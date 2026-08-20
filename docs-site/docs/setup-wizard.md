# First-run setup wizard

When Coworkee starts against an **empty database** and `DEMO` is **not** set to `1`, the first browser visit opens the setup wizard at `/setup`. This is how a real install is initialised — there is no default admin password to change and no sample data to clean up.

::: info When does the wizard appear?
Only on an empty database with `DEMO` unset (or `0`). If `DEMO=1`, the database is seeded with demo data instead and you go straight to the login page. See [DEMO vs. real install](./installation#demo-vs-real-install).
:::

## What the wizard asks for

The wizard collects everything needed to create the first account and the company in one pass:

1. **Administrator account** — name, email and password for the first user. This account gets the **Admin** role and full access.
2. **Company** — the company name that appears in the app and in documents.
3. **Language** — the default interface language (German or English). Individual users can still change their own language later.
4. **Theme** — the initial style preset and appearance (light / dark). Configurable again afterwards under admin settings.

On submit, the wizard creates the admin user and the company record, signs you in, and drops you on the dashboard. The `/setup` route is then closed — once a company exists, the wizard is no longer reachable.

## After the wizard

You now have an empty, real instance with one admin. Typical next steps:

- **Add employees** — [Employees & org chart](./modules#employees-org-chart).
- **Invite colleagues / create users and assign roles** — [Users & roles](./configuration#users-roles).
- **Configure email** so password resets and notifications can be sent — [Mail / SMTP](./configuration#mail-smtp).
- **Set your corporate identity** — accent colour and logo under [Theming](./configuration#theming).
- **Set absence entitlements** before people start requesting leave — [Absence](./modules#absence-approval-workflow).

## Resetting to run the wizard again

The wizard keys off "is the database empty?". To see it again on a test instance, start against a fresh database (drop the volume / use a new `DATABASE_URL`). Never do this on a production instance with real data.
