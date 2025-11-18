# Use a Debian-based image for better compatibility with Next.js & SWC
FROM node:20-bullseye AS builder

# Force output to be unbuffered so logs appear immediately
ENV PYTHONUNBUFFERED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /app

# Verify Dockerfile is being executed
RUN echo "========================================" && \
    echo "✅ Dockerfile is executing" && \
    echo "========================================" && \
    node --version && \
    npm --version && \
    pwd && \
    ls -la || echo "Directory is empty"

# 1) Increase Node memory for build
ENV NODE_ENV=production

# 2) Build-time env vars with sensible defaults
# Coolify can override these via "Build arguments"
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000

# Expose them to Next.js at build time
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# 3) Copy package manifests and install deps
COPY package*.json ./

# Optional: more verbose NPM logs to see issues
ENV NPM_CONFIG_LOGLEVEL=info

RUN echo "========================================" && \
    echo "📦 Installing dependencies..." && \
    echo "Node version: $(node -v)" && \
    echo "NPM version: $(npm -v)" && \
    echo "Working directory: $(pwd)" && \
    echo "Files before install:" && \
    ls -la && \
    echo "========================================" && \
    npm install --legacy-peer-deps && \
    echo "✅ Dependencies installed successfully" && \
    echo "Files after install:" && \
    ls -la node_modules 2>/dev/null | head -5 || echo "node_modules not found"

# 4) Copy the rest of the app
COPY . .

# 5) Build the Next.js application with debug info
RUN echo "========================================" && \
    echo "🚀 Starting Next.js build..." && \
    echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" && \
    echo "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}" && \
    echo "NODE_ENV=${NODE_ENV}" && \
    echo "NODE_OPTIONS=${NODE_OPTIONS}" && \
    echo "Files in app directory:" && \
    ls -la | head -10 && \
    echo "Checking for next.config:" && \
    ls -la next.config.* 2>/dev/null || echo "No next.config found" && \
    echo "Checking for src directory:" && \
    ls -la src/ 2>/dev/null | head -5 || echo "src/ not found" && \
    echo "========================================" && \
    npm run build || ( \
      echo "========================================" && \
      echo "❌ BUILD FAILED" && \
      echo "=== npm build failed, dumping logs ===" && \
      find ~/.npm/_logs -type f -maxdepth 1 -print -exec cat {} \; 2>/dev/null || echo "No npm logs found" && \
      echo "Checking for error details..." && \
      ls -la .next 2>/dev/null || echo "No .next directory" && \
      cat package.json | grep -A 3 '"build"' && \
      echo "========================================" && \
      exit 1 \
    )

# 6) Run stage (you can keep single-stage if you want)
FROM node:20-bullseye AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built app from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.* ./ || true

EXPOSE 3000

CMD ["npm", "start"]
