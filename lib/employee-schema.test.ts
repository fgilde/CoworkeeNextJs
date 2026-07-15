import { expect, test } from "vitest";
import { employeeSchema } from "./employee-schema";
const base = { firstName:"A", lastName:"B", email:"a@b.de", hireDate:"2020-01-01", workload:100, contractType:"PERMANENT", status:"ACTIVE" };
test("rejects bad email", () => {
  expect(employeeSchema.safeParse({ ...base, email:"x" }).success).toBe(false);
});
test("rejects workload out of range", () => {
  expect(employeeSchema.safeParse({ ...base, workload:0 }).success).toBe(false);
  expect(employeeSchema.safeParse({ ...base, workload:101 }).success).toBe(false);
});
test("accepts valid input", () => {
  expect(employeeSchema.safeParse(base).success).toBe(true);
});
test("coerces workload string to number", () => {
  const r = employeeSchema.safeParse({ ...base, workload:"80" });
  expect(r.success).toBe(true);
  if (r.success) expect(r.data.workload).toBe(80);
});
