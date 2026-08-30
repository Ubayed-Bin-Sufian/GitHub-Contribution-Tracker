"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function GithubSignInButton() {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signIn("github", { callbackUrl: "/dashboard" });
      }}
      className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-black hover:bg-brand-dim disabled:opacity-70"
    >
      {pending ? "Redirecting to GitHub…" : "Sign in with GitHub"}
    </button>
  );
}
