import { redirect } from "next/navigation";
import { GitBranch, ShieldCheck, BarChart3, RefreshCw } from "lucide-react";
import { auth } from "@/auth";
import { signInWithGithub } from "@/app/actions";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas-card px-3 py-1 text-xs text-ink-muted">
            <GitBranch className="h-3.5 w-3.5 text-brand" />
            Personal GitHub analytics
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-ink">
            Turn GitHub activity into project, language, and time-based insight.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted">
            Sign in with GitHub to analyze commits, pull requests, issues, and reviews. Data is stored
            for your account only. This application never modifies your repositories.
          </p>
          <form action={signInWithGithub} className="mt-8">
            <button
              type="submit"
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-black hover:bg-brand-dim"
            >
              Sign in with GitHub
            </button>
          </form>
        </div>
        <div className="grid gap-4">
          {[
            {
              icon: BarChart3,
              title: "Project-level rankings",
              copy: "See contribution champions, active work, and dormant repositories.",
            },
            {
              icon: RefreshCw,
              title: "Cached sync",
              copy: "Refresh GitHub data on demand. Returning visits read from PostgreSQL.",
            },
            {
              icon: ShieldCheck,
              title: "Read-only access",
              copy: "OAuth scopes are limited to profile data. Analytics stay isolated per user.",
            },
          ].map((item) => (
            <article key={item.title} className="card p-5">
              <item.icon className="h-5 w-5 text-brand" />
              <h2 className="mt-3 font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-ink-muted">{item.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
