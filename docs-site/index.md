---
layout: home

hero:
  name: Coworkee
  text: A workplace for everything human.
  tagline: Modern, self-hosted, bilingual HR software for one company — employees, absence, time, documents, onboarding, performance, analytics, recruiting and news. Yours to run, on your own server.
  image:
    src: /icon.png
    alt: Coworkee
  actions:
    - theme: brand
      text: Get started
      link: /docs/introduction
    - theme: alt
      text: Installation
      link: /docs/installation
    - theme: alt
      text: View on GitHub
      link: https://github.com/fgilde/CoworkeeNextJs

features:
  - icon: 👥
    title: Employees & org chart
    details: Searchable directory, rich profiles, create and edit records, and a live organisational chart built from reporting lines.
  - icon: 🗓️
    title: Absence & approval
    details: Leave balances and entitlements, request → approval workflow, and a team calendar so managers see who is away.
  - icon: ⏱️
    title: Time tracking
    details: Clock in and out, weekly hours overview, manual corrections, and a team view for managers.
  - icon: 📄
    title: Documents
    details: Secure private storage per employee, access-guarded downloads, and HR upload — nothing served publicly.
  - icon: ✅
    title: Onboarding
    details: Reusable checklist templates turned into per-employee processes with checkable, trackable tasks.
  - icon: 🎯
    title: Performance
    details: Goals with self-service progress plus performance reviews moving Draft → Submitted → Acknowledged.
  - icon: 📊
    title: Analytics
    details: An HR dashboard with KPIs and charts — headcount, contract types, new hires and absence days.
  - icon: 💼
    title: Recruiting
    details: Job postings and an applicant pipeline as a six-stage Kanban board.
  - icon: 🔔
    title: News & notifications
    details: A company announcement feed with in-app notifications in the top bar.
---

<div style="max-width: 1152px; margin: 4rem auto 0; padding: 0 24px;">

## One app for the whole employee lifecycle

Coworkee is a single-tenant HR platform in the spirit of Personio and HR-Works, built with Next.js 16, PostgreSQL and Prisma. It runs entirely on **your** infrastructure — a single Docker command brings up the app and its database. Everything is available in **German and English**, with light and dark modes and configurable theming.

<img src="/screens/dashboard-light.png" alt="Coworkee dashboard" style="border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); margin: 2rem 0;" />

### Built for self-hosting

- **One-command install** on any Linux host with Docker, or a prebuilt GHCR image for low-RAM servers that never runs a build.
- **Ready-made recipes** for Docker Compose, Proxmox, Unraid and Umbrel.
- **Role-based access control** (Admin / HR / Manager / Employee) enforced on the server.
- **REST API + MCP server** with per-user tokens, so scripts and AI clients act with exactly the permissions of the token owner.

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin: 2rem 0;">
  <img src="/screens/analytics-light.png" alt="Analytics" style="border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,0.12);" />
  <img src="/screens/org-light.png" alt="Org chart" style="border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,0.12);" />
</div>

<p style="text-align:center; margin-top: 3rem;">
  <a href="/CoworkeeNextJs/docs/introduction" style="font-weight:600;">Read the documentation →</a>
</p>

</div>
