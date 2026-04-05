'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type Lang = 'id' | 'en'
type Answer = 'yes' | 'no'

const STATIC = {
  id: {
    yes: 'Ya', no: 'Tidak',
    sub: 'jawab dengan jujur',
    labelYes: 'kamu bilang', labelNo: 'kamu bilang',
    titleYes: 'ya.', titleNo: 'tidak.',
    back: '← kembali',
    retry: '↺ pertanyaan lain',
  },
  en: {
    yes: 'Yes', no: 'No',
    sub: 'answer honestly',
    labelYes: 'you said', labelNo: 'you said',
    titleYes: 'yes.', titleNo: 'no.',
    back: '← go back',
    retry: '↺ new question',
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
    en: ["that's okay.", 'just being here', 'is already brave.'],
  },
}

export default function Home() {
  const [lang, setLang] = useState<Lang>('id')
  const [question, setQuestion] = useState('')
  const [questionLoading, setQuestionLoading] = useState(true)
  const [buttonsDisabled, setButtonsDisabled] = useState(true)
  const [mainHover, setMainHover] = useState<'warm' | 'cold' | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [resultActive, setResultActive] = useState(false)
  const [answerType, setAnswerType] = useState<Answer>('yes')
  const [resultLines, setResultLines] = useState<string[]>([])
  const [resultLoading, setResultLoading] = useState(false)
  const [agentStatus, setAgentStatus] = useState<'idle' | 'connected' | 'error'>('idle')

  const currentQuestion = useRef('')
  const particlesEl = useRef<HTMLDivElement>(null)
  const pInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionId = useRef(Math.random().toString(36).slice(2, 12))
  const langRef = useRef(lang)
  langRef.current = lang

  // ── API ──
  const callAgent = useCallback(async (text: string): Promise<string> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        userId: `user-${sessionId.current}`,
        userName: 'User',
        roomId: `session-${sessionId.current}`,
      }),
    })
    if (!res.ok) throw new Error(`Agent ${res.status}`)
    const data = await res.json()
    if (Array.isArray(data)) return data.map((d: { text?: string }) => d.text || '').filter(Boolean).join('\n').trim()
    return ((data as { text?: string }).text || '').trim()
  }, [])

  // ── GENERATE QUESTION ──
  const generateQuestion = useCallback(async (l?: Lang) => {
    const activeLang = l ?? langRef.current
    setQuestion('')
    setQuestionLoading(true)
    setButtonsDisabled(true)
    currentQuestion.current = ''

    const prompt = activeLang === 'id'
      ? '[MODE:PERTANYAAN] Hasilkan SATU pertanyaan introspektif singkat (maks 8 kata) dalam bahasa Indonesia. Tema: kebahagiaan, kehadiran, kesendirian, kedamaian batin. Hanya pertanyaan saja, tanpa tanda kutip.'
      : '[MODE:QUESTION] Generate ONE short introspective question (max 8 words). Themes: happiness, presence, loneliness, inner peace. Just the question, no quotes.'

    try {
      let q = await callAgent(prompt)
      q = q.replace(/^["'""]|["'""]$/g, '').trim()
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

  // ── GENERATE RESPONSE ──
  const generateResponse = useCallback(async (type: Answer) => {
    const activeLang = langRef.current
    setResultLoading(true)
    setResultLines([])

    const prompt = activeLang === 'id'
      ? `[MODE:RESPONS] Pertanyaan: "${currentQuestion.current}" | Jawaban user: ${type === 'yes' ? 'YA' : 'TIDAK'}. Tulis respons empatik singkat (3-5 baris). Gaya: puitis, hangat, lembut. Setiap baris dipisah newline.`
      : `[MODE:RESPONSE] Question: "${currentQuestion.current}" | User answered: ${type === 'yes' ? 'YES' : 'NO'}. Write a short empathetic response (3-5 lines). Style: poetic, warm, gentle. Each line separated by newline.`

    try {
      const text = await callAgent(prompt)
      const lines = text.split('\n').filter((l) => l.trim())
      setResultLines(lines.length ? lines : FALLBACK_RESPONSES[type][activeLang])
    } catch {
      setResultLines(FALLBACK_RESPONSES[type][activeLang])
    } finally {
      setResultLoading(false)
    }
  }, [callAgent])

  // ── ANSWER ──
  const handleAnswer = useCallback(async (type: Answer) => {
    stopParticles()
    setMainHover(null)
    setAnswerType(type)
    setShowResult(true)
    setResultActive(false)
    setTimeout(() => setResultActive(true), 80)
    if (type === 'yes') startParticles('yes', 3)
    else startParticles('no', 1)
    await generateResponse(type)
  }, [generateResponse])

  // ── GO BACK ──
  const goBack = useCallback(() => {
    setResultActive(false)
    stopParticles()
    setTimeout(() => {
      setShowResult(false)
      generateQuestion()
    }, 800)
  }, [generateQuestion])

  // ── LANG SWITCH ──
  const switchLang = useCallback((l: Lang) => {
    setLang(l)
    generateQuestion(l)
  }, [generateQuestion])

  // ── PARTICLES ──
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

  // init
  useEffect(() => { generateQuestion(); return () => stopParticles() }, [])  // eslint-disable-line

  const s = STATIC[lang]

  return (
    <>
      {/* particles */}
      <div ref={particlesEl} className="particles" />

      {/* header */}
      <div className="header">
        <div className="lang-toggle">
          <button className={`lang-btn${lang === 'id' ? ' active' : ''}`} onClick={() => switchLang('id')}>ID</button>
          <div className="lang-sep" />
          <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => switchLang('en')}>EN</button>
        </div>
      </div>

      {/* main */}
      <div
        className={`main${mainHover === 'warm' ? ' warm-hover' : ''}${mainHover === 'cold' ? ' cold-hover' : ''}`}
        style={{ opacity: showResult ? 0 : 1, pointerEvents: showResult ? 'none' : 'all' }}
      >
        <div className="breathe-line" />

        <div className="question-wrap">
          {questionLoading ? (
            <div className="question-loading">
              <div className="dot" /><div className="dot" /><div className="dot" />
            </div>
          ) : (
            <>
              <h1 className="question">{question}</h1>
              <div className="retry-hint" onClick={() => generateQuestion()}>{s.retry}</div>
            </>
          )}
        </div>

        <p className="sub-question">{s.sub}</p>

        <div className="choices">
          <button
            className="choice yes"
            disabled={buttonsDisabled}
            onMouseEnter={() => { setMainHover('warm'); startParticles('yes', 2) }}
            onMouseLeave={() => { setMainHover(null); stopParticles() }}
            onClick={() => handleAnswer('yes')}
          >{s.yes}</button>
          <button
            className="choice no"
            disabled={buttonsDisabled}
            onMouseEnter={() => { setMainHover('cold'); startParticles('no', 1) }}
            onMouseLeave={() => { setMainHover(null); stopParticles() }}
            onClick={() => handleAnswer('no')}
          >{s.no}</button>
        </div>
      </div>

      {/* result overlay */}
      {showResult && (
        <div className={`result${resultActive ? ' active' : ''} ${answerType === 'yes' ? 'yes-result' : 'no-result'}`}>
          {/* visual effects */}
          {answerType === 'yes' ? (
            <><div className="glow-ring r1" /><div className="glow-ring r2" /><div className="glow-ring r3" /></>
          ) : (
            <div className="static-line" />
          )}

          <div className="result-label">{answerType === 'yes' ? s.labelYes : s.labelNo}</div>
          <div className="result-title">{answerType === 'yes' ? s.titleYes : s.titleNo}</div>
          <div className="result-divider" />

          <div className="result-body">
            {resultLoading ? (
              <div className="question-loading">
                <div className="dot" /><div className="dot" /><div className="dot" />
              </div>
            ) : (
              resultLines.map((line, i) => (
                <span
                  key={`${line}-${i}`}
                  style={{ display: 'block', opacity: 0, animation: `fadeIn 0.6s ${i * 0.35}s ease both` }}
                >
                  {line}
                </span>
              ))
            )}
          </div>

          <button className="back-btn" onClick={goBack}>{s.back}</button>
        </div>
      )}

      {/* status indicator */}
      <div className={`status-dot${agentStatus !== 'idle' ? ` ${agentStatus}` : ''}`}>
        <div className="dot-live" />
        <span>solace · nosana</span>
      </div>

      {/* attribution */}
      <a className="nosana-badge" href="https://nosana.com" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" strokeWidth="1" />
          <path d="M12 3v18M3 12h18" strokeWidth="1" />
        </svg>
        <span>powered by nosana</span>
      </a>
    </>
  )
}
