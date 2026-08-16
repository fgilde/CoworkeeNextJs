import { db } from "@/lib/db";
import { authorize } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;

  const employee = auth.user.employeeId
    ? await db.employee.findUnique({
        where: { id: auth.user.employeeId },
        include: { department: true, position: true, location: true, manager: true },
      })
    : null;

  return Response.json({
    user: { id: auth.user.id, email: auth.user.email, role: auth.role, locale: auth.user.locale },
    role: auth.role,
    employee,
  });
}
