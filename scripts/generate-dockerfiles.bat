@echo off
REM Generate Dockerfiles from docker-compose definitions

REM Backend Dockerfile
(
echo FROM node:20-alpine
echo RUN apk add --no-cache curl
echo WORKDIR /app
echo COPY package*.json ./
echo RUN npm install
echo COPY . .
echo RUN addgroup -g 1001 -S nodejs ^&^& \
echo     adduser -S nodejs -u 1001 ^&^& \
echo     chown -R nodejs:nodejs /app
echo USER nodejs
echo EXPOSE 3001
echo CMD ["npm", "start"]
) > backend\Dockerfile

REM Frontend Dockerfile
(
echo FROM node:22-bullseye AS builder
echo WORKDIR /app
echo ARG NEXT_PUBLIC_API_URL=https://accountingsuite.bizabodeserver.org/api
echo ARG NEXT_PUBLIC_APP_URL=https://accountingsuite.bizabodeserver.org
echo ENV NEXT_PUBLIC_API_URL=%%NEXT_PUBLIC_API_URL%%
echo ENV NEXT_PUBLIC_APP_URL=%%NEXT_PUBLIC_APP_URL%%
echo ENV NODE_ENV=production
echo ENV NODE_OPTIONS="--max-old-space-size=4096"
echo ENV NEXT_TELEMETRY_DISABLED=1
echo COPY package*.json ./
echo RUN npm install --legacy-peer-deps ^&^& npm cache clean --force
echo COPY . .
echo RUN npm run build
echo FROM node:22-bullseye-slim AS runner
echo WORKDIR /app
echo ENV NODE_ENV=production
echo ENV NEXT_TELEMETRY_DISABLED=1
echo RUN groupadd --system --gid 1001 nodejs ^&^& \
echo     useradd --system --uid 1001 nextjs
echo COPY --from=builder /app/package*.json ./
echo COPY --from=builder /app/public ./public
echo COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
echo COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
echo COPY --from=builder --chown=nextjs:nodejs /app/next.config.* ./
echo USER nextjs
echo EXPOSE 3000
echo ENV PORT=3000
echo ENV HOSTNAME="0.0.0.0"
echo CMD ["npm", "start"]
) > frontend\Dockerfile

echo Dockerfiles generated successfully!
