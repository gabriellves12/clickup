import { NextResponse } from "next/server";
import { createOauthValue, createPkceChallenge, getDriveConfiguration, getGoogleAuthorizationUrl, requireDriveUser } from "@/lib/google-drive";

const STATE_COOKIE = "google-drive-oauth-state";
const VERIFIER_COOKIE = "google-drive-oauth-verifier";

export async function GET(request: Request) {
  await requireDriveUser();
  if (!getDriveConfiguration().configured) return NextResponse.redirect(new URL("/drive?drive=setup", request.url));
  const state = createOauthValue();
  const verifier = createOauthValue();
  const response = NextResponse.redirect(getGoogleAuthorizationUrl(request, state, createPkceChallenge(verifier)));
  const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 60 * 10, path: "/" };
  response.cookies.set(STATE_COOKIE, state, options);
  response.cookies.set(VERIFIER_COOKIE, verifier, options);
  return response;
}
