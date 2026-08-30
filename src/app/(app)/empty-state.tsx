import { ProfileHeader } from "@/components/profile-header";

export function EmptyDashboard({
  name,
  image,
  errorMessage,
}: {
  name: string;
  image?: string | null;
  errorMessage?: string | null;
}) {
  return (
    <div className="space-y-6">
      <ProfileHeader
        name={name}
        image={image}
        syncStatus="idle"
        lastSyncedAt={null}
        errorMessage={errorMessage}
      />
      <section className="card p-8">
        <h2 className="text-xl font-semibold">No analytics yet</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
          Use <strong>Sync GitHub Data</strong> to fetch your contribution history through the GitHub
          GraphQL API. The app only reads public contribution data available to your OAuth token and
          stores the analyzed results in PostgreSQL.
        </p>
      </section>
    </div>
  );
}
