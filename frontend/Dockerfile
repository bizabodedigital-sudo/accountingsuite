# Production-optimized Next.js Dockerfile for Coolify
FROM node:20-bullseye AS builder

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time environment variables (Coolify can override via Build arguments)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL

# Cache busting - increment this to force rebuild without cache
ARG CACHE_BUST=2025-11-18-v2

# Set build-time env vars (required for Next.js build)
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
# Using npm install (more forgiving than npm ci if lock file is out of sync)
# Cache buster ensures this layer is rebuilt: ${CACHE_BUST}
RUN npm install --legacy-peer-deps && \
    npm cache clean --force

# Copy application source
COPY . .

# Build Next.js application
RUN npm run build

# Production runner stage
FROM node:20-bullseye-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use Next.js standalone server
CMD ["node", "server.js"]
