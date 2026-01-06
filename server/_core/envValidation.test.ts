/**
 * Property-Based Tests for Environment Validation
 * Feature: go-getter-enhancements
 * Property 1: JWT Secret Validation
 * Validates: Requirements 1.2, 1.3
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { validateJwtSecret } from "./envValidation";

const JWT_SECRET_PLACEHOLDER = "your-random-secret-key-here";
const MIN_JWT_SECRET_LENGTH = 32;
const PBT_CONFIG = { numRuns: 100 };

describe("Property 1: JWT Secret Validation", () => {
  /**
   * Feature: go-getter-enhancements, Property 1: JWT Secret Validation
   * Validates: Requirements 1.2, 1.3
   *
   * For any string provided as JWT_SECRET, the validation function SHALL return
   * valid=true if and only if the string length is >= 32 characters AND the string
   * does not equal the placeholder value "your-random-secret-key-here".
   */

  it("should return valid=true for secrets >= 32 chars that are not the placeholder (non-production)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: MIN_JWT_SECRET_LENGTH, maxLength: 256 }),
        (secret) => {
          // Skip the placeholder value - it's tested separately
          if (secret === JWT_SECRET_PLACEHOLDER) return true;

          const result = validateJwtSecret(secret, false);
          return result.valid === true && result.error === undefined;
        }
      ),
      PBT_CONFIG
    );
  });

  it("should return valid=false for secrets < 32 chars", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: MIN_JWT_SECRET_LENGTH - 1 }).filter(s => s.trim() !== ""),
        (secret) => {
          const result = validateJwtSecret(secret, false);
          return (
            result.valid === false &&
            result.error !== undefined &&
            result.error.includes("at least 32 characters")
          );
        }
      ),
      PBT_CONFIG
    );
  });

  it("should return valid=false for placeholder value in production mode", () => {
    const result = validateJwtSecret(JWT_SECRET_PLACEHOLDER, true);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("placeholder value");
  });

  it("should return valid=true with warning for placeholder value in non-production mode", () => {
    const result = validateJwtSecret(JWT_SECRET_PLACEHOLDER, false);
    expect(result.valid).toBe(true);
    expect(result.warning).toContain("placeholder value");
  });

  it("should return valid=false for empty or undefined secrets", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(undefined, "", "   ", "\t", "\n"),
        (secret) => {
          const result = validateJwtSecret(secret as string | undefined, false);
          return result.valid === false && result.error !== undefined;
        }
      ),
      PBT_CONFIG
    );
  });

  it("should consistently validate the same secret the same way (deterministic)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        fc.boolean(),
        (secret, isProduction) => {
          const result1 = validateJwtSecret(secret, isProduction);
          const result2 = validateJwtSecret(secret, isProduction);
          return (
            result1.valid === result2.valid &&
            result1.error === result2.error &&
            result1.warning === result2.warning
          );
        }
      ),
      PBT_CONFIG
    );
  });
});
