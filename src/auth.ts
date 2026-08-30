import NextAuth from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { authConfig } from "@/auth.config";
import { persistGithubUser } from "@/lib/persist-github-user";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  logger: {
    error(error) {
      const err = error as { name?: string; message?: string; cause?: unknown };
      console.error("AUTH_ERROR", err?.name, err?.message, err?.cause);
    },
    warn(code) {
      console.warn("AUTH_WARN", code);
    },
    debug() {
      // Do not log Auth.js debug payloads — they can include client secrets.
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
              id_token: typeof account.id_token === "string" ? account.id_token : null,
              session_state: typeof account.session_state === "string" ? account.session_state : null,
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
