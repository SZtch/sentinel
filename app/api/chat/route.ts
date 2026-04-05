import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const AGENT_URL = process.env.ELIZA_API_URL || 'http://localhost:3001'
const AGENT_ID  = process.env.ELIZA_AGENT_ID  || 'aya'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Inject authenticated userId so ElizaOS plugin uses correct storage
  const enrichedBody = {
    ...(body as object),
    userId: session.user.id,
    roomId: `room-${session.user.id}`,
  }

  try {
    const agentRes = await fetch(`${AGENT_URL}/${AGENT_ID}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichedBody),
      signal: AbortSignal.timeout(15000),
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

export async function GET() {
  try {
    const res = await fetch(`${AGENT_URL}/health`, { method: 'GET' })
    const status = res.ok ? 'connected' : 'degraded'
    return Response.json({ status, agentUrl: AGENT_URL, agentId: AGENT_ID })
  } catch {
    return Response.json({ status: 'offline', agentUrl: AGENT_URL, agentId: AGENT_ID }, { status: 503 })
  }
}
