import {
  getSessions,
  getEmotionalTrend,
  getStreak,
  getDaysSinceLastSession,
} from "../lib/storage.js";

export const emotionalMemoryProvider = {
  name: "EMOTIONAL_MEMORY",

  get: async (_runtime: unknown, _message: unknown, _state: unknown): Promise<{ text: string }> => {
    // Extract userId from ElizaOS message — injected by Next.js /api/chat
    const message = _message as { userId?: string };
    const userId = message?.userId || "default";

    const sessions = getSessions(14, userId);

    if (sessions.length === 0) {
      return { text: "EMOTIONAL HISTORY: No previous sessions. This is a fresh start for this user." };
    }

    const trend = getEmotionalTrend(sessions);
    const streak = getStreak(sessions);
    const daysSince = getDaysSinceLastSession(sessions);
    const recent = sessions.slice(-7);

    // Detect active language from the mode prefix in the current message.
    // [MODE:PERTANYAAN], [MODE:RESPONS], [MODE:CURHAT] → Indonesian
    // [MODE:QUESTION], [MODE:RESPONSE], [MODE:CHAT] → English
    // Falls back to last session's lang if no prefix found.
    const messageText = (_message as { content?: { text?: string } })?.content?.text ?? "";
    const idPrefixes = ["[MODE:PERTANYAAN]", "[MODE:RESPONS]", "[MODE:CURHAT]"];
    const activeLang = idPrefixes.some(p => messageText.toUpperCase().includes(p.toUpperCase()))
      ? "id"
      : messageText.includes("[MODE:")
        ? "en"
        : (sessions[sessions.length - 1]?.lang ?? "en");

    const langNote = activeLang === "id"
      ? "LANGUAGE: User is currently in Indonesian mode. All your responses MUST be in Bahasa Indonesia."
      : "LANGUAGE: User is currently in English mode. All your responses MUST be in English.";

    const historyLines = recent
      .map((s) => `- ${s.date} [${s.lang}]: "${s.question}" → ${s.answer}`)
      .join("\n");

    const trendNote = {
      declining:
        "TREND: DECLINING — User has been answering 'no' more often. Be extra gentle. Ask shorter questions (max 5 words). Be grounding, not exploratory.",
      stable:
        "TREND: STABLE — Mixed responses. Maintain warmth. Normal question depth.",
      positive:
        "TREND: POSITIVE — User has been feeling good. You can explore deeper feelings with slightly more curious questions.",
    }[trend];

    const absenceNote =
      daysSince !== null && daysSince >= 2
        ? `\nABSENCE: User has been away for ${daysSince} days. If it feels natural, gently acknowledge their return — once, briefly.`
        : "";

    const streakNote =
      streak >= 5
        ? `\nSTREAK: ${streak} days in a row. This user is showing up consistently. You may honor that silently through the warmth of your tone.`
        : "";

    const text = `EMOTIONAL HISTORY (last ${recent.length} sessions):
${historyLines}

${trendNote}${absenceNote}${streakNote}

${langNote}

Use this context to shape your tone and questions. Do not reference "trend", "history", or "data" explicitly to the user. Just let it inform how you show up.`;

    return { text };
  },
};
