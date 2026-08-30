import Image from "next/image";
import { signOutAction } from "@/app/actions";
import { formatRelative } from "@/lib/format";
import { SyncButton } from "@/components/sync-button";

type ProfileHeaderProps = {
  name: string;
  login?: string | null;
  image?: string | null;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
  htmlUrl?: string | null;
  syncStatus: string;
  lastSyncedAt?: Date | string | null;
  errorMessage?: string | null;
};

export function ProfileHeader({
  name,
  login,
  image,
  bio,
  company,
  location,
  htmlUrl,
  syncStatus,
  lastSyncedAt,
  errorMessage,
}: ProfileHeaderProps) {
  return (
    <section className="card flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-4">
        {image ? (
          <Image
            src={image}
            alt={name}
            width={72}
            height={72}
            className="rounded-2xl border border-line"
          />
        ) : (
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-canvas-hover text-xl font-semibold">
            {name.slice(0, 1)}
          </div>
        )}
        <div>
          <p className="stat-label">GitHub profile</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{name}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {login ? `@${login}` : "Authenticated GitHub account"}
            {company ? ` · ${company}` : ""}
            {location ? ` · ${location}` : ""}
          </p>
          {bio ? <p className="mt-3 max-w-2xl text-sm text-ink-muted">{bio}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-faint">
            {htmlUrl ? (
              <a href={htmlUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                View on GitHub
              </a>
            ) : null}
            <span>Last sync {formatRelative(lastSyncedAt)}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-start gap-3 lg:items-end">
        <SyncButton status={syncStatus} lastSyncedAt={lastSyncedAt} errorMessage={errorMessage} />
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </section>
  );
}
