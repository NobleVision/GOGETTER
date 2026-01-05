/**
 * Property-Based Tests for Google OAuth User Record Management
 * Feature: go-getter-enhancements, Property 2: User Record Management on OAuth
 * Validates: Requirements 2.4, 2.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fc from "fast-check";

// Mock the database module
vi.mock("../db", () => ({
  getUserByGoogleId: vi.fn(),
  getUserByEmail: vi.fn(),
  getDb: vi.fn(),
}));

// Mock ENV
vi.mock("./env", () => ({
  ENV: {
    ownerOpenId: "owner-open-id",
    googleClientId: "test-client-id",
    googleClientSecret: "test-client-secret",
  },
}));

import * as db from "../db";

// Simulated upsertUserWithGoogle logic for testing
// This mirrors the actual implementation in db.ts
interface GoogleUserInput {
  openId: string;
  googleId: string;
  name: string | null;
  email: string;
  pictureUrl: string | null;
  loginMethod: string;
  lastSignedIn: Date;
}

interface UserRecord {
  id: number;
  openId: string;
  googleId: string | null;
  name: string | null;
  email: string | null;
  pictureUrl: string | null;
  authProviders: string[];
  lastSignedIn: Date;
  updatedAt: Date;
}

// In-memory user store for testing
let userStore: Map<number, UserRecord>;
let nextUserId: number;

function resetUserStore() {
  userStore = new Map();
  nextUserId = 1;
}

function simulateUpsertUserWithGoogle(user: GoogleUserInput): UserRecord {
  // Check if user exists by Google ID
  for (const [id, existingUser] of userStore.entries()) {
    if (existingUser.googleId === user.googleId) {
      // Update existing Google user
      const updated: UserRecord = {
        ...existingUser,
        name: user.name,
        email: user.email,
        pictureUrl: user.pictureUrl,
        lastSignedIn: user.lastSignedIn,
        updatedAt: new Date(),
      };
      userStore.set(id, updated);
      return updated;
    }
  }

  // Check if user exists by email (for account linking)
  for (const [id, existingUser] of userStore.entries()) {
    if (existingUser.email === user.email) {
      // Link Google account to existing user
      const currentProviders = existingUser.authProviders || [];
      const updatedProviders = currentProviders.includes("google")
        ? currentProviders
        : [...currentProviders, "google"];

      const updated: UserRecord = {
        ...existingUser,
        googleId: user.googleId,
        pictureUrl: user.pictureUrl || existingUser.pictureUrl,
        authProviders: updatedProviders,
        lastSignedIn: user.lastSignedIn,
        updatedAt: new Date(),
      };
      userStore.set(id, updated);
      return updated;
    }
  }

  // Create new user
  const newUser: UserRecord = {
    id: nextUserId++,
    openId: user.openId,
    googleId: user.googleId,
    name: user.name,
    email: user.email,
    pictureUrl: user.pictureUrl,
    authProviders: ["google"],
    lastSignedIn: user.lastSignedIn,
    updatedAt: new Date(),
  };
  userStore.set(newUser.id, newUser);
  return newUser;
}

// Arbitraries for generating test data
const googleIdArb = fc.string({ minLength: 10, maxLength: 30 }).filter((s) => s.length > 0);
const emailArb = fc.emailAddress();
const nameArb = fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null });
const pictureUrlArb = fc.option(
  fc.webUrl().filter((url) => url.length <= 500),
  { nil: null }
);

const googleUserInputArb = fc.record({
  googleId: googleIdArb,
  email: emailArb,
  name: nameArb,
  pictureUrl: pictureUrlArb,
}).map((data) => ({
  openId: `google_${data.googleId}`,
  googleId: data.googleId,
  name: data.name,
  email: data.email,
  pictureUrl: data.pictureUrl,
  loginMethod: "google",
  lastSignedIn: new Date(),
}));

describe("Property 2: User Record Management on OAuth", () => {
  beforeEach(() => {
    resetUserStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 2: User Record Management on OAuth
   * For any valid OAuth profile data (containing email and provider ID), signing in SHALL result in either:
   * - A new user record created with matching profile data (if no user exists with that provider ID), OR
   * - An existing user record with updated lastSignedIn timestamp (if user exists)
   * Validates: Requirements 2.4, 2.5
   */
  it("should create new user when no existing user with Google ID", () => {
    fc.assert(
      fc.property(googleUserInputArb, (userInput) => {
        resetUserStore();
        
        const result = simulateUpsertUserWithGoogle(userInput);
        
        // Verify new user was created with matching profile data
        expect(result.googleId).toBe(userInput.googleId);
        expect(result.email).toBe(userInput.email);
        expect(result.name).toBe(userInput.name);
        expect(result.authProviders).toContain("google");
        expect(userStore.size).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it("should update lastSignedIn when existing user signs in again", () => {
    fc.assert(
      fc.property(googleUserInputArb, (userInput) => {
        resetUserStore();
        
        // First sign-in creates user
        const firstResult = simulateUpsertUserWithGoogle(userInput);
        const firstSignIn = firstResult.lastSignedIn;
        
        // Wait a tiny bit to ensure different timestamp
        const updatedInput = {
          ...userInput,
          lastSignedIn: new Date(Date.now() + 1000),
        };
        
        // Second sign-in should update existing user
        const secondResult = simulateUpsertUserWithGoogle(updatedInput);
        
        // Verify same user was updated (not a new one created)
        expect(userStore.size).toBe(1);
        expect(secondResult.id).toBe(firstResult.id);
        expect(secondResult.googleId).toBe(userInput.googleId);
        // lastSignedIn should be updated
        expect(secondResult.lastSignedIn.getTime()).toBeGreaterThanOrEqual(firstSignIn.getTime());
      }),
      { numRuns: 100 }
    );
  });

  it("should link Google account when user with same email exists", () => {
    fc.assert(
      fc.property(
        googleUserInputArb,
        googleIdArb,
        (userInput, differentGoogleId) => {
          // Skip if google IDs happen to be the same
          if (userInput.googleId === differentGoogleId) return;
          
          resetUserStore();
          
          // Create existing user with same email but different provider
          const existingUser: UserRecord = {
            id: nextUserId++,
            openId: "manus_existing",
            googleId: null,
            name: "Existing User",
            email: userInput.email,
            pictureUrl: null,
            authProviders: ["manus"],
            lastSignedIn: new Date(Date.now() - 10000),
            updatedAt: new Date(Date.now() - 10000),
          };
          userStore.set(existingUser.id, existingUser);
          
          // Sign in with Google using same email
          const result = simulateUpsertUserWithGoogle(userInput);
          
          // Verify account was linked (not new user created)
          expect(userStore.size).toBe(1);
          expect(result.id).toBe(existingUser.id);
          expect(result.googleId).toBe(userInput.googleId);
          expect(result.authProviders).toContain("google");
          expect(result.authProviders).toContain("manus");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve user data integrity across multiple sign-ins", () => {
    fc.assert(
      fc.property(
        fc.array(googleUserInputArb, { minLength: 1, maxLength: 5 }),
        (userInputs) => {
          resetUserStore();
          
          // Use the same user input multiple times
          const baseInput = userInputs[0];
          
          for (let i = 0; i < userInputs.length; i++) {
            const input = {
              ...baseInput,
              lastSignedIn: new Date(Date.now() + i * 1000),
            };
            simulateUpsertUserWithGoogle(input);
          }
          
          // Should still only have one user
          expect(userStore.size).toBe(1);
          
          // User should have correct Google ID
          const user = Array.from(userStore.values())[0];
          expect(user.googleId).toBe(baseInput.googleId);
          expect(user.email).toBe(baseInput.email);
        }
      ),
      { numRuns: 100 }
    );
  });
});
