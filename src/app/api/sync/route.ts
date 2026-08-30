import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSyncStatus, syncGithubData } from "@/lib/sync";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getSyncStatus(session.user.id);
  return NextResponse.json({
    status: status.status,
    lastSyncedAt: status.lastSyncedAt,
    startedAt: status.startedAt,
    finishedAt: status.finishedAt,
    errorMessage: status.errorMessage,
  });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await syncGithubData(session.user.id);
    return NextResponse.json({
      status: status.status,
      lastSyncedAt: status.lastSyncedAt,
      startedAt: status.startedAt,
      finishedAt: status.finishedAt,
      errorMessage: status.errorMessage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ status: "error", errorMessage: message }, { status: 500 });
  }
}
