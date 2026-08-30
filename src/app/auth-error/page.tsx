import Link from "next/link";

const MESSAGES: Record<string, string> = {
  Configuration: "Auth.js is missing a required environment variable, or the GitHub OAuth app settings do not match this deployment.",
  AccessDenied: "GitHub denied access. Grant the requested read-only permissions and try again.",
  Verification: "This sign-in link is invalid or has expired.",
  OAuthCallback: "GitHub returned to the app, but the sign-in could not be completed. Confirm AUTH_URL, the GitHub callback URL, and that database migrations have been applied.",
  OAuthAccountNotLinked: "This GitHub account could not be linked to an existing user.",
  Default: "Sign-in failed. Try again, or check Vercel logs for AUTH_ERROR.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const code = params.error ?? "Default";
  const message = MESSAGES[code] ?? MESSAGES.Default;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <p className="text-xs uppercase tracking-wide text-ink-muted">Authentication</p>
      <h1 className="mt-2 text-2xl font-semibold">Could not sign in with GitHub</h1>
      <p className="mt-4 text-sm leading-6 text-ink-muted">{message}</p>
      {code !== "Default" ? (
        <p className="mt-2 font-mono text-xs text-ink-muted">Error code: {code}</p>
      ) : null}
      <Link
        href="/"
        className="mt-8 w-fit rounded-xl bg-brand px-4 py-2 text-sm font-medium text-black"
      >
        Back to sign in
      </Link>
    </main>
  );
}
