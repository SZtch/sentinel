import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessions, getLatestJournal, getStreak } from "../../../lib/storage";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const sessions = getSessions(30, userId);
    const streak = getStreak(sessions);
    const journal = getLatestJournal(userId);

    return Response.json({
      streak,
      journal: journal
        ? { week: journal.week, content: journal.content, sessionCount: journal.sessionCount }
        : null,
    });
  } catch {
    return Response.json({ streak: 0, journal: null });
  }
}
