import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import {
  getGoogleAuthorizationUrl,
  exchangeCodeForTokens,
  getGoogleUserInfo,
  isGoogleOAuthConfigured,
} from "./googleOAuth";
import { randomBytes } from "crypto";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// Store OAuth states temporarily (in production, use Redis or similar)
const oauthStates = new Map<string, { redirectUri: string; createdAt: number }>();

// Clean up expired states (older than 10 minutes)
function cleanupExpiredStates() {
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;
  for (const [state, data] of oauthStates.entries()) {
    if (now - data.createdAt > TEN_MINUTES) {
      oauthStates.delete(state);
    }
  }
}

export function registerOAuthRoutes(app: Express) {
  // Manus OAuth callback (existing)
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

  /**
   * Google OAuth initialization endpoint
   * Requirement 2.1: Redirect to Google's OAuth consent screen
   */
  app.get("/api/oauth/google/init", (req: Request, res: Response) => {
    if (!isGoogleOAuthConfigured()) {
      res.status(503).json({ error: "Google OAuth is not configured" });
      return;
    }

    // Generate a secure random state
    const state = randomBytes(32).toString("hex");
    const redirectUri = `${req.protocol}://${req.get("host")}/api/oauth/google/callback`;

    // Store state for verification
    cleanupExpiredStates();
    oauthStates.set(state, { redirectUri, createdAt: Date.now() });

    const authUrl = getGoogleAuthorizationUrl(redirectUri, state);
    res.redirect(302, authUrl);
  });

  /**
   * Google OAuth callback endpoint
   * Requirements 2.2, 2.3: Exchange code for tokens and retrieve user profile
   */
  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const error = getQueryParam(req, "error");

    // Handle OAuth errors from Google
    if (error) {
      console.error("[GoogleOAuth] Authorization error:", error);
      res.redirect(302, "/?error=google_auth_denied");
      return;
    }

    if (!code || !state) {
      res.redirect(302, "/?error=google_auth_invalid");
      return;
    }

    // Verify state to prevent CSRF
    const storedState = oauthStates.get(state);
    if (!storedState) {
      console.error("[GoogleOAuth] Invalid or expired state");
      res.redirect(302, "/?error=google_auth_state_invalid");
      return;
    }
    oauthStates.delete(state);

    try {
      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code, storedState.redirectUri);

      // Get user profile from Google
      const googleUser = await getGoogleUserInfo(tokens.access_token);

      if (!googleUser.email) {
        res.redirect(302, "/?error=google_auth_no_email");
        return;
      }

      // Create a unique openId for Google users
      const googleOpenId = `google_${googleUser.id}`;

      // Upsert user with Google data
      await db.upsertUserWithGoogle({
        openId: googleOpenId,
        googleId: googleUser.id,
        name: googleUser.name || null,
        email: googleUser.email,
        pictureUrl: googleUser.picture || null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // Create session token
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

  /**
   * Check if Google OAuth is available
   */
  app.get("/api/oauth/google/status", (_req: Request, res: Response) => {
    res.json({ configured: isGoogleOAuthConfigured() });
  });
}
