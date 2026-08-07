import { NextResponse } from "next/server";
import { DriveError, requireDriveUser, uploadDriveFile } from "@/lib/google-drive";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new DriveError("Escolha um arquivo para enviar.");
    const entry = await uploadDriveFile(await requireDriveUser(), file, String(form.get("folderId") ?? "") || undefined, String(form.get("token") ?? "") || undefined);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (caught) { const error = caught instanceof DriveError ? caught : new DriveError("Não foi possível enviar o arquivo.", 500); return NextResponse.json({ error: error.message }, { status: error.status }); }
}
