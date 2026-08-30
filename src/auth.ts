import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, profiles } from "@/db/schema";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
  logger: {
    error(...args: unknown[]) {
      console.error("AUTH_ERROR", ...args);
    },
    warn(...args: unknown[]) {
      console.warn("AUTH_WARN", ...args);
    },
    debug(...args: unknown[]) {
      console.debug("AUTH_DEBUG", ...args);
    },
  },
  events: {
    async signIn({ user, profile, account }) {
      if (!user.id || account?.provider !== "github") {
        return;
      }

      const githubProfile = profile as
        | {
            id?: number | string;
            login?: string;
            name?: string | null;
            bio?: string | null;
            company?: string | null;
            location?: string | null;
            avatar_url?: string;
            html_url?: string;
          }
        | undefined;

      const login = githubProfile?.login;
      const githubId = githubProfile?.id ? String(githubProfile.id) : account.providerAccountId;

      if (!login) {
        return;
      }

      await db
        .insert(profiles)
        .values({
          userId: user.id,
          githubId,
          login,
          name: githubProfile?.name ?? user.name ?? login,
          bio: githubProfile?.bio ?? null,
          company: githubProfile?.company ?? null,
          location: githubProfile?.location ?? null,
          avatarUrl: githubProfile?.avatar_url ?? user.image ?? null,
          htmlUrl: githubProfile?.html_url ?? `https://github.com/${login}`,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: profiles.userId,
          set: {
            githubId,
            login,
            name: githubProfile?.name ?? user.name ?? login,
            bio: githubProfile?.bio ?? null,
            company: githubProfile?.company ?? null,
            location: githubProfile?.location ?? null,
            avatarUrl: githubProfile?.avatar_url ?? user.image ?? null,
            htmlUrl: githubProfile?.html_url ?? `https://github.com/${login}`,
            updatedAt: new Date(),
          },
        });
    },
  },
});

export async function getGithubAccessToken(userId: string) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .limit(1);

  if (!account || account.provider !== "github" || !account.access_token) {
    throw new Error("No GitHub access token stored for this account.");
  }

  return account.access_token;
}
