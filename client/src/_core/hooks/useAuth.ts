import { getGoogleLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { handleError, isAuthError } from "@/lib/errorHandling";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
  onAuthError?: (error: any) => void;
};

export function useAuth(options?: UseAuthOptions) {
  const { 
    redirectOnUnauthenticated = false, 
    redirectPath,
    onAuthError 
  } = options ?? {};
  
  // Use Google OAuth login URL by default
  const effectiveRedirectPath = redirectPath ?? getGoogleLoginUrl();
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (isAuthError(error)) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    onError: (error) => {
      const errorInfo = handleError(error, 'Authentication check');
      if (onAuthError && errorInfo.isAuthError) {
        onAuthError(error);
      }
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
      toast.success('Signed out successfully');
    },
    onError: (error) => {
      // Handle logout errors gracefully
      if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED") {
        // Already logged out, just clear local state
        utils.auth.me.setData(undefined, null);
        return;
      }
      handleError(error, 'Sign out');
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        // Already logged out, just clear state
        return;
      }
      throw error;
    } finally {
      // Always clear local state
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const refresh = useCallback(async () => {
    try {
      await meQuery.refetch();
    } catch (error) {
      handleError(error, 'Refresh authentication');
    }
  }, [meQuery]);

  const state = useMemo(() => {
    // Store user info in localStorage for persistence
    try {
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify(meQuery.data)
      );
    } catch (error) {
      console.warn('[Auth] Failed to store user info in localStorage:', error);
    }

    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (!effectiveRedirectPath) return; // Don't redirect if no URL configured
    if (window.location.pathname === effectiveRedirectPath) return;

    // Add a small delay to avoid redirect loops
    const timer = setTimeout(() => {
      console.log('[Auth] Redirecting unauthenticated user to:', effectiveRedirectPath);
      window.location.href = effectiveRedirectPath;
    }, 100);

    return () => clearTimeout(timer);
  }, [
    redirectOnUnauthenticated,
    effectiveRedirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh,
    logout,
  };
}
