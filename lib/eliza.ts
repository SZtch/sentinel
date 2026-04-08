const AGENT_URL = process.env.ELIZA_API_URL || 'http://localhost:3001'
const AGENT_ID  = process.env.ELIZA_AGENT_ID  || '30c8adf3-1590-0456-aed5-9c78c439c205'

const sessionCache = new Map<string, { sessionId: string; expiresAt: number }>()

export async function getOrCreateElizaSession(userId: string): Promise<string> {
  const cached = sessionCache.get(userId)
  const now = Date.now()

  if (cached && cached.expiresAt > now + 5 * 60 * 1000) return cached.sessionId

  const res = await fetch(`${AGENT_URL}/api/messaging/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId: AGENT_ID, userId }),
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) throw new Error(`Eliza session create failed: ${res.status}`)
  const data = await res.json()

  // DEBUG: lihat struktur response session
  console.log('[eliza] session create response:', JSON.stringify(data))

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
  maxWait = 25000
): Promise<string | null> {
  const deadline = Date.now() + maxWait

  while (Date.now() < deadline) {
    try {
      const res = await fetch(
        `${AGENT_URL}/api/messaging/sessions/${sessionId}/messages`,
        { signal: AbortSignal.timeout(5000) }
      )

      if (res.ok) {
        const data = await res.json()
        // DEBUG: lihat struktur response messages
        console.log('[eliza] poll response:', JSON.stringify(data))

        const agentMsgs = (data.messages || []).filter(
          (m: { isAgent: boolean; createdAt: string; content: string | { text?: string } }) =>
            m.isAgent && new Date(m.createdAt).getTime() > sentAt
        )

        if (agentMsgs.length > 0) {
          const raw = agentMsgs[agentMsgs.length - 1].content
          return typeof raw === 'string' ? raw : (raw as { text?: string })?.text ?? ''
        }
      } else {
        // DEBUG: lihat kalau response tidak ok
        console.log('[eliza] poll failed, status:', res.status, 'sessionId:', sessionId)
      }
    } catch (e) {
      console.log('[eliza] poll error:', e)
    }

    if (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 1200))
    }
  }

  return null
}

export async function sendMessageFireAndForget(
  userId: string,
  text: string,
  sessionSuffix = ''
): Promise<void> {
  const sessionId = await getOrCreateElizaSession(userId + sessionSuffix)

  const res = await fetch(`${AGENT_URL}/api/messaging/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text }),
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) invalidateElizaSession(userId + sessionSuffix)
}

export { AGENT_URL, AGENT_ID }
