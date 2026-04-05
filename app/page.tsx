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

        /* Ambient background glow */
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

        /* Grain texture */
        .landing::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.4;
        }

        .content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 520px;
          width: 100%;
        }

        /* Eyebrow */
        .eyebrow {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 11px;
          letter-spacing: 0.22em;
          color: rgba(180, 140, 90, 0.45);
          text-transform: uppercase;
          margin-bottom: 32px;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 1s ease 0.1s, transform 1s ease 0.1s;
        }

        /* Main logo */
        .logo {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(72px, 18vw, 120px);
          font-weight: 300;
          color: rgba(220, 200, 175, 0.92);
          line-height: 0.9;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 1.2s ease 0.3s, transform 1.2s ease 0.3s;
        }

        .logo .q {
          color: rgba(180, 130, 70, 0.8);
          font-style: italic;
        }

        /* Tagline */
        .tagline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(15px, 3.5vw, 19px);
          font-weight: 300;
          font-style: italic;
          color: rgba(200, 175, 145, 0.55);
          line-height: 1.6;
          margin-bottom: 48px;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 1s ease 0.6s, transform 1s ease 0.6s;
        }

        /* Divider */
        .divider {
          width: 1px;
          height: 40px;
          background: linear-gradient(to bottom, transparent, rgba(180,140,90,0.25), transparent);
          margin: 0 auto 48px;
          opacity: 0;
          transition: opacity 1s ease 0.8s;
        }

        /* Description */
        .desc {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(14px, 3vw, 16px);
          font-weight: 300;
          color: rgba(180, 160, 135, 0.4);
          line-height: 1.9;
          margin-bottom: 56px;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 1s ease 0.9s, transform 1s ease 0.9s;
        }

        /* Features */
        .features {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-bottom: 56px;
          opacity: 0;
          transition: opacity 1s ease 1s;
          flex-wrap: wrap;
        }

        .feature {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .feature-icon {
          font-size: 18px;
          opacity: 0.5;
        }

        .feature-label {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 10px;
          letter-spacing: 0.15em;
          color: rgba(180, 150, 110, 0.35);
          text-transform: uppercase;
        }

        /* CTA Button */
        .cta-wrap {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 1s ease 1.1s, transform 1s ease 1.1s;
          margin-bottom: 48px;
        }

        .cta-btn {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 15px;
          font-weight: 400;
          letter-spacing: 0.1em;
          color: rgba(220, 195, 160, 0.8);
          background: transparent;
          border: 1px solid rgba(180, 140, 90, 0.25);
          padding: 14px 40px;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.4s ease;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          position: relative;
          overflow: hidden;
        }

        .cta-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(180, 140, 90, 0.05);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .cta-btn:hover {
          border-color: rgba(180, 140, 90, 0.5);
          color: rgba(230, 210, 180, 1);
          transform: translateY(-1px);
        }

        .cta-btn:hover::before {
          opacity: 1;
        }

        .cta-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        .google-icon {
          width: 16px;
          height: 16px;
          opacity: 0.7;
          flex-shrink: 0;
        }

        /* Footer */
        .footer {
          opacity: 0;
          transition: opacity 1s ease 1.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .badge {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 10px;
          letter-spacing: 0.14em;
          color: rgba(150, 130, 105, 0.3);
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .badge:hover {
          color: rgba(180, 150, 110, 0.55);
        }

        .badge-sep {
          width: 1px;
          height: 10px;
          background: rgba(150, 130, 105, 0.2);
        }

        /* Breathing line */
        .breathe {
          width: 32px;
          height: 1px;
          background: rgba(180, 140, 90, 0.2);
          margin: 0 auto 40px;
          animation: breathe 4s ease-in-out infinite;
          opacity: 0;
          transition: opacity 1s ease 0.7s;
        }

        @keyframes breathe {
          0%, 100% { width: 20px; opacity: 0.15; }
          50% { width: 48px; opacity: 0.35; }
        }

        /* Visible state */
        .visible .eyebrow,
        .visible .logo,
        .visible .tagline,
        .visible .divider,
        .visible .desc,
        .visible .features,
        .visible .cta-wrap,
        .visible .footer,
        .visible .breathe {
          opacity: 1;
          transform: translateY(0);
        }

        /* Loading dots */
        @keyframes ldot {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 0.8; }
        }

        .ldots span {
          display: inline-block;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: currentColor;
          margin: 0 2px;
          animation: ldot 1.2s infinite;
        }
        .ldots span:nth-child(2) { animation-delay: 0.2s; }
        .ldots span:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      <div className={`landing${visible ? ' visible' : ''}`}>
        <div className="content">

          <p className="eyebrow">a personal AI companion</p>

          <h1 className="logo">
            one<span className="q">Q</span>
          </h1>

          <div className="breathe" />

          <p className="tagline">
            Aya asks.<br />
            You answer.<br />
            She remembers.
          </p>

          <div className="divider" />

          <p className="desc">
            One quiet question a day.<br />
            No advice. No judgment. Just presence.<br />
            Aya adapts to how you've been — and meets you there.
          </p>

          <div className="features">
            <div className="feature">
              <span className="feature-icon">✦</span>
              <span className="feature-label">remembers</span>
            </div>
            <div className="feature">
              <span className="feature-icon">◇</span>
              <span className="feature-label">adapts</span>
            </div>
            <div className="feature">
              <span className="feature-icon">◯</span>
              <span className="feature-label">reflects</span>
            </div>
            <div className="feature">
              <span className="feature-icon">⟡</span>
              <span className="feature-label">bilingual</span>
            </div>
          </div>

          <div className="cta-wrap">
            <button className="cta-btn" onClick={handleSignIn} disabled={loading}>
              {loading ? (
                <span className="ldots">
                  <span /><span /><span />
                </span>
              ) : (
                <>
                  <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="rgba(220,195,160,0.6)"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="rgba(220,195,160,0.5)"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="rgba(220,195,160,0.45)"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="rgba(220,195,160,0.55)"/>
                  </svg>
                  begin with Google
                </>
              )}
            </button>
          </div>

          <div className="footer">
            <a className="badge" href="https://nosana.com" target="_blank" rel="noopener noreferrer">
              nosana gpu
            </a>
            <div className="badge-sep" />
            <a className="badge" href="https://elizaos.ai" target="_blank" rel="noopener noreferrer">
              elizaos v2
            </a>
            <div className="badge-sep" />
            <span className="badge">qwen 27b</span>
          </div>

        </div>
      </div>
    </>
  )
}
