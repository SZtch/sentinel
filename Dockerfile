# syntax=docker/dockerfile:1

FROM node:23-slim AS base

RUN apt-get update && apt-get install -y \
  python3 make g++ git curl unzip \
  && rm -rf /var/lib/apt/lists/*

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

ENV ELIZAOS_TELEMETRY_DISABLED=true
ENV DO_NOT_TRACK=1

WORKDIR /app

# ── Install dependencies ──
COPY package.json ./
COPY plugin/package.json ./plugin/
RUN bun install

# ── Copy all source ──
COPY . .

# ── Build Next.js ──
RUN bun run build

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
ENV ELIZA_AGENT_ID=aya

# ── Start both processes ──
CMD ["sh", "-c", "SERVER_PORT=3001 bun run start:agent & until curl -sf http://localhost:3001/api/server/health > /dev/null 2>&1; do sleep 2; done && bun run start"]
