"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitBranch, Menu, X } from "lucide-react";
import { useState } from "react";
import { NAV_ITEMS } from "@/components/nav";
import { cn } from "@/lib/format";

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <GitBranch className="h-4 w-4 text-brand" />
          Contribution Tracker
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg border border-line p-2 text-ink-muted"
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <aside
        className={cn(
          "border-line bg-canvas-muted lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:border-r",
          open ? "block border-b" : "hidden lg:flex",
        )}
      >
        <div className="hidden px-6 py-6 lg:block">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-glow text-brand">
              <GitBranch className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">GitHub Contribution</span>
              <span className="block text-xs text-ink-muted">Tracker</span>
            </span>
          </Link>
        </div>
        <nav className="flex flex-col gap-1 px-3 pb-6">
          {NAV_ITEMS.filter((item) => !item.hidden).map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-brand-glow text-ink"
                    : "text-ink-muted hover:bg-canvas-hover hover:text-ink",
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-brand")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto hidden px-6 pb-6 text-xs leading-5 text-ink-faint lg:block">
          Read-only GitHub analytics. This app never writes to your repositories.
        </p>
      </aside>
    </>
  );
}
