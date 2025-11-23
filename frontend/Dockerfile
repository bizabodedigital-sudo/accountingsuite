# Production Frontend Dockerfile
# Clean, simple, production-ready Next.js build

# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Build arguments (must be set at build time)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000

# Set build-time environment variables (but NOT NODE_ENV yet - we need devDependencies)
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
# Don't set NODE_ENV=production yet - we need devDependencies for TypeScript, Tailwind, etc.
RUN npm install --legacy-peer-deps && \
    npm cache clean --force

# NOW set NODE_ENV=production for the build
ENV NODE_ENV=production

# Copy application source
COPY . .

# Build Next.js application
RUN echo "========================================" && \
    echo "Building Next.js application" && \
    echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" && \
    echo "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}" && \
    echo "NODE_ENV=${NODE_ENV}" && \
    echo "========================================" && \
    npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.* ./

USER nextjs

EXPOSE 3000

# Health check (give Next.js more time to start)
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Next.js (explicitly set host and port)
CMD ["npm", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
