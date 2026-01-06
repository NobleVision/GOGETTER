/**
 * Environment Validation Module
 * Validates required environment variables at server startup
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { randomBytes } from "crypto";

const JWT_SECRET_PLACEHOLDER = "your-random-secret-key-here";
const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Generates a cryptographically secure random secret
 * Requirement 1.2: Generate secure JWT_SECRET
 * @param length - Length of the secret in bytes (default 32, produces 64 hex chars)
 * @returns A hex-encoded random string
 */
export function generateSecureSecret(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that DATABASE_URL is configured
 * Requirement 1.1: Validate DATABASE_URL presence
 */
export function validateDatabaseUrl(databaseUrl: string | undefined): {
  valid: boolean;
  error?: string;
} {
  if (!databaseUrl || databaseUrl.trim() === "") {
    return {
      valid: false,
      error: "DATABASE_URL environment variable is not configured",
    };
  }
  return { valid: true };
}

/**
 * Validates JWT_SECRET meets security requirements
 * Requirement 1.2: Minimum 32 characters
 * Requirement 1.3: Not the placeholder value
 */
export function validateJwtSecret(
  jwtSecret: string | undefined,
  isProduction: boolean
): { valid: boolean; error?: string; warning?: string } {
  if (!jwtSecret) {
    return {
      valid: false,
      error: "JWT_SECRET environment variable is not configured",
    };
  }

  // Check for empty or whitespace-only strings
  if (jwtSecret.trim() === "") {
    return {
      valid: false,
      error: "JWT_SECRET environment variable is not configured",
    };
  }

  if (jwtSecret === JWT_SECRET_PLACEHOLDER) {
    if (isProduction) {
      return {
        valid: false,
        error: `JWT_SECRET contains placeholder value "${JWT_SECRET_PLACEHOLDER}". Please generate a secure secret.`,
      };
    }
    return {
      valid: true,
      warning: `JWT_SECRET contains placeholder value. Generate a secure secret before deploying to production.`,
    };
  }

  if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    return {
      valid: false,
      error: `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters (current: ${jwtSecret.length})`,
    };
  }

  return { valid: true };
}

/**
 * Validates all required environment variables
 * Requirement 1.4: Provide clear error messages
 */
export function validateEnvironment(env: {
  databaseUrl?: string;
  jwtSecret?: string;
  isProduction?: boolean;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = env.isProduction ?? process.env.NODE_ENV === "production";

  // Validate DATABASE_URL
  const dbResult = validateDatabaseUrl(env.databaseUrl);
  if (!dbResult.valid && dbResult.error) {
    errors.push(dbResult.error);
  }

  // Validate JWT_SECRET
  const jwtResult = validateJwtSecret(env.jwtSecret, isProduction);
  if (!jwtResult.valid && jwtResult.error) {
    errors.push(jwtResult.error);
  }
  if (jwtResult.warning) {
    warnings.push(jwtResult.warning);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Runs environment validation and exits if critical errors found
 * Called at server startup
 */
export function runStartupValidation(): void {
  const result = validateEnvironment({
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    isProduction: process.env.NODE_ENV === "production",
  });

  // Log warnings
  for (const warning of result.warnings) {
    console.warn(`⚠️  Warning: ${warning}`);
  }

  // If validation failed, log errors and exit in production
  if (!result.valid) {
    console.error("\n❌ Environment validation failed:");
    for (const error of result.errors) {
      console.error(`   - ${error}`);
    }

    if (process.env.NODE_ENV === "production") {
      console.error("\nServer cannot start with invalid configuration in production mode.");
      process.exit(1);
    } else {
      console.warn("\n⚠️  Running in development mode with invalid configuration. Fix before deploying.");
    }
  } else {
    console.log("✅ Environment validation passed");
  }
}
