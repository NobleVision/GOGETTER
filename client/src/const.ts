export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // If OAuth portal is not configured, return empty string or fallback
  if (!oauthPortalUrl) {
    console.warn('[Auth] VITE_OAUTH_PORTAL_URL is not configured');
    return '';
  }
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId || '');
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

// Check if Manus OAuth is configured
export const isManusOAuthConfigured = () => {
  return Boolean(import.meta.env.VITE_OAUTH_PORTAL_URL && import.meta.env.VITE_APP_ID);
};

// Generate Google OAuth login URL
export const getGoogleLoginUrl = () => {
  return `${window.location.origin}/api/oauth/google/init`;
};
