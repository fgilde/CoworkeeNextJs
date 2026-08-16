import { z } from "zod";

// Empty string (from an unfilled optional form field) is treated as "not provided".
// `max` caps free-text length so arbitrarily long input can't be stored.
const optionalString = (max: number) =>
  z
    .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string().max(max))
    .optional();

const optionalDateString = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.iso.date())
  .optional();

export const employeeSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.email().max(200),
  phone: optionalString(40),
  street: optionalString(120),
  city: optionalString(120),
  country: optionalString(120),
  birthDate: optionalDateString,
  hireDate: z.iso.date(),
  exitDate: optionalDateString,
  contractType: z.enum(["PERMANENT", "TEMPORARY", "INTERN", "WORKING_STUDENT"]),
  workload: z.coerce.number().int().min(1).max(100),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  departmentId: optionalString(50),
  positionId: optionalString(50),
  locationId: optionalString(50),
  managerId: optionalString(50),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
