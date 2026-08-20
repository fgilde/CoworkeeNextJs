# API & MCP

Coworkee exposes a real **REST API** and an **MCP server**, both authenticated with **per-user API tokens**. A token carries exactly its owner's [RBAC permissions](./configuration#users-roles) — a script or AI client can only ever do what the user may do.

Create and revoke tokens on your [Account page](./account#api-tokens). An in-app reference and ready-made client config live at **`/settings/api`**.

## Authentication

Send your token as a bearer header on every request:

```
Authorization: Bearer <token>
```

## REST API (`/api/v1`)

Base path: `GET /api/v1/*`. Resources include `me`, employees, absences, time, documents, goals, reviews, recruiting and announcements.

- **OpenAPI 3.1** description at `GET /api/v1/openapi.json` — point any OpenAPI tool (Swagger UI, Postman, code generators) at it.

### Example: who am I

```bash
curl https://your-host/api/v1/me \
  -H "Authorization: Bearer $COWORKEE_TOKEN"
```

### Example: list employees

```bash
curl https://your-host/api/v1/employees \
  -H "Authorization: Bearer $COWORKEE_TOKEN"
```

Responses are JSON. What you get back is scoped to your permissions — an Employee token sees far less than an HR token.

## MCP server (`/api/mcp`)

Coworkee ships a **Model Context Protocol** server at `POST /api/mcp` (JSON-RPC). It exposes **RBAC-scoped tools** — the same permission model as the REST API — so an AI assistant connected with your token can read and act only within your rights.

### Pointing an MCP client at Coworkee

Most MCP clients take a server entry with a URL and an authorization header. A typical configuration:

```json
{
  "mcpServers": {
    "coworkee": {
      "url": "https://your-host/api/mcp",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}
```

Some clients instead wrap a remote MCP endpoint with a bridge such as `mcp-remote`:

```json
{
  "mcpServers": {
    "coworkee": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://your-host/api/mcp",
        "--header", "Authorization: Bearer <token>"
      ]
    }
  }
}
```

Once connected, the assistant can call the exposed tools (e.g. look up an employee, check absence balances) — always within the token owner's permissions. The exact list of tools and the copy-paste config for your instance are shown at **`/settings/api`**.

::: tip Least privilege
Because a token inherits its owner's role, the cleanest way to limit what an AI client can do is to create the token under a user whose role has exactly the access you want it to have.
:::
