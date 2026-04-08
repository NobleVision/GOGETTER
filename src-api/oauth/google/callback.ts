/**
 * Vercel Serverless Function - Google OAuth Callback
 * Handles Google OAuth callback at /api/oauth/google/callback
 */

import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parse as parseCookie } from "cookie";
import {
  exchangeCodeForTokens,
  getGoogleUserInfo,
} from "../../../server/_core/googleOAuth";
import { sdk } from "../../../server/_core/sdk";
import * as db from "../../../server/db";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../../shared/const";

/**
 * Parse query parameters from URL.
 * In bundled Vercel functions, req.query may be undefined,
 * so we parse directly from the URL as a fallback.
 */
function parseQueryParams(req: VercelRequest): Record<string, string> {
  // First try req.query if it exists
  if (req.query && typeof req.query === "object") {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") {
        result[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        result[key] = value[0];
      }
    }
    if (Object.keys(result).length > 0) {
      return result;
    }
  }

  // Fallback: parse from URL
  const url = req.url || "";
  const queryIndex = url.indexOf("?");
  if (queryIndex === -1) {
    return {};
  }

  const queryString = url.slice(queryIndex + 1);
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function getQueryParam(req: VercelRequest, key: string): string | undefined {
  const params = parseQueryParams(req);
  return params[key];
}

/**
 * Helper to perform redirects in Vercel serverless functions.
 * VercelResponse doesn't have a redirect method, so we use writeHead + end.
 */
function redirect(res: VercelResponse, statusCode: number, url: string): void {
  res.writeHead(statusCode, { Location: url });
  res.end();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = getQueryParam(req, "code");
  const state = getQueryParam(req, "state");
  const error = getQueryParam(req, "error");

  if (error) {
    console.error("[GoogleOAuth] Authorization error:", error);
    return redirect(res, 302, "/?error=google_auth_denied");
  }

  if (!code || !state) {
    return redirect(res, 302, "/?error=google_auth_invalid");
  }

  // Verify state from cookie
  const cookies = parseCookie(req.headers.cookie || "");
  const storedState = cookies.oauth_state;

  if (!storedState || storedState !== state) {
    console.error("[GoogleOAuth] Invalid or expired state");
    return redirect(res, 302, "/?error=google_auth_state_invalid");
  }

  try {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const redirectUri = `${protocol}://${host}/api/oauth/google/callback`;

    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    if (!googleUser.email) {
      return redirect(res, 302, "/?error=google_auth_no_email");
    }

    const googleOpenId = `google_${googleUser.id}`;

    await db.upsertUserWithGoogle({
      openId: googleOpenId,
      googleId: googleUser.id,
      name: googleUser.name || null,
      email: googleUser.email,
      pictureUrl: googleUser.picture || null,
      loginMethod: "google",
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(googleOpenId, {
      name: googleUser.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    // Set session cookie and clear oauth state cookie
    const isSecure = req.headers["x-forwarded-proto"] === "https";
    res.setHeader("Set-Cookie", [
      `${COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; SameSite=None; Max-Age=${ONE_YEAR_MS / 1000}${isSecure ? "; Secure" : ""}`,
      `oauth_state=; Path=/; HttpOnly; Max-Age=0`,
    ]);

    return redirect(res, 302, "/");
  } catch (error) {
    console.error("[GoogleOAuth] Callback failed:", error);
    return redirect(res, 302, "/?error=google_auth_failed");
  }
}
