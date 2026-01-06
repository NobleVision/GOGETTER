/**
 * URL Notifications Component
 * Handles error and success messages passed via URL parameters
 * Provides user-friendly notifications for OAuth and other operations
 */

import { useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  // Google OAuth errors
  google_auth_denied: "Google sign-in was cancelled. Please try again.",
  google_auth_invalid: "Invalid Google authentication request.",
  google_auth_state_invalid: "Authentication security check failed. Please try again.",
  google_auth_no_email: "Google account must have a verified email address.",
  google_auth_email_unverified: "Please verify your email address with Google first.",
  google_auth_failed: "Google sign-in failed. Please try again.",
  google_auth_expired: "Authentication session expired. Please try again.",
  google_auth_init_failed: "Failed to start Google sign-in process.",
  google_oauth_not_configured: "Google sign-in is not available. Please contact support.",
  google_auth_invalid_request: "Invalid authentication request.",
  google_auth_unauthorized: "Authentication not authorized.",
  google_auth_unsupported: "Authentication method not supported.",
  google_auth_invalid_scope: "Invalid authentication permissions.",
  google_auth_server_error: "Google authentication server error. Please try again.",
  google_auth_unavailable: "Google authentication temporarily unavailable.",
  google_auth_error: "Google authentication error occurred.",
  google_auth_invalid_params: "Invalid authentication parameters.",

  // Google OAuth linking errors
  google_link_denied: "Google account linking was cancelled.",
  google_link_invalid: "Invalid Google account linking request.",
  google_link_state_invalid: "Account linking security check failed. Please try again.",
  google_link_no_email: "Google account must have a verified email address.",
  google_link_email_unverified: "Please verify your email address with Google first.",
  google_link_failed: "Failed to link Google account. Please try again.",
  google_account_already_linked: "This Google account is already linked to another user.",
  user_not_found: "User account not found. Please sign in again.",
  authentication_required: "Please sign in to link accounts.",
  google_link_init_failed: "Failed to start Google account linking.",
  google_link_invalid_request: "Invalid account linking request.",
  google_link_unauthorized: "Account linking not authorized.",
  google_link_error: "Google account linking error occurred.",
  google_link_invalid_params: "Invalid account linking parameters.",

  // General errors
  network_error: "Network connection error. Please check your internet connection.",
  server_error: "Server error. Please try again in a moment.",
  timeout_error: "Request timed out. Please try again.",
  unknown_error: "An unexpected error occurred. Please try again.",
};

const SUCCESS_MESSAGES: Record<string, string> = {
  google_auth_success: "Successfully signed in with Google!",
  google_linked: "Google account linked successfully!",
  profile_saved: "Profile saved successfully!",
  preset_saved: "Preset saved successfully!",
  preset_deleted: "Preset deleted successfully!",
  logout_success: "Signed out successfully!",
};

const INFO_MESSAGES: Record<string, string> = {
  session_expired: "Your session has expired. Please sign in again.",
  first_time: "Welcome to GO-GETTER OS! Complete the wizard to get started.",
};

export default function UrlNotifications() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const error = params.get('error');
    const success = params.get('success');
    const info = params.get('info');

    // Handle error messages
    if (error) {
      const message = ERROR_MESSAGES[error] || `Error: ${error}`;
      toast.error(message, {
        icon: <AlertTriangle className="h-4 w-4" />,
        duration: 6000,
        action: error.includes('auth') ? {
          label: 'Try Again',
          onClick: () => {
            window.location.href = '/api/oauth/google/init';
          },
        } : undefined,
      });

      // Clear error from URL
      params.delete('error');
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
      window.history.replaceState({}, '', newUrl);
    }

    // Handle success messages
    if (success) {
      const message = SUCCESS_MESSAGES[success] || `Success: ${success}`;
      toast.success(message, {
        icon: <CheckCircle2 className="h-4 w-4" />,
        duration: 4000,
      });

      // Clear success from URL
      params.delete('success');
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
      window.history.replaceState({}, '', newUrl);
    }

    // Handle info messages
    if (info) {
      const message = INFO_MESSAGES[info] || `Info: ${info}`;
      toast.info(message, {
        icon: <Info className="h-4 w-4" />,
        duration: 5000,
      });

      // Clear info from URL
      params.delete('info');
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchString]);

  return null; // This component doesn't render anything
}