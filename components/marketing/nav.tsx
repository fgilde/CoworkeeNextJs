"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { LocaleSwitch } from "@/components/locale-switch";

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("marketing");

  const links = [
    { href: "#funktionen", label: t("nav.features") },
    { href: "#module", label: t("nav.modules") },
    { href: "#hosting", label: t("nav.hosting") },
    { href: "#demo", label: t("nav.demo") },
    { href: "#kontakt", label: t("nav.contact") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-heading text-xl font-semibold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-violet-600"
        >
          Coworkee
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LocaleSwitch />
          <Link
            href="/login"
            className="inline-flex items-center rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md hover:brightness-110 active:translate-y-px"
          >
            {t("nav.login")}
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <LocaleSwitch />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? t("nav.menuClose") : t("nav.menuOpen")}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/login"
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm"
            >
              {t("nav.login")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
