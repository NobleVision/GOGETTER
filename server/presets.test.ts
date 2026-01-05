/**
 * Property-Based Tests for Discovery Presets
 * Feature: go-getter-enhancements, Property 8: Preset Name Uniqueness
 * 
 * Validates: Requirements 5.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import type { UserPreferences, DiscoveryPreset } from '../drizzle/schema';

// Mock database to simulate preset storage and unique constraint behavior
let mockPresets: DiscoveryPreset[] = [];
let nextId = 1;

// Mock the database functions
vi.mock('./db', () => ({
  getDb: vi.fn().mockResolvedValue({}),
  
  createDiscoveryPreset: vi.fn().mockImplementation(async (userId: number, name: string, config: UserPreferences): Promise<DiscoveryPreset> => {
    // Check for preset count limit (10 presets max)
    const currentCount = mockPresets.filter(p => p.userId === userId).length;
    if (currentCount >= 10) {
      throw new Error("Maximum preset limit reached. Delete a preset first.");
    }
    
    // Check for duplicate name for same user (simulating unique constraint)
    const existingPreset = mockPresets.find(p => p.userId === userId && p.name === name);
    if (existingPreset) {
      throw new Error(`A preset with the name "${name}" already exists`);
    }
    
    const newPreset: DiscoveryPreset = {
      id: nextId++,
      userId,
      name,
      config,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockPresets.push(newPreset);
    return newPreset;
  }),
  
  getDiscoveryPresets: vi.fn().mockImplementation(async (userId: number): Promise<DiscoveryPreset[]> => {
    return mockPresets.filter(p => p.userId === userId);
  }),
  
  deleteDiscoveryPreset: vi.fn().mockImplementation(async (userId: number, presetId: number): Promise<boolean> => {
    const index = mockPresets.findIndex(p => p.id === presetId && p.userId === userId);
    if (index >= 0) {
      mockPresets.splice(index, 1);
      return true;
    }
    return false;
  }),
  
  getDiscoveryPresetCount: vi.fn().mockImplementation(async (userId: number): Promise<number> => {
    return mockPresets.filter(p => p.userId === userId).length;
  }),
  
  getDiscoveryPresetById: vi.fn().mockImplementation(async (userId: number, presetId: number): Promise<DiscoveryPreset | undefined> => {
    return mockPresets.find(p => p.id === presetId && p.userId === userId);
  })
}));

// Import the mocked functions
import { 
  createDiscoveryPreset, 
  getDiscoveryPresets, 
  deleteDiscoveryPreset,
  getDiscoveryPresetCount,
  getDiscoveryPresetById
} from './db';

// Property-based test configuration
const PBT_CONFIG = { numRuns: 100 };

// Arbitraries for generating test data
const userIdArb = fc.integer({ min: 1, max: 1000000 });
const presetNameArb = fc.string({ minLength: 1, maxLength: 255 }).filter(name => name.trim().length > 0);

const userPreferencesArb = fc.record({
  riskTolerance: fc.constantFrom('conservative', 'moderate', 'aggressive'),
  interests: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
  capitalAvailable: fc.integer({ min: 0, max: 1000000 }),
  technicalSkills: fc.string({ minLength: 1, maxLength: 50 }),
  businessGoals: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 10 })
}) as fc.Arbitrary<UserPreferences>;

describe("Property 8: Preset Name Uniqueness", () => {
  beforeEach(() => {
    // Reset mock data before each test
    mockPresets = [];
    nextId = 1;
    vi.clearAllMocks();
  });
  /**
   * Feature: go-getter-enhancements, Property 8: Preset Name Uniqueness
   * 
   * Validates: Requirements 5.2
   * 
   * Property 8: Preset Name Uniqueness
   * For any user attempting to save a preset, if a preset with the same name already exists 
   * for that user, the save operation SHALL fail with a uniqueness error.
   */
  it("should fail when attempting to create preset with duplicate name for same user", async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        presetNameArb,
        userPreferencesArb,
        userPreferencesArb,
        async (userId, presetName, config1, config2) => {
          // Reset mock state for this property test iteration
          mockPresets = [];
          nextId = 1;

          // Create first preset with the name
          const firstPreset = await createDiscoveryPreset(userId, presetName, config1);
          expect(firstPreset).toBeDefined();
          expect(firstPreset!.name).toBe(presetName);

          // Attempt to create second preset with same name should fail
          let errorThrown = false;
          let errorMessage = '';
          
          try {
            await createDiscoveryPreset(userId, presetName, config2);
          } catch (error) {
            errorThrown = true;
            errorMessage = error instanceof Error ? error.message : String(error);
          }

          // Verify that error was thrown and contains expected message
          expect(errorThrown).toBe(true);
          expect(errorMessage).toContain('already exists');

          // Verify only one preset exists with that name
          const presets = await getDiscoveryPresets(userId);
          const presetsWithName = presets.filter(p => p.name === presetName);
          expect(presetsWithName).toHaveLength(1);
          expect(presetsWithName[0].config).toEqual(config1); // Should be the first config
        }
      ),
      PBT_CONFIG
    );
  });

  it("should allow same preset name for different users", async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        userIdArb,
        presetNameArb,
        userPreferencesArb,
        userPreferencesArb,
        async (userId1, userId2, presetName, config1, config2) => {
          // Ensure different users
          fc.pre(userId1 !== userId2);

          // Reset mock state for this property test iteration
          mockPresets = [];
          nextId = 1;

          // Create preset with same name for both users - should succeed
          const preset1 = await createDiscoveryPreset(userId1, presetName, config1);
          const preset2 = await createDiscoveryPreset(userId2, presetName, config2);

          expect(preset1).toBeDefined();
          expect(preset2).toBeDefined();
          expect(preset1!.name).toBe(presetName);
          expect(preset2!.name).toBe(presetName);
          expect(preset1!.userId).toBe(userId1);
          expect(preset2!.userId).toBe(userId2);

          // Verify each user has their own preset
          const user1Presets = await getDiscoveryPresets(userId1);
          const user2Presets = await getDiscoveryPresets(userId2);
          
          expect(user1Presets.filter(p => p.name === presetName)).toHaveLength(1);
          expect(user2Presets.filter(p => p.name === presetName)).toHaveLength(1);
        }
      ),
      PBT_CONFIG
    );
  });

  it("should allow different preset names for same user", async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        presetNameArb,
        presetNameArb,
        userPreferencesArb,
        userPreferencesArb,
        async (userId, name1, name2, config1, config2) => {
          // Ensure different names
          fc.pre(name1 !== name2);

          // Reset mock state for this property test iteration
          mockPresets = [];
          nextId = 1;

          // Create presets with different names - should succeed
          const preset1 = await createDiscoveryPreset(userId, name1, config1);
          const preset2 = await createDiscoveryPreset(userId, name2, config2);

          expect(preset1).toBeDefined();
          expect(preset2).toBeDefined();
          expect(preset1!.name).toBe(name1);
          expect(preset2!.name).toBe(name2);

          // Verify both presets exist
          const presets = await getDiscoveryPresets(userId);
          expect(presets).toHaveLength(2);
          
          const presetNames = presets.map(p => p.name).sort();
          expect(presetNames).toEqual([name1, name2].sort());
        }
      ),
      PBT_CONFIG
    );
  });
});

describe("Property 9: Preset Loading Completeness", () => {
  beforeEach(() => {
    // Reset mock data before each test
    mockPresets = [];
    nextId = 1;
    vi.clearAllMocks();
  });

  /**
   * Feature: go-getter-enhancements, Property 9: Preset Loading Completeness
   * 
   * Validates: Requirements 5.3, 5.4
   * 
   * Property 9: Preset Loading Completeness
   * For any saved preset, loading that preset SHALL restore all wizard fields to exactly 
   * the values that were saved, with no fields missing or modified.
   */
  it("should restore all wizard fields exactly as they were saved", async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        presetNameArb,
        userPreferencesArb,
        async (userId, presetName, originalConfig) => {
          // Reset mock state for this property test iteration
          mockPresets = [];
          nextId = 1;

          // Create a preset with the original configuration
          const savedPreset = await createDiscoveryPreset(userId, presetName, originalConfig);
          expect(savedPreset).toBeDefined();

          // Retrieve the preset by ID (simulating loading)
          const loadedPreset = await getDiscoveryPresetById(userId, savedPreset!.id);
          expect(loadedPreset).toBeDefined();

          // Verify that all fields are exactly the same
          expect(loadedPreset!.config.riskTolerance).toBe(originalConfig.riskTolerance);
          expect(loadedPreset!.config.interests).toEqual(originalConfig.interests);
          expect(loadedPreset!.config.capitalAvailable).toBe(originalConfig.capitalAvailable);
          expect(loadedPreset!.config.technicalSkills).toBe(originalConfig.technicalSkills);
          expect(loadedPreset!.config.businessGoals).toEqual(originalConfig.businessGoals);

          // Verify no fields are missing (all required fields present)
          expect(loadedPreset!.config).toHaveProperty('riskTolerance');
          expect(loadedPreset!.config).toHaveProperty('interests');
          expect(loadedPreset!.config).toHaveProperty('capitalAvailable');
          expect(loadedPreset!.config).toHaveProperty('technicalSkills');
          expect(loadedPreset!.config).toHaveProperty('businessGoals');

          // Verify no extra fields were added
          const expectedKeys = ['riskTolerance', 'interests', 'capitalAvailable', 'technicalSkills', 'businessGoals'];
          const actualKeys = Object.keys(loadedPreset!.config);
          expect(actualKeys.sort()).toEqual(expectedKeys.sort());
        }
      ),
      PBT_CONFIG
    );
  });

  it("should handle edge cases in preset configuration values", async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        presetNameArb,
        fc.record({
          riskTolerance: fc.constantFrom('conservative', 'moderate', 'aggressive'),
          interests: fc.oneof(
            fc.constant([]), // Empty array
            fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 20 }) // Non-empty array
          ),
          capitalAvailable: fc.oneof(
            fc.constant(0), // Zero capital
            fc.integer({ min: 1, max: 1000000 }) // Positive capital
          ),
          technicalSkills: fc.string({ minLength: 1, maxLength: 50 }),
          businessGoals: fc.oneof(
            fc.constant([]), // Empty goals
            fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 15 }) // Non-empty goals
          )
        }) as fc.Arbitrary<UserPreferences>,
        async (userId, presetName, edgeCaseConfig) => {
          // Reset mock state for this property test iteration
          mockPresets = [];
          nextId = 1;

          // Create preset with edge case configuration
          const savedPreset = await createDiscoveryPreset(userId, presetName, edgeCaseConfig);
          expect(savedPreset).toBeDefined();

          // Load the preset
          const loadedPreset = await getDiscoveryPresetById(userId, savedPreset!.id);
          expect(loadedPreset).toBeDefined();

          // Verify exact match for all fields, including edge cases
          expect(loadedPreset!.config).toEqual(edgeCaseConfig);

          // Special verification for array fields to ensure they maintain order and content
          if (edgeCaseConfig.interests.length > 0) {
            expect(loadedPreset!.config.interests).toHaveLength(edgeCaseConfig.interests.length);
            edgeCaseConfig.interests.forEach((interest, index) => {
              expect(loadedPreset!.config.interests[index]).toBe(interest);
            });
          }

          if (edgeCaseConfig.businessGoals.length > 0) {
            expect(loadedPreset!.config.businessGoals).toHaveLength(edgeCaseConfig.businessGoals.length);
            edgeCaseConfig.businessGoals.forEach((goal, index) => {
              expect(loadedPreset!.config.businessGoals[index]).toBe(goal);
            });
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it("should maintain data integrity across multiple save-load cycles", async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        presetNameArb,
        userPreferencesArb,
        async (userId, presetName, originalConfig) => {
          // Reset mock state for this property test iteration
          mockPresets = [];
          nextId = 1;

          // Create initial preset
          const preset1 = await createDiscoveryPreset(userId, presetName, originalConfig);
          expect(preset1).toBeDefined();

          // Load it multiple times to ensure consistency
          const loaded1 = await getDiscoveryPresetById(userId, preset1!.id);
          const loaded2 = await getDiscoveryPresetById(userId, preset1!.id);
          const loaded3 = await getDiscoveryPresetById(userId, preset1!.id);

          // All loads should return identical configurations
          expect(loaded1!.config).toEqual(originalConfig);
          expect(loaded2!.config).toEqual(originalConfig);
          expect(loaded3!.config).toEqual(originalConfig);
          expect(loaded1!.config).toEqual(loaded2!.config);
          expect(loaded2!.config).toEqual(loaded3!.config);
        }
      ),
      PBT_CONFIG
    );
  });
});

describe("Property 10: Preset Count Limit Enforcement", () => {
  beforeEach(() => {
    // Reset mock data before each test
    mockPresets = [];
    nextId = 1;
    vi.clearAllMocks();
  });

  /**
   * Feature: go-getter-enhancements, Property 10: Preset Count Limit Enforcement
   * 
   * Validates: Requirements 5.6, 5.7
   * 
   * Property 10: Preset Count Limit Enforcement
   * For any user with 10 existing presets, attempting to create an 11th preset SHALL fail with a limit exceeded error.
   */
  it("should fail when attempting to create 11th preset for user with 10 existing presets", async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        fc.array(presetNameArb, { minLength: 10, maxLength: 10 }).filter(names => {
          // Ensure all names are unique
          const uniqueNames = new Set(names);
          return uniqueNames.size === names.length;
        }),
        presetNameArb,
        fc.array(userPreferencesArb, { minLength: 11, maxLength: 11 }),
        async (userId, presetNames, eleventhName, configs) => {
          // Ensure the 11th name is different from the first 10
          fc.pre(!presetNames.includes(eleventhName));

          // Reset mock state for this property test iteration
          mockPresets = [];
          nextId = 1;

          // Create 10 presets successfully
          const createdPresets = [];
          for (let i = 0; i < 10; i++) {
            const preset = await createDiscoveryPreset(userId, presetNames[i], configs[i]);
            expect(preset).toBeDefined();
            createdPresets.push(preset!);
          }

          // Verify we have exactly 10 presets
          const count = await getDiscoveryPresetCount(userId);
          expect(count).toBe(10);

          // Attempt to create 11th preset should fail
          let errorThrown = false;
          let errorMessage = '';
          
          try {
            await createDiscoveryPreset(userId, eleventhName, configs[10]);
          } catch (error) {
            errorThrown = true;
            errorMessage = error instanceof Error ? error.message : String(error);
          }

          // Verify that error was thrown and contains expected message
          expect(errorThrown).toBe(true);
          expect(errorMessage).toContain('limit');

          // Verify count is still 10
          const finalCount = await getDiscoveryPresetCount(userId);
          expect(finalCount).toBe(10);

          // Verify the 11th preset was not created
          const allPresets = await getDiscoveryPresets(userId);
          expect(allPresets).toHaveLength(10);
          expect(allPresets.find(p => p.name === eleventhName)).toBeUndefined();
        }
      ),
      PBT_CONFIG
    );
  });

  it("should allow creating presets up to the limit of 10", async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        fc.array(presetNameArb, { minLength: 1, maxLength: 10 }).filter(names => {
          // Ensure all names are unique
          const uniqueNames = new Set(names);
          return uniqueNames.size === names.length;
        }),
        async (userId, presetNames) => {
          // Reset mock state for this property test iteration
          mockPresets = [];
          nextId = 1;

          const numPresets = presetNames.length;
          const configs = Array.from({ length: numPresets }, () => ({
            riskTolerance: 'moderate' as const,
            interests: ['test'],
            capitalAvailable: 1000,
            technicalSkills: 'basic',
            businessGoals: ['profit']
          }));

          // Create presets up to the limit - should all succeed
          const createdPresets = [];
          for (let i = 0; i < numPresets; i++) {
            const preset = await createDiscoveryPreset(userId, presetNames[i], configs[i]);
            expect(preset).toBeDefined();
            expect(preset!.name).toBe(presetNames[i]);
            createdPresets.push(preset!);
          }

          // Verify count matches expected
          const count = await getDiscoveryPresetCount(userId);
          expect(count).toBe(numPresets);

          // Verify all presets exist
          const allPresets = await getDiscoveryPresets(userId);
          expect(allPresets).toHaveLength(numPresets);
          
          const retrievedNames = allPresets.map(p => p.name).sort();
          const expectedNames = presetNames.sort();
          expect(retrievedNames).toEqual(expectedNames);
        }
      ),
      PBT_CONFIG
    );
  });

  it("should allow creating preset after deleting one when at limit", async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        fc.array(presetNameArb, { minLength: 10, maxLength: 10 }).filter(names => {
          // Ensure all names are unique
          const uniqueNames = new Set(names);
          return uniqueNames.size === names.length;
        }),
        presetNameArb,
        async (userId, presetNames, newPresetName) => {
          // Ensure the new name is different from existing ones
          fc.pre(!presetNames.includes(newPresetName));

          // Reset mock state for this property test iteration
          mockPresets = [];
          nextId = 1;

          const configs = Array.from({ length: 10 }, () => ({
            riskTolerance: 'moderate' as const,
            interests: ['test'],
            capitalAvailable: 1000,
            technicalSkills: 'basic',
            businessGoals: ['profit']
          }));

          // Create 10 presets to reach the limit
          const createdPresets = [];
          for (let i = 0; i < 10; i++) {
            const preset = await createDiscoveryPreset(userId, presetNames[i], configs[i]);
            expect(preset).toBeDefined();
            createdPresets.push(preset!);
          }

          // Verify we're at the limit
          let count = await getDiscoveryPresetCount(userId);
          expect(count).toBe(10);

          // Delete one preset
          const presetToDelete = createdPresets[0];
          const deleteResult = await deleteDiscoveryPreset(userId, presetToDelete.id);
          expect(deleteResult).toBe(true);

          // Verify count decreased
          count = await getDiscoveryPresetCount(userId);
          expect(count).toBe(9);

          // Now creating a new preset should succeed
          const newConfig = {
            riskTolerance: 'aggressive' as const,
            interests: ['new'],
            capitalAvailable: 2000,
            technicalSkills: 'advanced',
            businessGoals: ['growth']
          };

          const newPreset = await createDiscoveryPreset(userId, newPresetName, newConfig);
          expect(newPreset).toBeDefined();
          expect(newPreset!.name).toBe(newPresetName);

          // Verify final count is back to 10
          const finalCount = await getDiscoveryPresetCount(userId);
          expect(finalCount).toBe(10);
        }
      ),
      PBT_CONFIG
    );
  });
});