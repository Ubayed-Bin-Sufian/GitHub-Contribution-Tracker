import { auth } from "@/auth";
import { getDashboardData } from "@/lib/data";
import { ProfileHeader } from "@/components/profile-header";

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const data = await getDashboardData(session.user.id);

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
        <h1 className="text-2xl font-semibold">Personalized insights</h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-muted">
          These insights are generated deterministically from your stored GitHub analytics. No paid
          AI API is used.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {data.insights.map((insight) => (
          <article key={insight.id} className="card p-6">
            <h2 className="font-semibold">{insight.title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">{insight.detail}</p>
          </article>
        ))}
        {!data.insights.length ? (
          <article className="card p-6 text-sm text-ink-muted">
            Sync GitHub data to generate insights.
          </article>
        ) : null}
      </div>
    </div>
  );
}
