"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-sm text-ink-muted">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 w-fit rounded-xl bg-brand px-4 py-2 text-sm font-medium text-black"
      >
        Try again
      </button>
    </main>
  );
}
