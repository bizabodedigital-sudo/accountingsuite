# Production-optimized Next.js Dockerfile for Coolify
# Uses Node 22 to match local development environment (v22.16.0)
FROM node:22-bullseye AS builder

WORKDIR /app

# Build-time environment variables (Coolify can override via Build arguments)
# These MUST be set as ARG before ENV for Next.js to see them at build time
# NOTE: Do NOT include /api here - frontend code adds /api to baseURL automatically
ARG NEXT_PUBLIC_API_URL=https://accountingsuite.bizabodeserver.org
ARG NEXT_PUBLIC_APP_URL=https://accountingsuite.bizabodeserver.org

# Set build-time env vars (required for Next.js build)
# Next.js embeds NEXT_PUBLIC_* vars at build time, so they must be available during npm run build
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Production environment settings
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Debug: Print Node/NPM versions and environment BEFORE npm install
RUN echo "========================================" && \
    echo "🔍 PRE-INSTALL DIAGNOSTICS" && \
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
    echo "Package files present:" && \
    ls -la package*.json && \
    echo "========================================"

# Install ALL dependencies (including devDependencies needed for build)
# CRITICAL: Do NOT use --only=production or --omit=dev here!
# Next.js build requires devDependencies like TypeScript, Tailwind, etc.
RUN npm install --legacy-peer-deps && \
    npm cache clean --force && \
    echo "✅ Dependencies installed successfully"

# Copy application source code
COPY . .

# Clean any existing build artifacts and node_modules to ensure fresh build
# This prevents Turbopack chunks from dev builds from being included
RUN rm -rf .next node_modules/.cache && \
    echo "Cleaned build artifacts and cache"

# Debug: Print Node/NPM versions and environment BEFORE npm run build
RUN echo "========================================" && \
    echo "🔍 PRE-BUILD DIAGNOSTICS" && \
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
    echo "Critical files check:" && \
    echo "  next.config.ts: $(test -f next.config.ts && echo '✅ EXISTS' || echo '❌ MISSING')" && \
    echo "  package.json: $(test -f package.json && echo '✅ EXISTS' || echo '❌ MISSING')" && \
    echo "  src/ directory: $(test -d src && echo '✅ EXISTS' || echo '❌ MISSING')" && \
    echo "  public/ directory: $(test -d public && echo '✅ EXISTS' || echo '❌ MISSING')" && \
    echo "" && \
    echo "Build script from package.json:" && \
    cat package.json | grep -A 3 '"build"' && \
    echo "" && \
    echo "Available memory:" && \
    free -h 2>/dev/null || echo "Memory info not available (this is normal)" && \
    echo "" && \
    echo "Disk space:" && \
    df -h . 2>/dev/null || echo "Disk info not available (this is normal)" && \
    echo "========================================"

# Clean any existing build artifacts (important for production builds)
RUN rm -rf .next && \
    echo "Cleaned any existing build artifacts"

# Build Next.js application
# Run in separate step so we can see the actual error if it fails
RUN echo "========================================" && \
    echo "🚀 STARTING NEXT.JS BUILD" && \
    echo "========================================" && \
    echo "NODE_ENV: $NODE_ENV" && \
    echo "Building with: npm run build" && \
    npm run build || { \
      echo "" && \
      echo "========================================" && \
      echo "❌ BUILD FAILED - ERROR DETAILS" && \
      echo "========================================" && \
      echo "The npm run build command failed with exit code 1." && \
      echo "Check the output above for the actual Next.js error message." && \
      echo "" && \
      echo "Common causes:" && \
      echo "  - Missing or incorrect NEXT_PUBLIC_* environment variables" && \
      echo "  - TypeScript compilation errors" && \
      echo "  - Missing dependencies" && \
      echo "  - Insufficient memory" && \
      echo "" && \
      echo "Checking if .next directory was created:" && \
      ls -la .next 2>/dev/null || echo ".next directory does not exist (build failed early)" && \
      exit 1; \
    }

# Verify build output
RUN echo "========================================" && \
    echo "✅ BUILD COMPLETED - VERIFYING OUTPUT" && \
    echo "========================================" && \
    ls -la .next 2>/dev/null | head -15 || (echo "ERROR: .next directory not found!" && exit 1) && \
    echo "Build verification complete!"

# Production runner stage
FROM node:22-bullseye-slim AS runner

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
COPY --from=builder --chown=nextjs:nodejs /app/next.config.* ./

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use npm start (more forgiving than standalone mode)
CMD ["npm", "start"]
