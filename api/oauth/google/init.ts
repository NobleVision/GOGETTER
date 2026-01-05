/**
 * Vercel Serverless Function - Google OAuth Init
 * Initiates Google OAuth flow at /api/oauth/google/init
 */

import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomBytes } from "crypto";
import {
  getGoogleAuthorizationUrl,
  isGoogleOAuthConfigured,
} from "../../../server/_core/googleOAuth";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({ error: "Google OAuth is not configured" });
  }

  const state = randomBytes(32).toString("hex");
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const redirectUri = `${protocol}://${host}/api/oauth/google/callback`;

  // Store state in cookie for verification (serverless-friendly approach)
  res.setHeader(
    "Set-Cookie",
    `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
  );

  const authUrl = getGoogleAuthorizationUrl(redirectUri, state);
  return res.redirect(302, authUrl);
}
