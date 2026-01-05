/**
 * Vercel Serverless Function - Manus OAuth Callback
 * Handles OAuth callback at /api/oauth/callback
 */

import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sdk } from "../../server/_core/sdk";
import * as db from "../../server/db";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";

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
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
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

  if (!code || !state) {
    return res.status(400).json({ error: "code and state are required" });
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      return res.status(400).json({ error: "openId missing from user info" });
    }

    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    // Set cookie
    const isSecure = req.headers["x-forwarded-proto"] === "https";
    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; SameSite=None; Max-Age=${ONE_YEAR_MS / 1000}${isSecure ? "; Secure" : ""}`
    );

    return redirect(res, 302, "/");
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    return res.status(500).json({ error: "OAuth callback failed" });
  }
}
