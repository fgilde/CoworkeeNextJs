# Account & self-service

Every user, whatever their [role](./configuration#users-roles), has a self-service **Account** page (`/account`) for the things that are theirs alone.

## Profile

View and edit your own profile — name, contact details and the fields your role is allowed to change. HR/Admin can edit anyone; every user can maintain their own basics.

## Change password

Change your password from the Account page: enter your current password and a new one. This is the routine, signed-in path. If you've forgotten your password and can't sign in, use the reset flow below.

## Password reset (forgot password)

If you can't log in, use the **"Forgot password?"** link on the login page:

1. Enter your email on the forgot-password page.
2. Coworkee emails you a **reset link** (a one-time, time-limited link).
3. Open the link and set a new password.
4. Log in with the new password.

::: warning Mail must be configured
The reset link is delivered by email. If the instance is on the **LOG** mail fallback, the link is written to the application log instead of being sent — so an admin must configure a real transport under [Mail / SMTP](./configuration#mail-smtp) before self-service reset works for real users.
:::

## Language

Switch your interface language between **German** and **English**. The choice is stored per user (cookie-based, no URL prefix), so it follows you across sessions and doesn't affect anyone else.

## API tokens

Create **personal API tokens** on the Account page to use the [REST API and MCP server](./api-mcp).

- A token carries **exactly your RBAC permissions** — automation can only do what you may do.
- The token value is **shown once**, at creation. Copy it immediately; it can't be retrieved again.
- **Revoke** a token any time from the same page; revoked tokens stop working immediately.

Send a token as an `Authorization: Bearer <token>` header. See [API & MCP](./api-mcp) for full examples.
