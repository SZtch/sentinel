'use client'

import { JournalData, LangStrings } from './types'

interface JournalPanelProps {
  journalData: JournalData
  s: LangStrings
  onClose: () => void
}

export function JournalPanel({ journalData, s, onClose }: JournalPanelProps) {
  if (!journalData.journal) return null

  return (
    <div
      className="journal-panel"
      onClick={onClose}
    >
      <div
        className="journal-panel-inner"
        onClick={e => e.stopPropagation()}
      >
        <p className="journal-panel-label">{s.thisWeek}</p>
        {journalData.journal.content.split('\n').map((line, i) => (
          <span key={i} style={{
            display: 'block', fontSize: '16px',
            color: 'rgba(215,195,170,0.78)', fontStyle: 'italic',
            lineHeight: 2, opacity: 0,
            animation: `fadeIn 0.7s ${0.1 + i * 0.25}s ease both`,
          }}>
            {line}
          </span>
        ))}
        <button
          onClick={onClose}
          style={{
            marginTop: '28px', background: 'none', border: 'none',
            color: 'rgba(150,133,115,0.4)', fontSize: '11px',
            letterSpacing: '0.15em', fontStyle: 'italic',
            cursor: 'pointer', padding: '0',
          }}
        >
          {s.chatClose}
        </button>
      </div>
    </div>
  )
}
