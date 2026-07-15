import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../lib/db";
import { computeWorkingDays } from "../lib/leave";

async function main() {
  // --- Idempotent cleanup (FK-safe order) ---
  await db.auditLog.deleteMany();
  await db.timeEntry.deleteMany();
  await db.leaveRequest.deleteMany();
  await db.leaveEntitlement.deleteMany();
  await db.leaveType.deleteMany();
  await db.user.deleteMany();
  await db.employee.updateMany({ data: { managerId: null } });
  await db.department.updateMany({ data: { leadId: null } });
  await db.employee.deleteMany();
  await db.department.deleteMany();
  await db.position.deleteMany();
  await db.location.deleteMany();

  // --- Locations ---
  const berlin = await db.location.create({
    data: { name: "Berlin", city: "Berlin", country: "DE" },
  });
  const munich = await db.location.create({
    data: { name: "München", city: "München", country: "DE" },
  });

  // --- Departments (leadId set later once leads exist) ---
  const engineering = await db.department.create({ data: { name: "Engineering" } });
  const peopleCulture = await db.department.create({ data: { name: "People & Culture" } });
  const sales = await db.department.create({ data: { name: "Sales" } });
  const finance = await db.department.create({ data: { name: "Finance" } });

  // --- Positions ---
  const [posCEO, posCTO, posEngManager, posSWE, posHRManager, posRecruiter, posSalesManager, posAE, posAccountant] =
    await Promise.all(
      [
        "CEO",
        "CTO",
        "Engineering Manager",
        "Software Engineer",
        "HR Manager",
        "Recruiter",
        "Sales Manager",
        "Account Executive",
        "Accountant",
      ].map((title) => db.position.create({ data: { title } }))
    );

  const hireDate = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

  // --- Employees ---
  const ceo = await db.employee.create({
    data: {
      firstName: "Sabine",
      lastName: "Hoffmann",
      email: "sabine.hoffmann@coworkee.test",
      phone: "+49 30 1234567",
      birthDate: hireDate(1975, 4, 12),
      city: "Berlin",
      country: "DE",
      hireDate: hireDate(2015, 1, 1),
      contractType: "PERMANENT",
      workload: 100,
      locationId: berlin.id,
    },
  });

  const cto = await db.employee.create({
    data: {
      firstName: "Jonas",
      lastName: "Weber",
      email: "jonas.weber@coworkee.test",
      hireDate: hireDate(2016, 3, 1),
      contractType: "PERMANENT",
      workload: 100,
      locationId: berlin.id,
      departmentId: engineering.id,
      positionId: posCTO.id,
      managerId: ceo.id,
    },
  });

  const hrManager = await db.employee.create({
    data: {
      firstName: "Katrin",
      lastName: "Neumann",
      email: "katrin.neumann@coworkee.test",
      phone: "+49 30 7654321",
      hireDate: hireDate(2017, 6, 15),
      contractType: "PERMANENT",
      workload: 100,
      locationId: berlin.id,
      departmentId: peopleCulture.id,
      positionId: posHRManager.id,
      managerId: ceo.id,
    },
  });

  const salesManager = await db.employee.create({
    data: {
      firstName: "Michael",
      lastName: "Schmidt",
      email: "michael.schmidt@coworkee.test",
      hireDate: hireDate(2018, 2, 1),
      contractType: "PERMANENT",
      workload: 100,
      locationId: munich.id,
      departmentId: sales.id,
      positionId: posSalesManager.id,
      managerId: ceo.id,
    },
  });

  // Finance lead reports to CEO too (dept lead)
  const financeLead = await db.employee.create({
    data: {
      firstName: "Anna",
      lastName: "Fischer",
      email: "anna.fischer@coworkee.test",
      hireDate: hireDate(2017, 9, 1),
      contractType: "PERMANENT",
      workload: 100,
      locationId: berlin.id,
      departmentId: finance.id,
      positionId: posAccountant.id,
      managerId: ceo.id,
    },
  });

  await Promise.all([
    db.department.update({ where: { id: engineering.id }, data: { leadId: cto.id } }),
    db.department.update({ where: { id: peopleCulture.id }, data: { leadId: hrManager.id } }),
    db.department.update({ where: { id: sales.id }, data: { leadId: salesManager.id } }),
    db.department.update({ where: { id: finance.id }, data: { leadId: financeLead.id } }),
  ]);

  const engManager = await db.employee.create({
    data: {
      firstName: "Lukas",
      lastName: "Becker",
      email: "lukas.becker@coworkee.test",
      hireDate: hireDate(2019, 4, 1),
      contractType: "PERMANENT",
      workload: 100,
      locationId: berlin.id,
      departmentId: engineering.id,
      positionId: posEngManager.id,
      managerId: cto.id,
    },
  });

  // Engineering ICs
  const swe1 = await db.employee.create({
    data: {
      firstName: "Emily",
      lastName: "Krüger",
      email: "emily.krueger@coworkee.test",
      hireDate: hireDate(2020, 5, 1),
      contractType: "PERMANENT",
      workload: 100,
      locationId: berlin.id,
      departmentId: engineering.id,
      positionId: posSWE.id,
      managerId: engManager.id,
    },
  });

  const swe2 = await db.employee.create({
    data: {
      firstName: "David",
      lastName: "Wagner",
      email: "david.wagner@coworkee.test",
      hireDate: hireDate(2021, 8, 15),
      contractType: "PERMANENT",
      workload: 100,
      locationId: munich.id,
      departmentId: engineering.id,
      positionId: posSWE.id,
      managerId: engManager.id,
    },
  });

  const swe3 = await db.employee.create({
    data: {
      firstName: "Nina",
      lastName: "Schulz",
      email: "nina.schulz@coworkee.test",
      hireDate: hireDate(2022, 3, 1),
      contractType: "TEMPORARY",
      workload: 100,
      locationId: berlin.id,
      departmentId: engineering.id,
      positionId: posSWE.id,
      managerId: engManager.id,
    },
  });

  const workingStudent = await db.employee.create({
    data: {
      firstName: "Paul",
      lastName: "Zimmermann",
      email: "paul.zimmermann@coworkee.test",
      birthDate: hireDate(2001, 11, 3),
      hireDate: hireDate(2023, 10, 1),
      contractType: "WORKING_STUDENT",
      workload: 50,
      locationId: berlin.id,
      departmentId: engineering.id,
      positionId: posSWE.id,
      managerId: engManager.id,
    },
  });

  // People & Culture IC
  const recruiter = await db.employee.create({
    data: {
      firstName: "Laura",
      lastName: "Hartmann",
      email: "laura.hartmann@coworkee.test",
      hireDate: hireDate(2020, 9, 1),
      contractType: "PERMANENT",
      workload: 80,
      locationId: berlin.id,
      departmentId: peopleCulture.id,
      positionId: posRecruiter.id,
      managerId: hrManager.id,
    },
  });

  const intern = await db.employee.create({
    data: {
      firstName: "Tom",
      lastName: "Vogel",
      email: "tom.vogel@coworkee.test",
      birthDate: hireDate(2002, 7, 20),
      hireDate: hireDate(2024, 4, 1),
      contractType: "INTERN",
      workload: 100,
      locationId: berlin.id,
      departmentId: peopleCulture.id,
      positionId: posRecruiter.id,
      managerId: hrManager.id,
    },
  });

  // Sales ICs
  const ae1 = await db.employee.create({
    data: {
      firstName: "Julia",
      lastName: "Richter",
      email: "julia.richter@coworkee.test",
      hireDate: hireDate(2019, 11, 1),
      contractType: "PERMANENT",
      workload: 100,
      locationId: munich.id,
      departmentId: sales.id,
      positionId: posAE.id,
      managerId: salesManager.id,
    },
  });

  const ae2 = await db.employee.create({
    data: {
      firstName: "Sebastian",
      lastName: "Klein",
      email: "sebastian.klein@coworkee.test",
      hireDate: hireDate(2021, 1, 15),
      contractType: "PERMANENT",
      workload: 100,
      locationId: munich.id,
      departmentId: sales.id,
      positionId: posAE.id,
      managerId: salesManager.id,
    },
  });

  const ae3 = await db.employee.create({
    data: {
      firstName: "Sophie",
      lastName: "Wolf",
      email: "sophie.wolf@coworkee.test",
      hireDate: hireDate(2022, 6, 1),
      contractType: "TEMPORARY",
      workload: 100,
      locationId: berlin.id,
      departmentId: sales.id,
      positionId: posAE.id,
      managerId: salesManager.id,
    },
  });

  // Finance IC
  const accountant2 = await db.employee.create({
    data: {
      firstName: "Felix",
      lastName: "Braun",
      email: "felix.braun@coworkee.test",
      hireDate: hireDate(2023, 2, 1),
      contractType: "PERMANENT",
      workload: 80,
      locationId: berlin.id,
      departmentId: finance.id,
      positionId: posAccountant.id,
      managerId: financeLead.id,
    },
  });

  // Extra CTO-side IC to round out ~15
  const swe4 = await db.employee.create({
    data: {
      firstName: "Marie",
      lastName: "Lang",
      email: "marie.lang@coworkee.test",
      hireDate: hireDate(2020, 1, 10),
      contractType: "PERMANENT",
      workload: 100,
      locationId: munich.id,
      departmentId: engineering.id,
      positionId: posSWE.id,
      managerId: cto.id,
    },
  });

  const employees = [
    ceo,
    cto,
    hrManager,
    salesManager,
    financeLead,
    engManager,
    swe1,
    swe2,
    swe3,
    workingStudent,
    recruiter,
    intern,
    ae1,
    ae2,
    ae3,
    accountant2,
    swe4,
  ];

  // --- Users (logins) ---
  const passwordHash = await bcrypt.hash("coworkee", 10);

  const adminUser = await db.user.create({
    data: { email: "admin@coworkee.test", passwordHash, role: "ADMIN", locale: "de", employeeId: ceo.id },
  });
  const hrUser = await db.user.create({
    data: { email: "hr@coworkee.test", passwordHash, role: "HR", locale: "de", employeeId: hrManager.id },
  });
  const managerUser = await db.user.create({
    data: { email: "manager@coworkee.test", passwordHash, role: "MANAGER", locale: "de", employeeId: engManager.id },
  });
  const employeeUser = await db.user.create({
    data: { email: "employee@coworkee.test", passwordHash, role: "EMPLOYEE", locale: "de", employeeId: swe1.id },
  });

  // --- Leave types ---
  const vacationType = await db.leaveType.create({
    data: { name: "Urlaub", colorHex: "#22c55e", paid: true, defaultDays: 30 },
  });
  const sickType = await db.leaveType.create({
    data: { name: "Krankheit", colorHex: "#ef4444", paid: true, defaultDays: 10 },
  });
  await db.leaveType.create({
    data: { name: "Unbezahlt", colorHex: "#94a3b8", paid: false, defaultDays: 0 },
  });

  // --- Entitlements (current year, every employee) ---
  const year = new Date().getFullYear();
  const entitlements = await Promise.all(
    employees.flatMap((e) => [
      db.leaveEntitlement.create({ data: { employeeId: e.id, typeId: vacationType.id, year, days: 30 } }),
      db.leaveEntitlement.create({ data: { employeeId: e.id, typeId: sickType.id, year, days: 10 } }),
    ])
  );

  // --- Sample requests (swe1 + swe2 report to engManager, so approvals demo works) ---
  const pendingStart = new Date(Date.UTC(year, 7, 3)); // Mon
  const pendingEnd = new Date(Date.UTC(year, 7, 7)); // Fri
  const approvedStart = new Date(Date.UTC(year, 5, 1)); // Mon
  const approvedEnd = new Date(Date.UTC(year, 5, 5)); // Fri

  const pendingRequest = await db.leaveRequest.create({
    data: {
      employeeId: swe1.id,
      typeId: vacationType.id,
      startDate: pendingStart,
      endDate: pendingEnd,
      workingDays: computeWorkingDays(pendingStart, pendingEnd),
      reason: "Sommerurlaub",
      status: "PENDING",
    },
  });

  const approvedRequest = await db.leaveRequest.create({
    data: {
      employeeId: swe2.id,
      typeId: vacationType.id,
      startDate: approvedStart,
      endDate: approvedEnd,
      workingDays: computeWorkingDays(approvedStart, approvedEnd),
      status: "APPROVED",
      approverId: engManager.id,
      decidedAt: new Date(),
    },
  });

  // --- Time entries (swe1, swe2, engManager over the last few weekdays) ---
  const workDay = (daysAgo: number, h: number, m = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const dayStart = (daysAgo: number) => {
    const d = workDay(daysAgo, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Last 3 weekdays (skip weekends) for swe1, swe2 and engManager, 09:00-17:00, 30 min break.
  const recentWeekdays: number[] = [];
  for (let daysAgo = 1; recentWeekdays.length < 3; daysAgo++) {
    const d = workDay(daysAgo, 0);
    if (d.getDay() !== 0 && d.getDay() !== 6) recentWeekdays.push(daysAgo);
  }

  const timeEntries = await Promise.all(
    [swe1, swe2, engManager].flatMap((emp) =>
      recentWeekdays.map((daysAgo) =>
        db.timeEntry.create({
          data: {
            employeeId: emp.id,
            date: dayStart(daysAgo),
            start: workDay(daysAgo, 9),
            end: workDay(daysAgo, 17),
            breakMinutes: 30,
          },
        })
      )
    )
  );

  // Demo: swe3 currently clocked in (open entry).
  await db.timeEntry.create({
    data: {
      employeeId: swe3.id,
      date: dayStart(0),
      start: workDay(0, 9),
      end: null,
    },
  });

  const counts = {
    locations: 2,
    departments: 4,
    positions: 9,
    employees: employees.length,
    users: [adminUser, hrUser, managerUser, employeeUser].length,
    leaveTypes: 3,
    leaveEntitlements: entitlements.length,
    leaveRequests: [pendingRequest, approvedRequest].length,
    timeEntries: timeEntries.length + 1,
  };

  console.log("Seed done: ", counts);
  await db.$disconnect?.();
}

main()
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect?.();
    process.exit(1);
  });
