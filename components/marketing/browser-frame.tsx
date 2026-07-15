import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Fake browser chrome wrapping a product screenshot: three dots + a URL
 * pill above the image. Purely decorative (aria-hidden) — the screenshot's
 * alt text carries the meaning.
 */
export function BrowserFrame({
  src,
  alt,
  url = "coworkee.app",
  preload = false,
  className,
}: {
  src: string;
  alt: string;
  url?: string;
  preload?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10",
        className,
      )}
    >
      <div aria-hidden className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-yellow-400" />
          <span className="size-2.5 rounded-full bg-green-400" />
        </div>
        <div className="mx-auto flex max-w-[70%] items-center gap-1.5 rounded-md bg-white px-3 py-1 text-xs text-slate-400 ring-1 ring-slate-200">
          <Lock />
          <span className="truncate">{url}</span>
        </div>
      </div>
      <Image
        src={src}
        alt={alt}
        width={1440}
        height={900}
        preload={preload}
        sizes="(max-width: 768px) 100vw, 900px"
        className="block h-auto w-full"
      />
    </div>
  );
}

function Lock() {
  return (
    <svg viewBox="0 0 16 16" className="size-3 shrink-0 fill-slate-400">
      <path d="M4 7V5a4 4 0 1 1 8 0v2h.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1H4Zm1.5 0h5V5a2.5 2.5 0 0 0-5 0v2Z" />
    </svg>
  );
}
