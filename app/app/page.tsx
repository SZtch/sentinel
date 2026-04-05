'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'

type Lang = 'id' | 'en'
type Answer = 'yes' | 'no'

const STATIC = {
  id: {
    yes: 'ya', no: 'tidak',
    sub: 'jawab dengan jujur',
    back: '← kembali',
    retry: '↺ pertanyaan lain',
    streak: 'hari',
    thisWeek: 'minggu ini',
    switchTo: 'en',
  },
  en: {
    yes: 'yes', no: 'no',
    sub: 'answer honestly',
    back: '← go back',
    retry: '↺ new question',
    streak: 'days',
    thisWeek: 'this week',
    switchTo: 'id',
  },
}

const FALLBACK_QUESTIONS = {
  id: ['apakah kamu bahagia?', 'apa yang kamu rasakan hari ini?', 'apakah kamu merasa cukup?', 'masih adakah yang memberatkanmu?'],
  en: ['are you happy?', 'how are you, really?', 'are you at peace today?', 'what are you carrying right now?'],
}

const FALLBACK_RESPONSES = {
  yes: {
    id: ['bagus.', 'pegang itu baik-baik.', 'kebahagiaan sedang bersamamu sekarang.'],
    en: ['good.', 'hold onto it.', 'happiness is with you right now.'],
  },
  no: {
    id: ['tidak apa-apa.', 'cukup ada di sini.', 'itu sudah berani.'],
    en: ["that's okay.", 'just being here is already brave.'],
  },
}

type JournalData = {
  streak: number
  journal: { week: string; content: string; sessionCount: number } | null
}

function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'id'
  const l = navigator.language || ''
  return l.startsWith('id') ? 'id' : 'en'
}

function getTimeContext(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 9)   return 'early morning'
  if (h >= 9 && h < 12)  return 'morning'
  if (h >= 12 && h < 15) return 'afternoon'
  if (h >= 15 && h < 18) return 'late afternoon'
  if (h >= 18 && h < 21) return 'evening'
  return 'night'
}

export default function Home() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') window.location.href = '/'
  }, [status])

  if (status === 'loading' || !session) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0d0b0a', color: 'rgba(200,180,160,0.35)', fontStyle: 'italic', fontSize: '13px',
        letterSpacing: '0.1em',
      }}>
        ...
      </div>
    )
  }

  return <AppContent session={session} />
}

function AppContent({ session }: { session: NonNullable<ReturnType<typeof useSession>['data']> }) {
  const [lang, setLang] = useState<Lang>('id')
  const [question, setQuestion] = useState('')
  const [questionLoading, setQuestionLoading] = useState(true)
  const [buttonsDisabled, setButtonsDisabled] = useState(true)
  const [hoverSide, setHoverSide] = useState<'yes' | 'no' | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [resultActive, setResultActive] = useState(false)
  const [answerType, setAnswerType] = useState<Answer>('yes')
  const [resultLines, setResultLines] = useState<string[]>([])
  const [resultLoading, setResultLoading] = useState(false)
  const [agentStatus, setAgentStatus] = useState<'idle' | 'connected' | 'error'>('idle')
  const [journalData, setJournalData] = useState<JournalData>({ streak: 0, journal: null })
  const [showJournal, setShowJournal] = useState(false)

  const currentQuestion = useRef('')
  const currentResponse = useRef('')
  const particlesEl = useRef<HTMLDivElement>(null)
  const pInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const langRef = useRef(lang)
  langRef.current = lang

  useEffect(() => {
    setLang(detectLang())
  }, [])

  useEffect(() => {
    fetch('/api/journal').then(r => r.json()).then(setJournalData).catch(() => {})
  }, [])

  const saveSession = useCallback(async (question: string, answer: Answer, response: string, lang: Lang) => {
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, response, lang }),
      })
      const res = await fetch('/api/journal')
      setJournalData(await res.json())
    } catch {}
  }, [])

  const callAgent = useCallback(async (text: string): Promise<string> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, userName: 'User' }),
    })
    if (!res.ok) throw new Error(`Agent ${res.status}`)
    const data = await res.json()
    if (Array.isArray(data)) return data.map((d: { text?: string }) => d.text || '').filter(Boolean).join('\n').trim()
    return ((data as { text?: string }).text || '').trim()
  }, [])

  const generateQuestion = useCallback(async (l?: Lang) => {
    const activeLang = l ?? langRef.current
    setQuestion('')
    setQuestionLoading(true)
    setButtonsDisabled(true)
    setShowJournal(false)
    currentQuestion.current = ''

    const time = getTimeContext()
    const prompt = activeLang === 'id'
      ? `[MODE:PERTANYAAN] Waktu: ${time}. Hasilkan SATU pertanyaan introspektif singkat (maks 8 kata) dalam bahasa Indonesia. Tema: kebahagiaan, kehadiran, kesendirian, kedamaian batin. Sesuaikan tone dengan waktu. Hanya pertanyaan saja, tanpa tanda kutip.`
      : `[MODE:QUESTION] Time of day: ${time}. Generate ONE short introspective question (max 8 words). Themes: happiness, presence, loneliness, inner peace. Adjust tone to time. Just the question, no quotes.`

    try {
      let q = await callAgent(prompt)
      q = q.replace(/^["""']|["""']$/g, '').trim()
      if (!q.endsWith('?')) q += '?'
      currentQuestion.current = q
      setQuestion(q)
      setAgentStatus('connected')
    } catch {
      setAgentStatus('error')
      const fallbacks = FALLBACK_QUESTIONS[activeLang]
      const q = fallbacks[Math.floor(Math.random() * fallbacks.length)]
      currentQuestion.current = q
      setQuestion(q)
    } finally {
      setQuestionLoading(false)
      setButtonsDisabled(false)
    }
  }, [callAgent])

  const generateResponse = useCallback(async (type: Answer) => {
    const activeLang = langRef.current
    const time = getTimeContext()
    setResultLoading(true)
    setResultLines([])
    currentResponse.current = ''

    const prompt = activeLang === 'id'
      ? `[MODE:RESPONS] Waktu: ${time}. Pertanyaan: "${currentQuestion.current}" | Jawaban: ${type === 'yes' ? 'YA' : 'TIDAK'}. Tulis respons empatik singkat (2-4 baris). Gaya: puitis, hangat, sesuai waktu ${time}. Tiap baris dipisah newline.`
      : `[MODE:RESPONSE] Time: ${time}. Question: "${currentQuestion.current}" | Answer: ${type === 'yes' ? 'YES' : 'NO'}. Write a short empathetic response (2-4 lines). Style: poetic, warm, fitting for ${time}. Each line separated by newline.`

    try {
      const text = await callAgent(prompt)
      const lines = text.split('\n').filter(l => l.trim())
      const finalLines = lines.length ? lines : FALLBACK_RESPONSES[type][activeLang]
      currentResponse.current = finalLines.join('\n')
      setResultLines(finalLines)
    } catch {
      const fallback = FALLBACK_RESPONSES[type][activeLang]
      currentResponse.current = fallback.join('\n')
      setResultLines(fallback)
    } finally {
      saveSession(currentQuestion.current, type, currentResponse.current, activeLang)
      setResultLoading(false)
      setTimeout(() => setShowJournal(true), 2000)
    }
  }, [callAgent, saveSession])

  const handleAnswer = useCallback(async (type: Answer) => {
    if (buttonsDisabled) return
    stopParticles()
    setHoverSide(null)
    setAnswerType(type)
    setShowResult(true)
    setResultActive(false)
    setTimeout(() => setResultActive(true), 80)
    if (type === 'yes') startParticles('yes', 3)
    else startParticles('no', 1)
    await generateResponse(type)
  }, [generateResponse, buttonsDisabled])

  const goBack = useCallback(() => {
    setResultActive(false)
    setShowJournal(false)
    stopParticles()
    setTimeout(() => {
      setShowResult(false)
      generateQuestion()
    }, 800)
  }, [generateQuestion])

  const switchLang = useCallback(() => {
    const next: Lang = langRef.current === 'id' ? 'en' : 'id'
    setLang(next)
    generateQuestion(next)
  }, [generateQuestion])

  function stopParticles() {
    if (pInterval.current) { clearInterval(pInterval.current); pInterval.current = null }
  }

  function spawnParticle(type: Answer) {
    if (!particlesEl.current) return
    const p = document.createElement('div')
    p.className = 'particle'
    const size = Math.random() * 4 + 1
    const dur  = Math.random() * 3 + 2
    const dl   = Math.random() * 0.4
    const warm = type === 'yes'
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;bottom:${Math.random()*30}%;` +
      `background:${warm
        ? `rgba(232,${140+(Math.random()*40|0)},${30+(Math.random()*40|0)},${.4+Math.random()*.4})`
        : `rgba(${60+(Math.random()*40|0)},${100+(Math.random()*40|0)},${140+(Math.random()*30|0)},${.3+Math.random()*.3})`};` +
      `animation-duration:${dur}s;animation-delay:${dl}s;`
    particlesEl.current.appendChild(p)
    setTimeout(() => p.remove(), (dur + dl) * 1000)
  }

  function startParticles(type: Answer, n = 2) {
    stopParticles()
    for (let i = 0; i < 6; i++) spawnParticle(type)
    pInterval.current = setInterval(() => { for (let i = 0; i < n; i++) spawnParticle(type) }, 150)
  }

  useEffect(() => { generateQuestion(); return () => stopParticles() }, [])  // eslint-disable-line

  const s = STATIC[lang]

  return (
    <>
      <div ref={particlesEl} className="particles" />

      {/* split-screen interaction zones — entire screen is clickable */}
      <div
        className="split-screen"
        style={{ opacity: showResult ? 0 : 1, pointerEvents: showResult ? 'none' : 'all' }}
      >
        <div
          className={`split-half yes-half${hoverSide === 'yes' ? ' active' : ''}`}
          onMouseEnter={() => { if (!buttonsDisabled) { setHoverSide('yes'); startParticles('yes', 2) } }}
          onMouseLeave={() => { setHoverSide(null); stopParticles() }}
          onClick={() => handleAnswer('yes')}
        >
          <span className="split-label">{s.yes}</span>
        </div>

        <div className="split-divider" />

        <div
          className={`split-half no-half${hoverSide === 'no' ? ' active' : ''}`}
          onMouseEnter={() => { if (!buttonsDisabled) { setHoverSide('no'); startParticles('no', 1) } }}
          onMouseLeave={() => { setHoverSide(null); stopParticles() }}
          onClick={() => handleAnswer('no')}
        >
          <span className="split-label">{s.no}</span>
        </div>
      </div>

      {/* question floats centered above the zones */}
      <div
        className="question-float"
        style={{ opacity: showResult ? 0 : 1, pointerEvents: 'none' }}
      >
        <div className="breathe-line" />
        <div className="question-wrap">
          {questionLoading ? (
            <div className="question-loading">
              <div className="dot" /><div className="dot" /><div className="dot" />
            </div>
          ) : (
            <>
              <h1 className={`question${hoverSide === 'yes' ? ' warm' : hoverSide === 'no' ? ' cool' : ''}`}>
                {question}
              </h1>
              <div
                className="retry-hint"
                style={{ pointerEvents: 'all' }}
                onClick={() => generateQuestion()}
              >
                {s.retry}
              </div>
            </>
          )}
        </div>
        <p className="sub-question">{s.sub}</p>
      </div>

      {/* result overlay — stripped down */}
      {showResult && (
        <div className={`result${resultActive ? ' active' : ''} ${answerType}-result`}>
          {/* only indicator of which answer: a thin accent bar */}
          <div className="result-accent-bar" />

          {answerType === 'yes' ? (
            <><div className="glow-ring r1" /><div className="glow-ring r2" /><div className="glow-ring r3" /></>
          ) : (
            <div className="static-line" />
          )}

          <div className="result-body">
            {resultLoading ? (
              <div className="question-loading">
                <div className="dot" /><div className="dot" /><div className="dot" />
              </div>
            ) : (
              resultLines.map((line, i) => (
                <span
                  key={`${line}-${i}`}
                  style={{ display: 'block', opacity: 0, animation: `fadeIn 0.8s ${i * 0.45}s ease both` }}
                >
                  {line}
                </span>
              ))
            )}
          </div>

          {!resultLoading && showJournal && journalData.journal && (
            <div className="journal-block" style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              maxWidth: 'min(460px, 88vw)',
              width: '100%',
            }}>
              <p style={{
                fontSize: '9px', letterSpacing: '0.2em',
                color: 'rgba(180,150,120,0.35)', marginBottom: '12px',
                textTransform: 'uppercase',
              }}>
                {s.thisWeek}
              </p>
              {journalData.journal.content.split('\n').map((line, i) => (
                <span key={i} style={{
                  display: 'block', fontSize: '13px',
                  color: 'rgba(210,190,168,0.55)', fontStyle: 'italic',
                  lineHeight: 1.9, opacity: 0,
                  animation: `fadeIn 0.7s ${0.3 + i * 0.3}s ease both`,
                }}>
                  {line}
                </span>
              ))}
            </div>
          )}

          <button className="back-btn" onClick={goBack}>{s.back}</button>
        </div>
      )}

      {/* status dot */}
      <div className={`status-dot${agentStatus !== 'idle' ? ` ${agentStatus}` : ''}`}>
        <div className="dot-live" />
        <span>aya · nosana</span>
      </div>

      {/* user info — top left */}
      <div className="user-info">
        <span className="user-name">{session.user?.name?.split(' ')[0]}</span>
        <span className="info-sep">·</span>
        <button className="ghost-btn" onClick={() => signOut({ callbackUrl: '/' })}>sign out</button>
      </div>

      {/* streak — only after 7 days */}
      {journalData.streak >= 7 && (
        <div className="streak-display">
          {journalData.streak} {s.streak}
        </div>
      )}

      {/* lang switcher — whisper text, bottom left */}
      <button className="lang-switch" onClick={switchLang}>
        {s.switchTo}
      </button>

      {/* nosana badge */}
      <a className="nosana-badge" href="https://nosana.com" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" strokeWidth="1" />
          <path d="M12 3v18M3 12h18" strokeWidth="1" />
        </svg>
        <span>nosana</span>
      </a>
    </>
  )
}
