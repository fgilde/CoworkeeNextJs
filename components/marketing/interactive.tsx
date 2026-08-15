"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Boxes, Infinity as InfinityIcon, Languages, ServerCog } from "lucide-react";

/**
 * Enables scroll-reveal for every `.reveal` element on the page. Adds
 * `reveal-ready` to <html> on mount so the hidden state only ever applies
 * when JS is running (no-JS / reduced-motion users still see everything).
 */
export function RevealInit() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-ready");
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}

type StatItem = {
  key: string;
  icon: typeof Boxes;
  value?: number;
  suffix?: string;
  display?: string;
};

const STAT_ITEMS: StatItem[] = [
  { key: "modules", icon: Boxes, value: 9 },
  { key: "languages", icon: Languages, value: 2 },
  { key: "selfHostable", icon: ServerCog, value: 100, suffix: "%" },
  { key: "employees", icon: InfinityIcon, display: "∞" },
];

export function StatsBand() {
  const t = useTranslations("marketing");

  return (
    <section className="border-y border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 text-center sm:grid-cols-4">
          {STAT_ITEMS.map(({ key, icon: Icon, value, suffix, display }) => (
            <div key={key} className="reveal flex flex-col items-center">
              <span className="mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 text-white">
                <Icon className="size-5" aria-hidden />
              </span>
              <StatNumber value={value} suffix={suffix} display={display} />
              <span className="mt-1 text-sm font-medium text-slate-600">
                {t(`stats.${key}`)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatNumber({
  value,
  suffix,
  display,
}: {
  value?: number;
  suffix?: string;
  display?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (display !== undefined || value === undefined) return;
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        io.disconnect();
        const duration = 1400;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(Math.round(value * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, display]);

  return (
    <span
      ref={ref}
      className="bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent tabular-nums sm:text-5xl"
    >
      {display ?? `${n}${suffix ?? ""}`}
    </span>
  );
}
