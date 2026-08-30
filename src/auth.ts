import NextAuth from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { authConfig } from "@/auth.config";
import { persistGithubUser } from "@/lib/persist-github-user";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "github") {
        try {
          const userId = await persistGithubUser({
            account: {
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            },
            profile: profile as {
              id?: number | string;
              login?: string;
              name?: string | null;
              email?: string | null;
              bio?: string | null;
              company?: string | null;
              location?: string | null;
              avatar_url?: string;
              html_url?: string;
            },
            user,
          });
          token.sub = userId;
          console.info("AUTH_PERSIST_OK", { userId, login: (profile as { login?: string } | undefined)?.login });
        } catch (error) {
          console.error("AUTH_PERSIST_FAILED", error);
          throw error;
        }
        return token;
      }

      if (user?.id) {
        token.sub = user.id;
      }
      return token;
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
