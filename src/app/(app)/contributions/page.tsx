import { auth } from "@/auth";
import { getDashboardData } from "@/lib/data";
import type { PeriodKey } from "@/lib/analytics";
import { ProfileHeader } from "@/components/profile-header";
import { PeriodTabs } from "@/components/period-tabs";
import { StatCard } from "@/components/stat-card";
import { TrendChart, TypeBreakdownChart } from "@/components/charts";
import { ContributionHeatmap } from "@/components/heatmap";

const PERIODS = new Set(["30d", "90d", "12m", "all"]);

export default async function ContributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const params = await searchParams;
  const period = (PERIODS.has(params.period ?? "") ? params.period : "12m") as PeriodKey;
  const data = await getDashboardData(session.user.id, period);

  return (
    <div className="space-y-6">
      <ProfileHeader
        name={data.profile?.name ?? session.user.name ?? "GitHub user"}
        login={data.profile?.login}
        image={data.profile?.avatarUrl ?? session.user.image}
        syncStatus={data.sync.status}
        lastSyncedAt={data.sync.lastSyncedAt}
        errorMessage={data.sync.errorMessage}
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contribution analytics</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Trends are computed from cached daily totals. Sync to refresh GitHub history.
          </p>
        </div>
        <PeriodTabs current={period} hrefBase="/contributions" />
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Contributions" value={data.totals.total} />
        <StatCard label="Commits" value={data.totals.commits} />
        <StatCard label="Pull requests" value={data.totals.pullRequests} />
        <StatCard label="Issues" value={data.totals.issues} />
        <StatCard label="Reviews" value={data.totals.reviews} />
      </section>
      <ContributionHeatmap days={data.heatmapDays} />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">Contribution trend</h2>
          <TrendChart data={data.monthly} />
        </section>
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">By contribution type</h2>
          <TypeBreakdownChart data={data.monthly} />
        </section>
      </div>
    </div>
  );
}
