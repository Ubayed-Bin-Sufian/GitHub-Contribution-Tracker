const GITHUB_GRAPHQL = "https://api.github.com/graphql";

export type GithubViewer = {
  login: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  avatarUrl: string;
  url: string;
  createdAt: string;
  followers: { totalCount: number };
  following: { totalCount: number };
  repositories: { totalCount: number };
};

export type ContributionDay = {
  date: string;
  contributionCount: number;
};

export type RepoContribution = {
  githubRepoId: string;
  name: string;
  owner: string;
  fullName: string;
  url: string;
  primaryLanguage: string | null;
  languageColor: string | null;
  isFork: boolean;
  isPrivate: boolean;
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  year: number;
};

export type YearSnapshot = {
  year: number;
  from: string;
  to: string;
  viewer: GithubViewer;
  totals: {
    commits: number;
    pullRequests: number;
    issues: number;
    reviews: number;
    calendarTotal: number;
  };
  days: ContributionDay[];
  repos: RepoContribution[];
};

const CONTRIBUTIONS_QUERY = `
  query ViewerContributions($from: DateTime!, $to: DateTime!) {
    viewer {
      login
      name
      bio
      company
      location
      avatarUrl
      url
      createdAt
      followers { totalCount }
      following { totalCount }
      repositories { totalCount }
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
        commitContributionsByRepository(maxRepositories: 100) {
          contributions { totalCount }
          repository {
            id
            name
            nameWithOwner
            url
            isFork
            isPrivate
            owner { login }
            primaryLanguage { name color }
          }
        }
        pullRequestContributionsByRepository(maxRepositories: 100) {
          contributions { totalCount }
          repository {
            id
            name
            nameWithOwner
            url
            isFork
            isPrivate
            owner { login }
            primaryLanguage { name color }
          }
        }
        issueContributionsByRepository(maxRepositories: 100) {
          contributions { totalCount }
          repository {
            id
            name
            nameWithOwner
            url
            isFork
            isPrivate
            owner { login }
            primaryLanguage { name color }
          }
        }
        pullRequestReviewContributionsByRepository(maxRepositories: 100) {
          contributions { totalCount }
          repository {
            id
            name
            nameWithOwner
            url
            isFork
            isPrivate
            owner { login }
            primaryLanguage { name color }
          }
        }
      }
    }
  }
`;

type RepoNode = {
  id: string;
  name: string;
  nameWithOwner: string;
  url: string;
  isFork: boolean;
  isPrivate: boolean;
  owner: { login: string };
  primaryLanguage: { name: string; color: string | null } | null;
};

type RepoBucket = {
  contributions: { totalCount: number };
  repository: RepoNode;
};

type ContributionsResponse = {
  data?: {
    viewer: GithubViewer & {
      contributionsCollection: {
        totalCommitContributions: number;
        totalIssueContributions: number;
        totalPullRequestContributions: number;
        totalPullRequestReviewContributions: number;
        contributionCalendar: {
          totalContributions: number;
          weeks: { contributionDays: ContributionDay[] }[];
        };
        commitContributionsByRepository: RepoBucket[];
        pullRequestContributionsByRepository: RepoBucket[];
        issueContributionsByRepository: RepoBucket[];
        pullRequestReviewContributionsByRepository: RepoBucket[];
      };
    };
  };
  errors?: { message: string }[];
};

async function githubGraphql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "github-contribution-tracker",
      "X-Requested-With": "GitHubContributionTracker",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub GraphQL request failed (${response.status}): ${body.slice(0, 240)}`);
  }

  return (await response.json()) as T;
}

function mergeRepo(
  map: Map<string, RepoContribution>,
  bucket: RepoBucket,
  year: number,
  field: "commits" | "pullRequests" | "issues" | "reviews",
) {
  const repo = bucket.repository;
  const existing = map.get(repo.id) ?? {
    githubRepoId: repo.id,
    name: repo.name,
    owner: repo.owner.login,
    fullName: repo.nameWithOwner,
    url: repo.url,
    primaryLanguage: repo.primaryLanguage?.name ?? null,
    languageColor: repo.primaryLanguage?.color ?? null,
    isFork: repo.isFork,
    isPrivate: repo.isPrivate,
    commits: 0,
    pullRequests: 0,
    issues: 0,
    reviews: 0,
    year,
  };

  existing[field] += bucket.contributions.totalCount;
  map.set(repo.id, existing);
}

export function contributionYears(createdAt?: Date | null, now = new Date()) {
  const startYear = createdAt ? createdAt.getUTCFullYear() : now.getUTCFullYear() - 5;
  const earliest = Math.max(startYear, now.getUTCFullYear() - 5);
  const years: number[] = [];
  for (let year = earliest; year <= now.getUTCFullYear(); year += 1) {
    years.push(year);
  }
  return years;
}

export async function fetchContributionYear(token: string, year: number, now = new Date()): Promise<YearSnapshot> {
  const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const to =
    year === now.getUTCFullYear()
      ? now
      : new Date(Date.UTC(year, 11, 31, 23, 59, 59));

  const payload = await githubGraphql<ContributionsResponse>(token, CONTRIBUTIONS_QUERY, {
    from: from.toISOString(),
    to: to.toISOString(),
  });

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  const viewer = payload.data?.viewer;
  if (!viewer) {
    throw new Error("GitHub returned no viewer data.");
  }

  const collection = viewer.contributionsCollection;
  const days = collection.contributionCalendar.weeks.flatMap((week) => week.contributionDays);
  const repos = new Map<string, RepoContribution>();

  for (const bucket of collection.commitContributionsByRepository) {
    mergeRepo(repos, bucket, year, "commits");
  }
  for (const bucket of collection.pullRequestContributionsByRepository) {
    mergeRepo(repos, bucket, year, "pullRequests");
  }
  for (const bucket of collection.issueContributionsByRepository) {
    mergeRepo(repos, bucket, year, "issues");
  }
  for (const bucket of collection.pullRequestReviewContributionsByRepository) {
    mergeRepo(repos, bucket, year, "reviews");
  }

  return {
    year,
    from: from.toISOString(),
    to: to.toISOString(),
    totals: {
      commits: collection.totalCommitContributions,
      pullRequests: collection.totalPullRequestContributions,
      issues: collection.totalIssueContributions,
      reviews: collection.totalPullRequestReviewContributions,
      calendarTotal: collection.contributionCalendar.totalContributions,
    },
    days,
    repos: [...repos.values()],
    viewer,
  };
}

export async function fetchGithubHistory(token: string, createdAt?: Date | null) {
  const now = new Date();
  const years = contributionYears(createdAt, now);
  const snapshots: YearSnapshot[] = [];

  for (const year of years) {
    snapshots.push(await fetchContributionYear(token, year, now));
  }

  return {
    viewer: snapshots[snapshots.length - 1]?.viewer,
    snapshots,
  };
}
