# Use a Debian-based image for better compatibility with Next.js & SWC
FROM node:20-bullseye AS builder

WORKDIR /app

# 1) Increase Node memory for build
ENV NODE_OPTIONS="--max-old-space-size=4096"
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

RUN echo "📦 Installing dependencies..." && \
    node -v && npm -v && \
    npm install --legacy-peer-deps

# 4) Copy the rest of the app
COPY . .

# 5) Build the Next.js application with debug info
RUN echo "🚀 Starting Next.js build..." && \
    echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" && \
    echo "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}" && \
    npm run build

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
