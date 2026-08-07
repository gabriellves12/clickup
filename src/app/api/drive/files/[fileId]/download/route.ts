import { NextResponse } from "next/server";
import { DriveError, fetchDriveDownload, requireDriveUser } from "@/lib/google-drive";

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const { fileId } = await params;
    const token = new URL(request.url).searchParams.get("token");
    if (!token) throw new DriveError("Download inválido.", 403);
    const file = await fetchDriveDownload(await requireDriveUser(), fileId, token);
    return new NextResponse(file.response.body, { headers: { "content-type": file.type, "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`, "cache-control": "no-store" } });
  } catch (caught) { const error = caught instanceof DriveError ? caught : new DriveError("Não foi possível baixar o arquivo.", 500); return NextResponse.json({ error: error.message }, { status: error.status }); }
}
