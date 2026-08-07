import { NextResponse } from "next/server";
import { DriveError, getConnectionStatus, requireDriveUser } from "@/lib/google-drive";

export async function GET() {
  try { return NextResponse.json(await getConnectionStatus(await requireDriveUser())); }
  catch (caught) { const error = caught instanceof DriveError ? caught : new DriveError("Não foi possível verificar a conexão do Drive.", 500); return NextResponse.json({ error: error.message }, { status: error.status }); }
}
