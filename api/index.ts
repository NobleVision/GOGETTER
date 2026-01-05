/**
 * Vercel Serverless Function Entry Point
 * This wraps the Express server for Vercel's serverless environment
 */

import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import {
  getGoogleAuthorizationUrl,
  exchangeCodeForTokens,
  getGoogleUserInfo,
  isGoogleOAuthConfigured,
} from "../server/_core/googleOAuth";
import { getSessionCookieOptions } from "../server/_core/cookies";
import { sdk } from "../server/_core/sdk";
import * as db from "../server/db";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { randomBytes } from "crypto";
import type { Request, Response } from "express";

const app = express();

// Configure body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper function
function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// Store OAuth states temporarily
const oauthStates = new Map<string, { redirectUri: string; createdAt: number }>();

function cleanupExpiredStates() {
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;
  for (const [state, data] of oauthStates.entries()) {
    if (now - data.createdAt > TEN_MINUTES) {
      oauthStates.delete(state);
    }
  }
}

// Manus OAuth callback
app.get("/api/oauth/callback", async (req: Request, res: Response) => {
  const code = getQueryParam(req, "code");
  const state = getQueryParam(req, "state");

  if (!code || !state) {
    res.status(400).json({ error: "code and state are required" });
    return;
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      res.status(400).json({ error: "openId missing from user info" });
      return;
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

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    res.redirect(302, "/");
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    res.status(500).json({ error: "OAuth callback failed" });
  }
});

// Google OAuth init
app.get("/api/oauth/google/init", (req: Request, res: Response) => {
  if (!isGoogleOAuthConfigured()) {
    res.status(503).json({ error: "Google OAuth is not configured" });
    return;
  }

  const state = randomBytes(32).toString("hex");
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.get("host");
  const redirectUri = `${protocol}://${host}/api/oauth/google/callback`;

  cleanupExpiredStates();
  oauthStates.set(state, { redirectUri, createdAt: Date.now() });

  const authUrl = getGoogleAuthorizationUrl(redirectUri, state);
  res.redirect(302, authUrl);
});

// Google OAuth callback
app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
  const code = getQueryParam(req, "code");
  const state = getQueryParam(req, "state");
  const error = getQueryParam(req, "error");

  if (error) {
    console.error("[GoogleOAuth] Authorization error:", error);
    res.redirect(302, "/?error=google_auth_denied");
    return;
  }

  if (!code || !state) {
    res.redirect(302, "/?error=google_auth_invalid");
    return;
  }

  const storedState = oauthStates.get(state);
  if (!storedState) {
    console.error("[GoogleOAuth] Invalid or expired state");
    res.redirect(302, "/?error=google_auth_state_invalid");
    return;
  }
  oauthStates.delete(state);

  try {
    const tokens = await exchangeCodeForTokens(code, storedState.redirectUri);
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    if (!googleUser.email) {
      res.redirect(302, "/?error=google_auth_no_email");
      return;
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

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    res.redirect(302, "/");
  } catch (error) {
    console.error("[GoogleOAuth] Callback failed:", error);
    res.redirect(302, "/?error=google_auth_failed");
  }
});

// Google OAuth status
app.get("/api/oauth/google/status", (_req: Request, res: Response) => {
  res.json({ configured: isGoogleOAuthConfigured() });
});

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Export for Vercel
export default app;
