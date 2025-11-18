# Production-optimized Next.js Dockerfile for Coolify
FROM node:20-bullseye AS builder

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time environment variables (Coolify can override via Build arguments)
# Provide defaults to prevent build failures if not set
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cache busting - increment this to force rebuild without cache
ARG CACHE_BUST=2025-11-18-v3

# Set build-time env vars (required for Next.js build)
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Copy package files
COPY package*.json ./

# Debug: Print Node version and environment before npm install
RUN echo "========================================" && \
    echo "🔍 DEBUG: PRE-INSTALL DIAGNOSTICS" && \
    echo "========================================" && \
    echo "Node.js version: $(node --version)" && \
    echo "NPM version: $(npm --version)" && \
    echo "Working directory: $(pwd)" && \
    echo "" && \
    echo "Environment variables:" && \
    echo "  NODE_ENV: $NODE_ENV" && \
    echo "  NODE_OPTIONS: $NODE_OPTIONS" && \
    echo "  NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL" && \
    echo "  NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL" && \
    echo "  NEXT_TELEMETRY_DISABLED: $NEXT_TELEMETRY_DISABLED" && \
    echo "" && \
    echo "Package files:" && \
    ls -la package*.json && \
    echo "========================================"

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

# Debug: Print Node version and environment before npm run build
RUN echo "========================================" && \
    echo "🔍 DEBUG: PRE-BUILD DIAGNOSTICS" && \
    echo "========================================" && \
    echo "Node.js version: $(node --version)" && \
    echo "NPM version: $(npm --version)" && \
    echo "Working directory: $(pwd)" && \
    echo "" && \
    echo "Environment variables:" && \
    echo "  NODE_ENV: $NODE_ENV" && \
    echo "  NODE_OPTIONS: $NODE_OPTIONS" && \
    echo "  NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL" && \
    echo "  NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL" && \
    echo "  NEXT_TELEMETRY_DISABLED: $NEXT_TELEMETRY_DISABLED" && \
    echo "" && \
    echo "Available memory:" && \
    free -h 2>/dev/null || echo "Memory info not available" && \
    echo "" && \
    echo "Disk space:" && \
    df -h . 2>/dev/null || echo "Disk info not available" && \
    echo "========================================"

# Build Next.js application with verbose output
# Split into separate RUN commands so each step's output is visible
RUN echo "========================================" && \
    echo "🚀 STARTING NEXT.JS BUILD" && \
    echo "========================================"

# Run the build and capture output
RUN npm run build

# Verify build succeeded
RUN echo "========================================" && \
    echo "✅ BUILD COMPLETED - VERIFYING OUTPUT" && \
    echo "========================================" && \
    ls -la .next 2>/dev/null | head -15 || (echo "ERROR: .next directory not found!" && exit 1) && \
    echo "Build verification complete!"

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
