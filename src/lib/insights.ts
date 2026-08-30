import { format } from "date-fns";
import {
  categorizeRepositories,
  monthlyTotals,
  type DailyPoint,
  type RepoRecord,
} from "./analytics";

export type LanguageRecord = {
  name: string;
  color: string | null;
  repoCount: number;
  contributionCount: number;
  lastActivity: Date | null;
};

export type LanguageYear = {
  language: string;
  year: number;
  contributionCount: number;
};

export type Insight = {
  id: string;
  title: string;
  detail: string;
};

export function buildInsights(input: {
  days: DailyPoint[];
  repos: RepoRecord[];
  languages: LanguageRecord[];
  languageYears: LanguageYear[];
  currentStreak: number;
  longestStreak: number;
  now?: Date;
}): Insight[] {
  const now = input.now ?? new Date();
  const insights: Insight[] = [];
  const categories = categorizeRepositories(input.repos, now);
  const months = monthlyTotals(input.days);
  const topRepo = [...input.repos].sort((a, b) => b.contributionCount - a.contributionCount)[0];
  const topLanguage = [...input.languages].sort((a, b) => b.contributionCount - a.contributionCount)[0];
  const topMonth = [...months].sort((a, b) => b.total - a.total)[0];
  const total = input.repos.reduce((sum, repo) => sum + repo.contributionCount, 0);
  const topThree = [...input.repos]
    .sort((a, b) => b.contributionCount - a.contributionCount)
    .slice(0, 3)
    .reduce((sum, repo) => sum + repo.contributionCount, 0);

  if (topRepo) {
    insights.push({
      id: "most-active-repo",
      title: "Most active repository",
      detail: `${topRepo.fullName} leads with ${topRepo.contributionCount} contributions.`,
    });
  }

  if (topMonth) {
    insights.push({
      id: "most-productive-month",
      title: "Most productive month",
      detail: `${format(new Date(`${topMonth.month}-01T00:00:00Z`), "MMMM yyyy")} had ${topMonth.total} contributions.`,
    });
  }

  if (topLanguage) {
    insights.push({
      id: "most-used-language",
      title: "Most-used programming language",
      detail: `${topLanguage.name} appears in ${topLanguage.repoCount} repositories and ${topLanguage.contributionCount} contributions.`,
    });
  }

  if (total > 0) {
    const share = Math.round((topThree / total) * 100);
    insights.push({
      id: "concentration",
      title: "Activity concentration",
      detail: `${share}% of your contributions are concentrated in your top 3 repositories.`,
    });
  }

  insights.push({
    id: "active-vs-dormant",
    title: "Active versus dormant projects",
    detail: `${categories.active.length} projects are active and ${categories.dormant.length} are dormant.`,
  });

  const years = [...new Set(input.languageYears.map((row) => row.year))].sort((a, b) => a - b);
  if (years.length >= 2) {
    const latest = years[years.length - 1];
    const previous = years[years.length - 2];
    const latestTop = topLanguageForYear(input.languageYears, latest);
    const previousTop = topLanguageForYear(input.languageYears, previous);
    if (latestTop && previousTop && latestTop !== previousTop) {
      insights.push({
        id: "language-shift",
        title: "Recent change in language usage",
        detail: `Your leading language shifted from ${previousTop} in ${previous} to ${latestTop} in ${latest}.`,
      });
    } else if (latestTop) {
      insights.push({
        id: "language-stable",
        title: "Language usage is consistent",
        detail: `${latestTop} remained your most-used language across recent years.`,
      });
    }
  }

  const personal = categories.personal.reduce((sum, repo) => sum + repo.contributionCount, 0);
  const opensource = categories.opensource.reduce((sum, repo) => sum + repo.contributionCount, 0);
  const splitTotal = personal + opensource;
  if (splitTotal > 0) {
    insights.push({
      id: "oss-vs-personal",
      title: "Open source versus personal work",
      detail: `${Math.round((opensource / splitTotal) * 100)}% of contributions are on repositories you do not own; ${Math.round((personal / splitTotal) * 100)}% are personal projects.`,
    });
  }

  insights.push({
    id: "longest-streak",
    title: "Longest contribution streak",
    detail: `Your longest streak is ${input.longestStreak} days. Current streak: ${input.currentStreak} days.`,
  });

  return insights;
}

function topLanguageForYear(rows: LanguageYear[], year: number) {
  return [...rows]
    .filter((row) => row.year === year)
    .sort((a, b) => b.contributionCount - a.contributionCount)[0]?.language;
}

export function yearInReview(
  year: number,
  days: DailyPoint[],
  repos: RepoRecord[],
  languages: LanguageRecord[],
  longestStreak: number,
) {
  const yearDays = days.filter((day) => day.date.getUTCFullYear() === year);
  const totals = yearDays.reduce(
    (acc, day) => {
      acc.total += day.total;
      acc.commits += day.commits;
      acc.pullRequests += day.pullRequests;
      acc.issues += day.issues;
      acc.reviews += day.reviews;
      return acc;
    },
    { total: 0, commits: 0, pullRequests: 0, issues: 0, reviews: 0 },
  );

  const yearRepos = repos.filter((repo) => {
    const first = repo.firstContribution?.getUTCFullYear();
    const last = repo.lastContribution?.getUTCFullYear();
    if (first && last) return year >= first && year <= last;
    return Boolean(last === year || first === year);
  });

  const months = monthlyTotals(yearDays);
  const topMonth = [...months].sort((a, b) => b.total - a.total)[0];
  const topRepo = [...yearRepos].sort((a, b) => b.contributionCount - a.contributionCount)[0];
  const topLanguage = [...languages].sort((a, b) => b.contributionCount - a.contributionCount)[0];
  const opensource = yearRepos.filter((repo) => !repo.isOwn).length;

  return {
    year,
    totals,
    mostActiveProject: topRepo?.fullName ?? "Not enough data",
    mostUsedLanguage: topLanguage?.name ?? "Not enough data",
    mostProductiveMonth: topMonth
      ? format(new Date(`${topMonth.month}-01T00:00:00Z`), "MMMM yyyy")
      : "Not enough data",
    longestStreak,
    repositories: yearRepos.length,
    openSourceRepositories: opensource,
  };
}
