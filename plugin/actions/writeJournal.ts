import {
  getSessions,
  addJournalEntry,
  getCurrentWeek,
} from "../lib/storage.js";

const OPENAI_API_URL = process.env.OPENAI_API_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "nosana";
const MODEL_NAME = process.env.MODEL_NAME || "Qwen/Qwen3.5-27B-AWQ-4bit";

async function generateJournalContent(sessionSummary: string): Promise<string | null> {
  if (!OPENAI_API_URL) return null;

  const prompt = `Based on this week's emotional check-ins, write a quiet poetic reflection in 3-4 lines.\nStyle: lowercase, warm, honest, no advice — just witness what the week held.\nDo not use quotes, lists, or greetings. Return only the reflection itself.\n\nSessions:\n${sessionSummary}`;

  try {
    const res = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.85,
        max_tokens: 150,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export const writeJournalAction = {
  name: "WRITE_JOURNAL",
  description: "Autonomously generate and save a weekly emotional journal entry from recent sessions.",
  similes: ["JOURNAL", "SAVE_JOURNAL", "REFLECT", "WEEKLY_SUMMARY"],

  validate: async (_runtime: unknown, message: { content?: { text?: string } }): Promise<boolean> => {
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
    // Extract userId injected by Next.js /api/chat route
    const message = _message as { userId?: string };
    const userId = message?.userId || "default";

    const sessions = getSessions(7, userId);

    if (sessions.length < 2) {
      if (callback) await callback({ text: "" });
      return;
    }

    const week = getCurrentWeek();
    const summary = sessions
      .map(s => `${s.date}: "${s.question}" → ${s.answer}`)
      .join("\n");

    const content = await generateJournalContent(summary);

    if (content) {
      addJournalEntry(
        {
          week,
          content,
          generatedAt: Date.now(),
          sessionCount: sessions.length,
        },
        userId
      );
    }

    if (callback) await callback({ text: "" });
    return;
  },

  examples: [],
};
