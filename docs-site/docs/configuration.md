# Configuration & admin

Administrative settings live under **Settings** (`/settings`) and are available to the **Admin** role (some sections also to **HR**). This page covers theming, email, users and roles, and company settings.

## Theming

Coworkee separates the **style preset** (the overall visual language) from the **corporate identity** (your brand colour and logo).

**Style presets:**

| Preset | Feel |
|---|---|
| `default` | Clean, neutral, the out-of-the-box look |
| `material` | Material-inspired surfaces and elevation |
| `github` | Understated, GitHub-like |
| `playful` | Rounder, more colourful |

**Corporate identity:**

- **Accent colour** — the primary/CI colour used across buttons, links and highlights.
- **Logo** — upload your company logo; it is served from the tenant logo endpoint and shown in the app shell.

**Appearance:** light and dark mode are available everywhere; the choice is remembered per user.

Set the initial preset and appearance in the [setup wizard](./setup-wizard); change them any time under **Settings → Appearance / Theming**.

## Mail / SMTP

Coworkee can send transactional email — most importantly the **password-reset link** and notifications. Configure the mail transport under **Settings → Mail**. Four transports are supported:

| Transport | Use it when |
|---|---|
| **SMTP** | You have a mail server or relay (host, port, user, password, TLS). |
| **SendGrid** | You use SendGrid — provide the API key. |
| **sendmail** | The host has a local `sendmail`-compatible binary. |
| **LOG** (fallback) | No mail configured — messages are written to the application log instead of being sent. Fine for development. |

- **Secrets are encrypted** at rest (SMTP password, SendGrid API key), not stored in plain text.
- Use the **"Send test email"** button after saving to confirm the transport works end to end.
- Until a real transport is configured, Coworkee falls back to **LOG**, so a password-reset link, for example, appears in the container logs rather than an inbox.

::: tip Password reset needs working mail
The [forgot-password flow](./account#password-reset) emails a reset link. If mail is on the LOG fallback, that link only appears in the logs — configure a real transport before relying on self-service password resets.
:::

## Users & roles

Coworkee uses **role-based access control (RBAC)** with four roles, enforced **server-side** on every write (server actions are Zod-validated and audited). Manage users and their roles under **Settings → Users**.

| Role | Intended for |
|---|---|
| **ADMIN** | System administrators — full access, including settings, theming, mail and user management. |
| **HR** | HR staff — manages employees, absence, documents, onboarding, recruiting across the company. |
| **MANAGER** | Team leads — approves their team's absence, sees team time, manages their reports. |
| **EMPLOYEE** | Every employee — self-service: own profile, own absence requests, own time, own documents. |

### Permission matrix

A practical view of who can do what. "Own" means the acting user's own records; "team" means the manager's direct reports.

| Capability | Admin | HR | Manager | Employee |
|---|:---:|:---:|:---:|:---:|
| View own profile & data | ✅ | ✅ | ✅ | ✅ |
| Edit own profile (self-service) | ✅ | ✅ | ✅ | ✅ |
| View all employees | ✅ | ✅ | ✅ | ✅ |
| Create / edit employees | ✅ | ✅ | — | — |
| Request own absence | ✅ | ✅ | ✅ | ✅ |
| Approve absence | ✅ | ✅ | team | — |
| Manage absence entitlements | ✅ | ✅ | — | — |
| View team time | ✅ | ✅ | team | — |
| Upload documents to a profile | ✅ | ✅ | — | — |
| Manage onboarding templates & processes | ✅ | ✅ | — | — |
| Manage goals & reviews | ✅ | ✅ | team | own progress |
| View analytics dashboard | ✅ | ✅ | — | — |
| Manage recruiting pipeline | ✅ | ✅ | — | — |
| Publish news / announcements | ✅ | ✅ | — | — |
| Manage users & roles | ✅ | — | — | — |
| Settings: theming, mail, company | ✅ | — | — | — |

::: info Exact scoping
The table is a guide to the intended model. The authoritative rules are the server-side RBAC checks in `lib/` — every write goes through them regardless of what the UI shows.
:::

## Company settings

Under **Settings → Company** the admin maintains the company name and general organisation-wide options set up in the [wizard](./setup-wizard). These values feed the app shell, documents and analytics.
