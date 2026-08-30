import Link from "next/link";
import type { PeriodKey } from "@/lib/analytics";
import { cn } from "@/lib/format";

const PERIODS: Array<{ key: PeriodKey; label: string }> = [
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "12m", label: "Last 12 months" },
  { key: "all", label: "All available history" },
];

export function PeriodTabs({
  current,
  hrefBase,
}: {
  current: PeriodKey;
  hrefBase: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PERIODS.map((period) => (
        <Link
          key={period.key}
          href={`${hrefBase}?period=${period.key}`}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs transition",
            current === period.key
              ? "border-brand bg-brand-glow text-ink"
              : "border-line text-ink-muted hover:border-ink-faint hover:text-ink",
          )}
        >
          {period.label}
        </Link>
      ))}
    </div>
  );
}
