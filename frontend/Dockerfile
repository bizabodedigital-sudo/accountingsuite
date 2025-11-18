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

# Pre-build diagnostics
RUN echo "========================================" && \
    echo "🔍 PRE-BUILD DIAGNOSTICS" && \
    echo "========================================" && \
    echo "Files in app directory:" && \
    ls -la | head -15 && \
    echo "" && \
    echo "Checking for critical files:" && \
    echo "  next.config.ts: $(test -f next.config.ts && echo '✅' || echo '❌')" && \
    echo "  package.json: $(test -f package.json && echo '✅' || echo '❌')" && \
    echo "  src/ directory: $(test -d src && echo '✅' || echo '❌')" && \
    echo "  public/ directory: $(test -d public && echo '✅' || echo '❌')" && \
    echo "" && \
    echo "Environment variables:" && \
    echo "  NODE_ENV: $NODE_ENV" && \
    echo "  NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL" && \
    echo "  NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL" && \
    echo "  NODE_OPTIONS: $NODE_OPTIONS" && \
    echo "" && \
    echo "Build script:" && \
    cat package.json | grep -A 2 '"build"' && \
    echo "========================================"

# Build Next.js application with verbose output
RUN echo "🚀 Starting Next.js build..." && \
    npm run build 2>&1 || { \
      echo "" && \
      echo "========================================" && \
      echo "❌ BUILD FAILED" && \
      echo "========================================" && \
      echo "Last 50 lines of build output:" && \
      tail -50 /tmp/build.log 2>/dev/null || echo "No build log available" && \
      echo "" && \
      echo "Checking if .next directory exists:" && \
      ls -la .next 2>/dev/null || echo ".next directory does not exist" && \
      exit 1; \
    } && \
    echo "" && \
    echo "✅ Build completed successfully!" && \
    echo "Verifying .next directory:" && \
    ls -la .next | head -10

# Production runner stage
FROM node:20-bullseye-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/next.config.* ./ || true

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use npm start (more forgiving than standalone mode)
CMD ["npm", "start"]
