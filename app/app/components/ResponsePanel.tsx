'use client'

import { RefObject } from 'react'
import { Answer, LangStrings } from './types'

function IconBack() {
  return (
    <svg width="18" height="8" viewBox="0 0 18 8" fill="none" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round">
      <line x1="17" y1="4" x2="1" y2="4" />
      <line x1="1" y1="4" x2="4" y2="1.5" />
      <line x1="1" y1="4" x2="4" y2="6.5" />
    </svg>
  )
}

function IconSend({ active }: { active: boolean }) {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none"
      stroke={active ? 'rgba(210,175,130,0.7)' : 'rgba(255,255,255,0.1)'}
      strokeWidth="0.75" strokeLinecap="round">
      <line x1="1" y1="7" x2="17" y2="7" />
      <line x1="17" y1="7" x2="12" y2="2.5" />
      <line x1="17" y1="7" x2="12" y2="11.5" />
    </svg>
  )
}

interface ChatMessage {
  role: 'user' | 'aya'
  text: string
}

interface ResponsePanelProps {
  answerType: Answer
  resultActive: boolean
  resultLines: string[]
  resultLoading: boolean
  chatMode: boolean
  chatMessages: ChatMessage[]
  chatInput: string
  chatLoading: boolean
  showChatPrompt: boolean
  chatEndRef: RefObject<HTMLDivElement>
  s: LangStrings
  onBack: () => void
  onOpenChat: () => void
  onCloseChat: () => void
  onChatInputChange: (val: string) => void
  onSendMessage: () => void
}

export function ResponsePanel({
  answerType,
  resultActive,
  resultLines,
  resultLoading,
  chatMode,
  chatMessages,
  chatInput,
  chatLoading,
  showChatPrompt,
  chatEndRef,
  s,
  onBack,
  onOpenChat,
  onCloseChat,
  onChatInputChange,
  onSendMessage,
}: ResponsePanelProps) {
  return (
    <div className={`result${resultActive ? ' active' : ''} ${answerType}-result`}>
      <div className="result-accent-bar" />

      {answerType === 'yes' ? (
        <><div className="glow-ring r1" /><div className="glow-ring r2" /><div className="glow-ring r3" /></>
      ) : (
        <div className="static-line" />
      )}

      {/* Response lines */}
      <div className="result-body" style={{ transition: 'opacity 0.5s ease' }}>
        {resultLoading ? (
          <div className="question-loading">
            <div className="dot" /><div className="dot" /><div className="dot" />
          </div>
        ) : chatMode ? (
          <span style={{
            display: 'block', opacity: 0.28, fontSize: '15px',
            fontStyle: 'italic', letterSpacing: '0.04em',
            transition: 'opacity 0.5s ease',
          }}>
            {resultLines[0]}
          </span>
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

      {/* Chat prompt */}
      {!resultLoading && showChatPrompt && !chatMode && (
        <div style={{ marginTop: '28px', opacity: 0, animation: 'fadeIn 0.8s 0.2s ease both' }}>
          <button
            onClick={onOpenChat}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(200,170,140,0.72)', fontSize: '14px',
              fontStyle: 'italic', letterSpacing: '0.08em',
              cursor: 'pointer', padding: '0',
              borderBottom: '1px solid rgba(200,170,140,0.18)',
              transition: 'color 0.3s, border-color 0.3s',
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.color = 'rgba(220,190,160,0.75)'
              ;(e.target as HTMLButtonElement).style.borderColor = 'rgba(220,190,160,0.3)'
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.color = 'rgba(200,170,140,0.5)'
              ;(e.target as HTMLButtonElement).style.borderColor = 'rgba(200,170,140,0.18)'
            }}
          >
            {s.chatPrompt}
          </button>
        </div>
      )}

      {/* Chat mode */}
      {!resultLoading && chatMode && (
        <div style={{
          marginTop: '20px', width: '100%',
          maxWidth: 'min(460px, 88vw)',
          opacity: 0, animation: 'fadeIn 0.6s ease both',
        }}>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', marginBottom: '24px' }} />

          <div style={{
            maxHeight: '300px', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '20px',
            paddingRight: '4px', marginBottom: '20px',
            scrollbarWidth: 'none',
          }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                opacity: 0, animation: `fadeIn 0.5s ${i * 0.08}s ease both`,
              }}>
                <span style={{
                  fontSize: '14px', lineHeight: 1.9, maxWidth: '88%',
                  color: msg.role === 'aya' ? 'rgba(210,188,165,0.82)' : 'rgba(195,178,160,0.6)',
                  fontStyle: msg.role === 'aya' ? 'italic' : 'normal',
                  letterSpacing: msg.role === 'aya' ? '0.03em' : '0.01em',
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                }}>
                  {msg.text}
                </span>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: 'flex', gap: '6px', paddingLeft: '2px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} className="dot" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(200,170,140,0.10)',
            borderRadius: '6px',
            padding: '10px 12px',
            paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
          }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => onChatInputChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSendMessage()}
              placeholder={s.chatPlaceholder}
              autoFocus
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: 'rgba(220,200,178,0.85)', fontSize: '14px',
                fontStyle: 'italic', letterSpacing: '0.03em',
                caretColor: 'rgba(220,190,150,0.5)',
              }}
            />
            <button
              onClick={onSendMessage}
              disabled={chatLoading || !chatInput.trim()}
              style={{
                background: 'none', border: 'none',
                cursor: chatInput.trim() ? 'pointer' : 'default',
                padding: '0',
                opacity: chatInput.trim() && !chatLoading ? 1 : 0.28,
                transition: 'opacity 0.2s ease',
                display: 'flex', alignItems: 'center',
              }}
            >
              <IconSend active={!!chatInput.trim()} />
            </button>
          </div>

          <button
            onClick={onCloseChat}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(150,133,115,0.65)', fontSize: '12px',
              letterSpacing: '0.1em', cursor: 'pointer',
              marginTop: '16px', fontStyle: 'italic', padding: '0',
            }}
          >
            {s.chatClose}
          </button>
        </div>
      )}

      {/* Back button */}
      <button className="back-btn" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <IconBack />
        <span>{s.back}</span>
      </button>
    </div>
  )
}
