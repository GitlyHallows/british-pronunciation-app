"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/practice/struggles", label: "Struggles" },
  { href: "/practice/misc", label: "Miscellaneous" },
  { href: "/practice/recordings", label: "Recordings" }
];

export function PracticeTabs() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
              active
                ? "border-teal bg-teal text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-teal/40 hover:text-teal"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
