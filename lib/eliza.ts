const AGENT_URL = process.env.ELIZA_API_URL || 'http://localhost:3001'
const AGENT_ID  = process.env.ELIZA_AGENT_ID  || '30c8adf3-1590-0456-aed5-9c78c439c205'

// Shared session cache — imported by both chat and session routes
// so the same user always uses the same Eliza session context
const sessionCache = new Map<string, { sessionId: string; expiresAt: number }>()

export async function getOrCreateElizaSession(userId: string): Promise<string> {
  const cached = sessionCache.get(userId)
  const now = Date.now()

  if (cached && cached.expiresAt > now + 5 * 60 * 1000) return cached.sessionId

  const res = await fetch(`${AGENT_URL}/api/messaging/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId: AGENT_ID, userId }),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) throw new Error(`Eliza session create failed: ${res.status}`)
  const data = await res.json()

  sessionCache.set(userId, {
    sessionId: data.sessionId,
    expiresAt: data.expiresAt
      ? new Date(data.expiresAt).getTime()
      : Date.now() + 60 * 60 * 1000,
  })

  return data.sessionId
}

export function invalidateElizaSession(userId: string) {
  sessionCache.delete(userId)
}

export async function pollForReply(
  sessionId: string,
  sentAt: number,
  maxWait = 15000
): Promise<string | null> {
  const deadline = Date.now() + maxWait

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 1200))

    const res = await fetch(`${AGENT_URL}/api/messaging/sessions/${sessionId}/messages`)
    if (!res.ok) continue

    const data = await res.json()
    const agentMsgs = (data.messages || []).filter(
      (m: { isAgent: boolean; createdAt: string; content: string | { text?: string } }) =>
        m.isAgent && new Date(m.createdAt).getTime() > sentAt
    )

    if (agentMsgs.length > 0) {
      const raw = agentMsgs[agentMsgs.length - 1].content
      return typeof raw === 'string' ? raw : (raw as { text?: string })?.text ?? ''
    }
  }

  return null
}

// Send a message to Eliza without waiting for a reply.
// Used for fire-and-forget triggers like journal generation.
export async function sendMessageFireAndForget(
  userId: string,
  text: string
): Promise<void> {
  const sessionId = await getOrCreateElizaSession(userId)

  const res = await fetch(`${AGENT_URL}/api/messaging/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text }),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) invalidateElizaSession(userId)
}

export { AGENT_URL, AGENT_ID }
