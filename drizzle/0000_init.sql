CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text,
  "email" text UNIQUE,
  "emailVerified" timestamp,
  "image" text
);

CREATE TABLE IF NOT EXISTS "account" (
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "provider" text NOT NULL,
  "providerAccountId" text NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text,
  PRIMARY KEY ("provider", "providerAccountId")
);

CREATE TABLE IF NOT EXISTS "session" (
  "sessionToken" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "expires" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "verificationToken" (
  "identifier" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamp NOT NULL,
  PRIMARY KEY ("identifier", "token")
);

CREATE TABLE IF NOT EXISTS "profile" (
  "userId" text PRIMARY KEY REFERENCES "user"("id") ON DELETE CASCADE,
  "githubId" text NOT NULL,
  "login" text NOT NULL,
  "name" text,
  "bio" text,
  "company" text,
  "location" text,
  "avatarUrl" text,
  "htmlUrl" text,
  "publicRepos" integer NOT NULL DEFAULT 0,
  "followers" integer NOT NULL DEFAULT 0,
  "following" integer NOT NULL DEFAULT 0,
  "githubCreatedAt" timestamp,
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "sync_job" (
  "userId" text PRIMARY KEY REFERENCES "user"("id") ON DELETE CASCADE,
  "status" text NOT NULL DEFAULT 'idle',
  "lastSyncedAt" timestamp,
  "startedAt" timestamp,
  "finishedAt" timestamp,
  "errorMessage" text
);

CREATE TABLE IF NOT EXISTS "daily_contribution" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "date" date NOT NULL,
  "commits" integer NOT NULL DEFAULT 0,
  "pullRequests" integer NOT NULL DEFAULT 0,
  "issues" integer NOT NULL DEFAULT 0,
  "reviews" integer NOT NULL DEFAULT 0,
  "total" integer NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS "daily_contribution_user_date"
  ON "daily_contribution" ("userId", "date");
CREATE INDEX IF NOT EXISTS "daily_contribution_user_idx"
  ON "daily_contribution" ("userId");

CREATE TABLE IF NOT EXISTS "repository" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "githubRepoId" text NOT NULL,
  "name" text NOT NULL,
  "owner" text NOT NULL,
  "fullName" text NOT NULL,
  "url" text NOT NULL,
  "primaryLanguage" text,
  "languageColor" text,
  "isFork" boolean NOT NULL DEFAULT false,
  "isPrivate" boolean NOT NULL DEFAULT false,
  "isOwn" boolean NOT NULL DEFAULT false,
  "commits" integer NOT NULL DEFAULT 0,
  "pullRequests" integer NOT NULL DEFAULT 0,
  "issues" integer NOT NULL DEFAULT 0,
  "reviews" integer NOT NULL DEFAULT 0,
  "contributionCount" integer NOT NULL DEFAULT 0,
  "firstContribution" timestamp,
  "lastContribution" timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS "repository_user_github"
  ON "repository" ("userId", "githubRepoId");
CREATE INDEX IF NOT EXISTS "repository_user_idx"
  ON "repository" ("userId");

CREATE TABLE IF NOT EXISTS "language" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "color" text,
  "repoCount" integer NOT NULL DEFAULT 0,
  "contributionCount" integer NOT NULL DEFAULT 0,
  "lastActivity" timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS "language_user_name"
  ON "language" ("userId", "name");
CREATE INDEX IF NOT EXISTS "language_user_idx"
  ON "language" ("userId");

CREATE TABLE IF NOT EXISTS "language_yearly" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "language" text NOT NULL,
  "year" integer NOT NULL,
  "contributionCount" integer NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS "language_yearly_user_lang_year"
  ON "language_yearly" ("userId", "language", "year");
