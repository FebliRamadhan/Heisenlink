# ===========================================
# Heisenlink - Production Dockerfile
# ===========================================
# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN apk add --no-cache openssl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies with cache
RUN --mount=type=cache,target=/root/.npm \
  npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 linkhub

# Copy built files with correct ownership (avoids slow chown -R)
COPY --chown=linkhub:nodejs --from=deps /app/node_modules ./node_modules
COPY --chown=linkhub:nodejs --from=deps /app/prisma ./prisma
COPY --chown=linkhub:nodejs . .

# Create directories with correct ownership
RUN mkdir -p public/uploads logs && chown -R linkhub:nodejs public/uploads logs

USER linkhub

EXPOSE 3000

ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/server.js"]
