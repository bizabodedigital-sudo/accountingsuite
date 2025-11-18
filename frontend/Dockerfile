# Production-optimized Next.js Dockerfile for Coolify
FROM node:20-bullseye

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy application files
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NODE_ENV=production

# Build the Next.js application
ENV NODE_OPTIONS="--max-old-space-size=4096"
# Run build - errors will be visible in logs
RUN npm run build

# Expose port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]
