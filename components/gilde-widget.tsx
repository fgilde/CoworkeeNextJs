"use client";

import { useEffect, useRef, useState } from "react";

// GildeConnect contact/support widgets (web components). One reusable wrapper for
// the marketing site and the in-app About page.
//
// The widget rewrites its own DOM after upgrading. If React owned that node it
// would try to reconcile it on every RSC refresh (e.g. the locale switch calls
// revalidatePath) and crash. So we render a plain <div> that React controls and
// mount the web component *inside* it imperatively — React never diffs it.
const WIDGET_SRC = "https://connect.gilde.org/widgets/v1.js?v=2";
const PROJECT = "fgilde/CoworkeeNextJs";

function useWidgetScript() {
  useEffect(() => {
    if (document.querySelector("script[data-gilde-widgets]")) return;
    const s = document.createElement("script");
    s.type = "module";
    s.src = WIDGET_SRC;
    s.dataset.gildeWidgets = "true";
    document.head.appendChild(s);
  }, []);
}

// Track the app/site dark mode (class strategy on <html>).
function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setDark(el.classList.contains("dark"));
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export type GildeWidgetProps = {
  type: "contact" | "support";
  /** Hex accent; should match the surface it sits on. */
  accent: string;
  /** Current UI language. */
  language: string;
  /** Inline renders the form directly; otherwise a button opens the dialog. */
  inline?: boolean;
  /** Dialog title. */
  title?: string;
  /** Whether to show the homepage link. Defaults to on for buttons, off for inline. */
  showHomepage?: boolean;
  /** Button label (dialog mode). */
  label?: string;
  className?: string;
};

export function GildeWidget({
  type,
  accent,
  language,
  inline = false,
  title,
  showHomepage,
  label,
  className,
}: GildeWidgetProps) {
  useWidgetScript();
  const dark = useDarkMode();
  const hostRef = useRef<HTMLDivElement>(null);
  const elRef = useRef<HTMLElement | null>(null);

  // (Re)build the web component imperatively when its content-defining props
  // change. Not theme — that is a cheap attribute update handled below.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Inline vs. button rules: inline hides footer + description; the button shows both.
    const attrs: Record<string, string> = {
      project: PROJECT,
      widget: type,
      accent,
      language,
      width: "560",
      radius: "18",
      padding: "28",
      "show-logo": "true",
      "show-preview-notice": "false",
      "footer-brand": "Coworkee",
      "footer-tagline": "gilde.org",
      "show-description": inline ? "false" : "true",
      "show-footer": inline ? "false" : "true",
      "show-homepage": (showHomepage ?? !inline) ? "true" : "false",
    };
    if (title) attrs.title = title;
    if (type === "support") {
      attrs["support-layout"] = "rows";
      attrs["show-support-icons"] = "true";
      attrs["show-support-qr"] = "true";
      attrs["show-support-hint"] = "false";
    }

    const el = document.createElement(type === "support" ? "gilde-support" : "gilde-contact");
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (inline) el.setAttribute("inline", "");
    el.setAttribute("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
    if (label) el.textContent = label;

    host.replaceChildren(el);
    elRef.current = el;

    return () => {
      el.remove();
      elRef.current = null;
    };
  }, [type, accent, language, inline, title, showHomepage, label]);

  // Cheap theme sync — no rebuild.
  useEffect(() => {
    elRef.current?.setAttribute("theme", dark ? "dark" : "light");
  }, [dark]);

  return <div ref={hostRef} className={className} />;
}
