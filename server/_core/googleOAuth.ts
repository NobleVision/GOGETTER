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
  if (!ENV.googleClientId || !ENV.googleClientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }
  
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
  try {
    const client = createOAuth2Client(redirectUri);
    
    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      state,
      prompt: "consent",
      include_granted_scopes: true,
    });
    
    return authUrl;
  } catch (error: any) {
    console.error("[GoogleOAuth] Failed to generate authorization URL:", error);
    throw new Error(`Failed to generate Google authorization URL: ${error.message}`);
  }
}

/**
 * Exchanges authorization code for tokens
 * Requirement 2.2: Exchange code for access tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<GoogleTokens> {
  try {
    const client = createOAuth2Client(redirectUri);
    
    const { tokens } = await client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error("No access token received from Google");
    }
    
    return {
      access_token: tokens.access_token,
      id_token: tokens.id_token || undefined,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || undefined,
      token_type: tokens.token_type || "Bearer",
      scope: tokens.scope || "",
    };
  } catch (error: any) {
    console.error("[GoogleOAuth] Token exchange failed:", error);
    
    // Provide more specific error messages
    if (error.message?.includes('invalid_grant')) {
      throw new Error("Authorization code expired or invalid");
    } else if (error.message?.includes('invalid_client')) {
      throw new Error("Google OAuth client configuration error");
    } else if (error.message?.includes('invalid_request')) {
      throw new Error("Invalid OAuth request parameters");
    } else {
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }
}

/**
 * Retrieves user profile information from Google
 * Requirement 2.3: Retrieve user's profile information
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 10000, // 10 second timeout
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Google API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    // Validate required fields
    if (!data.id) {
      throw new Error("Google user ID not provided");
    }
    if (!data.email) {
      throw new Error("Google email not provided");
    }
    
    return {
      id: data.id,
      email: data.email,
      name: data.name || data.email.split('@')[0], // Fallback to email prefix
      picture: data.picture,
      verified_email: data.verified_email || false,
    };
  } catch (error: any) {
    console.error("[GoogleOAuth] Failed to get user info:", error);
    
    if (error.message?.includes('timeout')) {
      throw new Error("Google API request timed out");
    } else if (error.message?.includes('401')) {
      throw new Error("Invalid or expired access token");
    } else if (error.message?.includes('403')) {
      throw new Error("Insufficient permissions for Google API");
    } else if (error.message?.includes('network')) {
      throw new Error("Network error connecting to Google API");
    } else {
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }
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
      console.warn("[GoogleOAuth] No payload in ID token");
      return null;
    }
    
    return {
      id: payload.sub,
      email: payload.email || "",
      name: payload.name || payload.email?.split('@')[0] || "",
      picture: payload.picture,
      verified_email: payload.email_verified || false,
    };
  } catch (error: any) {
    console.error("[GoogleOAuth] Failed to verify ID token:", error);
    return null;
  }
}

/**
 * Checks if Google OAuth is configured
 */
export function isGoogleOAuthConfigured(): boolean {
  const configured = Boolean(ENV.googleClientId && ENV.googleClientSecret);
  
  if (!configured) {
    console.warn("[GoogleOAuth] Google OAuth not configured - missing client ID or secret");
  }
  
  return configured;
}

/**
 * Validates Google OAuth configuration
 */
export function validateGoogleOAuthConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!ENV.googleClientId) {
    errors.push("GOOGLE_CLIENT_ID environment variable not set");
  } else if (!ENV.googleClientId.endsWith('.googleusercontent.com')) {
    errors.push("GOOGLE_CLIENT_ID appears to be invalid format");
  }
  
  if (!ENV.googleClientSecret) {
    errors.push("GOOGLE_CLIENT_SECRET environment variable not set");
  } else if (ENV.googleClientSecret.length < 20) {
    errors.push("GOOGLE_CLIENT_SECRET appears to be too short");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
