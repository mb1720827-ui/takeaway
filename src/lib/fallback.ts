// When the Claude plan's usage limit is reached, the worker retries on free models through FreeLLMAPI,
// using the "free" profile that `npx freellmapi setup-claude --profile free` writes. No profile, no fallback.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** Whether a Claude Code error says the Claude plan's usage limit (or the API rate limit) is reached. */
export function isUsageLimit(message: string): boolean {
  return /usage limit|hit your (?:usage )?limit|(?:5-hour|weekly|daily|session|opus|sonnet) limit|out of (?:extra )?usage|rate_limit_error|API Error: 429/i.test(
    message,
  );
}

/** The free models' environment from a profile's settings.json, or null if it can't reach a gateway. */
export function fallbackEnv(settingsJson: string): Record<string, string> | null {
  try {
    const env = (JSON.parse(settingsJson) as { env?: Record<string, unknown> }).env ?? {};
    if (typeof env.ANTHROPIC_BASE_URL !== "string" || typeof env.ANTHROPIC_AUTH_TOKEN !== "string") return null;
    return Object.fromEntries(Object.entries(env).filter((e): e is [string, string] => typeof e[1] === "string"));
  } catch {
    return null;
  }
}

/** Read fresh each time, so setting the profile up later needs no worker restart. */
export function loadFallbackEnv(path = join(homedir(), ".claude", "profiles", "free", "settings.json")): Record<string, string> | null {
  try {
    return fallbackEnv(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}
