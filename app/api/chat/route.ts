import { NextRequest } from 'next/server'

// ElizaOS agent runs on a separate port inside the container.
// The frontend calls /api/chat which proxies here — no CORS issues,
// and the agent port stays internal (not exposed publicly).
const AGENT_URL = process.env.ELIZA_API_URL || 'http://localhost:3001'
const AGENT_ID  = process.env.ELIZA_AGENT_ID  || 'solace'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const agentRes = await fetch(`${AGENT_URL}/${AGENT_ID}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // timeout: AbortSignal.timeout(15000),  // Node 18+
    })

    if (!agentRes.ok) {
      const text = await agentRes.text().catch(() => '')
      return Response.json(
        { error: `Agent returned ${agentRes.status}`, detail: text },
        { status: agentRes.status },
      )
    }

    const data = await agentRes.json()
    return Response.json(data)
  } catch (err) {
    console.error('[/api/chat] Agent unreachable:', err)
    return Response.json(
      { error: 'Agent unreachable — is ElizaOS running?' },
      { status: 503 },
    )
  }
}

// Health check — useful for Nosana deployment verification
export async function GET() {
  try {
    const res = await fetch(`${AGENT_URL}/health`, { method: 'GET' })
    const status = res.ok ? 'connected' : 'degraded'
    return Response.json({ status, agentUrl: AGENT_URL, agentId: AGENT_ID })
  } catch {
    return Response.json({ status: 'offline', agentUrl: AGENT_URL, agentId: AGENT_ID }, { status: 503 })
  }
}
