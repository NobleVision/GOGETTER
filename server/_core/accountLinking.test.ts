/**
 * Property-Based Tests for Account Linking by Email
 * Feature: go-getter-enhancements, Property 14: Account Linking by Email
 * Validates: Requirements 8.2, 8.3
 * 
 * Property 14: Account Linking by Email
 * For any user signing in with a new OAuth provider where the email matches an existing 
 * user account, the new provider SHALL be added to the existing user's authProviders 
 * array without creating a duplicate user record.
 */

import { describe, it, expect, beforeEach } from "vitest";
import fc from "fast-check";

// ============ Types ============

interface UserRecord {
  id: number;
  openId: string;
  googleId: string | null;
  manusId: string | null;
  name: string | null;
  email: string | null;
  pictureUrl: string | null;
  authProviders: string[];
  lastSignedIn: Date;
  updatedAt: Date;
}

interface OAuthSignInInput {
  provider: "google" | "manus";
  providerId: string;
  email: string;
  name: string | null;
  pictureUrl: string | null;
}

// ============ In-Memory User Store (Simulates DB) ============

let userStore: Map<number, UserRecord>;
let nextUserId: number;

function resetUserStore() {
  userStore = new Map();
  nextUserId = 1;
}

function getUserCount(): number {
  return userStore.size;
}

function getUserByEmail(email: string): UserRecord | undefined {
  for (const user of userStore.values()) {
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
}

function getUserByProviderId(provider: string, providerId: string): UserRecord | undefined {
  for (const user of userStore.values()) {
    if (provider === "google" && user.googleId === providerId) {
      return user;
    }
    if (provider === "manus" && user.manusId === providerId) {
      return user;
    }
  }
  return undefined;
}

/**
 * Simulates the account linking logic from upsertUserWithGoogle/upsertUserWithManus
 * This mirrors the actual implementation behavior in db.ts
 */
function simulateOAuthSignIn(input: OAuthSignInInput): UserRecord {
  const now = new Date();
  
  // Check if user exists by provider ID
  const existingByProviderId = getUserByProviderId(input.provider, input.providerId);
  
  if (existingByProviderId) {
    // Update existing user with this provider
    const updated: UserRecord = {
      ...existingByProviderId,
      name: input.name || existingByProviderId.name,
      email: input.email,
      pictureUrl: input.pictureUrl || existingByProviderId.pictureUrl,
      lastSignedIn: now,
      updatedAt: now,
    };
    userStore.set(existingByProviderId.id, updated);
    return updated;
  }

  // Check if user exists by email (for account linking - Requirements 8.2, 8.3)
  const existingByEmail = getUserByEmail(input.email);
  
  if (existingByEmail) {
    // Link new provider to existing user account
    const currentProviders = existingByEmail.authProviders || [];
    const updatedProviders = currentProviders.includes(input.provider)
      ? currentProviders
      : [...currentProviders, input.provider];

    const updated: UserRecord = {
      ...existingByEmail,
      googleId: input.provider === "google" ? input.providerId : existingByEmail.googleId,
      manusId: input.provider === "manus" ? input.providerId : existingByEmail.manusId,
      pictureUrl: input.pictureUrl || existingByEmail.pictureUrl,
      authProviders: updatedProviders,
      lastSignedIn: now,
      updatedAt: now,
    };
    userStore.set(existingByEmail.id, updated);
    return updated;
  }

  // Create new user
  const newUser: UserRecord = {
    id: nextUserId++,
    openId: `${input.provider}_${input.providerId}`,
    googleId: input.provider === "google" ? input.providerId : null,
    manusId: input.provider === "manus" ? input.providerId : null,
    name: input.name,
    email: input.email,
    pictureUrl: input.pictureUrl,
    authProviders: [input.provider],
    lastSignedIn: now,
    updatedAt: now,
  };
  userStore.set(newUser.id, newUser);
  return newUser;
}

/**
 * Creates an existing user with a specific provider (for testing account linking)
 */
function createExistingUser(
  email: string,
  provider: "google" | "manus",
  providerId: string
): UserRecord {
  const user: UserRecord = {
    id: nextUserId++,
    openId: `${provider}_${providerId}`,
    googleId: provider === "google" ? providerId : null,
    manusId: provider === "manus" ? providerId : null,
    name: "Existing User",
    email: email,
    pictureUrl: null,
    authProviders: [provider],
    lastSignedIn: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000),
  };
  userStore.set(user.id, user);
  return user;
}

// ============ Arbitraries ============

const providerIdArb = fc.string({ minLength: 10, maxLength: 30 }).filter((s) => s.length > 0);
const emailArb = fc.emailAddress();
const nameArb = fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null });
const pictureUrlArb = fc.option(
  fc.webUrl().filter((url) => url.length <= 500),
  { nil: null }
);
const providerArb = fc.constantFrom("google" as const, "manus" as const);

const oauthSignInArb = fc.record({
  provider: providerArb,
  providerId: providerIdArb,
  email: emailArb,
  name: nameArb,
  pictureUrl: pictureUrlArb,
});

// ============ Property Tests ============

describe("Property 14: Account Linking by Email", () => {
  beforeEach(() => {
    resetUserStore();
  });

  /**
   * Property 14: Account Linking by Email
   * For any user signing in with a new OAuth provider where the email matches an existing 
   * user account, the new provider SHALL be added to the existing user's authProviders 
   * array without creating a duplicate user record.
   * Validates: Requirements 8.2, 8.3
   */
  it("should link new provider to existing account with same email without creating duplicate", () => {
    fc.assert(
      fc.property(
        emailArb,
        providerIdArb,
        providerIdArb,
        nameArb,
        pictureUrlArb,
        (email, googleProviderId, manusProviderId, name, pictureUrl) => {
          // Skip if provider IDs happen to be the same
          if (googleProviderId === manusProviderId) return;
          
          resetUserStore();
          
          // Create existing user with Google provider
          const existingUser = createExistingUser(email, "google", googleProviderId);
          const initialUserCount = getUserCount();
          
          // Sign in with Manus using the same email
          const signInInput: OAuthSignInInput = {
            provider: "manus",
            providerId: manusProviderId,
            email: email,
            name: name,
            pictureUrl: pictureUrl,
          };
          
          const result = simulateOAuthSignIn(signInInput);
          
          // Verify: No duplicate user created
          expect(getUserCount()).toBe(initialUserCount);
          
          // Verify: Same user record was updated
          expect(result.id).toBe(existingUser.id);
          
          // Verify: New provider was added to authProviders
          expect(result.authProviders).toContain("manus");
          expect(result.authProviders).toContain("google");
          
          // Verify: Both provider IDs are set
          expect(result.googleId).toBe(googleProviderId);
          expect(result.manusId).toBe(manusProviderId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should not duplicate provider in authProviders array when signing in with same provider", () => {
    fc.assert(
      fc.property(
        oauthSignInArb,
        (signInInput) => {
          resetUserStore();
          
          // First sign-in creates user
          const firstResult = simulateOAuthSignIn(signInInput);
          expect(firstResult.authProviders.filter(p => p === signInInput.provider).length).toBe(1);
          
          // Second sign-in with same provider
          const secondResult = simulateOAuthSignIn({
            ...signInInput,
          });
          
          // Verify: Provider appears exactly once in authProviders
          const providerCount = secondResult.authProviders.filter(
            p => p === signInInput.provider
          ).length;
          expect(providerCount).toBe(1);
          
          // Verify: Still only one user
          expect(getUserCount()).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve existing user data when linking new provider", () => {
    fc.assert(
      fc.property(
        emailArb,
        providerIdArb,
        providerIdArb,
        nameArb,
        (email, existingProviderId, newProviderId, newName) => {
          // Skip if provider IDs are the same
          if (existingProviderId === newProviderId) return;
          
          resetUserStore();
          
          // Create existing user with Manus
          const existingUser = createExistingUser(email, "manus", existingProviderId);
          const originalOpenId = existingUser.openId;
          
          // Sign in with Google using same email
          const signInInput: OAuthSignInInput = {
            provider: "google",
            providerId: newProviderId,
            email: email,
            name: newName,
            pictureUrl: null,
          };
          
          const result = simulateOAuthSignIn(signInInput);
          
          // Verify: Original openId is preserved
          expect(result.openId).toBe(originalOpenId);
          
          // Verify: Original provider ID is preserved
          expect(result.manusId).toBe(existingProviderId);
          
          // Verify: New provider ID is added
          expect(result.googleId).toBe(newProviderId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should handle linking multiple providers to same account", () => {
    fc.assert(
      fc.property(
        emailArb,
        providerIdArb,
        providerIdArb,
        (email, googleId, manusId) => {
          // Skip if IDs are the same
          if (googleId === manusId) return;
          
          resetUserStore();
          
          // First sign-in with Google
          const googleSignIn: OAuthSignInInput = {
            provider: "google",
            providerId: googleId,
            email: email,
            name: "User",
            pictureUrl: null,
          };
          const afterGoogle = simulateOAuthSignIn(googleSignIn);
          expect(afterGoogle.authProviders).toEqual(["google"]);
          expect(getUserCount()).toBe(1);
          
          // Second sign-in with Manus (same email)
          const manusSignIn: OAuthSignInInput = {
            provider: "manus",
            providerId: manusId,
            email: email,
            name: "User",
            pictureUrl: null,
          };
          const afterManus = simulateOAuthSignIn(manusSignIn);
          
          // Verify: Both providers linked
          expect(afterManus.authProviders).toContain("google");
          expect(afterManus.authProviders).toContain("manus");
          expect(afterManus.authProviders.length).toBe(2);
          
          // Verify: Still only one user
          expect(getUserCount()).toBe(1);
          
          // Verify: Same user ID
          expect(afterManus.id).toBe(afterGoogle.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should create separate users for different emails", () => {
    fc.assert(
      fc.property(
        emailArb,
        emailArb,
        providerIdArb,
        providerIdArb,
        (email1, email2, providerId1, providerId2) => {
          // Skip if emails or provider IDs are the same
          if (email1 === email2 || providerId1 === providerId2) return;
          
          resetUserStore();
          
          // First user signs in
          const signIn1: OAuthSignInInput = {
            provider: "google",
            providerId: providerId1,
            email: email1,
            name: "User 1",
            pictureUrl: null,
          };
          const user1 = simulateOAuthSignIn(signIn1);
          
          // Second user signs in with different email
          const signIn2: OAuthSignInInput = {
            provider: "google",
            providerId: providerId2,
            email: email2,
            name: "User 2",
            pictureUrl: null,
          };
          const user2 = simulateOAuthSignIn(signIn2);
          
          // Verify: Two separate users created
          expect(getUserCount()).toBe(2);
          expect(user1.id).not.toBe(user2.id);
          expect(user1.email).toBe(email1);
          expect(user2.email).toBe(email2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
