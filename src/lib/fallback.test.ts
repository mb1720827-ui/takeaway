import { describe, expect, it } from "vitest";
import { fallbackEnv, isUsageLimit } from "./fallback";

describe("isUsageLimit", () => {
  it("recognises Claude's usage-limit messages", () => {
    expect(isUsageLimit("Claude AI usage limit reached|1752087600")).toBe(true);
    expect(isUsageLimit("You've hit your limit · resets 7pm (Africa/Lagos)")).toBe(true);
    expect(isUsageLimit("5-hour limit reached ∙ resets 3am")).toBe(true);
    expect(isUsageLimit("Weekly limit reached ∙ resets Mon 9am")).toBe(true);
    expect(isUsageLimit('API Error: 429 {"type":"error","error":{"type":"rate_limit_error","message":"Rate limited"}}')).toBe(true);
  });

  it("ignores other failures", () => {
    expect(isUsageLimit("Reached maximum number of turns (10)")).toBe(false);
    expect(isUsageLimit("Prompt is too long")).toBe(false);
    expect(isUsageLimit("Claude Code exited with 1: spawn claude.exe ENOENT")).toBe(false);
    expect(isUsageLimit("Invalid API key · Please run /login")).toBe(false);
  });
});

describe("fallbackEnv", () => {
  const profile = {
    env: {
      ANTHROPIC_BASE_URL: "http://127.0.0.1:31415",
      ANTHROPIC_AUTH_TOKEN: "freellmapi-test",
      ANTHROPIC_MODEL: "auto",
      CLAUDE_CODE_AUTO_COMPACT_WINDOW: "104857",
    },
  };

  it("reads the free models' settings from the free profile", () => {
    expect(fallbackEnv(JSON.stringify(profile))).toEqual(profile.env);
  });

  it("keeps only text values", () => {
    expect(fallbackEnv(JSON.stringify({ env: { ...profile.env, SOMETHING: 3 } }))).toEqual(profile.env);
  });

  it("is off when the profile isn't set up", () => {
    expect(fallbackEnv(JSON.stringify({ env: { ANTHROPIC_BASE_URL: "http://127.0.0.1:31415" } }))).toBeNull();
    expect(fallbackEnv("{}")).toBeNull();
    expect(fallbackEnv("not json")).toBeNull();
  });
});
