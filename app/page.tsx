'use client'

import { signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function Landing() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const handleSignIn = async () => {
    setLoading(true)
    await signIn('google', { callbackUrl: '/app' })
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0c0a09;
          min-height: 100vh;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        .landing {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          position: relative;
          overflow: hidden;
        }

        .landing::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 50% 0%, rgba(160, 100, 50, 0.07) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 20% 80%, rgba(80, 60, 120, 0.05) 0%, transparent 60%),
            radial-gradient(ellipse 30% 30% at 80% 60%, rgba(100, 140, 160, 0.04) 0%, transparent 60%);
          pointer-events: none;
        }

        .landing::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.2; /* reduced — was making text look grainy */
        }

        .content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 520px;
          width: 100%;
        }

        .eyebrow {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 11px;
          letter-spacing: 0.22em;
          color: rgba(180, 140, 90, 0.45);
          text-transform: uppercase;
          margin-bottom: 32px;
          opacity: 0;
          transition: opacity 1.2s ease;
        }

        .eyebrow.visible { opacity: 1; }

        .title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(52px, 10vw, 88px);
          font-weight: 300;
          color: rgba(220, 200, 175, 0.92);
          line-height: 1.05;
          letter-spacing: -0.01em;
          margin-bottom: 16px;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 1.2s ease 0.2s, transform 1.2s ease 0.2s;
        }

        .title.visible { opacity: 1; transform: translateY(0); }

        .subtitle {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 16px;
          font-style: italic;
          color: rgba(180, 155, 120, 0.5);
          margin-bottom: 56px;
          opacity: 0;
          transition: opacity 1.2s ease 0.5s;
        }

        .subtitle.visible { opacity: 1; }

        @keyframes borderPulse {
          0%, 100% { border-color: rgba(200, 170, 120, 0.18); }
          50%       { border-color: rgba(200, 170, 120, 0.38); }
        }

        .signin-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 13px 28px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(200, 170, 120, 0.18);
          border-radius: 6px;
          color: rgba(210, 185, 150, 0.8);
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 14px;
          letter-spacing: 0.08em;
          cursor: pointer;
          /* single transition declaration — no duplicate */
          opacity: 0;
          transition: opacity 1.2s ease 0.8s, background 0.3s, border-color 0.3s, color 0.3s;
        }

        .signin-btn.visible {
          opacity: 1;
          /* border breathes gently once revealed */
          animation: borderPulse 4s 2.2s ease-in-out infinite;
        }

        .signin-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(200, 170, 120, 0.5) !important;
          color: rgba(230, 210, 180, 0.95);
          animation-play-state: paused;
        }

        .signin-btn:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .footer {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: rgba(150, 120, 90, 0.3);
          white-space: nowrap;
          opacity: 0;
          transition: opacity 1.2s ease 1.2s;
        }

        .footer.visible { opacity: 1; }
      `}</style>

      <div className="landing">
        <div className="content">
          <p className={`eyebrow${visible ? ' visible' : ''}`}>oneQ</p>
          <h1 className={`title${visible ? ' visible' : ''}`}>
            are you<br />happy?
          </h1>
          <p className={`subtitle${visible ? ' visible' : ''}`}>
            one question. one feeling. every day.
          </p>
          <button
            className={`signin-btn${visible ? ' visible' : ''}`}
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? 'signing in...' : 'continue with google'}
          </button>
        </div>

        <p className={`footer${visible ? ' visible' : ''}`}>
          built on nosana · powered by elizaos
        </p>
      </div>
    </>
  )
}
