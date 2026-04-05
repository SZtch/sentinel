# syntax=docker/dockerfile:1

FROM node:23-slim AS base

RUN apt-get update && apt-get install -y \
  python3 make g++ git curl \
  && rm -rf /var/lib/apt/lists/*

ENV ELIZAOS_TELEMETRY_DISABLED=true
ENV DO_NOT_TRACK=1

WORKDIR /app

# ── Install dependencies ──
COPY package.json ./
RUN npm install

# ── Copy all source ──
COPY . .

# ── Build Next.js ──
RUN npm run build

# ── Runtime directories ──
RUN mkdir -p /app/data

# ── Ports ──
# 3000 → Next.js frontend (public-facing)
# 3001 → ElizaOS agent   (internal, proxied via /api/chat)
EXPOSE 3000

# ── Environment ──
ENV NODE_ENV=production

# ElizaOS agent port — must NOT conflict with Next.js (3000)
ENV SERVER_PORT=3001
ENV ELIZA_API_URL=http://localhost:3001
ENV ELIZA_AGENT_ID=solace

# ── Start both processes ──
# ElizaOS starts first; `sleep 8` gives it time to initialize before Next.js
# begins accepting requests that proxy to it.
CMD ["sh", "-c", "SERVER_PORT=3001 npm run start:agent & sleep 8 && npm run start"]
