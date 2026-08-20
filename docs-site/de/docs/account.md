# Konto & Self-Service

Jede/r Benutzer/in hat — unabhängig von der [Rolle](./configuration#benutzer-rollen) — eine Self-Service-**Konto**-Seite (`/account`) für die Dinge, die nur sie/ihn betreffen.

## Profil

Sehen und bearbeiten Sie Ihr eigenes Profil — Name, Kontaktdaten und die Felder, die Ihre Rolle ändern darf. HR/Admin können alle bearbeiten; jede/r pflegt die eigenen Grunddaten.

## Passwort ändern

Ändern Sie Ihr Passwort auf der Konto-Seite: aktuelles Passwort und ein neues eingeben. Das ist der reguläre, angemeldete Weg. Wenn Sie Ihr Passwort vergessen haben und sich nicht anmelden können, nutzen Sie den Reset-Ablauf unten.

## Passwort zurücksetzen (Passwort vergessen)

Wenn Sie sich nicht anmelden können, nutzen Sie den Link **„Passwort vergessen?"** auf der Login-Seite:

1. E-Mail auf der Passwort-vergessen-Seite eingeben.
2. Coworkee mailt Ihnen einen **Reset-Link** (einmalig, zeitlich begrenzt).
3. Link öffnen und ein neues Passwort setzen.
4. Mit dem neuen Passwort anmelden.

::: warning Mail muss konfiguriert sein
Der Reset-Link wird per E-Mail zugestellt. Steht die Instanz auf dem **LOG**-Mail-Fallback, wird der Link ins Anwendungs-Log geschrieben statt versendet — ein Admin muss also unter [Mail / SMTP](./configuration#mail-smtp) einen echten Transport konfigurieren, damit der Self-Service-Reset für echte Nutzer funktioniert.
:::

## Sprache

Wechseln Sie Ihre Oberflächensprache zwischen **Deutsch** und **Englisch**. Die Wahl wird pro Benutzer gespeichert (cookie-basiert, ohne URL-Präfix), begleitet Sie also über Sitzungen hinweg und betrifft niemanden sonst.

## API-Tokens

Erstellen Sie **persönliche API-Tokens** auf der Konto-Seite, um die [REST-API und den MCP-Server](./api-mcp) zu nutzen.

- Ein Token trägt **genau Ihre RBAC-Rechte** — Automatisierung kann nur, was auch Sie dürfen.
- Der Token-Wert wird **einmalig** bei der Erstellung angezeigt. Sofort kopieren; er lässt sich nicht erneut abrufen.
- **Widerrufen** Sie ein Token jederzeit auf derselben Seite; widerrufene Tokens funktionieren sofort nicht mehr.

Senden Sie ein Token als Header `Authorization: Bearer <token>`. Vollständige Beispiele siehe [API & MCP](./api-mcp).
