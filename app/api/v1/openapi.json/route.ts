// OpenAPI 3.1 description of the Coworkee REST API. Public (no secrets);
// serves Scalar/Swagger as a reference. Hand-rolled — no generator dependency.

const sec = [{ bearerAuth: [] }];

const list = (tag: string, summary: string) => ({
  tags: [tag],
  summary,
  security: sec,
  parameters: [
    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
    { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 100 } },
  ],
  responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" }, "403": { description: "Forbidden" } },
});

const create = (tag: string, summary: string, required: string[], properties: Record<string, unknown>) => ({
  tags: [tag],
  summary,
  security: sec,
  requestBody: {
    required: true,
    content: { "application/json": { schema: { type: "object", required, properties } } },
  },
  responses: { "201": { description: "Created" }, "400": { description: "Bad request" }, "401": { description: "Unauthorized" }, "403": { description: "Forbidden" } },
});

const S = { string: { type: "string" }, int: { type: "integer" }, date: { type: "string", format: "date-time" }, bool: { type: "boolean" } };

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Coworkee API",
    version: "1.0.0",
    description:
      "REST API of the Coworkee HR platform. Authenticate with a personal Bearer token " +
      "(Account → API tokens). Access is scoped by the token holder's role (ADMIN/HR/MANAGER/EMPLOYEE).",
  },
  servers: [{ url: "/" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", description: "Personal API token (Account → API tokens)" },
    },
  },
  security: sec,
  paths: {
    "/api/v1/me": {
      get: { tags: ["General"], summary: "Current token's user, employee and role", security: sec, responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } } },
    },
    "/api/v1/employees": {
      get: list("Employees", "List employees (q, department, location, status filters)"),
      post: create("Employees", "Create employee", ["firstName", "lastName", "email", "hireDate"], {
        firstName: S.string, lastName: S.string, email: S.string, hireDate: S.date, phone: S.string,
        contractType: { type: "string", enum: ["PERMANENT", "TEMPORARY", "INTERN", "WORKING_STUDENT"] },
        workload: S.int, departmentId: S.string, positionId: S.string, locationId: S.string, managerId: S.string,
      }),
    },
    "/api/v1/employees/{id}": {
      get: { tags: ["Employees"], summary: "Get employee", security: sec, parameters: [{ name: "id", in: "path", required: true, schema: S.string }], responses: { "200": { description: "OK" }, "404": { description: "Not found" } } },
      patch: {
        tags: ["Employees"], summary: "Update employee", security: sec,
        parameters: [{ name: "id", in: "path", required: true, schema: S.string }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", additionalProperties: true } } } },
        responses: { "200": { description: "OK" }, "403": { description: "Forbidden" }, "404": { description: "Not found" } },
      },
    },
    "/api/v1/departments": {
      get: list("Org", "List departments"),
      post: create("Org", "Create department", ["name"], { name: S.string, leadId: S.string }),
    },
    "/api/v1/positions": {
      get: list("Org", "List positions"),
      post: create("Org", "Create position", ["title"], { title: S.string }),
    },
    "/api/v1/locations": {
      get: list("Org", "List locations"),
      post: create("Org", "Create location", ["name"], { name: S.string, city: S.string, country: S.string }),
    },
    "/api/v1/absences": {
      get: list("Absences", "List leave requests (RBAC-scoped: own / team / all)"),
      post: create("Absences", "Request leave (for the token's own employee)", ["typeId", "startDate", "endDate"], {
        typeId: S.string, startDate: S.date, endDate: S.date, halfDayStart: S.bool, halfDayEnd: S.bool, reason: S.string,
      }),
    },
    "/api/v1/time-entries": {
      get: list("Time", "List time entries (own / team / all by role)"),
      post: create("Time", "Log a time entry (for the token's own employee)", ["date", "start"], {
        date: S.date, start: S.date, end: S.date, breakMinutes: S.int, note: S.string,
      }),
    },
    "/api/v1/documents": {
      get: list("Documents", "List document metadata (own, or all with document:manage). File bytes stay behind the guarded download."),
    },
    "/api/v1/goals": {
      get: list("Performance", "List goals (own / team / all by role)"),
      post: create("Performance", "Create goal", ["employeeId", "title"], {
        employeeId: S.string, title: S.string, description: S.string, dueDate: S.date,
      }),
    },
    "/api/v1/reviews": {
      get: list("Performance", "List reviews (own / team / all by role)"),
      post: create("Performance", "Create review", ["employeeId", "reviewerId", "period"], {
        employeeId: S.string, reviewerId: S.string, period: S.string, rating: S.int,
        strengths: S.string, improvements: S.string, comments: S.string,
      }),
    },
    "/api/v1/onboarding": {
      get: list("Onboarding", "List onboarding/offboarding checklists (type, employee filters)"),
    },
    "/api/v1/recruiting": {
      get: list("Recruiting", "List job postings with applications (status filter)"),
      post: create("Recruiting", "Create job posting", ["title", "description"], {
        title: S.string, description: S.string, employmentType: S.string,
        status: { type: "string", enum: ["DRAFT", "OPEN", "CLOSED"] }, departmentId: S.string, locationId: S.string,
      }),
    },
    "/api/v1/announcements": {
      get: list("News", "List announcements (any authenticated token holder)"),
      post: create("News", "Create announcement", ["title", "body"], { title: S.string, body: S.string, pinned: S.bool }),
    },
    "/api/v1/openapi.json": {
      get: { tags: ["General"], summary: "This OpenAPI document", responses: { "200": { description: "OK" } } },
    },
  },
};

export function GET() {
  return Response.json(spec);
}
