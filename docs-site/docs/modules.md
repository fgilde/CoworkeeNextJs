# Module guides

Coworkee is organised into nine modules, reachable from the sidebar after login. This page explains how to use each one. Visibility of actions depends on your [role](./configuration#users-roles).

## Employees & org chart

The **Employees** directory is the heart of Coworkee.

- **Directory** — search, filter and page through everyone. Everyone can browse; **HR/Admin** can create and edit.
- **Profiles** — each employee has a detail profile: contact data, role, department, contract type, manager, start date, plus tabs for [documents](#documents) and [absence](#absence-approval-workflow).
- **Create / edit** — HR/Admin add new employees and keep records current. Setting an employee's **manager** is what builds the reporting lines.
- **Org chart** (`/org`) — a live organisational chart generated from those reporting lines. Change a manager and the chart updates.

![Org chart](/screens/org-light.png)

## Absence & approval workflow

Manage leave from request through approval, with entitlements per employee.

- **Entitlements** — HR/Admin set each employee's leave entitlement (their annual balance). Do this before people start requesting.
- **Request** — an employee requests absence for a date range and type; the balance is checked.
- **Approval workflow** — the request goes to the approver (**Manager** for their team, or **HR/Admin**), who approves or rejects. Balances update on approval.
- **Team overview** — a calendar showing who is away, so overlaps are visible before approving.

![Absences](/screens/absences-light.png)

## Time tracking

- **Clock in / out** — employees record working time with start/stop.
- **Weekly overview** — hours per day and week totals for the individual.
- **Manual entries** — add or correct entries when a clock-in was missed.
- **Team times** — managers see their team's recorded time.

## Documents

Secure, private document storage per employee — nothing here is ever served publicly.

- **Private storage** — files live under `storage/documents/` on the server (a persistent volume), never in the public web root.
- **Access-guarded download** — every download goes through an access check (`/api/documents/[id]`); you only get files you're allowed to see.
- **HR upload** — HR/Admin upload documents onto an employee's profile (contracts, certificates, etc.).
- **Profile tab** — documents appear on the employee's profile under a Documents tab.

## Onboarding

Turn a repeatable checklist into a tracked process for each new hire.

- **Templates** — HR/Admin build reusable onboarding checklist templates (the list of tasks a new joiner needs).
- **Per-employee processes** — instantiate a template for a specific employee; it becomes a live process.
- **Checkable tasks** — tasks are ticked off as they're completed, so onboarding progress is visible at a glance.

## Performance

Two connected tools: goals and reviews.

- **Goals** — set objectives with a target; employees update their own **progress** (self-service), so goals stay current without a manager chasing them.
- **Performance reviews** — a review moves through **Draft → Submitted → Acknowledged**. The reviewer drafts and submits; the employee acknowledges, closing the loop.

![Performance](/screens/performance-light.png)

## Analytics

An HR dashboard (**HR/Admin**) with KPIs and charts:

- **Headcount** over time,
- **Contract types** breakdown,
- **New hires**,
- **Absence days**.

Use it to spot trends — growth, attrition, absence load — at a glance.

![Analytics](/screens/analytics-light.png)

## Recruiting

- **Job postings** — create and manage open positions.
- **Applicant pipeline** — a **Kanban board with six stages**; drag applicants along as they progress through the hiring process.

![Recruiting](/screens/recruiting-light.png)

## News & notifications

- **Announcement feed** — HR/Admin publish company news; everyone sees the feed.
- **In-app notifications** — the **bell in the top bar** surfaces notifications (new announcements, absence decisions, etc.) without email.
