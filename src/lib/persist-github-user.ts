import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, profiles, users } from "@/db/schema";

type GithubAccount = {
  providerAccountId: string;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
};

type GithubProfile = {
  id?: number | string;
  login?: string;
  name?: string | null;
  email?: string | null;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
  avatar_url?: string;
  html_url?: string;
};

export async function persistGithubUser(input: {
  account: GithubAccount;
  profile?: GithubProfile;
  user?: { id?: string | null; name?: string | null; email?: string | null; image?: string | null };
}) {
  const githubId = input.profile?.id
    ? String(input.profile.id)
    : input.account.providerAccountId;
  const login = input.profile?.login ?? `user-${githubId}`;
  const email = input.profile?.email ?? input.user?.email ?? null;
  const name = input.profile?.name ?? input.user?.name ?? login;
  const image = input.profile?.avatar_url ?? input.user?.image ?? null;

  const [existingAccount] = await db
    .select()
    .from(accounts)
    .where(
      and(eq(accounts.provider, "github"), eq(accounts.providerAccountId, input.account.providerAccountId)),
    )
    .limit(1);

  let userId = existingAccount?.userId;

  if (!userId && email) {
    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    userId = existingUser?.id;
  }

  if (!userId) {
    const [created] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        name,
        email,
        image,
      })
      .returning({ id: users.id });
    userId = created?.id;
    if (!userId) {
      throw new Error("Failed to create user row.");
    }
  } else {
    await db
      .update(users)
      .set({ name, email: email ?? undefined, image })
      .where(eq(users.id, userId));
  }

  await db
    .insert(accounts)
    .values({
      userId,
      type: "oauth",
      provider: "github",
      providerAccountId: input.account.providerAccountId,
      access_token: input.account.access_token ?? null,
      refresh_token: input.account.refresh_token ?? null,
      expires_at: input.account.expires_at ?? null,
      token_type: input.account.token_type ?? null,
      scope: input.account.scope ?? null,
      id_token: input.account.id_token ?? null,
      session_state: input.account.session_state ?? null,
    })
    .onConflictDoUpdate({
      target: [accounts.provider, accounts.providerAccountId],
      set: {
        userId,
        access_token: input.account.access_token ?? null,
        refresh_token: input.account.refresh_token ?? null,
        expires_at: input.account.expires_at ?? null,
        token_type: input.account.token_type ?? null,
        scope: input.account.scope ?? null,
      },
    });

  await db
    .insert(profiles)
    .values({
      userId,
      githubId,
      login,
      name,
      bio: input.profile?.bio ?? null,
      company: input.profile?.company ?? null,
      location: input.profile?.location ?? null,
      avatarUrl: image,
      htmlUrl: input.profile?.html_url ?? `https://github.com/${login}`,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        githubId,
        login,
        name,
        bio: input.profile?.bio ?? null,
        company: input.profile?.company ?? null,
        location: input.profile?.location ?? null,
        avatarUrl: image,
        htmlUrl: input.profile?.html_url ?? `https://github.com/${login}`,
        updatedAt: new Date(),
      },
    });

  return userId;
}
