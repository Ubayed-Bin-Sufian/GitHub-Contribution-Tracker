import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getDashboardData, getRepo } from "@/lib/data";
import { CATEGORY_META, repoCategories } from "@/lib/analytics";
import { formatDate, formatNumber } from "@/lib/format";
import { StatCard } from "@/components/stat-card";

export default async function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;
  const [repo, data] = await Promise.all([
    getRepo(session.user.id, id),
    getDashboardData(session.user.id),
  ]);

  if (!repo) {
    notFound();
  }

  const categories = repoCategories(repo, data.repos);

  return (
    <div className="space-y-6">
      <Link href="/repositories" className="text-sm text-ink-muted hover:text-ink">
        ← Back to repositories
      </Link>
      <section className="card p-6">
        <p className="stat-label">Repository analytics</p>
        <h1 className="mt-2 text-3xl font-semibold">{repo.fullName}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Owner {repo.owner}
          {repo.primaryLanguage ? ` · ${repo.primaryLanguage}` : ""}
          {repo.isOwn ? " · Personal project" : " · External / open source"}
        </p>
        <a href={repo.url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-brand hover:underline">
          Open on GitHub
        </a>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Contributions" value={repo.contributionCount} />
        <StatCard label="Commits" value={repo.commits} />
        <StatCard label="Pull requests" value={repo.pullRequests} />
        <StatCard label="Issues" value={repo.issues} />
        <StatCard label="Reviews" value={repo.reviews} />
        <StatCard label="First contribution" value={formatDate(repo.firstContribution)} />
        <StatCard label="Most recent" value={formatDate(repo.lastContribution)} />
        <StatCard label="Language" value={repo.primaryLanguage ?? "Unknown"} />
      </section>
      <section className="card p-6">
        <h2 className="text-lg font-semibold">Automatic categories</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((key) => (
            <span key={key} className="rounded-full border border-line px-3 py-1 text-sm text-ink-muted">
              {CATEGORY_META[key].title}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          This page only shows your stored contribution totals. Rank among your repositories: #
          {data.repos.findIndex((item) => item.id === repo.id) + 1} of {formatNumber(data.repos.length)}.
        </p>
      </section>
    </div>
  );
}
