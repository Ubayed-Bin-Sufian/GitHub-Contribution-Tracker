import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ],
);

export const profiles = pgTable("profile", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  githubId: text("githubId").notNull(),
  login: text("login").notNull(),
  name: text("name"),
  bio: text("bio"),
  company: text("company"),
  location: text("location"),
  avatarUrl: text("avatarUrl"),
  htmlUrl: text("htmlUrl"),
  publicRepos: integer("publicRepos").notNull().default(0),
  followers: integer("followers").notNull().default(0),
  following: integer("following").notNull().default(0),
  githubCreatedAt: timestamp("githubCreatedAt", { mode: "date" }),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export const syncJobs = pgTable("sync_job", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("idle"),
  lastSyncedAt: timestamp("lastSyncedAt", { mode: "date" }),
  startedAt: timestamp("startedAt", { mode: "date" }),
  finishedAt: timestamp("finishedAt", { mode: "date" }),
  errorMessage: text("errorMessage"),
});

export const dailyContributions = pgTable(
  "daily_contribution",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date", { mode: "date" }).notNull(),
    commits: integer("commits").notNull().default(0),
    pullRequests: integer("pullRequests").notNull().default(0),
    issues: integer("issues").notNull().default(0),
    reviews: integer("reviews").notNull().default(0),
    total: integer("total").notNull().default(0),
  },
  (table) => [
    uniqueIndex("daily_contribution_user_date").on(table.userId, table.date),
    index("daily_contribution_user_idx").on(table.userId),
  ],
);

export const repositories = pgTable(
  "repository",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    githubRepoId: text("githubRepoId").notNull(),
    name: text("name").notNull(),
    owner: text("owner").notNull(),
    fullName: text("fullName").notNull(),
    url: text("url").notNull(),
    primaryLanguage: text("primaryLanguage"),
    languageColor: text("languageColor"),
    isFork: boolean("isFork").notNull().default(false),
    isPrivate: boolean("isPrivate").notNull().default(false),
    isOwn: boolean("isOwn").notNull().default(false),
    commits: integer("commits").notNull().default(0),
    pullRequests: integer("pullRequests").notNull().default(0),
    issues: integer("issues").notNull().default(0),
    reviews: integer("reviews").notNull().default(0),
    contributionCount: integer("contributionCount").notNull().default(0),
    firstContribution: timestamp("firstContribution", { mode: "date" }),
    lastContribution: timestamp("lastContribution", { mode: "date" }),
  },
  (table) => [
    uniqueIndex("repository_user_github").on(table.userId, table.githubRepoId),
    index("repository_user_idx").on(table.userId),
  ],
);

export const languages = pgTable(
  "language",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    repoCount: integer("repoCount").notNull().default(0),
    contributionCount: integer("contributionCount").notNull().default(0),
    lastActivity: timestamp("lastActivity", { mode: "date" }),
  },
  (table) => [
    uniqueIndex("language_user_name").on(table.userId, table.name),
    index("language_user_idx").on(table.userId),
  ],
);

export const languageYearly = pgTable(
  "language_yearly",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    year: integer("year").notNull(),
    contributionCount: integer("contributionCount").notNull().default(0),
  },
  (table) => [
    uniqueIndex("language_yearly_user_lang_year").on(
      table.userId,
      table.language,
      table.year,
    ),
  ],
);
