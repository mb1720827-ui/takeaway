import { describe, expect, it } from "vitest";
import { cardsJsonSchema, INTERVAL_DAYS, schedule } from "./recall";

const now = new Date("2026-11-25T08:00:00Z");
const days = (d: Date) => Math.round((d.getTime() - now.getTime()) / 86_400_000);

describe("schedule (Leitner boxes)", () => {
  it("moves up one box and waits longer each time on 'got it'", () => {
    expect(schedule(0, "got_it", now)).toMatchObject({ box: 1 });
    expect(days(schedule(0, "got_it", now).due_at)).toBe(INTERVAL_DAYS[1]);
    expect(days(schedule(3, "got_it", now).due_at)).toBe(INTERVAL_DAYS[4]);
  });

  it("jumps two boxes on 'easy'", () => {
    expect(schedule(1, "easy", now).box).toBe(3);
  });

  it("goes back to the start on 'forgot', due again tomorrow", () => {
    const next = schedule(5, "forgot", now);
    expect(next.box).toBe(0);
    expect(days(next.due_at)).toBe(1);
  });

  it("never goes past the last box", () => {
    expect(schedule(6, "easy", now).box).toBe(6);
    expect(days(schedule(6, "got_it", now).due_at)).toBe(INTERVAL_DAYS[6]);
  });

  it("uses growing intervals", () => {
    expect(INTERVAL_DAYS).toEqual([1, 2, 4, 7, 14, 30, 60]);
  });
});

describe("cards schema", () => {
  it("is a draft-07 JSON Schema with a cards array", () => {
    const schema = cardsJsonSchema() as { $schema: string; required: string[] };
    expect(schema.$schema).toContain("draft-07");
    expect(schema.required).toEqual(["cards"]);
  });
});
