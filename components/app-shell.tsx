"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CircleDot, Layers2, Mic2, Spline } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ShellProps = {
  children: React.ReactNode;
};

const primaryLinks = [
  { href: "/learning", label: "Learning", icon: BookOpen },
  { href: "/practice/struggles", label: "Struggles", icon: CircleDot },
  { href: "/practice/misc", label: "Misc", icon: Layers2 },
  { href: "/practice/recordings", label: "Recordings", icon: Mic2 }
];

export function AppShell({ children }: ShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <div className="mx-auto grid min-h-dvh max-w-[1440px] grid-cols-1 gap-5 px-3 py-3 md:grid-cols-[280px_1fr] md:gap-6 md:px-6 md:py-6">
        <aside className="hidden rounded-3xl border border-white/60 bg-white/80 p-5 shadow-card backdrop-blur md:flex md:flex-col">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">
              <Spline className="h-3.5 w-3.5" /> Accent Lab
            </p>
            <h1 className="mt-4 font-[var(--font-dm-serif)] text-3xl text-ink">Practice Hub</h1>
            <p className="mt-2 text-sm text-slate-600">
              Learn, drill, and review recordings without page reloads.
            </p>
          </div>

          <nav className="mt-8 space-y-2">
            {primaryLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    active ? "bg-teal text-white shadow" : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="rounded-3xl border border-white/60 bg-white/75 shadow-card backdrop-blur">
          <header className="print-hide border-b border-slate-200/70 px-4 py-4 md:px-7">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Accent Practice App</p>
            <h2 className="font-[var(--font-dm-serif)] text-3xl text-ink">{resolveTitle(pathname)}</h2>
          </header>
          <div className="card-scroll max-h-[calc(100dvh-112px)] overflow-y-auto px-4 py-4 md:px-7 md:py-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <nav className="print-hide fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-white/70 bg-white/95 px-1 py-2 shadow-[0_-8px_20px_rgba(15,23,42,0.06)] backdrop-blur md:hidden">
        {primaryLinks.map((link) => {
          const active = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex min-w-[72px] flex-col items-center rounded-xl px-2 py-2 text-[11px] font-semibold",
                active ? "bg-teal text-white" : "text-slate-600"
              )}
            >
              <Icon className="mb-1 h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function resolveTitle(pathname: string) {
  if (pathname.startsWith("/learning")) return "Learning";
  if (pathname.startsWith("/practice/struggles")) return "Practice · Struggles";
  if (pathname.startsWith("/practice/misc")) return "Practice · Miscellaneous";
  if (pathname.startsWith("/practice/recordings")) return "Practice · Recordings";
  if (pathname.startsWith("/practice/sets")) return "Practice Set";
  return "Accent Practice";
}
