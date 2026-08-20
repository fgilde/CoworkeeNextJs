import { defineConfig, type DefaultTheme } from "vitepress";

const REPO = "https://github.com/fgilde/CoworkeeNextJs";

// Doc chapters, shared shape for both locales. Each tuple is [label, slug]; the slug is the
// markdown file under docs/ (EN) or de/docs/ (DE).
const EN_CHAPTERS: [string, string][] = [
  ["Introduction", "introduction"],
  ["Quick start (local dev)", "quick-start"],
  ["Installation & self-hosting", "installation"],
  ["First-run setup wizard", "setup-wizard"],
  ["Configuration & admin", "configuration"],
  ["Module guides", "modules"],
  ["Account & self-service", "account"],
  ["API & MCP", "api-mcp"],
  ["FAQ & troubleshooting", "faq"],
];

const DE_CHAPTERS: [string, string][] = [
  ["Einführung", "introduction"],
  ["Schnellstart (lokal)", "quick-start"],
  ["Installation & Self-Hosting", "installation"],
  ["Einrichtungsassistent", "setup-wizard"],
  ["Konfiguration & Administration", "configuration"],
  ["Modul-Handbuch", "modules"],
  ["Konto & Self-Service", "account"],
  ["API & MCP", "api-mcp"],
  ["FAQ & Fehlerbehebung", "faq"],
];

function sidebar(prefix: string, text: string, items: [string, string][]): DefaultTheme.Sidebar {
  return [{ text, items: items.map(([label, slug]) => ({ text: label, link: `${prefix}/docs/${slug}` })) }];
}

export default defineConfig({
  // Project page under github.io, so every asset and link is prefixed with the repo name.
  base: "/CoworkeeNextJs/",
  title: "Coworkee",
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: "localhostLinks",
  appearance: true,

  head: [
    ["link", { rel: "icon", type: "image/png", href: "/CoworkeeNextJs/icon.png" }],
    ["meta", { name: "theme-color", content: "#4f46e5" }],
  ],

  themeConfig: {
    logo: "/icon.png",
    socialLinks: [{ icon: "github", link: REPO }],
    search: {
      provider: "local",
      options: {
        locales: {
          de: {
            translations: {
              button: { buttonText: "Suchen", buttonAriaLabel: "Suchen" },
              modal: {
                displayDetails: "Details anzeigen",
                resetButtonTitle: "Suche zurücksetzen",
                noResultsText: "Keine Ergebnisse für",
                footer: {
                  selectText: "auswählen",
                  navigateText: "navigieren",
                  closeText: "schließen",
                },
              },
            },
          },
        },
      },
    },
  },

  locales: {
    root: {
      label: "English",
      lang: "en",
      description: "Self-hosted, bilingual HR and personnel-management software — employees, absence, time, documents, onboarding, performance, analytics, recruiting and news, with a REST API and MCP server.",
      themeConfig: {
        nav: [
          { text: "Home", link: "/" },
          { text: "Documentation", link: "/docs/introduction" },
          { text: "Installation", link: "/docs/installation" },
          { text: "API & MCP", link: "/docs/api-mcp" },
        ],
        sidebar: sidebar("", "Documentation", EN_CHAPTERS),
        editLink: {
          pattern: `${REPO}/edit/master/docs-site/:path`,
          text: "Edit this page on GitHub",
        },
        lastUpdatedText: "Last updated",
        footer: {
          message: 'Released under a proprietary license.',
          copyright: "Copyright © 2026 Coworkee",
        },
      },
    },

    de: {
      label: "Deutsch",
      lang: "de-DE",
      description: "Selbst gehostete, zweisprachige HR- und Personalverwaltungssoftware — Mitarbeitende, Abwesenheit, Zeiterfassung, Dokumente, Onboarding, Performance, Analytics, Recruiting und News, mit REST-API und MCP-Server.",
      themeConfig: {
        nav: [
          { text: "Start", link: "/de/" },
          { text: "Dokumentation", link: "/de/docs/introduction" },
          { text: "Installation", link: "/de/docs/installation" },
          { text: "API & MCP", link: "/de/docs/api-mcp" },
        ],
        sidebar: sidebar("/de", "Dokumentation", DE_CHAPTERS),
        editLink: {
          pattern: `${REPO}/edit/master/docs-site/:path`,
          text: "Diese Seite auf GitHub bearbeiten",
        },
        lastUpdatedText: "Zuletzt geändert",
        outline: { label: "Auf dieser Seite" },
        docFooter: { prev: "Zurück", next: "Weiter" },
        returnToTopLabel: "Nach oben",
        sidebarMenuLabel: "Kapitel",
        darkModeSwitchLabel: "Erscheinungsbild",
        langMenuLabel: "Sprache wechseln",
        footer: {
          message: "Veröffentlicht unter einer proprietären Lizenz.",
          copyright: "Copyright © 2026 Coworkee",
        },
      },
    },
  },
});
