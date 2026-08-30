import { auth } from "@/auth";
import { getDashboardData } from "@/lib/data";
import { yearInReview } from "@/lib/insights";
import { formatNumber } from "@/lib/format";
import { ProfileHeader } from "@/components/profile-header";
import { StatCard } from "@/components/stat-card";

export default async function YearInReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const data = await getDashboardData(session.user.id, "all");
  const params = await searchParams;
  const years = [...new Set(data.heatmapDays.map((day) => day.date.getUTCFullYear()))].sort(
    (a, b) => b - a,
  );
  const selected = Number(params.year) || years[0] || new Date().getUTCFullYear();
  const review = yearInReview(selected, data.heatmapDays, data.repos, data.languages, data.streaks.longest);

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
      <div className="card overflow-hidden p-8">
        <p className="stat-label">Year in Review</p>
        <h1 className="mt-2 text-4xl font-semibold">{review.year}</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          A yearly summary computed from your cached GitHub contribution history.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {years.map((year) => (
            <a
              key={year}
              href={`/year-in-review?year=${year}`}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                year === selected ? "border-brand bg-brand-glow" : "border-line text-ink-muted"
              }`}
            >
              {year}
            </a>
          ))}
        </div>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total contributions" value={review.totals.total} />
        <StatCard label="Most active project" value={review.mostActiveProject} />
        <StatCard label="Most-used language" value={review.mostUsedLanguage} />
        <StatCard label="Most productive month" value={review.mostProductiveMonth} />
        <StatCard label="Longest streak" value={review.longestStreak} hint="Across stored history" />
        <StatCard label="Repositories contributed to" value={review.repositories} />
        <StatCard label="External / open source repos" value={review.openSourceRepositories} />
        <StatCard label="Commits" value={review.totals.commits} />
      </section>
      <p className="text-sm text-ink-faint">
        {formatNumber(review.totals.pullRequests)} pull requests, {formatNumber(review.totals.issues)}{" "}
        issues, and {formatNumber(review.totals.reviews)} reviews in {review.year}.
      </p>
    </div>
  );
}
