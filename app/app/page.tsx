'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'

import { UserBar } from '../../components/UserBar'
import { QuestionCard } from '../../components/QuestionCard'
import { ResponsePanel } from '../../components/ResponsePanel'
import { StatusBanner } from '../../components/StatusBanner'
import { JournalPanel } from '../../components/JournalPanel'
import type { Lang, Answer, JournalData } from '../../components/types'

// ── Constants ────────────────────────────────────────────────
const STATIC = {
  id: {
    yes: 'ya', no: 'tidak',
    sub: 'jawab dengan jujur',
    back: 'kembali',
    retry: 'pertanyaan lain',
    streak: 'hari',
    thisWeek: 'minggu ini',
    switchTo: 'en',
    chatPrompt: 'ingin cerita lebih?',
    chatPlaceholder: 'cerita saja...',
    chatSend: 'kirim',
    chatClose: 'cukup untuk hari ini',
  },
  en: {
    yes: 'yes', no: 'no',
    sub: 'answer honestly',
    back: 'go back',
    retry: 'new question',
    streak: 'days',
    thisWeek: 'this week',
    switchTo: 'id',
    chatPrompt: 'want to talk about it?',
    chatPlaceholder: 'just talk...',
    chatSend: 'send',
    chatClose: "that's enough for today",
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

// ── Helpers ──────────────────────────────────────────────────
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

function LoadingDots() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0c0a09',
      color: 'rgba(168,150,132,0.72)',
      fontStyle: 'italic', fontSize: '13px', letterSpacing: '0.18em',
      animation: 'fadeIn 1s ease both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="dot" />
        <div className="dot" style={{ animationDelay: '0.2s' }} />
        <div className="dot" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────
export default function Home() {
  const { data: session, status } = useSession()
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    if (status !== 'unauthenticated') return
    const hasGuest = document.cookie
      .split(';')
      .some(c => c.trim().startsWith('oneq_guest_id='))
    if (hasGuest) {
      setIsGuest(true)
    } else {
      window.location.href = '/'
    }
  }, [status])

  if (status === 'loading') return <LoadingDots />
  if (status === 'unauthenticated' && !isGuest) return null

  return <AppContent session={session} isGuest={isGuest} />
}

// ── Controller ───────────────────────────────────────────────
function AppContent({
  session,
  isGuest,
}: {
  session: ReturnType<typeof useSession>['data']
  isGuest: boolean
}) {
  // ── State ──────────────────────────────────────────────────
  const [lang, setLang] = useState<Lang>('id')
  const [question, setQuestion] = useState('')
  const [questionLoading, setQuestionLoading] = useState(true)
  const [buttonsDisabled, setButtonsDisabled] = useState(true)
  const [hoverSide, setHoverSide] = useState<Answer | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [resultActive, setResultActive] = useState(false)
  const [answerType, setAnswerType] = useState<Answer>('yes')
  const [resultLines, setResultLines] = useState<string[]>([])
  const [resultLoading, setResultLoading] = useState(false)
  const [agentStatus, setAgentStatus] = useState<'idle' | 'connected' | 'error'>('idle')
  const [journalData, setJournalData] = useState<JournalData>({ streak: 0, journal: null })
  const [journalStatus, setJournalStatus] = useState<'idle' | 'pending' | 'ready' | 'error'>('idle')
  const [journalJustReady, setJournalJustReady] = useState(false)
  const [showJournal, setShowJournal] = useState(false)
  const [showJournalPanel, setShowJournalPanel] = useState(false)
  const [chatMode, setChatMode] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'aya'; text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [showChatPrompt, setShowChatPrompt] = useState(false)
  const [showHint, setShowHint] = useState(false)

  // ── Refs ───────────────────────────────────────────────────
  const chatEndRef = useRef<HTMLDivElement>(null)
  const currentQuestion = useRef('')
  const currentResponse = useRef('')
  const particlesEl = useRef<HTMLDivElement>(null)
  const pInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const langRef = useRef(lang)
  langRef.current = lang

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => { setLang(detectLang()) }, [])
  useEffect(() => {
    fetch('/api/journal').then(r => r.json()).then(setJournalData).catch(() => {})
  }, [])
  useEffect(() => { generateQuestion(); return () => stopParticles() }, []) // eslint-disable-line

  // ── Particle helpers ───────────────────────────────────────
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

  // ── Handlers ───────────────────────────────────────────────
  const saveSession = useCallback(async (question: string, answer: Answer, response: string, lang: Lang) => {
    try {
      const previousGeneratedAt = journalData.journal?.generatedAt ?? null

      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, response, lang }),
      })

      setJournalStatus('pending')

      const tryRefetch = async (): Promise<boolean> => {
        try {
          const r = await fetch('/api/journal')
          const data: JournalData = await r.json()
          const isNew = data.journal?.generatedAt !== undefined
            && data.journal.generatedAt !== previousGeneratedAt
          if (isNew) {
            setJournalData(data)
            setJournalStatus('ready')
            setJournalJustReady(true)
            setTimeout(() => setJournalJustReady(false), 2200)
            return true
          }
          return false
        } catch {
          return false
        }
      }

      await new Promise(r => setTimeout(r, 1800))
      const got1 = await tryRefetch()
      if (got1) return

      await new Promise(r => setTimeout(r, 2500))
      const got2 = await tryRefetch()
      if (!got2) setJournalStatus('error')
    } catch {
      setJournalStatus('error')
    }
  }, [journalData.journal?.generatedAt])

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
      q = q.replace(/^["""]/g, '').replace(/["""]$/g, '').trim()
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
      const hintTimer = setTimeout(() => setShowHint(true), 600)
      return () => clearTimeout(hintTimer)
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
      setTimeout(() => setShowChatPrompt(true), 3500)
    }
  }, [callAgent, saveSession])

  const handleAnswer = useCallback(async (type: Answer) => {
    if (buttonsDisabled) return
    setShowHint(false)
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

  const handleHoverEnter = useCallback((side: Answer) => {
    if (buttonsDisabled) return
    setHoverSide(side)
    startParticles(side, side === 'yes' ? 2 : 1)
  }, [buttonsDisabled])

  const handleHoverLeave = useCallback(() => {
    setHoverSide(null)
    stopParticles()
  }, [])

  const sendChatMessage = useCallback(async () => {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    const activeLang = langRef.current

    setChatMessages(prev => [...prev, { role: 'user', text }])
    setChatInput('')
    setChatLoading(true)

    const modePrefix = activeLang === 'id' ? '[MODE:CURHAT]' : '[MODE:CHAT]'
    const context = currentQuestion.current
      ? `Context — sebelumnya Aya bertanya: "${currentQuestion.current}"`
      : ''
    const prompt = `${modePrefix} ${context}\nUser: ${text}`

    try {
      const reply = await callAgent(prompt)
      setChatMessages(prev => [...prev, { role: 'aya', text: reply }])
    } catch {
      const fallback = activeLang === 'id' ? 'aku di sini.' : "i'm here."
      setChatMessages(prev => [...prev, { role: 'aya', text: fallback }])
    } finally {
      setChatLoading(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [chatInput, chatLoading, callAgent])

  const goBack = useCallback(() => {
    setResultActive(false)
    setShowJournal(false)
    setShowJournalPanel(false)
    setChatMode(false)
    setChatMessages([])
    setChatInput('')
    setShowChatPrompt(false)
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

  // ── Derived ────────────────────────────────────────────────
  const s = STATIC[lang]
  const displayName = isGuest ? 'guest' : session?.user?.name?.split(' ')[0]

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .split-screen { display: none !important; }

          .question-float {
            padding: 0 24px !important;
            padding-top: 72px !important;
            padding-bottom: 32px !important;
            pointer-events: all !important;
            justify-content: center !important;
          }

          .question { font-size: clamp(1.8rem, 8vw, 2.6rem) !important; }

          .breathe-line {
            height: 20px !important;
            margin-bottom: 16px !important;
          }

          .sub-question { margin-top: 8px !important; }
          .retry-hint   { margin-top: 14px !important; }

          .mobile-answer-btns {
            display: flex !important;
            gap: 16px !important;
            margin-top: 36px !important;
            width: 100% !important;
            pointer-events: all !important;
          }

          .mobile-answer-btn {
            flex: 1;
            padding: 14px 0;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(112,100,88,0.25);
            border-radius: 4px;
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 0.78rem;
            letter-spacing: 0.42em;
            text-transform: uppercase;
            color: rgba(112,100,88,0.85);
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            transition: background 0.25s, border-color 0.25s, color 0.25s;
          }

          .mobile-answer-btn.yes-btn:active {
            background: rgba(232,160,74,0.1);
            border-color: rgba(232,160,74,0.5);
            color: rgba(232,160,74,0.95);
          }

          .mobile-answer-btn.no-btn:active {
            background: rgba(91,122,138,0.1);
            border-color: rgba(91,122,138,0.5);
            color: rgba(91,122,138,0.95);
          }

          .mobile-answer-btn:disabled { opacity: 0.35; }

          .status-dot { display: none !important; }

          .result {
            padding: 72px 24px 80px !important;
          }
        }
      `}</style>

      <div ref={particlesEl} className="particles" />

      <QuestionCard
        question={question}
        questionLoading={questionLoading}
        buttonsDisabled={buttonsDisabled}
        hoverSide={hoverSide}
        showHint={showHint}
        showResult={showResult}
        s={s}
        onAnswer={handleAnswer}
        onRetry={() => generateQuestion()}
        onHoverEnter={handleHoverEnter}
        onHoverLeave={handleHoverLeave}
      />

      {showResult && (
        <>
          <ResponsePanel
            answerType={answerType}
            resultActive={resultActive}
            resultLines={resultLines}
            resultLoading={resultLoading}
            chatMode={chatMode}
            chatMessages={chatMessages}
            chatInput={chatInput}
            chatLoading={chatLoading}
            showChatPrompt={showChatPrompt}
            chatEndRef={chatEndRef}
            s={s}
            onBack={goBack}
            onOpenChat={() => setChatMode(true)}
            onCloseChat={() => setChatMode(false)}
            onChatInputChange={setChatInput}
            onSendMessage={sendChatMessage}
          />

          <StatusBanner
            show={showJournal}
            resultLoading={resultLoading}
            journalStatus={journalStatus}
            journalData={journalData}
            journalJustReady={journalJustReady}
            lang={lang}
            s={s}
            onOpenJournal={() => setShowJournalPanel(true)}
          />
        </>
      )}

      {showJournalPanel && (
        <JournalPanel
          journalData={journalData}
          s={s}
          onClose={() => setShowJournalPanel(false)}
        />
      )}

      <div className={`status-dot${agentStatus !== 'idle' ? ` ${agentStatus}` : ''}`}>
        <div className="dot-live" />
        <span>aya here</span>
      </div>

      <UserBar
        displayName={displayName}
        isGuest={isGuest}
        onSignOut={() => signOut({ callbackUrl: '/' })}
      />

      {journalData.streak >= 2 && (
        <div className="streak-display">
          {journalData.streak} {s.streak}
        </div>
      )}

      {!showResult && (
        <button className="lang-switch" onClick={switchLang}>
          {s.switchTo}
        </button>
      )}

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
