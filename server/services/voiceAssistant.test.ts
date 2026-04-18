import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  buildDefaultModes,
  isSupportedAgentMode,
  normalizeConfirmationCode,
  resolveAgentMode,
} from "./voiceAssistant";
import type { VoiceAgentModeConfig } from "../../drizzle/schema";

const PBT_CONFIG = { numRuns: 100 };

function arbitraryModeConfig() {
  return fc.record<VoiceAgentModeConfig>({
    key: fc.constantFrom(
      "listen",
      "interact",
      "business",
      "project_management",
      "development",
      "custom"
    ),
    label: fc.string({ minLength: 3, maxLength: 30 }),
    enabled: fc.boolean(),
    prompt: fc.string({ minLength: 10, maxLength: 200 }),
    tools: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }), { nil: undefined }),
    handoffTargets: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }), { nil: undefined }),
  });
}

describe("Voice Assistant helpers", () => {
  it("normalizes confirmation codes by trimming whitespace and uppercasing characters", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ maxLength: 3 }),
        fc.string({ maxLength: 3 }),
        (core, leading, trailing) => {
          const padded = `${leading}${core}${trailing}`;
          expect(normalizeConfirmationCode(`  ${padded}  `)).toBe(
            normalizeConfirmationCode(padded)
          );
          expect(normalizeConfirmationCode(core.toLowerCase())).toBe(
            normalizeConfirmationCode(core.toUpperCase())
          );
        }
      ),
      PBT_CONFIG
    );
  });

  it("resolves supported requested modes and otherwise falls back to the first enabled mode", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryModeConfig(), { minLength: 1, maxLength: 10 }),
        fc.option(
          fc.constantFrom(
            "listen",
            "interact",
            "business",
            "project_management",
            "development",
            "custom",
            "unknown"
          ),
          { nil: undefined }
        ),
        (modeConfigs, requestedMode) => {
          const available = buildDefaultModes(modeConfigs);
          const firstEnabled = available.find((mode) => mode.enabled)?.key ?? "listen";
          const expected = requestedMode && isSupportedAgentMode(requestedMode, available)
            ? requestedMode
            : firstEnabled;

          expect(resolveAgentMode(requestedMode, available)).toBe(expected);
        }
      ),
      PBT_CONFIG
    );
  });

  it("keeps the default mode catalogue usable when no custom modes are supplied", () => {
    const defaults = buildDefaultModes();
    expect(defaults.length).toBeGreaterThanOrEqual(5);
    expect(resolveAgentMode(undefined, defaults)).toBe(defaults[0].key);
    expect(isSupportedAgentMode("listen", defaults)).toBe(true);
  });
});
