import { z } from "zod";

// Empty string (from an unfilled optional form field) is treated as "not provided".
const optionalString = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string())
  .optional();

const optionalDateString = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.iso.date())
  .optional();

export const employeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  phone: optionalString,
  street: optionalString,
  city: optionalString,
  country: optionalString,
  birthDate: optionalDateString,
  hireDate: z.iso.date(),
  exitDate: optionalDateString,
  contractType: z.enum(["PERMANENT", "TEMPORARY", "INTERN", "WORKING_STUDENT"]),
  workload: z.coerce.number().int().min(1).max(100),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  departmentId: optionalString,
  positionId: optionalString,
  locationId: optionalString,
  managerId: optionalString,
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
