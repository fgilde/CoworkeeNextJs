"use client";

import { useEffect, useState } from "react";

// GildeConnect contact/support widgets (web components). One reusable wrapper for
// the marketing site and the in-app About page. Loads the module script once and
// keeps the widget `theme` in sync with the surrounding light/dark mode.
const WIDGET_SRC = "https://connect.gilde.org/widgets/v1.js?v=2";
const PROJECT = "fgilde/CoworkeeNextJs";

function useWidgetScript() {
  useEffect(() => {
    if (document.querySelector(`script[data-gilde-widgets]`)) return;
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

  // Inline vs. button rules (per the widget guidance): inline hides footer and
  // description; the button shows both.
  const attrs: Record<string, string> = {
    project: PROJECT,
    widget: type,
    theme: dark ? "dark" : "light",
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
  if (className) attrs.class = className;
  if (type === "support") {
    attrs["support-layout"] = "rows";
    attrs["show-support-icons"] = "true";
    attrs["show-support-qr"] = "true";
    attrs["show-support-hint"] = "false";
  }
  const inlineAttr = inline ? { inline: "" } : {};

  return type === "support" ? (
    <gilde-support {...attrs} {...inlineAttr}>
      {label}
    </gilde-support>
  ) : (
    <gilde-contact {...attrs} {...inlineAttr}>
      {label}
    </gilde-contact>
  );
}
