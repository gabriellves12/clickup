import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDriveConfiguration, getDriveRedirectUri, requireDriveUser, saveGoogleConnection } from "@/lib/google-drive";

export async function GET(request: Request) {
  const destination = new URL("/drive", request.url);
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");
  const store = await cookies();
  const expectedState = store.get("google-drive-oauth-state")?.value;
  const verifier = store.get("google-drive-oauth-verifier")?.value;
  try {
    if (error || !code || !state || state !== expectedState || !verifier) throw new Error(error === "access_denied" ? "Conexão cancelada." : "Não foi possível validar a conexão com o Google.");
    const user = await requireDriveUser();
    const { configured, clientId, clientSecret } = getDriveConfiguration();
    if (!configured || !clientId || !clientSecret) throw new Error("A integração do Drive ainda não foi configurada no deploy.");
    const body = new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: getDriveRedirectUri(request), grant_type: "authorization_code", code_verifier: verifier });
    const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body, cache: "no-store" });
    const data = await response.json() as { refresh_token?: string; id_token?: string; scope?: string; error_description?: string };
    if (!response.ok || !data.refresh_token || !data.id_token) throw new Error(data.error_description ?? "O Google não retornou a autorização necessária. Tente conectar novamente.");
    const payload = JSON.parse(Buffer.from(data.id_token.split(".")[1], "base64url").toString("utf8")) as { email?: string; email_verified?: boolean };
    const googleEmail = payload.email?.toLowerCase();
    if (!googleEmail || !payload.email_verified || googleEmail !== user.email.toLowerCase()) throw new Error("Conecte a mesma conta Google usada na plataforma.");
    await saveGoogleConnection(user, { googleEmail, refreshToken: data.refresh_token, scopes: data.scope });
    destination.searchParams.set("drive", "connected");
  } catch (caught) {
    destination.searchParams.set("drive", "error");
    destination.searchParams.set("message", caught instanceof Error ? caught.message : "Não foi possível conectar o Drive.");
  }
  store.delete("google-drive-oauth-state");
  store.delete("google-drive-oauth-verifier");
  return NextResponse.redirect(destination);
}
