import { generateText, ModelClass, type IAgentRuntime } from "@elizaos/core";
import {
  getSessions,
  addJournalEntry,
  getCurrentWeek,
} from "../lib/storage.js";

export const writeJournalAction = {
  name: "WRITE_JOURNAL",
  description:
    "Autonomously generate and save a weekly emotional journal entry from recent sessions.",
  similes: ["JOURNAL", "SAVE_JOURNAL", "REFLECT", "WEEKLY_SUMMARY"],

  validate: async (
    _runtime: unknown,
    message: { content?: { text?: string } }
  ): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    return text.includes("[mode:journal]");
  },

  handler: async (
    _runtime: unknown,
    _message: unknown,
    _state: unknown,
    _options: unknown,
    callback?: Function
  ): Promise<void> => {
    const message = _message as { userId?: string };
    const userId = message?.userId || "default";

    const sessions = getSessions(7, userId);

    if (sessions.length < 2) {
      if (callback) await callback({ text: "" });
      return;
    }

    const week = getCurrentWeek();
    const summary = sessions
      .map((s) => `${s.date}: "${s.question}" → ${s.answer}`)
      .join("\n");

    const prompt = `Based on this week's emotional check-ins, write a quiet poetic reflection in 3-4 lines.
Style: lowercase, warm, honest, no advice — just witness what the week held.
Do not use quotes, lists, or greetings. Return only the reflection itself.

Sessions:
${summary}`;

    try {
      // Generate via ElizaOS runtime — routes through the configured model (Qwen on Nosana)
      const content = await generateText({
        runtime: _runtime as IAgentRuntime,
        context: prompt,
        modelClass: ModelClass.SMALL,
      });

      if (content?.trim()) {
        addJournalEntry(
          {
            week,
            content: content.trim(),
            generatedAt: Date.now(),
            sessionCount: sessions.length,
          },
          userId
        );
      }
    } catch {
      // silently fail — journal is non-critical
    }

    if (callback) await callback({ text: "" });
  },

  examples: [],
};
