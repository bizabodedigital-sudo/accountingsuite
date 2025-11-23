# Simple Frontend Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Build arguments
ARG NEXT_PUBLIC_API_URL=https://api.accountingsuites.bizabodeserver.org
ARG NEXT_PUBLIC_APP_URL=https://accountingsuites.bizabodeserver.org

# Environment variables
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for build)
RUN npm install --legacy-peer-deps && \
    npm cache clean --force

# Copy source
COPY . .

# Build
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy files
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.* ./

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start
CMD ["npm", "start"]
