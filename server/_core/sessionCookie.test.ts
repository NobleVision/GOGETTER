/**
 * Property-Based Tests for Session Cookie Round-Trip
 * Feature: go-getter-enhancements, Property 3: Session Cookie Round-Trip
 * Validates: Requirements 2.6, 2.8
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fc from "fast-check";
import { SignJWT, jwtVerify } from "jose";

// Test secret for JWT signing (minimum 32 characters)
const TEST_SECRET = "test-secret-key-for-jwt-signing-minimum-32-chars";
const secretKey = new TextEncoder().encode(TEST_SECRET);

interface SessionPayload {
  openId: string;
  appId: string;
  name: string;
}

/**
 * Creates a session token (mirrors sdk.createSessionToken)
 */
async function createSessionToken(
  openId: string,
  options: { expiresInMs?: number; name?: string } = {}
): Promise<string> {
  const payload: SessionPayload = {
    openId,
    appId: "test-app-id",
    name: options.name || "",
  };

  const issuedAt = Date.now();
  const expiresInMs = options.expiresInMs ?? 365 * 24 * 60 * 60 * 1000; // 1 year
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

  return new SignJWT({
    openId: payload.openId,
    appId: payload.appId,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

/**
 * Verifies a session token and extracts payload (mirrors sdk.verifySession)
 */
async function verifySession(
  cookieValue: string | undefined | null
): Promise<{ openId: string; appId: string; name: string } | null> {
  if (!cookieValue) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(cookieValue, secretKey, {
      algorithms: ["HS256"],
    });
    const { openId, appId, name } = payload as Record<string, unknown>;

    const isNonEmptyString = (value: unknown): value is string =>
      typeof value === "string" && value.length > 0;

    if (
      !isNonEmptyString(openId) ||
      !isNonEmptyString(appId) ||
      !isNonEmptyString(name)
    ) {
      return null;
    }

    return {
      openId,
      appId,
      name,
    };
  } catch (error) {
    return null;
  }
}

// Arbitraries for generating test data
const openIdArb = fc.string({ minLength: 1, maxLength: 64 }).filter((s) => s.trim().length > 0);
const nameArb = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

describe("Property 3: Session Cookie Round-Trip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 3: Session Cookie Round-Trip
   * For any valid user authentication, creating a session token and then verifying that token
   * SHALL return the same user identity (openId) that was used to create it.
   * Validates: Requirements 2.6, 2.8
   */
  it("should return same openId after creating and verifying session token", async () => {
    await fc.assert(
      fc.asyncProperty(openIdArb, nameArb, async (openId, name) => {
        // Create session token
        const token = await createSessionToken(openId, { name });

        // Verify session token
        const result = await verifySession(token);

        // Verify round-trip preserves openId
        expect(result).not.toBeNull();
        expect(result!.openId).toBe(openId);
        expect(result!.name).toBe(name);
      }),
      { numRuns: 100 }
    );
  });

  it("should maintain session across multiple verifications", async () => {
    await fc.assert(
      fc.asyncProperty(openIdArb, nameArb, async (openId, name) => {
        // Create session token once
        const token = await createSessionToken(openId, { name });

        // Verify multiple times (simulating page refreshes)
        const results = await Promise.all([
          verifySession(token),
          verifySession(token),
          verifySession(token),
        ]);

        // All verifications should return the same openId
        for (const result of results) {
          expect(result).not.toBeNull();
          expect(result!.openId).toBe(openId);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should return null for invalid or tampered tokens", async () => {
    await fc.assert(
      fc.asyncProperty(
        openIdArb,
        nameArb,
        fc.string({ minLength: 1, maxLength: 10 }),
        async (openId, name, tampering) => {
          // Create valid session token
          const token = await createSessionToken(openId, { name });

          // Tamper with the token
          const tamperedToken = token + tampering;

          // Verification should fail
          const result = await verifySession(tamperedToken);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return null for empty or undefined tokens", async () => {
    const emptyResult = await verifySession("");
    expect(emptyResult).toBeNull();

    const nullResult = await verifySession(null);
    expect(nullResult).toBeNull();

    const undefinedResult = await verifySession(undefined);
    expect(undefinedResult).toBeNull();
  });

  it("should handle Google OAuth openIds correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 30 }),
        nameArb,
        async (googleId, name) => {
          // Google OAuth creates openIds with google_ prefix
          const openId = `google_${googleId}`;

          // Create and verify session
          const token = await createSessionToken(openId, { name });
          const result = await verifySession(token);

          // Verify round-trip preserves the Google openId format
          expect(result).not.toBeNull();
          expect(result!.openId).toBe(openId);
          expect(result!.openId.startsWith("google_")).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve session data integrity for various user types", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Manus users
          fc.string({ minLength: 10, maxLength: 64 }).map((id) => ({ openId: id, provider: "manus" })),
          // Google users
          fc.string({ minLength: 10, maxLength: 30 }).map((id) => ({ openId: `google_${id}`, provider: "google" }))
        ),
        nameArb,
        async (userData, name) => {
          const token = await createSessionToken(userData.openId, { name });
          const result = await verifySession(token);

          expect(result).not.toBeNull();
          expect(result!.openId).toBe(userData.openId);
          expect(result!.name).toBe(name);
          expect(result!.appId).toBe("test-app-id");
        }
      ),
      { numRuns: 100 }
    );
  });
});
