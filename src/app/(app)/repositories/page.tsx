import { auth } from "@/auth";
import { getDashboardData } from "@/lib/data";
import { CATEGORY_META, categorizeRepositories } from "@/lib/analytics";
import { ProfileHeader } from "@/components/profile-header";
import { RepoTable } from "@/components/repo-table";
import Link from "next/link";

export default async function RepositoriesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const data = await getDashboardData(session.user.id);
  const categories = categorizeRepositories(data.repos);

  return (
    <div className="space-y-6">
      <ProfileHeader
        name={data.profile?.name ?? session.user.name ?? "GitHub user"}
        login={data.profile?.login}
        image={data.profile?.avatarUrl ?? session.user.image}
        htmlUrl={data.profile?.htmlUrl}
        syncStatus={data.sync.status}
        lastSyncedAt={data.sync.lastSyncedAt}
        errorMessage={data.sync.errorMessage}
      />
      <div>
        <h1 className="text-2xl font-semibold">Repository analytics</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Ranked by your contribution activity. Categories are calculated automatically from stored
          GitHub data.
        </p>
      </div>
      <RepoTable repos={data.repos} />
      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(CATEGORY_META).map(([key, meta]) => (
          <article key={key} className="card p-5">
            <h2 className="font-semibold">{meta.title}</h2>
            <p className="mt-1 text-sm text-ink-muted">{meta.description}</p>
            <ul className="mt-4 space-y-2">
              {categories[key as keyof typeof categories].slice(0, 6).map((repo) => (
                <li key={repo.id} className="flex items-center justify-between text-sm">
                  <Link href={`/repositories/${repo.id}`} className="hover:text-brand">
                    {repo.fullName}
                  </Link>
                  <span className="text-ink-faint">{repo.contributionCount}</span>
                </li>
              ))}
              {!categories[key as keyof typeof categories].length ? (
                <li className="text-sm text-ink-faint">No repositories in this category yet.</li>
              ) : null}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
