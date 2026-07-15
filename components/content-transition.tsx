"use client";

import { usePathname } from "next/navigation";

// Re-triggers a fade+slide-in on every client-side navigation by keying on
// the pathname, so the (app) layout's <main> doesn't have to remount.
export function ContentTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 fill-mode-both">
      {children}
    </div>
  );
}
