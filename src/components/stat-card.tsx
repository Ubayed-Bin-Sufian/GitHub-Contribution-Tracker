import { formatNumber } from "@/lib/format";

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <article className="card p-5">
      <p className="stat-label">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
      {hint ? <p className="mt-2 text-xs text-ink-faint">{hint}</p> : null}
    </article>
  );
}
