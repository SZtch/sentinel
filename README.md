# oneQ

![are you happy banner](./assets/NosanaXEliza.jpg)

**oneQ** is an introspective emotional companion built with ElizaOS v2 and deployed on Nosana's decentralized GPU network.

It asks you one quiet question at a time — remembers how you've been — and responds with warmth, not advice.

> "are you carrying something heavy today?"

---

## What It Does

- **Asks** — generates short, poetic introspective questions using Qwen3.5-27B via Nosana GPU
- **Listens** — presents a simple yes / no choice, no judgment
- **Responds** — writes an empathetic 3–5 line reply tailored to your answer
- **Remembers** — tracks your emotional pattern across sessions and adapts its tone
- **Reflects autonomously** — writes a weekly journal entry about your week *without being asked*
- **Bilingual** — Indonesian 🇮🇩 and English 🇬🇧, switch anytime

---

## What Makes It Agentic

Aya is not a chatbot. It's an agent that:

| Behavior | How |
|---|---|
| Adapts tone based on your emotional trend | `EMOTIONAL_MEMORY` provider injects history into every context |
| Detects absence (3+ days away) and responds accordingly | Provider calculates days since last session |
| Writes a weekly reflection *without user triggering it* | Autonomous journal generation after each session |
| Tracks streaks and honors consistency through tone | Storage layer + provider context |
| Adjusts question depth (declining → shorter & gentler) | Trend detection: `declining` / `stable` / `positive` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Agent Framework | ElizaOS v2 |
| LLM | Qwen/Qwen3.5-27B-AWQ-4bit via Nosana Inference |
| Custom Plugin | `solace-plugin` — ElizaOS provider + action |
| Frontend | Next.js 15 + React 19 |
| Storage | JSON file (`data/{userId}.json` per user) |
| Styling | Global CSS — Cormorant Garamond |
| Compute | Nosana Decentralized GPU |

---

## Architecture

```
[Browser]
    ↓ POST /api/chat          → question & response
    ↓ POST /api/session       → save session + trigger autonomous journal
    ↓ GET  /api/journal       → fetch streak & weekly reflection
[Next.js — port 3000]
    ↓ proxies to
[ElizaOS agent — port 3001]   ← Aya character + solace-plugin
    ↑ EMOTIONAL_MEMORY provider injects history into every message
    ↑ WRITE_JOURNAL action generates weekly reflection autonomously
    ↓ calls
[Qwen3.5-27B via Nosana GPU endpoint]
```

---

## Custom Plugin: solace-plugin

### `EMOTIONAL_MEMORY` Provider
Runs on **every message**. Injects:
- Last 7 sessions (date, question, answer, language)
- Emotional trend: `declining` / `stable` / `positive`
- Days since last session (absence detection)
- Streak length

Aya uses this to adjust tone and question depth — silently, without ever mentioning it.

### `WRITE_JOURNAL` Action
Triggered autonomously after each completed session. Calls Qwen via Nosana GPU to write a 3–4 line poetic weekly reflection. Saved to `data/{userId}.json`. Displayed in the UI after responses.

---

## Getting Started

### Prerequisites
- Node.js 23+

### Setup

```bash
git clone https://github.com/SZtch/agent-challenge
cd agent-challenge

cp .env.example .env
# Fill in your Nosana endpoint (see .env.example for details)

npm install

# Terminal 1 — ElizaOS agent (port 3001)
npm run dev:agent

# Terminal 2 — Next.js frontend (port 3000)
npm run dev
```

Open http://localhost:3000

---

## Deploy to Nosana

```bash
# Build
docker build -t YOUR_DOCKERHUB_USERNAME/oneq:latest .

# Push
docker push YOUR_DOCKERHUB_USERNAME/oneq:latest
```

Update `nos_job_def/nosana_eliza_job_definition.json` with your Docker Hub username, then deploy via [deploy.nosana.com](https://deploy.nosana.com).

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SERVER_PORT` | `3001` | ElizaOS agent port |
| `ELIZA_API_URL` | `http://localhost:3001` | Next.js → agent proxy |
| `ELIZA_AGENT_ID` | `aya` | Agent name |
| `OPENAI_API_KEY` | `nosana` | Nosana endpoint placeholder |
| `OPENAI_API_URL` | Nosana endpoint | Qwen3.5-27B inference |
| `MODEL_NAME` | `Qwen/Qwen3.5-27B-AWQ-4bit` | Model served by Nosana |
| `GOOGLE_CLIENT_ID` | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth client secret |
| `NEXTAUTH_SECRET` | — | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `http://localhost:3000` | App base URL (prod: Nosana URL) |
| `OPENAI_BASE_URL` | Nosana endpoint | Required by ElizaOS plugin-openai |

> **Note:** `data/{userId}.json` is ephemeral on Nosana — sessions reset if the container restarts. This is a known limitation of the MVP.

---

## Submission

Built for the **Nosana x ElizaOS Builders' Challenge** — Superteam Earn.

- **GitHub**: [github.com/SZtch/agent-challenge](https://github.com/SZtch/agent-challenge)
- **Stack**: ElizaOS v2 · Next.js 15 · Qwen3.5-27B · Nosana GPU · Custom Plugin
- **Hashtag**: #NosanaAgentChallenge
