import Link from "next/link";
import { formatDate, formatNumber } from "@/lib/format";
import type { RepoRecord } from "@/lib/analytics";

export function RepoTable({ repos }: { repos: RepoRecord[] }) {
  if (!repos.length) {
    return (
      <div className="card p-8 text-sm text-ink-muted">
        No repository data yet. Sync GitHub data to populate rankings.
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-line text-ink-faint">
          <tr>
            <th className="px-4 py-3 font-medium">Repository</th>
            <th className="px-4 py-3 font-medium">Owner</th>
            <th className="px-4 py-3 font-medium">Contributions</th>
            <th className="px-4 py-3 font-medium">Commits</th>
            <th className="px-4 py-3 font-medium">PRs</th>
            <th className="px-4 py-3 font-medium">Issues</th>
            <th className="px-4 py-3 font-medium">Reviews</th>
            <th className="px-4 py-3 font-medium">Language</th>
            <th className="px-4 py-3 font-medium">First</th>
            <th className="px-4 py-3 font-medium">Latest</th>
          </tr>
        </thead>
        <tbody>
          {repos.map((repo) => (
            <tr key={repo.id} className="border-b border-line/70 last:border-0 hover:bg-canvas-hover">
              <td className="px-4 py-3">
                <Link href={`/repositories/${repo.id}`} className="font-medium text-ink hover:text-brand">
                  {repo.name}
                </Link>
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 text-xs text-ink-faint hover:underline"
                >
                  GitHub
                </a>
              </td>
              <td className="px-4 py-3 text-ink-muted">{repo.owner}</td>
              <td className="px-4 py-3">{formatNumber(repo.contributionCount)}</td>
              <td className="px-4 py-3">{formatNumber(repo.commits)}</td>
              <td className="px-4 py-3">{formatNumber(repo.pullRequests)}</td>
              <td className="px-4 py-3">{formatNumber(repo.issues)}</td>
              <td className="px-4 py-3">{formatNumber(repo.reviews)}</td>
              <td className="px-4 py-3 text-ink-muted">{repo.primaryLanguage ?? "—"}</td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(repo.firstContribution)}</td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(repo.lastContribution)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
