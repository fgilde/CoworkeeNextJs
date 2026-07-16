import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Briefcase,
  CalendarClock,
  Check,
  Clock,
  FileText,
  ListChecks,
  Moon,
  Network,
  ShieldCheck,
  Sun,
  Target,
  Users2,
} from "lucide-react";
import { BrowserFrame } from "@/components/marketing/browser-frame";

const stats = [
  "9 Module",
  "DE / EN",
  "Hell & Dunkel",
  "Rollenbasierte Rechte (RBAC)",
  "DSGVO-freundlich, self-hosted",
];

const modules = [
  {
    icon: Users2,
    title: "Mitarbeiterverwaltung & Org-Chart",
    body: "Alle Stammdaten und die Berichtslinie auf einen Blick — immer aktuell.",
  },
  {
    icon: CalendarClock,
    title: "Abwesenheit & Urlaub",
    body: "Anträge, Genehmigungs-Workflow und Resturlaub automatisch berechnet.",
  },
  {
    icon: Clock,
    title: "Zeiterfassung",
    body: "Arbeitszeiten erfassen und auswerten, ohne Excel-Chaos.",
  },
  {
    icon: FileText,
    title: "Dokumente",
    body: "Verträge und Nachweise sicher ablegen, rollenbasiert freigegeben.",
  },
  {
    icon: ListChecks,
    title: "Onboarding-Checklisten",
    body: "Neue Teammitglieder strukturiert und ohne Reibungsverluste einarbeiten.",
  },
  {
    icon: Target,
    title: "Performance",
    body: "Ziele setzen, Reviews durchführen, Fortschritt sichtbar machen.",
  },
  {
    icon: BarChart3,
    title: "Analysen & Reporting",
    body: "Kopfzahl, Fluktuation und Abwesenheiten als KPIs und Charts.",
  },
  {
    icon: Briefcase,
    title: "Recruiting",
    body: "Stellen ausschreiben und Bewerbungen per Kanban-Pipeline steuern.",
  },
  {
    icon: Bell,
    title: "Neuigkeiten & Benachrichtigungen",
    body: "Ankündigungen und Erinnerungen erreichen das Team, wo es hinschaut.",
  },
];

const spotlights = [
  {
    eyebrow: "Analysen",
    title: "Entscheidungen auf Basis von Zahlen, nicht Bauchgefühl.",
    body: "Kopfzahl-Entwicklung, Vertragsarten, Neueinstellungen und Fluktuation in Echtzeit-Dashboards — statt verstreuter Tabellen.",
    bullets: ["KPI-Kacheln für HR-Kennzahlen", "Verlaufscharts für Headcount & Abgänge", "Export-fähige Auswertungen"],
    src: "/marketing/screens/analytics-light.png",
    alt: "Coworkee Analytics-Dashboard mit KPI-Kacheln und Diagrammen",
  },
  {
    eyebrow: "Org-Chart",
    title: "Die Struktur eures Unternehmens, sofort verständlich.",
    body: "Berichtslinien, Teams und offene Positionen als interaktiven Organisationsbaum — statt veralteter PowerPoint-Folien.",
    bullets: ["Automatisch aus den Mitarbeiterdaten generiert", "Klick-Navigation durch jede Ebene", "Immer synchron mit der Personalakte"],
    src: "/marketing/screens/org-light.png",
    alt: "Coworkee Org-Chart mit Berichtslinien der Organisation",
  },
  {
    eyebrow: "Recruiting",
    title: "Vom Stellenprofil bis zur Zusage — eine Pipeline.",
    body: "Ausschreibungen veröffentlichen und Bewerbungen per Drag-and-Drop-Kanban durch jede Phase führen, ohne den Überblick zu verlieren.",
    bullets: ["ATS-Kanban mit klaren Phasen", "Bewerberprofile inkl. Verlauf", "Rollenbasierte Sichtbarkeit für Fachbereiche"],
    src: "/marketing/screens/recruiting-light.png",
    alt: "Coworkee Recruiting-Pipeline als Kanban-Board",
  },
  {
    eyebrow: "Abwesenheit",
    title: "Urlaubsanträge, die niemand mehr per E-Mail verschickt.",
    body: "Verbleibende Urlaubstage, Anträge und Genehmigungen an einem Ort — transparent für Mitarbeitende und Führungskräfte.",
    bullets: ["Resturlaub live berechnet", "Genehmigungs-Workflow für Manager", "Team-Kalender für Abwesenheiten"],
    src: "/marketing/screens/absences-light.png",
    alt: "Coworkee Abwesenheits-Übersicht mit Urlaubssalden",
  },
  {
    eyebrow: "Mitarbeiterverzeichnis",
    title: "Jede Kollegin, jeder Kollege — durchsuchbar in Sekunden.",
    body: "Ein zentrales Verzeichnis mit Filter- und Suchfunktion ersetzt verstreute Kontaktlisten und veraltete Wikis.",
    bullets: ["Volltextsuche über die gesamte Belegschaft", "Filter nach Team, Standort und Rolle", "Direkter Sprung zur Personalakte"],
    src: "/marketing/screens/employees-light.png",
    alt: "Coworkee Mitarbeiterverzeichnis als durchsuchbare Tabelle",
  },
];

const demoLogins = [
  { role: "Administrator", email: "admin@coworkee.test" },
  { role: "HR", email: "hr@coworkee.test" },
  { role: "Manager", email: "manager@coworkee.test" },
  { role: "Mitarbeiter", email: "employee@coworkee.test" },
];

const footerLinks = [
  { href: "#module", label: "Module" },
  { href: "#funktionen", label: "Funktionen" },
  { href: "#demo", label: "Demo" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-indigo-700 via-indigo-600 to-violet-700 pt-20 pb-28 text-white sm:pt-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-40 size-[32rem] rounded-full bg-violet-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-size-[2.5rem_2.5rem] opacity-[0.06]"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Die HR-Plattform für dein ganzes Team.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-indigo-100 text-balance">
            Mitarbeitende, Abwesenheit, Zeiterfassung, Dokumente, Performance und Recruiting — in einem
            System, statt in zehn Tabs.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition-all hover:shadow-xl hover:brightness-105 active:translate-y-px"
            >
              Live-Demo starten
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href="#funktionen"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Funktionen ansehen
            </a>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-4xl">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 scale-95 rounded-3xl bg-white/20 blur-2xl"
          />
          <div className="rotate-1 transition-transform duration-500 ease-out hover:rotate-0">
            <BrowserFrame
              src="/marketing/screens/dashboard-light.png"
              alt="Coworkee Dashboard mit Übersicht über Team, Abwesenheiten und Aufgaben"
              url="coworkee.app/dashboard"
              preload
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function TrustBand() {
  return (
    <section className="border-b border-slate-200 bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 sm:px-6">
        {stats.map((s) => (
          <div key={s} className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <ShieldCheck className="size-4 text-indigo-500" aria-hidden />
            {s}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ModuleGrid() {
  return (
    <section id="module" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Alles, was HR braucht.
          </h2>
          <p className="mt-4 text-slate-600">
            Neun Module, eine Plattform. Kein Zusammensuchen zwischen Tools, die nicht miteinander sprechen.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="inline-flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 text-white">
                <Icon className="size-5" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeatureSpotlights() {
  return (
    <section id="funktionen" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Gebaut, damit HR-Arbeit wieder Spaß macht.
          </h2>
        </div>

        <div className="mt-16 flex flex-col gap-24">
          {spotlights.map((s, i) => (
            <div
              key={s.eyebrow}
              className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
            >
              <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                <span className="text-sm font-semibold tracking-wide text-indigo-600 uppercase">
                  {s.eyebrow}
                </span>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  {s.title}
                </h3>
                <p className="mt-4 text-slate-600">{s.body}</p>
                <ul className="mt-6 flex flex-col gap-3">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="mt-0.5 size-4 shrink-0 text-indigo-600" aria-hidden />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : undefined}>
                <BrowserFrame src={s.src} alt={s.alt} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DarkModeShowcase() {
  return (
    <section className="bg-slate-950 py-24 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            <Sun className="size-3.5" aria-hidden />
            <Moon className="size-3.5" aria-hidden />
            Hell &amp; Dunkel
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Hell oder dunkel — dein Team entscheidet.
          </h2>
          <p className="mt-4 text-slate-300">
            Jede Person stellt ihr bevorzugtes Theme selbst ein. Coworkee sieht in beiden Fällen gut aus.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2">
          <div>
            <BrowserFrame
              src="/marketing/screens/dashboard-light.png"
              alt="Coworkee Dashboard im hellen Theme"
              className="ring-1 ring-white/10"
            />
            <p className="mt-3 text-center text-sm text-slate-400">Hell</p>
          </div>
          <div>
            <BrowserFrame
              src="/marketing/screens/dashboard-dark.png"
              alt="Coworkee Dashboard im dunklen Theme"
              className="ring-1 ring-white/10"
            />
            <p className="mt-3 text-center text-sm text-slate-400">Dunkel</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DemoSection() {
  return (
    <section id="demo" className="bg-linear-to-br from-indigo-700 via-indigo-600 to-violet-700 py-24 text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-white/10 p-8 backdrop-blur-sm ring-1 ring-white/20 sm:p-12">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Live-Demo, ganz ohne Anmeldeformular.</h2>
            <p className="mt-3 text-indigo-100">
              Diese Instanz läuft mit realistischen Beispieldaten. Einfach mit einem der folgenden Zugänge anmelden.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {demoLogins.map((d) => (
              <div
                key={d.email}
                className="flex items-center justify-between gap-4 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15"
              >
                <span className="text-sm font-medium text-white/90">{d.role}</span>
                <code className="text-sm text-indigo-100">{d.email}</code>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-indigo-100">
            Passwort (alle): <code className="rounded bg-white/15 px-1.5 py-0.5">coworkee</code>
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition-all hover:shadow-xl hover:brightness-105 active:translate-y-px"
            >
              Zur Anmeldung
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MarketingFooter() {
  return (
    <footer className="bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 sm:flex-row sm:justify-between sm:px-6">
        <span className="font-heading text-lg font-semibold tracking-tight text-slate-900">Coworkee</span>

        <nav className="flex flex-wrap items-center justify-center gap-6">
          {footerLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-slate-600 hover:text-slate-900">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="text-center text-sm text-slate-500 sm:text-right">
          <p>
            © 2026 Coworkee · by{" "}
            <a
              href="https://www.gilde.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              gilde.org
            </a>
          </p>
          <p className="mt-0.5 flex items-center justify-center gap-1 sm:justify-end">
            <Network className="size-3.5" aria-hidden />
            Demo-Instanz
          </p>
        </div>
      </div>
    </footer>
  );
}
