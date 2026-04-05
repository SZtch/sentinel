import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createHash } from 'crypto'

const AGENT_URL = process.env.ELIZA_API_URL || 'http://localhost:3001'
const AGENT_ID  = process.env.ELIZA_AGENT_ID  || '30c8adf3-1590-0456-aed5-9c78c439c205'

// In-memory session cache per userId
const sessionCache = new Map<string, { sessionId: string; expiresAt: number }>()

// Convert Google user ID (non-UUID) to deterministic UUID format
function toUUID(str: string): string {
  const hash = createHash('md5').update(str).digest('hex')
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`
}

async function getOrCreateSession(userId: string): Promise<string> {
  const cached = sessionCache.get(userId)
  const now = Date.now()

  // Reuse cached session if still valid (5 min buffer before expiry)
  if (cached && cached.expiresAt > now + 5 * 60 * 1000) {
    return cached.sessionId
  }

  const res = await fetch(`${AGENT_URL}/api/messaging/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId: AGENT_ID, userId: toUUID(userId) }),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) throw new Error(`Session create failed: ${res.status}`)
  const data = await res.json()

  sessionCache.set(userId, {
    sessionId: data.sessionId,
    expiresAt: new Date(data.expiresAt).getTime(),
  })

  return data.sessionId
}

async function pollForReply(sessionId: string, sentAt: number, maxWait = 15000): Promise<string | null> {
  const deadline = Date.now() + maxWait

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 1200))

    const res = await fetch(`${AGENT_URL}/api/messaging/sessions/${sessionId}/messages`)
    if (!res.ok) continue

    const data = await res.json()
    const agentMsgs = (data.messages || []).filter(
      (m: { isAgent: boolean; createdAt: string; content: string }) =>
        m.isAgent && new Date(m.createdAt).getTime() > sentAt
    )

    if (agentMsgs.length > 0) {
      return agentMsgs[agentMsgs.length - 1].content
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { text?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const sessionId = await getOrCreateSession(session.user.id)
    const sentAt = Date.now()

    const msgRes = await fetch(`${AGENT_URL}/api/messaging/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: body.text }),
      signal: AbortSignal.timeout(10000),
    })

    if (!msgRes.ok) {
      // Session might have expired — clear cache
      sessionCache.delete(session.user.id)
      const txt = await msgRes.text().catch(() => '')
      return Response.json({ error: `Session error ${msgRes.status}`, detail: txt }, { status: msgRes.status })
    }

    const reply = await pollForReply(sessionId, sentAt)

    if (!reply) {
      return Response.json({ error: 'Agent did not respond in time' }, { status: 504 })
    }

    return Response.json([{ text: reply }])
  } catch (err) {
    console.error('[/api/chat] Error:', err)
    return Response.json({ error: 'Agent unreachable' }, { status: 503 })
  }
}

export async function GET() {
  try {
    const res = await fetch(`${AGENT_URL}/api/server/health`)
    const status = res.ok ? 'connected' : 'degraded'
    return Response.json({ status, agentUrl: AGENT_URL, agentId: AGENT_ID })
  } catch {
    return Response.json({ status: 'offline', agentUrl: AGENT_URL, agentId: AGENT_ID }, { status: 503 })
  }
}

