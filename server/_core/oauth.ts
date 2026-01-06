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
const oauthStates = new Map<string, { 
  redirectUri: string; 
  createdAt: number;
  userId?: number;
  isLinking?: boolean;
}>();

// Clean up expired states (older than 10 minutes)
function cleanupExpiredStates() {
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;
  oauthStates.forEach((data, state) => {
    if (now - data.createdAt > TEN_MINUTES) {
      oauthStates.delete(state);
    }
  });
}

// Enhanced error handling for OAuth redirects
function handleOAuthError(res: Response, error: string, context: string, isLinking = false) {
  const baseUrl = isLinking ? '/settings' : '/';
  const separator = baseUrl.includes('?') ? '&' : '?';
  
  console.error(`[OAuth Error - ${context}]:`, error);
  res.redirect(302, `${baseUrl}${separator}error=${error}`);
}

// Retry wrapper for OAuth operations
async function withOAuthRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries = 2
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on the last attempt or for certain error types
      if (attempt > maxRetries || 
          error.message?.includes('invalid_grant') ||
          error.message?.includes('invalid_request')) {
        throw error;
      }
      
      console.warn(`[OAuth Retry - ${context}] Attempt ${attempt} failed, retrying:`, error);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw lastError;
}

export function registerOAuthRoutes(app: Express) {
  /**
   * Google OAuth initialization endpoint
   * Requirement 2.1: Redirect to Google's OAuth consent screen
   */
  app.get("/api/oauth/google/init", (req: Request, res: Response) => {
    try {
      if (!isGoogleOAuthConfigured()) {
        console.error("[OAuth] Google OAuth is not configured");
        return handleOAuthError(res, "google_oauth_not_configured", "init");
      }

      // Generate a secure random state
      const state = randomBytes(32).toString("hex");
      const redirectUri = `${req.protocol}://${req.get("host")}/api/oauth/google/callback`;

      // Store state for verification
      cleanupExpiredStates();
      oauthStates.set(state, { redirectUri, createdAt: Date.now() });

      const authUrl = getGoogleAuthorizationUrl(redirectUri, state);
      res.redirect(302, authUrl);
    } catch (error: any) {
      console.error("[OAuth] Init failed:", error);
      handleOAuthError(res, "google_auth_init_failed", "init");
    }
  });

  /**
   * Google OAuth linking initialization endpoint
   * Requirement 8.2: Allow linking additional OAuth providers
   */
  app.get("/api/oauth/google/link", async (req: Request, res: Response) => {
    try {
      if (!isGoogleOAuthConfigured()) {
        console.error("[OAuth] Google OAuth is not configured for linking");
        return handleOAuthError(res, "google_oauth_not_configured", "link", true);
      }

      // Check if user is authenticated
      const user = await sdk.authenticateRequest(req as any);
      if (!user) {
        console.error("[OAuth] Authentication required for linking");
        return handleOAuthError(res, "authentication_required", "link", true);
      }

      // Generate a secure random state with link flag
      const state = randomBytes(32).toString("hex");
      const redirectUri = `${req.protocol}://${req.get("host")}/api/oauth/google/link-callback`;

      // Store state for verification with user ID for linking
      cleanupExpiredStates();
      oauthStates.set(state, { 
        redirectUri, 
        createdAt: Date.now(),
        userId: user.id,
        isLinking: true 
      });

      const authUrl = getGoogleAuthorizationUrl(redirectUri, state);
      res.redirect(302, authUrl);
    } catch (error: any) {
      console.error("[OAuth] Link init failed:", error);
      handleOAuthError(res, "google_link_init_failed", "link", true);
    }
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
      console.error("[OAuth] Google authorization error:", error);
      const errorMap: Record<string, string> = {
        'access_denied': 'google_auth_denied',
        'invalid_request': 'google_auth_invalid_request',
        'unauthorized_client': 'google_auth_unauthorized',
        'unsupported_response_type': 'google_auth_unsupported',
        'invalid_scope': 'google_auth_invalid_scope',
        'server_error': 'google_auth_server_error',
        'temporarily_unavailable': 'google_auth_unavailable',
      };
      return handleOAuthError(res, errorMap[error] || 'google_auth_error', "callback");
    }

    if (!code || !state) {
      console.error("[OAuth] Missing code or state parameter");
      return handleOAuthError(res, "google_auth_invalid_params", "callback");
    }

    // Verify state to prevent CSRF
    const storedState = oauthStates.get(state);
    if (!storedState) {
      console.error("[OAuth] Invalid or expired state:", state);
      return handleOAuthError(res, "google_auth_state_invalid", "callback");
    }
    oauthStates.delete(state);

    try {
      await withOAuthRetry(async () => {
        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code, storedState.redirectUri);

        // Get user profile from Google
        const googleUser = await getGoogleUserInfo(tokens.access_token);

        if (!googleUser.email) {
          throw new Error("No email provided by Google");
        }

        if (!googleUser.verified_email) {
          throw new Error("Email not verified by Google");
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

        res.redirect(302, "/?success=google_auth_success");
      }, "OAuth callback");
    } catch (error: any) {
      console.error("[OAuth] Callback processing failed:", error);
      
      // Provide specific error messages based on error type
      if (error.message?.includes('email')) {
        return handleOAuthError(res, "google_auth_no_email", "callback");
      } else if (error.message?.includes('verified')) {
        return handleOAuthError(res, "google_auth_email_unverified", "callback");
      } else if (error.message?.includes('invalid_grant')) {
        return handleOAuthError(res, "google_auth_expired", "callback");
      } else {
        return handleOAuthError(res, "google_auth_failed", "callback");
      }
    }
  });

  /**
   * Google OAuth link callback endpoint
   * Requirement 8.2: Handle account merge for same email
   */
  app.get("/api/oauth/google/link-callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const error = getQueryParam(req, "error");

    // Handle OAuth errors from Google
    if (error) {
      console.error("[OAuth] Google link authorization error:", error);
      const errorMap: Record<string, string> = {
        'access_denied': 'google_link_denied',
        'invalid_request': 'google_link_invalid_request',
        'unauthorized_client': 'google_link_unauthorized',
      };
      return handleOAuthError(res, errorMap[error] || 'google_link_error', "link-callback", true);
    }

    if (!code || !state) {
      console.error("[OAuth] Missing code or state parameter for linking");
      return handleOAuthError(res, "google_link_invalid_params", "link-callback", true);
    }

    // Verify state to prevent CSRF
    const storedState = oauthStates.get(state);
    if (!storedState || !storedState.isLinking || !storedState.userId) {
      console.error("[OAuth] Invalid or expired link state:", state);
      return handleOAuthError(res, "google_link_state_invalid", "link-callback", true);
    }
    oauthStates.delete(state);

    try {
      await withOAuthRetry(async () => {
        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code, storedState.redirectUri);

        // Get user profile from Google
        const googleUser = await getGoogleUserInfo(tokens.access_token);

        if (!googleUser.email) {
          throw new Error("No email provided by Google");
        }

        if (!googleUser.verified_email) {
          throw new Error("Email not verified by Google");
        }

        // Get the current user
        const currentUser = await db.getUserById(storedState.userId);
        if (!currentUser) {
          throw new Error("Current user not found");
        }

        // Check if Google account is already linked to another user
        const existingGoogleUser = await db.getUserByGoogleId(googleUser.id);
        if (existingGoogleUser && existingGoogleUser.id !== currentUser.id) {
          throw new Error("Google account already linked to another user");
        }

        // Link Google account to current user
        await db.linkGoogleAccount(currentUser.id, {
          googleId: googleUser.id,
          pictureUrl: googleUser.picture || null,
        });

        res.redirect(302, "/settings?success=google_linked");
      }, "OAuth link callback");
    } catch (error: any) {
      console.error("[OAuth] Link callback processing failed:", error);
      
      // Provide specific error messages
      if (error.message?.includes('email')) {
        return handleOAuthError(res, "google_link_no_email", "link-callback", true);
      } else if (error.message?.includes('verified')) {
        return handleOAuthError(res, "google_link_email_unverified", "link-callback", true);
      } else if (error.message?.includes('already linked')) {
        return handleOAuthError(res, "google_account_already_linked", "link-callback", true);
      } else if (error.message?.includes('not found')) {
        return handleOAuthError(res, "user_not_found", "link-callback", true);
      } else {
        return handleOAuthError(res, "google_link_failed", "link-callback", true);
      }
    }
  });

  /**
   * Check if Google OAuth is available
   */
  app.get("/api/oauth/google/status", (_req: Request, res: Response) => {
    try {
      res.json({ 
        configured: isGoogleOAuthConfigured(),
        available: true 
      });
    } catch (error: any) {
      console.error("[OAuth] Status check failed:", error);
      res.status(500).json({ 
        configured: false, 
        available: false,
        error: "Status check failed"
      });
    }
  });
}
