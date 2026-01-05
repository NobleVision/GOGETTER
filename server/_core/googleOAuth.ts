/**
 * Google OAuth Service
 * Handles Google OAuth authentication flow
 * Requirements: 2.1, 2.2, 2.3
 */

import { OAuth2Client } from "google-auth-library";
import { ENV } from "./env";

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export interface GoogleTokens {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type: string;
  scope: string;
}

/**
 * Creates an OAuth2Client instance for Google authentication
 */
function createOAuth2Client(redirectUri?: string): OAuth2Client {
  return new OAuth2Client(
    ENV.googleClientId,
    ENV.googleClientSecret,
    redirectUri
  );
}

/**
 * Generates the Google OAuth authorization URL
 * Requirement 2.1: Redirect to Google's OAuth consent screen
 */
export function getGoogleAuthorizationUrl(redirectUri: string, state: string): string {
  const client = createOAuth2Client(redirectUri);
  
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    state,
    prompt: "consent",
  });
  
  return authUrl;
}

/**
 * Exchanges authorization code for tokens
 * Requirement 2.2: Exchange code for access tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<GoogleTokens> {
  const client = createOAuth2Client(redirectUri);
  
  const { tokens } = await client.getToken(code);
  
  return {
    access_token: tokens.access_token || "",
    id_token: tokens.id_token || undefined,
    refresh_token: tokens.refresh_token || undefined,
    expiry_date: tokens.expiry_date || undefined,
    token_type: tokens.token_type || "Bearer",
    scope: tokens.scope || "",
  };
}

/**
 * Retrieves user profile information from Google
 * Requirement 2.3: Retrieve user's profile information
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    picture: data.picture,
    verified_email: data.verified_email,
  };
}

/**
 * Verifies a Google ID token and extracts user info
 * Can be used as an alternative to fetching user info via API
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleUserInfo | null> {
  try {
    const client = createOAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: ENV.googleClientId,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return null;
    }
    
    return {
      id: payload.sub,
      email: payload.email || "",
      name: payload.name || "",
      picture: payload.picture,
      verified_email: payload.email_verified || false,
    };
  } catch (error) {
    console.error("[GoogleOAuth] Failed to verify ID token:", error);
    return null;
  }
}

/**
 * Checks if Google OAuth is configured
 */
export function isGoogleOAuthConfigured(): boolean {
  return Boolean(ENV.googleClientId && ENV.googleClientSecret);
}
