# are you happy?

![are you happy banner](./assets/NosanaXEliza.jpg)

**are you happy?** is an introspective emotional companion built with ElizaOS and deployed on Nosana's decentralized GPU network.

It asks you one quiet question at a time — and responds to your answer with warmth, not advice.

> "are you carrying something heavy today?"

---

## What It Does

- **Asks** — generates short, poetic introspective questions using Qwen3.5 via Nosana GPU
- **Listens** — presents a simple yes / no choice, no judgment
- **Responds** — writes an empathetic 3–5 line reply tailored to your answer
- **Bilingual** — Indonesian 🇮🇩 and English 🇬🇧, switch anytime

---

## Tech Stack

| Layer | Technology |
|---|---|
| Agent Framework | ElizaOS v1 |
| LLM | Qwen3.5-4B via Nosana Inference |
| Frontend | Next.js 15 + React 19 |
| Styling | Global CSS — Cormorant Garamond |
| Compute | Nosana Decentralized GPU |

---

## Architecture

```
[Browser]
    ↓ POST /api/chat (Next.js route)
[Next.js — port 3000]
    ↓ proxies to
[ElizaOS agent — port 3001]  ← Solace character
    ↓ calls
[Qwen3.5 via Nosana GPU endpoint]
```

The frontend never calls the AI directly. Everything routes through the ElizaOS agent, which runs as a separate process inside the same Docker container.

---

## Getting Started

### Prerequisites
- Node.js 23+
- npm or bun

### Setup

```bash
# Clone
git clone https://github.com/SZtch/sentinel
cd sentinel

# Environment
cp env.example .env
# Fill in your Nosana endpoint (or use Ollama locally)

# Install
npm install

# Run ElizaOS agent (terminal 1) — port 3001
npm run dev:agent

# Run Next.js frontend (terminal 2) — port 3000
npm run dev
```

Open http://localhost:3000

---

## Agent Character

The agent is named **Solace** — defined in `characters/agent.character.json`.

It responds to two mode prefixes the frontend sends:

| Prefix | Behavior |
|---|---|
| `[MODE:QUESTION]` | Generates one short introspective question |
| `[MODE:RESPONSE]` | Generates an empathetic 3–5 line reply |

All responses are short, lowercase, poetic — no advice, no lists.

---

## Deploy to Nosana

```bash
# Build
docker build -t yourusername/are-you-happy:latest .

# Push
docker push yourusername/are-you-happy:latest

# Deploy via Nosana dashboard
# https://deploy.nosana.com
```

Update `nos_job_def/nosana_eliza_job_definition.json` with your image name before deploying.

The container exposes port **3000** (Next.js). ElizaOS runs internally on **3001**.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SERVER_PORT` | `3001` | ElizaOS agent port — must not be 3000 |
| `ELIZA_API_URL` | `http://localhost:3001` | Used by Next.js to proxy to the agent |
| `ELIZA_AGENT_ID` | `solace` | Agent name/slug |
| `OPENAI_API_KEY` | `nosana` | Placeholder for Nosana endpoint |
| `OPENAI_API_URL` | Nosana endpoint URL | Qwen3.5 inference endpoint |

---

## Why Nosana?

The Solace agent runs inference on Qwen3.5 — which needs GPU compute. Nosana's decentralized network provides that compute without locking into AWS or GCP.

Every question you're asked, every response you receive — processed on community-owned GPU infrastructure.

---

## Submission

Built for the **Nosana x ElizaOS Builders' Challenge** on Superteam Earn.

- **GitHub**: [github.com/SZtch/sentinel](https://github.com/SZtch/sentinel)
- **Stack**: ElizaOS · Next.js 15 · Qwen3.5 · Nosana GPU
- **Hashtag**: #NosanaAgentChallenge
