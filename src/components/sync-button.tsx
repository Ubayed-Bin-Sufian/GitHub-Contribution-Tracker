"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn, formatRelative } from "@/lib/format";

type SyncButtonProps = {
  status: string;
  lastSyncedAt?: Date | string | null;
  errorMessage?: string | null;
};

export function SyncButton({ status, lastSyncedAt, errorMessage }: SyncButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(status === "running");
  const [localError, setLocalError] = useState(errorMessage ?? "");

  async function onSync() {
    setPending(true);
    setLocalError("");
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const payload = (await response.json()) as { errorMessage?: string; status?: string };
      if (!response.ok) {
        throw new Error(payload.errorMessage ?? "Sync failed");
      }
      router.refresh();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setPending(false);
    }
  }

  const label = pending ? "Syncing GitHub data…" : "Sync GitHub Data";
  const state =
    localError || errorMessage
      ? "Error"
      : pending
        ? "Running"
        : status === "success"
          ? "Ready"
          : "Idle";

  return (
    <div className="flex flex-col items-start gap-2 lg:items-end">
      <button
        type="button"
        onClick={onSync}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-black transition hover:bg-brand-dim disabled:cursor-wait disabled:opacity-70",
        )}
      >
        <RefreshCw className={cn("h-4 w-4", pending && "animate-spin")} />
        {label}
      </button>
      <p className="text-xs text-ink-faint">
        Status: {state}
        {lastSyncedAt ? ` · ${formatRelative(lastSyncedAt)}` : ""}
      </p>
      {localError || errorMessage ? (
        <p className="max-w-xs text-xs text-red-400">{localError || errorMessage}</p>
      ) : null}
    </div>
  );
}
