/**
 * Error handling utilities for the GO-GETTER OS application
 * Provides consistent error handling, retry logic, and user-friendly messages
 */

import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

export interface ErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  isRetryable: boolean;
  isAuthError: boolean;
}

/**
 * Analyzes an error and returns structured error information
 */
export function analyzeError(error: any): ErrorInfo {
  // Handle tRPC errors
  if (error instanceof TRPCClientError) {
    const code = error.data?.code || 'UNKNOWN';
    const message = error.message;
    
    switch (code) {
      case 'UNAUTHORIZED':
        return {
          code,
          message,
          userMessage: 'Please sign in to continue',
          isRetryable: false,
          isAuthError: true,
        };
      case 'FORBIDDEN':
        return {
          code,
          message,
          userMessage: 'You do not have permission to perform this action',
          isRetryable: false,
          isAuthError: false,
        };
      case 'NOT_FOUND':
        return {
          code,
          message,
          userMessage: 'The requested resource was not found',
          isRetryable: false,
          isAuthError: false,
        };
      case 'TIMEOUT':
        return {
          code,
          message,
          userMessage: 'Request timed out. Please try again',
          isRetryable: true,
          isAuthError: false,
        };
      case 'TOO_MANY_REQUESTS':
        return {
          code,
          message,
          userMessage: 'Too many requests. Please wait a moment and try again',
          isRetryable: true,
          isAuthError: false,
        };
      case 'INTERNAL_SERVER_ERROR':
        return {
          code,
          message,
          userMessage: 'Server error. Please try again in a moment',
          isRetryable: true,
          isAuthError: false,
        };
      default:
        return {
          code,
          message,
          userMessage: message || 'An unexpected error occurred',
          isRetryable: true,
          isAuthError: false,
        };
    }
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: error.message,
      userMessage: 'Network connection error. Please check your internet connection',
      isRetryable: true,
      isAuthError: false,
    };
  }

  // Handle generic errors
  const message = error?.message || 'Unknown error';
  return {
    code: 'UNKNOWN',
    message,
    userMessage: message,
    isRetryable: true,
    isAuthError: false,
  };
}

/**
 * Implements exponential backoff retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = (error) => analyzeError(error).isRetryable,
  } = options;

  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt or if error is not retryable
      if (attempt === maxAttempts || !retryCondition(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );
      
      console.warn(`[Retry] Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Handles errors with user-friendly notifications
 */
export function handleError(error: any, context?: string): ErrorInfo {
  const errorInfo = analyzeError(error);
  
  // Log error for debugging
  console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
  
  // Show user-friendly toast notification
  if (errorInfo.isAuthError) {
    toast.error(errorInfo.userMessage, {
      action: {
        label: 'Sign In',
        onClick: () => {
          window.location.href = '/api/oauth/google/init';
        },
      },
    });
  } else {
    toast.error(errorInfo.userMessage);
  }
  
  return errorInfo;
}

/**
 * Creates a retry-enabled version of an async function
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string,
  retryOptions?: RetryOptions
) {
  return async (...args: T): Promise<R> => {
    try {
      if (retryOptions) {
        return await withRetry(() => fn(...args), retryOptions);
      } else {
        return await fn(...args);
      }
    } catch (error) {
      handleError(error, context);
      throw error;
    }
  };
}

/**
 * Checks if the current error is an authentication error
 */
export function isAuthError(error: any): boolean {
  return analyzeError(error).isAuthError;
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  return analyzeError(error).isRetryable;
}

/**
 * Creates a user-friendly error message from any error
 */
export function getErrorMessage(error: any): string {
  return analyzeError(error).userMessage;
}

/**
 * Handles authentication errors by redirecting to login
 */
export function handleAuthError(error: any): void {
  if (isAuthError(error)) {
    console.warn('[Auth] Authentication required, redirecting to login');
    window.location.href = '/api/oauth/google/init';
  }
}