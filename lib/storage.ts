import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export type Session = {
  id: string;
  date: string;
  timestamp: number;
  question: string;
  answer: "yes" | "no";
  response: string;
  lang: "id" | "en";
};

export type JournalEntry = {
  week: string;
  content: string;
  generatedAt: number;
  sessionCount: number;
};

type StorageData = { sessions: Session[]; journal: JournalEntry[] };

const DATA_DIR = join(process.cwd(), "data");

function userFile(userId: string): string {
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  return join(DATA_DIR, `${safe}.json`);
}

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function load(userId: string): StorageData {
  ensureDir();
  const file = userFile(userId);
  if (!existsSync(file)) return { sessions: [], journal: [] };
  try {
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    return { sessions: [], journal: [] };
  }
}

function save(userId: string, data: StorageData) {
  ensureDir();
  const file = userFile(userId);
  const tmp = file + ".tmp";
  writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  renameSync(tmp, file);
}

export function addSession(session: Session, userId: string) {
  const data = load(userId);
  data.sessions.push(session);
  save(userId, data);
}

export function getSessions(limit = 30, userId: string): Session[] {
  return load(userId).sessions.slice(-limit);
}

export function getLatestJournal(userId: string): JournalEntry | null {
  const entries = load(userId).journal;
  return entries.length ? entries[entries.length - 1] : null;
}

export function addJournalEntry(entry: JournalEntry, userId: string) {
  const data = load(userId);
  const idx = data.journal.findIndex((j) => j.week === entry.week);
  if (idx >= 0) data.journal[idx] = entry;
  else data.journal.push(entry);
  save(userId, data);
}

export function getStreak(sessions: Session[]): number {
  if (!sessions.length) return 0;
  const uniqueDates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
  const now = new Date();
  let streak = 0;
  for (let i = 0; i < uniqueDates.length; i++) {
    const expected = new Date(now);
    expected.setDate(now.getDate() - i);
    if (uniqueDates[i] === expected.toISOString().split("T")[0]) streak++;
    else break;
  }
  return streak;
}

export function getCurrentWeek(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
