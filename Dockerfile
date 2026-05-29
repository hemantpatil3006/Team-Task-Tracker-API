# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL (required by Prisma on Alpine)
RUN apk add --no-cache openssl

# Install dependencies first (layer caching)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src/

RUN npm run db:generate
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL (required by Prisma on Alpine)
RUN apk add --no-cache openssl

# Install only production deps
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npm run db:generate

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -q -O- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
