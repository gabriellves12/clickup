import { NextResponse } from "next/server";
import { DriveError, listDriveEntries, requireDriveUser } from "@/lib/google-drive";

export async function GET(request: Request) {
  try { const url = new URL(request.url); return NextResponse.json(await listDriveEntries(await requireDriveUser(), url.searchParams.get("folderId") ?? undefined, url.searchParams.get("token") ?? undefined)); }
  catch (caught) { const error = caught instanceof DriveError ? caught : new DriveError("Não foi possível carregar os arquivos.", 500); return NextResponse.json({ error: error.message }, { status: error.status }); }
}
