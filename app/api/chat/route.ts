import { NextRequest } from 'next/server'
import { resolveUserId } from '@/lib/auth'
import {
  getOrCreateElizaSession,
  invalidateElizaSession,
  pollForReply,
  AGENT_URL,
  AGENT_ID,
} from '@/lib/eliza'

export async function POST(req: NextRequest) {
  const userId = await resolveUserId(req)
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { text?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.text?.trim()) {
    return Response.json({ error: 'Message text is required' }, { status: 400 })
  }

  try {
    const sessionId = await getOrCreateElizaSession(userId)
    const sentAt = Date.now()

    const msgRes = await fetch(`${AGENT_URL}/api/messaging/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: body.text }),
      signal: AbortSignal.timeout(10000),
    })

    if (!msgRes.ok) {
      invalidateElizaSession(userId)
      const txt = await msgRes.text().catch(() => '')
      return Response.json({ error: `Session error ${msgRes.status}`, detail: txt }, { status: msgRes.status })
    }

    const reply = await pollForReply(sessionId, sentAt)

    if (reply === null) {
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
