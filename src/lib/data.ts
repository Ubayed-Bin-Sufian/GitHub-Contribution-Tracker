import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  dailyContributions,
  languageYearly,
  languages,
  profiles,
  repositories,
} from "@/db/schema";
import {
  computeStreaks,
  contributionScore,
  filterDays,
  monthlyTotals,
  sumDays,
  type DailyPoint,
  type PeriodKey,
  type RepoRecord,
} from "@/lib/analytics";
import { buildInsights, yearInReview, type LanguageRecord } from "@/lib/insights";
import { getSyncStatus } from "@/lib/sync";

function asDaily(row: typeof dailyContributions.$inferSelect): DailyPoint {
  return {
    date: row.date instanceof Date ? row.date : new Date(row.date),
    commits: row.commits,
    pullRequests: row.pullRequests,
    issues: row.issues,
    reviews: row.reviews,
    total: row.total,
  };
}

function asRepo(row: typeof repositories.$inferSelect): RepoRecord {
  return {
    id: row.id,
    name: row.name,
    owner: row.owner,
    fullName: row.fullName,
    url: row.url,
    primaryLanguage: row.primaryLanguage,
    languageColor: row.languageColor,
    isOwn: row.isOwn,
    isFork: row.isFork,
    commits: row.commits,
    pullRequests: row.pullRequests,
    issues: row.issues,
    reviews: row.reviews,
    contributionCount: row.contributionCount,
    firstContribution: row.firstContribution,
    lastContribution: row.lastContribution,
  };
}

export async function getProfile(userId: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return profile ?? null;
}

export async function getDays(userId: string) {
  const rows = await db
    .select()
    .from(dailyContributions)
    .where(eq(dailyContributions.userId, userId))
    .orderBy(dailyContributions.date);
  return rows.map(asDaily);
}

export async function getRepos(userId: string) {
  const rows = await db
    .select()
    .from(repositories)
    .where(eq(repositories.userId, userId))
    .orderBy(desc(repositories.contributionCount));
  return rows.map(asRepo);
}

export async function getRepo(userId: string, repoId: string) {
  const repos = await getRepos(userId);
  return repos.find((repo) => repo.id === repoId) ?? null;
}

export async function getLanguages(userId: string): Promise<LanguageRecord[]> {
  const rows = await db
    .select()
    .from(languages)
    .where(eq(languages.userId, userId))
    .orderBy(desc(languages.contributionCount));

  return rows.map((row) => ({
    name: row.name,
    color: row.color,
    repoCount: row.repoCount,
    contributionCount: row.contributionCount,
    lastActivity: row.lastActivity,
  }));
}

export async function getLanguageYears(userId: string) {
  return db
    .select()
    .from(languageYearly)
    .where(eq(languageYearly.userId, userId))
    .orderBy(languageYearly.year);
}

export async function getDashboardData(userId: string, period: PeriodKey = "12m") {
  const [profile, days, repos, languageRows, languageYears, sync] = await Promise.all([
    getProfile(userId),
    getDays(userId),
    getRepos(userId),
    getLanguages(userId),
    getLanguageYears(userId),
    getSyncStatus(userId),
  ]);

  const scopedDays = filterDays(days, period);
  const totals = sumDays(scopedDays);
  const streaks = computeStreaks(days);
  const allTotals = sumDays(days);
  const activeDays = days.filter((day) => day.total > 0).length;
  const score = contributionScore({
    commits: allTotals.commits,
    pullRequests: allTotals.pullRequests,
    issues: allTotals.issues,
    reviews: allTotals.reviews,
    repositories: repos.length,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    activeDays,
    windowDays: days.length,
  });

  const insights = buildInsights({
    days,
    repos,
    languages: languageRows,
    languageYears: languageYears.map((row) => ({
      language: row.language,
      year: row.year,
      contributionCount: row.contributionCount,
    })),
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
  });

  const currentYear = new Date().getUTCFullYear();
  const review = yearInReview(currentYear, days, repos, languageRows, streaks.longest);

  return {
    profile,
    sync,
    period,
    totals,
    allTotals,
    streaks,
    score,
    repos,
    languages: languageRows,
    languageYears,
    days: scopedDays,
    heatmapDays: days,
    monthly: monthlyTotals(scopedDays),
    insights,
    review,
  };
}
