export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate Google OAuth login URL
export const getGoogleLoginUrl = () => {
  return `${window.location.origin}/api/oauth/google/init`;
};
