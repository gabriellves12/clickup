import "server-only";

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, type CurrentUser } from "@/lib/current-user";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_API_URL = "https://www.googleapis.com/drive/v3";
const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ?? "10X4Wp_hPFnG57F5EhH8hEETBEVGHRN26";
const DRIVE_SCOPES = ["openid", "email", "https://www.googleapis.com/auth/drive"];

export type DriveEntry = {
  id: string; name: string; mimeType: string; size: string | null; modifiedTime: string | null;
  thumbnailLink: string | null; webViewLink: string | null; canDownload: boolean; folderToken?: string; downloadToken?: string;
};

type DriveToken = { subject: string; fileId: string; type: "folder" | "file"; expiresAt: number };

export function getDriveConfiguration() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const encryptionKey = process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY;
  return { configured: Boolean(clientId && clientSecret && encryptionKey), clientId, clientSecret, encryptionKey, rootFolderId: ROOT_FOLDER_ID };
}

export function getDriveRedirectUri(request?: Request) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return `${fromEnv}/api/integrations/google/drive/callback`;
  if (request) return `${new URL(request.url).origin}/api/integrations/google/drive/callback`;
  throw new Error("Defina NEXT_PUBLIC_SITE_URL para conectar o Google Drive.");
}

export function getGoogleAuthorizationUrl(request: Request, state: string, codeChallenge: string) {
  const { configured, clientId } = getDriveConfiguration();
  if (!configured || !clientId) throw new Error("A integração do Google Drive não está configurada.");
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: getDriveRedirectUri(request), response_type: "code", scope: DRIVE_SCOPES.join(" "), access_type: "offline", prompt: "consent", state, code_challenge: codeChallenge, code_challenge_method: "S256" });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export function createOauthValue() { return randomBytes(32).toString("base64url"); }
export function createPkceChallenge(value: string) { return createHash("sha256").update(value).digest("base64url"); }

export async function requireDriveUser() {
  const user = await requireCurrentUser();
  if (user.role === "client") throw new Error("A área de arquivos é interna.");
  return user;
}

export async function getConnectionStatus(user: CurrentUser) {
  const connection = await prisma.googleDriveConnection.findUnique({ where: { personId: user.id }, select: { googleEmail: true, updatedAt: true } });
  return { ...getDriveConfiguration(), connected: Boolean(connection), googleEmail: connection?.googleEmail ?? null, connectedAt: connection?.updatedAt.toISOString() ?? null };
}

export async function saveGoogleConnection(user: CurrentUser, input: { googleEmail: string; refreshToken: string; scopes?: string }) {
  await prisma.googleDriveConnection.upsert({
    where: { personId: user.id },
    create: { personId: user.id, googleEmail: input.googleEmail, encryptedRefreshToken: encrypt(input.refreshToken), scopes: input.scopes ?? null },
    update: { googleEmail: input.googleEmail, encryptedRefreshToken: encrypt(input.refreshToken), scopes: input.scopes ?? null },
  });
}

export async function getAccessToken(user: CurrentUser) {
  const connection = await prisma.googleDriveConnection.findUnique({ where: { personId: user.id } });
  if (!connection) throw new DriveError("Conecte sua conta Google para acessar os arquivos.", 401);
  const { configured, clientId, clientSecret } = getDriveConfiguration();
  if (!configured || !clientId || !clientSecret) throw new DriveError("A integração do Drive ainda não foi configurada no deploy.", 503);
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: decrypt(connection.encryptedRefreshToken), grant_type: "refresh_token" });
  const response = await fetch(GOOGLE_TOKEN_URL, { method: "POST", body, cache: "no-store" });
  const data = await response.json() as { access_token?: string; error?: string };
  if (!response.ok || !data.access_token) throw new DriveError("A conexão com o Google expirou. Conecte sua conta novamente.", 401);
  return data.access_token;
}

export async function listDriveEntries(user: CurrentUser, folderId?: string, folderToken?: string) {
  const target = resolveFolder(user, folderId, folderToken);
  const accessToken = await getAccessToken(user);
  const params = new URLSearchParams({ q: `'${target}' in parents and trashed = false`, orderBy: "folder,name_natural", pageSize: "100", fields: "files(id,name,mimeType,size,modifiedTime,thumbnailLink,webViewLink,capabilities(canDownload))", supportsAllDrives: "true", includeItemsFromAllDrives: "true" });
  const response = await fetch(`${DRIVE_API_URL}/files?${params}`, { headers: { authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  const data = await response.json() as {
    files?: Array<Omit<DriveEntry, "folderToken" | "downloadToken" | "canDownload"> & { capabilities?: { canDownload?: boolean } }>;
    error?: { message?: string };
  };
  if (!response.ok) throw new DriveError(data.error?.message ?? "Não foi possível listar esta pasta.", response.status);
  const files = (data.files ?? []).map((file) => ({
    id: file.id, name: file.name, mimeType: file.mimeType, size: file.size, modifiedTime: file.modifiedTime,
    thumbnailLink: file.thumbnailLink, webViewLink: file.webViewLink, canDownload: file.capabilities?.canDownload !== false,
    ...(file.mimeType === "application/vnd.google-apps.folder" ? { folderToken: signDriveToken({ subject: user.id, fileId: file.id, type: "folder", expiresAt: Date.now() + 1000 * 60 * 60 * 8 }) } : { downloadToken: signDriveToken({ subject: user.id, fileId: file.id, type: "file", expiresAt: Date.now() + 1000 * 60 * 60 * 8 }) }),
  }));
  return { folderId: target, entries: files };
}

export async function uploadDriveFile(user: CurrentUser, file: File, folderId?: string, folderToken?: string) {
  if (file.size > 100 * 1024 * 1024) throw new DriveError("Envie arquivos de até 100 MB por vez.", 413);
  const target = resolveFolder(user, folderId, folderToken);
  const accessToken = await getAccessToken(user);
  const boundary = `drive-${randomBytes(12).toString("hex")}`;
  const metadata = JSON.stringify({ name: file.name, parents: [target] });
  const content = Buffer.from(await file.arrayBuffer());
  const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${file.type || "application/octet-stream"}\r\n\r\n`), content, Buffer.from(`\r\n--${boundary}--`)]);
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,thumbnailLink,webViewLink,capabilities(canDownload)", { method: "POST", headers: { authorization: `Bearer ${accessToken}`, "content-type": `multipart/related; boundary=${boundary}` }, body, cache: "no-store" });
  const data = await response.json() as Omit<DriveEntry, "folderToken" | "downloadToken" | "canDownload"> & { capabilities?: { canDownload?: boolean }; error?: { message?: string } };
  if (!response.ok) throw new DriveError(data.error?.message ?? "Não foi possível enviar o arquivo.", response.status);
  return { id: data.id, name: data.name, mimeType: data.mimeType, size: data.size, modifiedTime: data.modifiedTime, thumbnailLink: data.thumbnailLink, webViewLink: data.webViewLink, canDownload: data.capabilities?.canDownload !== false, downloadToken: signDriveToken({ subject: user.id, fileId: data.id, type: "file", expiresAt: Date.now() + 1000 * 60 * 60 * 8 }) } satisfies DriveEntry;
}

export async function fetchDriveDownload(user: CurrentUser, fileId: string, downloadToken: string) {
  verifyDriveToken(downloadToken, user.id, fileId, "file");
  const accessToken = await getAccessToken(user);
  const metadataResponse = await fetch(`${DRIVE_API_URL}/files/${encodeURIComponent(fileId)}?fields=name,mimeType&supportsAllDrives=true`, { headers: { authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  const metadata = await metadataResponse.json() as { name?: string; mimeType?: string; error?: { message?: string } };
  if (!metadataResponse.ok || !metadata.name || !metadata.mimeType) throw new DriveError(metadata.error?.message ?? "Arquivo não encontrado.", metadataResponse.status);
  const isGoogleFile = metadata.mimeType.startsWith("application/vnd.google-apps.");
  const url = isGoogleFile ? `${DRIVE_API_URL}/files/${encodeURIComponent(fileId)}/export?mimeType=application/pdf&supportsAllDrives=true` : `${DRIVE_API_URL}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;
  const response = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!response.ok || !response.body) throw new DriveError("Não foi possível baixar o arquivo.", response.status);
  return { response, name: isGoogleFile ? `${metadata.name}.pdf` : metadata.name, type: response.headers.get("content-type") ?? "application/octet-stream" };
}

export class DriveError extends Error { constructor(message: string, public status = 400) { super(message); } }

function resolveFolder(user: CurrentUser, folderId?: string, token?: string) {
  if (!folderId || folderId === ROOT_FOLDER_ID) return ROOT_FOLDER_ID;
  if (!token) throw new DriveError("Pasta inválida.", 403);
  verifyDriveToken(token, user.id, folderId, "folder");
  return folderId;
}

function getEncryptionKey() {
  const value = getDriveConfiguration().encryptionKey;
  if (!value) throw new Error("Defina GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY no deploy.");
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY precisa conter 32 bytes em base64.");
  return key;
}

function encrypt(value: string) { const key = getEncryptionKey(); const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key, iv); const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]); return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join("."); }
function decrypt(value: string) { const key = getEncryptionKey(); const [iv, tag, data] = value.split("."); if (!iv || !tag || !data) throw new Error("Conexão do Drive inválida."); const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url")); decipher.setAuthTag(Buffer.from(tag, "base64url")); return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8"); }
function signDriveToken(value: DriveToken) { const payload = Buffer.from(JSON.stringify(value)).toString("base64url"); const signature = createHmac("sha256", getEncryptionKey()).update(payload).digest("base64url"); return `${payload}.${signature}`; }
function verifyDriveToken(token: string, subject: string, fileId: string, type: DriveToken["type"]) { const [payload, signature] = token.split("."); const expected = createHmac("sha256", getEncryptionKey()).update(payload ?? "").digest("base64url"); if (!payload || !signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new DriveError("Acesso à pasta expirado. Atualize a página.", 403); const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as DriveToken; if (parsed.subject !== subject || parsed.fileId !== fileId || parsed.type !== type || parsed.expiresAt < Date.now()) throw new DriveError("Acesso à pasta expirado. Atualize a página.", 403); }
