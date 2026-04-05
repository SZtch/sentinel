'use client'

import { JournalData, Lang, LangStrings } from './types'

interface StatusBannerProps {
  show: boolean
  resultLoading: boolean
  journalStatus: 'idle' | 'pending' | 'ready' | 'error'
  journalData: JournalData
  journalJustReady: boolean
  lang: Lang
  s: LangStrings
  onOpenJournal: () => void
}

export function StatusBanner({
  show,
  resultLoading,
  journalStatus,
  journalData,
  journalJustReady,
  lang,
  s,
  onOpenJournal,
}: StatusBannerProps) {
  if (resultLoading || !show) return null

  // Ready: show "this week" button
  if (journalData.journal && journalStatus !== 'pending') {
    return (
      <button
        onClick={onOpenJournal}
        style={{
          position: 'fixed', bottom: '22px', right: '24px',
          background: 'none', border: 'none',
          color: journalJustReady ? 'rgba(230,196,140,0.9)' : 'rgba(178,152,118,0.75)',
          fontSize: '11px',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          fontStyle: 'italic', cursor: 'pointer',
          opacity: 0, animation: 'fadeIn 0.5s 0.1s ease both',
          transition: 'color 0.4s ease, border-color 0.4s ease',
          padding: '0 0 2px 0',
          borderBottom: journalJustReady
            ? '1px solid rgba(230,196,140,0.45)'
            : '1px solid rgba(178,152,118,0.22)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'rgba(210,182,148,0.82)'
          e.currentTarget.style.borderBottomColor = 'rgba(210,182,148,0.42)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = journalJustReady ? 'rgba(230,196,140,0.9)' : 'rgba(178,152,118,0.55)'
          e.currentTarget.style.borderBottomColor = journalJustReady ? 'rgba(230,196,140,0.45)' : 'rgba(178,152,118,0.22)'
        }}
      >
        {s.thisWeek}
      </button>
    )
  }

  // Pending: "reflection is being written..."
  if (journalStatus === 'pending') {
    return (
      <div style={{
        position: 'fixed', bottom: '22px', right: '24px',
        display: 'flex', alignItems: 'center', gap: '8px',
        opacity: 0, animation: 'fadeIn 0.8s 0.6s ease both',
      }}>
        <span style={{
          fontSize: '11px', letterSpacing: '0.18em',
          textTransform: 'uppercase', fontStyle: 'italic',
          color: 'rgba(178,152,118,0.45)',
        }}>
          {lang === 'id' ? 'refleksi sedang ditulis' : 'reflection is being written'}
        </span>
        <span style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              display: 'inline-block', width: '3px', height: '3px',
              borderRadius: '50%', background: 'rgba(178,152,118,0.4)',
              animation: `dotPulse 1.4s ${i * 0.2}s ease-in-out infinite`,
            }} />
          ))}
        </span>
      </div>
    )
  }

  // Error: "will appear shortly"
  if (journalStatus === 'error' && !journalData.journal) {
    return (
      <p style={{
        position: 'fixed', bottom: '22px', right: '24px',
        margin: 0, fontSize: '11px', letterSpacing: '0.18em',
        textTransform: 'uppercase', fontStyle: 'italic',
        color: 'rgba(178,152,118,0.35)',
        opacity: 0, animation: 'fadeIn 0.8s 0.5s ease both',
      }}>
        {lang === 'id' ? 'refleksi akan muncul sebentar lagi.' : 'reflection will appear shortly.'}
      </p>
    )
  }

  // Idle: "will appear after a few sessions"
  if (journalStatus === 'idle' && !journalData.journal) {
    return (
      <p style={{
        position: 'fixed', bottom: '22px', right: '24px',
        margin: 0, fontSize: '11px', letterSpacing: '0.18em',
        textTransform: 'uppercase', fontStyle: 'italic',
        color: 'rgba(178,152,118,0.28)',
        opacity: 0, animation: 'fadeIn 0.8s 1.5s ease both',
      }}>
        {lang === 'id' ? 'refleksi akan muncul setelah beberapa sesi.' : 'reflections will appear after a few sessions.'}
      </p>
    )
  }

  return null
}
