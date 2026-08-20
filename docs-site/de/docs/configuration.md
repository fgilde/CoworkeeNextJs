# Konfiguration & Administration

Administrative Einstellungen liegen unter **Einstellungen** (`/settings`) und stehen der Rolle **Admin** offen (einige Bereiche auch **HR**). Diese Seite behandelt Theming, E-Mail, Benutzer und Rollen sowie Unternehmenseinstellungen.

## Theming

Coworkee trennt das **Stil-Preset** (die grundlegende visuelle Sprache) von der **Corporate Identity** (Ihre Markenfarbe und Ihr Logo).

**Stil-Presets:**

| Preset | Charakter |
|---|---|
| `default` | Klar, neutral, das Aussehen ab Werk |
| `material` | Material-inspirierte Flächen und Elevation |
| `github` | Zurückhaltend, GitHub-artig |
| `playful` | Runder, farbiger |

**Corporate Identity:**

- **Akzentfarbe** — die Primär-/CI-Farbe für Buttons, Links und Hervorhebungen.
- **Logo** — laden Sie Ihr Firmenlogo hoch; es wird über den Tenant-Logo-Endpunkt ausgeliefert und in der App-Shell angezeigt.

**Erscheinungsbild:** Heller und dunkler Modus sind überall verfügbar; die Wahl wird pro Benutzer gemerkt.

Setzen Sie Preset und Erscheinungsbild anfangs im [Einrichtungsassistenten](./setup-wizard); ändern Sie sie jederzeit unter **Einstellungen → Erscheinungsbild / Theming**.

## Mail / SMTP

Coworkee kann transaktionale E-Mails versenden — allen voran den **Passwort-Reset-Link** und Benachrichtigungen. Konfigurieren Sie den Mail-Transport unter **Einstellungen → Mail**. Vier Transporte werden unterstützt:

| Transport | Einsatz, wenn |
|---|---|
| **SMTP** | Sie einen Mailserver oder Relay haben (Host, Port, Benutzer, Passwort, TLS). |
| **SendGrid** | Sie SendGrid nutzen — API-Key angeben. |
| **sendmail** | Der Host ein `sendmail`-kompatibles Binary hat. |
| **LOG** (Fallback) | Keine Mail konfiguriert — Nachrichten werden ins Anwendungs-Log geschrieben statt versendet. Gut für die Entwicklung. |

- **Secrets werden verschlüsselt** gespeichert (SMTP-Passwort, SendGrid-API-Key), nicht im Klartext.
- Nutzen Sie nach dem Speichern den Button **„Test-E-Mail senden"**, um den Transport durchgängig zu prüfen.
- Solange kein echter Transport konfiguriert ist, fällt Coworkee auf **LOG** zurück — ein Passwort-Reset-Link erscheint dann z. B. im Container-Log statt im Postfach.

::: tip Passwort-Reset braucht funktionierende Mail
Der [Passwort-vergessen-Ablauf](./account#passwort-zurucksetzen) mailt einen Reset-Link. Steht Mail auf dem LOG-Fallback, erscheint dieser Link nur im Log — konfigurieren Sie einen echten Transport, bevor Sie sich auf Self-Service-Resets verlassen.
:::

## Benutzer & Rollen

Coworkee nutzt **rollenbasierte Zugriffssteuerung (RBAC)** mit vier Rollen, **serverseitig** bei jedem Schreibvorgang durchgesetzt (Server-Actions sind Zod-validiert und auditiert). Verwalten Sie Benutzer und Rollen unter **Einstellungen → Benutzer**.

| Rolle | Gedacht für |
|---|---|
| **ADMIN** | Systemadministration — voller Zugriff inkl. Einstellungen, Theming, Mail und Benutzerverwaltung. |
| **HR** | HR-Personal — verwaltet Mitarbeitende, Abwesenheit, Dokumente, Onboarding, Recruiting im ganzen Unternehmen. |
| **MANAGER** | Teamleitungen — genehmigen Abwesenheit ihres Teams, sehen Team-Zeiten, verwalten ihre Direktberichte. |
| **EMPLOYEE** | Alle Mitarbeitenden — Self-Service: eigenes Profil, eigene Abwesenheitsanträge, eigene Zeit, eigene Dokumente. |

### Berechtigungsmatrix

Eine praktische Sicht darauf, wer was darf. „Eigene" meint die eigenen Datensätze des Handelnden; „Team" meint die Direktberichte der Führungskraft.

| Fähigkeit | Admin | HR | Manager | Mitarbeitende |
|---|:---:|:---:|:---:|:---:|
| Eigenes Profil & Daten sehen | ✅ | ✅ | ✅ | ✅ |
| Eigenes Profil bearbeiten (Self-Service) | ✅ | ✅ | ✅ | ✅ |
| Alle Mitarbeitenden sehen | ✅ | ✅ | ✅ | ✅ |
| Mitarbeitende anlegen / bearbeiten | ✅ | ✅ | — | — |
| Eigene Abwesenheit beantragen | ✅ | ✅ | ✅ | ✅ |
| Abwesenheit genehmigen | ✅ | ✅ | Team | — |
| Abwesenheitsansprüche verwalten | ✅ | ✅ | — | — |
| Team-Zeiten sehen | ✅ | ✅ | Team | — |
| Dokumente auf ein Profil hochladen | ✅ | ✅ | — | — |
| Onboarding-Vorlagen & -Prozesse verwalten | ✅ | ✅ | — | — |
| Ziele & Beurteilungen verwalten | ✅ | ✅ | Team | eigener Fortschritt |
| Analytics-Dashboard sehen | ✅ | ✅ | — | — |
| Recruiting-Pipeline verwalten | ✅ | ✅ | — | — |
| News / Ankündigungen veröffentlichen | ✅ | ✅ | — | — |
| Benutzer & Rollen verwalten | ✅ | — | — | — |
| Einstellungen: Theming, Mail, Unternehmen | ✅ | — | — | — |

::: info Genaue Beschränkung
Die Tabelle ist ein Leitfaden zum gedachten Modell. Maßgeblich sind die serverseitigen RBAC-Prüfungen in `lib/` — jeder Schreibvorgang durchläuft sie, unabhängig davon, was die UI zeigt.
:::

## Unternehmenseinstellungen

Unter **Einstellungen → Unternehmen** pflegt der Admin den Firmennamen und die unternehmensweiten Optionen aus dem [Assistenten](./setup-wizard). Diese Werte speisen App-Shell, Dokumente und Analytics.
