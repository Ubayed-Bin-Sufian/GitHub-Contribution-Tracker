# GitHub Contribution Tracker

A personal GitHub analytics dashboard. Sign in with GitHub, sync contribution history through the GitHub GraphQL API, and explore project-level, language-level, and time-based insights.

The application is **read-only**. It never creates, updates, or deletes GitHub repositories or GitHub data.

## Features

- GitHub OAuth sign-in and sign-out (Auth.js)
- Persistent per-user accounts and cached analytics in PostgreSQL
- Manual **Sync GitHub Data** with last-sync time, running, success, and error states
- Overview cards: contributions, commits, pull requests, issues, reviews, repositories, streaks
- Contribution heatmap and activity trends
- Repository ranking, detail pages, and automatic categories
- Language distribution, repository counts, recent activity, and yearly trends
- Contribution periods: last 30 days, 90 days, 12 months, and all stored history
- Application-generated **Contribution Score** (not an official GitHub metric)
- Deterministic personalized insights (no paid AI API)
- Year in Review summary

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Auth.js (NextAuth v5) with the GitHub provider
- PostgreSQL + Drizzle ORM
- GitHub GraphQL API
- Recharts

## Local development

### 1. Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL) or any PostgreSQL 16 database
- A GitHub OAuth App

### 2. Create a GitHub OAuth App

1. Open [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set **Homepage URL** to `http://localhost:3000`
4. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`
5. Copy the client ID and client secret

Requested OAuth scopes are read-only: `read:user user:email`. The app only calls GitHub GraphQL queries.

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Set at least:

```bash
AUTH_SECRET=          # openssl rand -base64 32
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
DATABASE_URL=postgres://tracker:tracker@localhost:5432/tracker
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_URL=http://localhost:3000
```

Never commit `.env`. Secrets stay on the server and are never sent to the browser.

### 5. Install, migrate, run

```bash
npm install
node --env-file=.env scripts/migrate.mjs
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with GitHub, then click **Sync GitHub Data**.

## Stripe Projects CLI provisioning

Stripe login is not available in every region. When you can authenticate with the Stripe CLI, provision the free-tier catalog services below instead of signing up for each provider manually.

```bash
which stripe && stripe --version
stripe plugin install projects
stripe projects init --preflight --json
stripe projects init --accept-tos --yes
stripe projects catalog --json
```

Catalog services used by this app:

| Need | Provider | Service | Notes |
| --- | --- | --- | --- |
| PostgreSQL | Neon | `postgres` on the `free` plan | Persistent analytics store |
| Authentication | Clerk | `auth` on the `hobby` plan | Optional alternative to Auth.js |
| Hosting | Vercel | `project` on the `hobby` plan | Free-tier deploy |

Example commands after init (confirm current syntax with `stripe projects --help`):

```bash
stripe projects search neon --json
stripe projects search clerk --json
stripe projects search vercel --json
stripe projects add neon postgres
stripe projects add clerk auth --config app_name="GitHub Contribution Tracker"
stripe projects add vercel project --config name="github-contribution-tracker"
stripe projects env --json
```

If you provision Clerk, you can later swap Auth.js for Clerk GitHub social login. The current codebase uses Auth.js so the app runs without a provisioned Clerk instance.

Copy generated variable **names** into `.env` / Vercel. Do not paste secret values into chat, git, or client-side code.

Complementary catalog options if you expand later: Pydantic Logfire (observability), Schematic (feature flags), here.now (static hosting).

## Vercel free-tier deployment

1. Push this repository to GitHub
2. Import the project in [Vercel](https://vercel.com) (Hobby plan)
3. Set the same environment variables as `.env.example`
4. Set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to `https://<your-project>.vercel.app`
5. Add a production GitHub OAuth callback: `https://<your-project>.vercel.app/api/auth/callback/github`
6. Provision a free Neon (or other) Postgres database and set `DATABASE_URL`
7. After the first deploy, run migrations against that database:

```bash
DATABASE_URL='your-production-url' node scripts/migrate.mjs
```

8. Redeploy if needed. The app stays on Vercel Hobby + GitHub OAuth + a free Postgres plan.

## Security

- GitHub tokens are stored in the server-side `account` table and used only from API routes / server actions
- Dashboard queries are scoped to the authenticated user id
- Middleware redirects unauthenticated users away from private pages
- No GitHub mutation APIs are called

## Project layout

```
src/app            Pages, layouts, and API routes
src/auth.ts        Auth.js + GitHub OAuth
src/db             Drizzle schema and client
src/lib            GitHub sync, analytics, insights
src/components     Dashboard UI
drizzle            SQL migrations
```
