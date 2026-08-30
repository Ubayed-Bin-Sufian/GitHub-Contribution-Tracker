import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  dailyContributions,
  languageYearly,
  languages,
  profiles,
  repositories,
  syncJobs,
} from "@/db/schema";
import { getGithubAccessToken } from "@/auth";
import { fetchGithubHistory, type RepoContribution, type YearSnapshot } from "@/lib/github";

export async function getSyncStatus(userId: string) {
  const [job] = await db.select().from(syncJobs).where(eq(syncJobs.userId, userId)).limit(1);
  return (
    job ?? {
      userId,
      status: "idle" as const,
      lastSyncedAt: null,
      startedAt: null,
      finishedAt: null,
      errorMessage: null,
    }
  );
}

export async function syncGithubData(userId: string) {
  const existing = await getSyncStatus(userId);
  if (existing.status === "running") {
    return existing;
  }

  await db
    .insert(syncJobs)
    .values({
      userId,
      status: "running",
      startedAt: new Date(),
      finishedAt: null,
      errorMessage: null,
    })
    .onConflictDoUpdate({
      target: syncJobs.userId,
      set: {
        status: "running",
        startedAt: new Date(),
        finishedAt: null,
        errorMessage: null,
      },
    });

  try {
    const token = await getGithubAccessToken(userId);
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    const history = await fetchGithubHistory(token, profile?.githubCreatedAt ?? null);
    const viewer = history.viewer;

    if (!viewer) {
      throw new Error("GitHub returned no profile data.");
    }

    await db
      .insert(profiles)
      .values({
        userId,
        githubId: profile?.githubId ?? viewer.login,
        login: viewer.login,
        name: viewer.name,
        bio: viewer.bio,
        company: viewer.company,
        location: viewer.location,
        avatarUrl: viewer.avatarUrl,
        htmlUrl: viewer.url,
        publicRepos: viewer.repositories.totalCount,
        followers: viewer.followers.totalCount,
        following: viewer.following.totalCount,
        githubCreatedAt: new Date(viewer.createdAt),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          login: viewer.login,
          name: viewer.name,
          bio: viewer.bio,
          company: viewer.company,
          location: viewer.location,
          avatarUrl: viewer.avatarUrl,
          htmlUrl: viewer.url,
          publicRepos: viewer.repositories.totalCount,
          followers: viewer.followers.totalCount,
          following: viewer.following.totalCount,
          githubCreatedAt: new Date(viewer.createdAt),
          updatedAt: new Date(),
        },
      });

    await persistDays(userId, history.snapshots);
    await persistRepos(userId, viewer.login, history.snapshots);
    await persistLanguages(userId, history.snapshots);

    const finished = new Date();
    await db
      .update(syncJobs)
      .set({
        status: "success",
        lastSyncedAt: finished,
        finishedAt: finished,
        errorMessage: null,
      })
      .where(eq(syncJobs.userId, userId));

    return getSyncStatus(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    await db
      .update(syncJobs)
      .set({
        status: "error",
        finishedAt: new Date(),
        errorMessage: message,
      })
      .where(eq(syncJobs.userId, userId));
    throw error;
  }
}

async function persistDays(userId: string, snapshots: YearSnapshot[]) {
  const byDate = new Map<
    string,
    { date: Date; commits: number; pullRequests: number; issues: number; reviews: number; total: number }
  >();

  for (const snapshot of snapshots) {
    const calendarTotal = snapshot.days.reduce((sum, day) => sum + day.contributionCount, 0) || 1;

    for (const day of snapshot.days) {
      const ratio = day.contributionCount / calendarTotal;
      const existing = byDate.get(day.date) ?? {
        date: new Date(`${day.date}T00:00:00.000Z`),
        commits: 0,
        pullRequests: 0,
        issues: 0,
        reviews: 0,
        total: 0,
      };

      existing.commits = Math.round(snapshot.totals.commits * ratio);
      existing.pullRequests = Math.round(snapshot.totals.pullRequests * ratio);
      existing.issues = Math.round(snapshot.totals.issues * ratio);
      existing.reviews = Math.round(snapshot.totals.reviews * ratio);
      existing.total = day.contributionCount;
      byDate.set(day.date, existing);
    }
  }

  await db.delete(dailyContributions).where(eq(dailyContributions.userId, userId));

  const rows = [...byDate.values()].map((day) => ({
    userId,
    date: day.date,
    commits: day.commits,
    pullRequests: day.pullRequests,
    issues: day.issues,
    reviews: day.reviews,
    total: day.total,
  }));

  for (const chunk of chunkRows(rows, 200)) {
    if (chunk.length) {
      await db.insert(dailyContributions).values(chunk);
    }
  }
}

async function persistRepos(userId: string, login: string, snapshots: YearSnapshot[]) {
  const merged = new Map<
    string,
    RepoContribution & { firstYear: number; lastYear: number }
  >();

  for (const snapshot of snapshots) {
    for (const repo of snapshot.repos) {
      const existing = merged.get(repo.githubRepoId);
      if (!existing) {
        merged.set(repo.githubRepoId, {
          ...repo,
          firstYear: snapshot.year,
          lastYear: snapshot.year,
        });
        continue;
      }

      existing.commits += repo.commits;
      existing.pullRequests += repo.pullRequests;
      existing.issues += repo.issues;
      existing.reviews += repo.reviews;
      existing.firstYear = Math.min(existing.firstYear, snapshot.year);
      existing.lastYear = Math.max(existing.lastYear, snapshot.year);
      existing.primaryLanguage = repo.primaryLanguage ?? existing.primaryLanguage;
      existing.languageColor = repo.languageColor ?? existing.languageColor;
    }
  }

  await db.delete(repositories).where(eq(repositories.userId, userId));

  const rows = [...merged.values()].map((repo) => ({
    userId,
    githubRepoId: repo.githubRepoId,
    name: repo.name,
    owner: repo.owner,
    fullName: repo.fullName,
    url: repo.url,
    primaryLanguage: repo.primaryLanguage,
    languageColor: repo.languageColor,
    isFork: repo.isFork,
    isPrivate: repo.isPrivate,
    isOwn: repo.owner.toLowerCase() === login.toLowerCase(),
    commits: repo.commits,
    pullRequests: repo.pullRequests,
    issues: repo.issues,
    reviews: repo.reviews,
    contributionCount: repo.commits + repo.pullRequests + repo.issues + repo.reviews,
    firstContribution: new Date(Date.UTC(repo.firstYear, 0, 1)),
    lastContribution:
      repo.lastYear === new Date().getUTCFullYear()
        ? new Date()
        : new Date(Date.UTC(repo.lastYear, 11, 31)),
  }));

  for (const chunk of chunkRows(rows, 100)) {
    if (chunk.length) {
      await db.insert(repositories).values(chunk);
    }
  }
}

async function persistLanguages(userId: string, snapshots: YearSnapshot[]) {
  const yearly = new Map<string, { language: string; year: number; contributionCount: number; color: string | null }>();
  const totals = new Map<
    string,
    { name: string; color: string | null; repos: Set<string>; contributionCount: number; lastYear: number }
  >();

  for (const snapshot of snapshots) {
    for (const repo of snapshot.repos) {
      const language = repo.primaryLanguage ?? "Unknown";
      const count = repo.commits + repo.pullRequests + repo.issues + repo.reviews;
      const yearKey = `${language}:${snapshot.year}`;
      const yearRow = yearly.get(yearKey) ?? {
        language,
        year: snapshot.year,
        contributionCount: 0,
        color: repo.languageColor,
      };
      yearRow.contributionCount += count;
      yearRow.color = repo.languageColor ?? yearRow.color;
      yearly.set(yearKey, yearRow);

      const total = totals.get(language) ?? {
        name: language,
        color: repo.languageColor,
        repos: new Set<string>(),
        contributionCount: 0,
        lastYear: snapshot.year,
      };
      total.repos.add(repo.githubRepoId);
      total.contributionCount += count;
      total.lastYear = Math.max(total.lastYear, snapshot.year);
      total.color = repo.languageColor ?? total.color;
      totals.set(language, total);
    }
  }

  await db.delete(languages).where(eq(languages.userId, userId));
  await db.delete(languageYearly).where(eq(languageYearly.userId, userId));

  const languageRows = [...totals.values()].map((item) => ({
    userId,
    name: item.name,
    color: item.color,
    repoCount: item.repos.size,
    contributionCount: item.contributionCount,
    lastActivity: new Date(Date.UTC(item.lastYear, 11, 31)),
  }));

  const yearlyRows = [...yearly.values()].map((item) => ({
    userId,
    language: item.language,
    year: item.year,
    contributionCount: item.contributionCount,
  }));

  if (languageRows.length) {
    await db.insert(languages).values(languageRows);
  }
  if (yearlyRows.length) {
    await db.insert(languageYearly).values(yearlyRows);
  }
}

function chunkRows<T>(rows: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}
