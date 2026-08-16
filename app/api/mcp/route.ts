import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { authenticateApiRequest, type ApiAuth } from "@/lib/api-auth";
import { reportIds } from "@/lib/api-helpers";
import { can, type Action } from "@/lib/rbac";
import { computeWorkingDays } from "@/lib/leave";

// MCP server (Model Context Protocol) over Streamable HTTP / JSON-RPC.
// Auth: Bearer token (personal API token) → the token's user + role. Any MCP
// client (Claude, ChatGPT, …) can then read/write the HR data its role allows.
// Stateless: each POST is self-contained; response is application/json.
// Mirrors HaVeWa's src/app/api/mcp/route.ts, adapted to Coworkee's domain + RBAC.

const PROTOCOL = "2024-11-05";

type Tool = {
  name: string;
  description: string;
  inputSchema: object;
  action?: Action; // RBAC gate; undefined = any authenticated token holder.
  run: (a: ApiAuth, args: Record<string, unknown>) => Promise<unknown>;
};

const obj = (props: Record<string, object> = {}, required: string[] = []) => ({
  type: "object",
  properties: props,
  required,
});
const str = { type: "string" };
const int = { type: "integer" };
const bool = { type: "boolean" };

const empSel = { select: { id: true, firstName: true, lastName: true } };

const TOOLS: Tool[] = [
  {
    name: "whoami",
    description: "The current token's user, role and linked employee.",
    inputSchema: obj(),
    run: async (a) => {
      const employee = a.user.employeeId
        ? await db.employee.findUnique({
            where: { id: a.user.employeeId },
            include: { department: true, position: true, location: true, manager: true },
          })
        : null;
      return { user: { id: a.user.id, email: a.user.email, role: a.role, locale: a.user.locale }, role: a.role, employee };
    },
  },
  {
    name: "list_employees",
    description: "List employees. Optional q (name/email search), departmentId, locationId, status (ACTIVE|INACTIVE).",
    inputSchema: obj({ q: str, departmentId: str, locationId: str, status: str, limit: int }),
    action: "employee:read",
    run: (_a, args) => {
      const status = args.status;
      const q = args.q ? String(args.q) : "";
      const where: Prisma.EmployeeWhereInput = {
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(args.departmentId ? { departmentId: String(args.departmentId) } : {}),
        ...(args.locationId ? { locationId: String(args.locationId) } : {}),
        ...(status === "ACTIVE" || status === "INACTIVE" ? { status } : {}),
      };
      return db.employee.findMany({
        where,
        include: { department: true, position: true, location: true },
        orderBy: { lastName: "asc" },
        take: takeOf(args),
      });
    },
  },
  {
    name: "get_employee",
    description: "One employee with department, position, location, manager and direct reports.",
    inputSchema: obj({ id: str }, ["id"]),
    action: "employee:read",
    run: (_a, args) =>
      db.employee.findUnique({
        where: { id: String(args.id) },
        include: { department: true, position: true, location: true, manager: true, reports: true },
      }),
  },
  {
    name: "list_absences",
    description: "List leave requests, RBAC-scoped: leave:manage → all; approvers → own + direct reports; else own only. Optional status.",
    inputSchema: obj({ status: str, limit: int }),
    action: "leave:request",
    run: async (a, args) => {
      let where: Prisma.LeaveRequestWhereInput = {};
      if (!can(a.role, "leave:manage")) {
        const self = a.user.employeeId;
        if (!self) return [];
        const ids = can(a.role, "leave:approve") ? [self, ...(await reportIds(self))] : [self];
        where = { employeeId: { in: ids } };
      }
      if (args.status) where = { ...where, status: args.status as Prisma.LeaveRequestWhereInput["status"] };
      return db.leaveRequest.findMany({
        where,
        include: { employee: empSel, type: { select: { id: true, name: true, colorHex: true } } },
        orderBy: { startDate: "desc" },
        take: takeOf(args),
      });
    },
  },
  {
    name: "create_leave_request",
    description: "Request leave for the token's own employee. Dates as YYYY-MM-DD. typeId from a leave type.",
    inputSchema: obj(
      { typeId: str, startDate: str, endDate: str, halfDayStart: bool, halfDayEnd: bool, reason: str },
      ["typeId", "startDate", "endDate"],
    ),
    action: "leave:request",
    run: async (a, args) => {
      if (!a.user.employeeId) throw new Error("Your account is not linked to an employee");
      const start = new Date(String(args.startDate));
      const end = new Date(String(args.endDate));
      const halfDayStart = Boolean(args.halfDayStart);
      const halfDayEnd = Boolean(args.halfDayEnd);
      return db.leaveRequest.create({
        data: {
          employeeId: a.user.employeeId,
          typeId: String(args.typeId),
          startDate: start,
          endDate: end,
          halfDayStart,
          halfDayEnd,
          workingDays: computeWorkingDays(start, end, halfDayStart, halfDayEnd),
          reason: args.reason ? String(args.reason) : null,
        },
      });
    },
  },
  {
    name: "decide_leave_request",
    description: "Approve or reject a pending leave request. decision = APPROVED|REJECTED. Approvers only; MANAGER may only decide their own reports.",
    inputSchema: obj({ id: str, decision: { type: "string", enum: ["APPROVED", "REJECTED"] }, note: str }, ["id", "decision"]),
    action: "leave:approve",
    run: async (a, args) => {
      const decision = String(args.decision);
      if (decision !== "APPROVED" && decision !== "REJECTED") throw new Error("decision must be APPROVED or REJECTED");
      if (!a.user.employeeId) throw new Error("Your account is not linked to an employee");
      const request = await db.leaveRequest.findUnique({
        where: { id: String(args.id) },
        select: { status: true, employee: { select: { managerId: true } } },
      });
      if (!request) throw new Error("Leave request not found");
      // MANAGER scope: may only decide requests from their own reports. HR/ADMIN: any.
      if (a.role === "MANAGER" && request.employee.managerId !== a.user.employeeId) {
        throw new Error("Forbidden — not your report");
      }
      if (request.status !== "PENDING") throw new Error("Request already decided");
      return db.leaveRequest.update({
        where: { id: String(args.id) },
        data: {
          status: decision,
          approverId: a.user.employeeId,
          decidedAt: new Date(),
          decisionNote: args.note ? String(args.note) : null,
        },
      });
    },
  },
  {
    name: "list_time_entries",
    description: "List time entries, RBAC-scoped: without time:view-team → own; MANAGER → own + reports; HR/ADMIN → all.",
    inputSchema: obj({ limit: int }),
    action: "time:track",
    run: async (a, args) => {
      let where: Prisma.TimeEntryWhereInput = {};
      const self = a.user.employeeId;
      if (!can(a.role, "time:view-team")) {
        if (!self) return [];
        where = { employeeId: self };
      } else if (a.role === "MANAGER") {
        if (!self) return [];
        where = { employeeId: { in: [self, ...(await reportIds(self))] } };
      }
      return db.timeEntry.findMany({ where, include: { employee: empSel }, orderBy: { date: "desc" }, take: takeOf(args) });
    },
  },
  {
    name: "list_documents",
    description: "List document metadata (own, or all with document:manage). File bytes stay behind the guarded download.",
    inputSchema: obj({ limit: int }),
    action: "document:read-own",
    run: (a, args) => {
      let where: Prisma.DocumentWhereInput = {};
      if (!can(a.role, "document:manage")) {
        if (!a.user.employeeId) return Promise.resolve([]);
        where = { employeeId: a.user.employeeId };
      }
      return db.document.findMany({
        where,
        select: {
          id: true, employeeId: true, title: true, category: true, originalName: true,
          mimeType: true, sizeBytes: true, uploadedAt: true, employee: empSel,
        },
        orderBy: { uploadedAt: "desc" },
        take: takeOf(args),
      });
    },
  },
  {
    name: "list_goals",
    description: "List goals, RBAC-scoped: goal:manage (HR/ADMIN) → all; MANAGER → own + reports; else own.",
    inputSchema: obj({ limit: int }),
    action: "employee:read",
    run: async (a, args) => {
      const self = a.user.employeeId;
      let where: Prisma.GoalWhereInput = {};
      if (!can(a.role, "goal:manage")) {
        if (!self) return [];
        where = { employeeId: self };
      } else if (a.role === "MANAGER") {
        where = { employeeId: { in: self ? [self, ...(await reportIds(self))] : [] } };
      }
      return db.goal.findMany({ where, include: { employee: empSel }, orderBy: { updatedAt: "desc" }, take: takeOf(args) });
    },
  },
  {
    name: "list_recruiting",
    description: "List job postings with applications. recruiting:manage only. Optional status (DRAFT|OPEN|CLOSED).",
    inputSchema: obj({ status: str, limit: int }),
    action: "recruiting:manage",
    run: (_a, args) => {
      const status = args.status;
      const where: Prisma.JobPostingWhereInput =
        status === "DRAFT" || status === "OPEN" || status === "CLOSED" ? { status } : {};
      return db.jobPosting.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
          applications: { orderBy: { appliedAt: "desc" } },
        },
        orderBy: { updatedAt: "desc" },
        take: takeOf(args),
      });
    },
  },
  {
    name: "list_announcements",
    description: "Company news / announcements. Readable by any authenticated token holder.",
    inputSchema: obj({ limit: int }),
    run: (_a, args) =>
      db.announcement.findMany({ orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: takeOf(args) }),
  },
  {
    name: "create_announcement",
    description: "Publish a company announcement. HR/ADMIN only (announcement:manage).",
    inputSchema: obj({ title: str, body: str, pinned: bool }, ["title", "body"]),
    action: "announcement:manage",
    run: (a, args) =>
      db.announcement.create({
        data: { title: String(args.title), body: String(args.body), pinned: Boolean(args.pinned), authorId: a.user.id },
      }),
  },
];

// Clamp an optional limit to 1..100 (default 50), mirroring the REST pagination.
function takeOf(args: Record<string, unknown>): number {
  return Math.min(100, Math.max(1, Number(args.limit) || 50));
}

const rpc = (id: unknown, result: unknown) => Response.json({ jsonrpc: "2.0", id, result });
const rpcError = (id: unknown, code: number, message: string) =>
  Response.json({ jsonrpc: "2.0", id, error: { code, message } });

// Tools this role may use — hidden from tools/list, and blocked on call as defense-in-depth.
const allowed = (auth: ApiAuth) => TOOLS.filter((t) => !t.action || can(auth.role, t.action));

export async function POST(req: Request) {
  const auth = await authenticateApiRequest(req);
  if (!auth) {
    return Response.json(
      { jsonrpc: "2.0", id: null, error: { code: -32001, message: "Unauthorized" } },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || body.jsonrpc !== "2.0") return rpcError(null, -32600, "Invalid Request");
  const { id, method, params } = body;

  // Notifications (no response expected).
  if (typeof method === "string" && method.startsWith("notifications/")) {
    return new Response(null, { status: 202 });
  }

  switch (method) {
    case "initialize":
      return rpc(id, {
        protocolVersion: params?.protocolVersion ?? PROTOCOL,
        capabilities: { tools: {} },
        serverInfo: { name: "Coworkee", version: "1.0.0" },
      });
    case "ping":
      return rpc(id, {});
    case "tools/list":
      return rpc(id, {
        tools: allowed(auth).map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
      });
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${params?.name}`);
      if (tool.action && !can(auth.role, tool.action)) {
        return rpc(id, { content: [{ type: "text", text: "Error: permission denied — your role may not use this tool" }], isError: true });
      }
      try {
        const result = await tool.run(auth, params?.arguments ?? {});
        return rpc(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
      } catch (e) {
        return rpc(id, {
          content: [{ type: "text", text: `Error: ${e instanceof Error ? e.message : "unknown"}` }],
          isError: true,
        });
      }
    }
    default:
      return rpcError(id, -32601, `Method not supported: ${method}`);
  }
}

// Some clients probe GET (SSE stream). Stateless → not supported; hint to POST.
export function GET() {
  return new Response("MCP endpoint — use POST (JSON-RPC 2.0) with an Authorization: Bearer <token> header.", {
    status: 405,
    headers: { "Content-Type": "text/plain" },
  });
}
