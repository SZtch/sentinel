'use client'

import { Answer, LangStrings } from './types'

function IconRetry() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round">
      <path d="M7 1.5 A5.5 5.5 0 1 0 12.5 7" />
      <line x1="12.5" y1="7" x2="12.5" y2="3" />
      <line x1="12.5" y1="3" x2="9" y2="3" />
    </svg>
  )
}

interface QuestionCardProps {
  question: string
  questionLoading: boolean
  buttonsDisabled: boolean
  hoverSide: Answer | null
  showHint: boolean
  showResult: boolean
  s: LangStrings
  onAnswer: (type: Answer) => void
  onRetry: () => void
  onHoverEnter: (side: Answer) => void
  onHoverLeave: () => void
}

export function QuestionCard({
  question,
  questionLoading,
  buttonsDisabled,
  hoverSide,
  showHint,
  showResult,
  s,
  onAnswer,
  onRetry,
  onHoverEnter,
  onHoverLeave,
}: QuestionCardProps) {
  return (
    <>
      {/* Desktop split screen */}
      <div
        className="split-screen"
        style={{ opacity: showResult ? 0 : 1, pointerEvents: showResult ? 'none' : 'all' }}
      >
        <div
          role="button"
          tabIndex={buttonsDisabled ? -1 : 0}
          aria-label={s.yes}
          className={`split-half yes-half${hoverSide === 'yes' ? ' active' : ''}`}
          onMouseEnter={() => { if (!buttonsDisabled) onHoverEnter('yes') }}
          onMouseLeave={onHoverLeave}
          onClick={() => onAnswer('yes')}
          onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !buttonsDisabled) onAnswer('yes') }}
        >
          <span className="split-label">{s.yes}</span>
        </div>

        <div className="split-divider" />

        <div
          role="button"
          tabIndex={buttonsDisabled ? -1 : 0}
          aria-label={s.no}
          className={`split-half no-half${hoverSide === 'no' ? ' active' : ''}`}
          onMouseEnter={() => { if (!buttonsDisabled) onHoverEnter('no') }}
          onMouseLeave={onHoverLeave}
          onClick={() => onAnswer('no')}
          onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !buttonsDisabled) onAnswer('no') }}
        >
          <span className="split-label">{s.no}</span>
        </div>
      </div>

      {/* Question float overlay */}
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
              <p className="sub-question">{s.sub}</p>
              <div
                className="retry-hint"
                style={{ pointerEvents: 'all', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={onRetry}
              >
                <IconRetry />
                <span>{s.retry}</span>
              </div>
            </>
          )}
        </div>

        {/* Mobile answer buttons */}
        {!questionLoading && (
          <div className="mobile-answer-btns">
            <button
              className={`mobile-answer-btn yes-btn${hoverSide === 'yes' ? ' active' : ''}`}
              onClick={() => onAnswer('yes')}
              disabled={buttonsDisabled}
            >
              {s.yes}
            </button>
            <button
              className={`mobile-answer-btn no-btn${hoverSide === 'no' ? ' active' : ''}`}
              onClick={() => onAnswer('no')}
              disabled={buttonsDisabled}
            >
              {s.no}
            </button>
          </div>
        )}

        {showHint && (
          <p style={{
            marginTop: '32px',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '11px',
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'rgba(152,134,112,0.52)',
            fontStyle: 'italic',
            animation: 'fadeIn 0.8s ease both, fadeOut 0.8s 3.5s ease forwards',
            pointerEvents: 'none',
          }}>
            tap to answer
          </p>
        )}
      </div>
    </>
  )
}
