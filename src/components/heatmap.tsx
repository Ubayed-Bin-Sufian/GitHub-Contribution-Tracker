import { cn } from "@/lib/format";

function utcKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

type HeatmapProps = {
  days: Array<{ date: Date; total: number }>;
};

const LEVELS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

function level(count: number, max: number) {
  if (count <= 0) return 0;
  if (max <= 1) return 4;
  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

export function ContributionHeatmap({ days }: HeatmapProps) {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 364);
  const scoped = days.filter((day) => day.date >= cutoff);
  const max = Math.max(1, ...scoped.map((day) => day.total));
  const byDate = new Map(scoped.map((day) => [utcKey(day.date), day.total]));

  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 364);
  while (start.getUTCDay() !== 0) {
    start.setUTCDate(start.getUTCDate() - 1);
  }

  const weeks: Array<Array<{ date: string; count: number } | null>> = [];
  const cursor = new Date(start);
  const today = new Date();

  while (cursor <= today) {
    const week: Array<{ date: string; count: number } | null> = [];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      if (cursor > today) {
        week.push(null);
        continue;
      }
      const key = utcKey(cursor);
      week.push({ date: key, count: byDate.get(key) ?? 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
  }

  return (
    <section className="card overflow-x-auto p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="stat-label">Contribution heatmap</p>
          <h2 className="mt-1 text-lg font-semibold">Last 12 months</h2>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-ink-faint">
          Less
          {LEVELS.map((color) => (
            <span key={color} className="heatmap-cell" style={{ background: color }} />
          ))}
          More
        </div>
      </div>
      <div className="flex gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) =>
              day ? (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} contributions`}
                  className={cn("heatmap-cell")}
                  style={{ background: LEVELS[level(day.count, max)] }}
                />
              ) : (
                <div key={`${weekIndex}-${dayIndex}`} className="heatmap-cell bg-transparent" />
              ),
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
