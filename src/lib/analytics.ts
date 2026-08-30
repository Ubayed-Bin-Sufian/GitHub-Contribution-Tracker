import { startOfDay, subDays } from "date-fns";

export type PeriodKey = "30d" | "90d" | "12m" | "all";

export type DailyPoint = {
  date: Date;
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  total: number;
};

export type RepoRecord = {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  url: string;
  primaryLanguage: string | null;
  languageColor: string | null;
  isOwn: boolean;
  isFork: boolean;
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  contributionCount: number;
  firstContribution: Date | null;
  lastContribution: Date | null;
};

export function periodStart(period: PeriodKey, now = new Date()) {
  if (period === "30d") return startOfDay(subDays(now, 29));
  if (period === "90d") return startOfDay(subDays(now, 89));
  if (period === "12m") return startOfDay(subDays(now, 364));
  return null;
}

export function filterDays(days: DailyPoint[], period: PeriodKey, now = new Date()) {
  const start = periodStart(period, now);
  if (!start) return days;
  return days.filter((day) => day.date >= start);
}

export function sumDays(days: DailyPoint[]) {
  return days.reduce(
    (acc, day) => {
      acc.commits += day.commits;
      acc.pullRequests += day.pullRequests;
      acc.issues += day.issues;
      acc.reviews += day.reviews;
      acc.total += day.total;
      return acc;
    },
    { commits: 0, pullRequests: 0, issues: 0, reviews: 0, total: 0 },
  );
}

export function computeStreaks(days: DailyPoint[], now = new Date()) {
  const active = new Set(
    days.filter((day) => day.total > 0).map((day) => startOfDay(day.date).toISOString()),
  );

  const walk = (from: Date) => {
    let cursor = startOfDay(from);
    let streak = 0;
    while (active.has(cursor.toISOString())) {
      streak += 1;
      cursor = subDays(cursor, 1);
    }
    return streak;
  };

  const today = startOfDay(now);
  const yesterday = subDays(today, 1);
  const current = active.has(today.toISOString())
    ? walk(today)
    : active.has(yesterday.toISOString())
      ? walk(yesterday)
      : 0;

  const sorted = [...days].sort((a, b) => a.date.getTime() - b.date.getTime());
  let longest = 0;
  let running = 0;
  let previous: Date | null = null;

  for (const day of sorted) {
    if (day.total <= 0) {
      running = 0;
      previous = null;
      continue;
    }

    if (previous && (startOfDay(day.date).getTime() - startOfDay(previous).getTime()) / 86400000 === 1) {
      running += 1;
    } else {
      running = 1;
    }

    longest = Math.max(longest, running);
    previous = day.date;
  }

  return { current, longest };
}

export function monthlyTotals(days: DailyPoint[]) {
  const map = new Map<string, { month: string; total: number; commits: number; pullRequests: number; issues: number; reviews: number }>();

  for (const day of days) {
    const key = `${day.date.getUTCFullYear()}-${String(day.date.getUTCMonth() + 1).padStart(2, "0")}`;
    const existing = map.get(key) ?? {
      month: key,
      total: 0,
      commits: 0,
      pullRequests: 0,
      issues: 0,
      reviews: 0,
    };
    existing.total += day.total;
    existing.commits += day.commits;
    existing.pullRequests += day.pullRequests;
    existing.issues += day.issues;
    existing.reviews += day.reviews;
    map.set(key, existing);
  }

  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function contributionScore(input: {
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  repositories: number;
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
  windowDays: number;
}) {
  const consistency =
    input.windowDays > 0 ? Math.min(1, input.activeDays / Math.max(30, input.windowDays * 0.25)) : 0;

  const raw =
    input.commits * 1 +
    input.pullRequests * 3 +
    input.issues * 2 +
    input.reviews * 2 +
    input.repositories * 1.5 +
    input.currentStreak * 0.8 +
    input.longestStreak * 0.2 +
    consistency * 40;

  return Math.round(raw);
}

export type RepoCategory =
  | "champions"
  | "active"
  | "emerging"
  | "dormant"
  | "personal"
  | "opensource";

export const CATEGORY_META: Record<
  RepoCategory,
  { title: string; description: string }
> = {
  champions: {
    title: "Contribution Champions",
    description: "Repositories where you contributed the most overall.",
  },
  active: {
    title: "Active Projects",
    description: "Repositories with a contribution in the last 30 days.",
  },
  emerging: {
    title: "Emerging Projects",
    description: "Repositories you first contributed to in the last 90 days.",
  },
  dormant: {
    title: "Dormant Projects",
    description: "Repositories with no contribution in the last 90 days.",
  },
  personal: {
    title: "Personal Projects",
    description: "Repositories you own.",
  },
  opensource: {
    title: "Open Source Contributions",
    description: "Repositories owned by other people or organizations.",
  },
};

export function categorizeRepositories(repos: RepoRecord[], now = new Date()) {
  const day = 86400000;
  const sorted = [...repos].sort((a, b) => b.contributionCount - a.contributionCount);
  const championCutoff = Math.max(
    8,
    sorted[Math.max(0, Math.ceil(sorted.length * 0.2) - 1)]?.contributionCount ?? 0,
  );

  const groups: Record<RepoCategory, RepoRecord[]> = {
    champions: [],
    active: [],
    emerging: [],
    dormant: [],
    personal: [],
    opensource: [],
  };

  for (const repo of sorted) {
    const last = repo.lastContribution ? now.getTime() - repo.lastContribution.getTime() : Number.POSITIVE_INFINITY;
    const first = repo.firstContribution ? now.getTime() - repo.firstContribution.getTime() : Number.POSITIVE_INFINITY;

    if (repo.contributionCount >= championCutoff && repo.contributionCount > 0) {
      groups.champions.push(repo);
    }
    if (last <= 30 * day) {
      groups.active.push(repo);
    }
    if (first <= 90 * day) {
      groups.emerging.push(repo);
    }
    if (last > 90 * day) {
      groups.dormant.push(repo);
    }
    if (repo.isOwn) {
      groups.personal.push(repo);
    } else {
      groups.opensource.push(repo);
    }
  }

  return groups;
}

export function repoCategories(repo: RepoRecord, all: RepoRecord[], now = new Date()) {
  const groups = categorizeRepositories(all, now);
  return (Object.keys(groups) as RepoCategory[]).filter((key) =>
    groups[key].some((item) => item.id === repo.id),
  );
}
