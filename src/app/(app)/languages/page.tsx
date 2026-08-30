import { auth } from "@/auth";
import { getDashboardData } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { LanguagePieChart, LanguageTrendChart } from "@/components/charts";
import { ProfileHeader } from "@/components/profile-header";

export default async function LanguagesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const data = await getDashboardData(session.user.id);
  const topLanguages = data.languages.slice(0, 6).map((language) => language.name);
  const years = [...new Set(data.languageYears.map((row) => row.year))].sort((a, b) => a - b);
  const trend = years.map((year) => {
    const point: Record<string, string | number> = { year };
    for (const language of topLanguages) {
      point[language] =
        data.languageYears.find((row) => row.year === year && row.language === language)
          ?.contributionCount ?? 0;
    }
    return point;
  });

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
      <div>
        <h1 className="text-2xl font-semibold">Programming-language analytics</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Language activity is derived from the primary language of repositories you contributed to.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-lg font-semibold">Language distribution</h2>
          <LanguagePieChart
            data={data.languages.map((language) => ({
              name: language.name,
              value: language.contributionCount,
              color: language.color,
            }))}
          />
        </section>
        <section className="card p-6">
          <h2 className="text-lg font-semibold">Historical language trends</h2>
          {years.length > 1 ? (
            <LanguageTrendChart data={trend} languages={topLanguages} />
          ) : (
            <p className="mt-6 text-sm text-ink-muted">
              More yearly history is needed before a trend chart can be shown.
            </p>
          )}
        </section>
      </div>
      <section className="card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line text-ink-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Language</th>
              <th className="px-4 py-3 font-medium">Repositories</th>
              <th className="px-4 py-3 font-medium">Contributions</th>
              <th className="px-4 py-3 font-medium">Recent activity</th>
            </tr>
          </thead>
          <tbody>
            {data.languages.map((language) => (
              <tr key={language.name} className="border-b border-line/70 last:border-0">
                <td className="px-4 py-3 font-medium">{language.name}</td>
                <td className="px-4 py-3">{formatNumber(language.repoCount)}</td>
                <td className="px-4 py-3">{formatNumber(language.contributionCount)}</td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(language.lastActivity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
