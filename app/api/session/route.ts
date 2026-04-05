import { NextRequest } from "next/server";
import { resolveUserId } from "@/lib/auth";
import { sendMessageFireAndForget } from "@/lib/eliza";
import {
  addSession,
  getSessions,
  getCurrentWeek,
  type Session,
} from "../../../lib/storage";

async function triggerJournalViaEliza(userId: string): Promise<void> {
  const sessions = getSessions(7, userId);
  if (sessions.length < 2) return;

  const summary = sessions
    .map((s) => `${s.date}: "${s.question}" → ${s.answer}`)
    .join("\n");

  // writeJournalAction in the plugin intercepts [MODE:JOURNAL],
  // generates content via ElizaOS runtime (Qwen on Nosana), and saves to storage.
  await sendMessageFireAndForget(
    userId,
    `[MODE:JOURNAL] Sessions:\n${summary}`
  );
}

export async function POST(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { question, answer, response, lang } = body;

    if (!question || !answer || !lang) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!["yes", "no"].includes(answer)) {
      return Response.json({ error: "Invalid answer" }, { status: 400 });
    }

    if (!["id", "en"].includes(lang)) {
      return Response.json({ error: "Invalid lang" }, { status: 400 });
    }

    const userSession: Session = {
      id: Math.random().toString(36).slice(2, 10),
      date: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
      question,
      answer,
      response: response || "",
      lang,
    };

    addSession(userSession, userId);

    // Fire-and-forget: journal generation now goes through Eliza
    triggerJournalViaEliza(userId).catch(() => {});

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Failed to save session" }, { status: 500 });
  }
}
