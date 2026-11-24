import { z } from "zod";

/** Days until a card returns, by Leitner box (0 = just learned or forgotten, 6 = well known). */
export const INTERVAL_DAYS = [1, 2, 4, 7, 14, 30, 60] as const;
const LAST_BOX = INTERVAL_DAYS.length - 1;

export type Grade = "forgot" | "got_it" | "easy";
export const GRADES: Grade[] = ["forgot", "got_it", "easy"];

/** Next box and due date for a card after the user grades their recall. */
export function schedule(box: number, grade: Grade, now = new Date()): { box: number; due_at: Date } {
  const next = grade === "forgot" ? 0 : Math.min(box + (grade === "easy" ? 2 : 1), LAST_BOX);
  return { box: next, due_at: new Date(now.getTime() + INTERVAL_DAYS[next] * 86_400_000) };
}

/** Recall cards the worker asks Claude to write for each save. */
export const CardsSchema = z.object({
  cards: z
    .array(
      z.object({
        question: z.string().min(3).max(500).describe("Tests an idea, step or reason, not trivia like the creator's name"),
        answer: z.string().min(1).max(1500).describe("One to three sentences"),
      }),
    )
    .max(5),
});

export const cardsJsonSchema = () => z.toJSONSchema(CardsSchema, { target: "draft-7" });
