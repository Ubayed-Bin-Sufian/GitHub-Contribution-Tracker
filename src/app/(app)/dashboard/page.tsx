import Link from "next/link";
import { auth } from "@/auth";
import { getDashboardData } from "@/lib/data";
import { CATEGORY_META, categorizeRepositories } from "@/lib/analytics";
import { formatNumber } from "@/lib/format";
import { EmptyDashboard } from "@/app/(app)/empty-state";
import { ProfileHeader } from "@/components/profile-header";
import { StatCard } from "@/components/stat-card";
import { ContributionHeatmap } from "@/components/heatmap";
import { LanguagePieChart, TrendChart } from "@/components/charts";
import { RepoTable } from "@/components/repo-table";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const data = await getDashboardData(session.user.id, "12m");
  const name = data.profile?.name ?? session.user.name ?? "GitHub user";

  if (!data.heatmapDays.length) {
    return (
      <EmptyDashboard
        name={name}
        image={data.profile?.avatarUrl ?? session.user.image}
        errorMessage={data.sync.errorMessage}
      />
    );
  }

  const categories = categorizeRepositories(data.repos);

  return (
    <div className="space-y-6">
      <ProfileHeader
        name={name}
        login={data.profile?.login}
        image={data.profile?.avatarUrl ?? session.user.image}
        bio={data.profile?.bio}
        company={data.profile?.company}
        location={data.profile?.location}
        htmlUrl={data.profile?.htmlUrl}
        syncStatus={data.sync.status}
        lastSyncedAt={data.sync.lastSyncedAt}
        errorMessage={data.sync.errorMessage}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total contributions" value={data.allTotals.total} hint="All stored history" />
        <StatCard label="Commits" value={data.allTotals.commits} />
        <StatCard label="Pull requests" value={data.allTotals.pullRequests} />
        <StatCard label="Issues" value={data.allTotals.issues} />
        <StatCard label="Code reviews" value={data.allTotals.reviews} />
        <StatCard label="Repositories" value={data.repos.length} hint="Repos you contributed to" />
        <StatCard label="Current streak" value={data.streaks.current} hint="Consecutive active days" />
        <StatCard label="Longest streak" value={data.streaks.longest} />
      </section>

      <section className="card p-6">
        <p className="stat-label">Application-generated metric</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Contribution Score</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">
              Not an official GitHub metric. Weighted from commits, pull requests, issues, reviews,
              project count, and contribution consistency.
            </p>
          </div>
          <p className="text-5xl font-semibold text-brand">{formatNumber(data.score)}</p>
        </div>
      </section>

      <ContributionHeatmap days={data.heatmapDays} />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="stat-label">Activity over time</p>
              <h2 className="mt-1 text-lg font-semibold">Last 12 months</h2>
            </div>
            <Link href="/contributions" className="text-sm text-brand hover:underline">
              Explore periods
            </Link>
          </div>
          <TrendChart data={data.monthly} />
        </section>
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="stat-label">Programming languages</p>
              <h2 className="mt-1 text-lg font-semibold">Distribution</h2>
            </div>
            <Link href="/languages" className="text-sm text-brand hover:underline">
              Language analytics
            </Link>
          </div>
          <LanguagePieChart
            data={data.languages.slice(0, 8).map((language) => ({
              name: language.name,
              value: language.contributionCount,
              color: language.color,
            }))}
          />
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Most active repositories</h2>
          <Link href="/repositories" className="text-sm text-brand hover:underline">
            Full ranking
          </Link>
        </div>
        <RepoTable repos={data.repos.slice(0, 8)} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Repository categories</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <article key={key} className="card p-5">
              <h3 className="font-semibold">{meta.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{meta.description}</p>
              <p className="mt-4 text-2xl font-semibold">
                {categories[key as keyof typeof categories].length}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories[key as keyof typeof categories].slice(0, 4).map((repo) => (
                  <Link
                    key={repo.id}
                    href={`/repositories/${repo.id}`}
                    className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-muted hover:text-ink"
                  >
                    {repo.name}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Personalized insights</h2>
            <Link href="/insights" className="text-sm text-brand hover:underline">
              All insights
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {data.insights.slice(0, 4).map((insight) => (
              <li key={insight.id} className="rounded-xl bg-canvas-hover p-4">
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="mt-1 text-sm text-ink-muted">{insight.detail}</p>
              </li>
            ))}
          </ul>
        </article>
        <article className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Year in Review {data.review.year}</h2>
            <Link href="/year-in-review" className="text-sm text-brand hover:underline">
              Full summary
            </Link>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-ink-faint">Contributions</dt>
              <dd className="mt-1 text-lg font-semibold">{formatNumber(data.review.totals.total)}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Most active project</dt>
              <dd className="mt-1 font-medium">{data.review.mostActiveProject}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Most-used language</dt>
              <dd className="mt-1 font-medium">{data.review.mostUsedLanguage}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Most productive month</dt>
              <dd className="mt-1 font-medium">{data.review.mostProductiveMonth}</dd>
            </div>
          </dl>
        </article>
      </section>
    </div>
  );
}
