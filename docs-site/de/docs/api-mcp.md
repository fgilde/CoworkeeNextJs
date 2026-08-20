# API & MCP

Coworkee stellt eine echte **REST-API** und einen **MCP-Server** bereit, beide mit **benutzereigenen API-Tokens** authentifiziert. Ein Token trägt genau die [RBAC-Rechte](./configuration#benutzer-rollen) seines Inhabers — ein Skript oder KI-Client kann immer nur, was auch der Benutzer darf.

Tokens erstellen und widerrufen Sie auf Ihrer [Konto-Seite](./account#api-tokens). Eine In-App-Referenz und fertige Client-Konfiguration liegen unter **`/settings/api`**.

## Authentifizierung

Senden Sie Ihr Token als Bearer-Header bei jedem Request:

```
Authorization: Bearer <token>
```

## REST-API (`/api/v1`)

Basispfad: `GET /api/v1/*`. Zu den Ressourcen zählen `me`, employees, absences, time, documents, goals, reviews, recruiting und announcements.

- **OpenAPI-3.1**-Beschreibung unter `GET /api/v1/openapi.json` — richten Sie jedes OpenAPI-Werkzeug (Swagger UI, Postman, Codegeneratoren) darauf aus.

### Beispiel: Wer bin ich

```bash
curl https://ihr-host/api/v1/me \
  -H "Authorization: Bearer $COWORKEE_TOKEN"
```

### Beispiel: Mitarbeitende auflisten

```bash
curl https://ihr-host/api/v1/employees \
  -H "Authorization: Bearer $COWORKEE_TOKEN"
```

Antworten sind JSON. Was Sie zurückbekommen, ist auf Ihre Rechte beschränkt — ein Employee-Token sieht weit weniger als ein HR-Token.

## MCP-Server (`/api/mcp`)

Coworkee liefert einen **Model-Context-Protocol**-Server unter `POST /api/mcp` (JSON-RPC). Er stellt **RBAC-beschränkte Tools** bereit — dasselbe Rechtemodell wie die REST-API — sodass ein mit Ihrem Token verbundener KI-Assistent nur innerhalb Ihrer Rechte lesen und handeln kann.

### Einen MCP-Client auf Coworkee ausrichten

Die meisten MCP-Clients nehmen einen Server-Eintrag mit URL und Authorization-Header. Eine typische Konfiguration:

```json
{
  "mcpServers": {
    "coworkee": {
      "url": "https://ihr-host/api/mcp",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}
```

Manche Clients umschließen einen entfernten MCP-Endpunkt stattdessen mit einer Brücke wie `mcp-remote`:

```json
{
  "mcpServers": {
    "coworkee": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://ihr-host/api/mcp",
        "--header", "Authorization: Bearer <token>"
      ]
    }
  }
}
```

Nach der Verbindung kann der Assistent die bereitgestellten Tools aufrufen (z. B. eine/n Mitarbeitende/n nachschlagen, Urlaubskonten prüfen) — immer innerhalb der Rechte des Token-Inhabers. Die genaue Tool-Liste und die kopierfertige Konfiguration für Ihre Instanz stehen unter **`/settings/api`**.

::: tip Least Privilege
Da ein Token die Rolle seines Inhabers erbt, beschränken Sie am saubersten, was ein KI-Client tun darf, indem Sie das Token unter einem Benutzer erstellen, dessen Rolle genau den gewünschten Zugriff hat.
:::
