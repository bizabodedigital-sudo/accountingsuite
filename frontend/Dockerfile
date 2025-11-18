# Use Node 20 for compatibility with Next.js 15+
FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies first (for caching)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Set build-time environment variables (with defaults)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NODE_ENV=production

# Build the Next.js application
# Increase Node memory limit for build process
ENV NODE_OPTIONS="--max-old-space-size=4096"
# Run build - output all errors to stdout so they're visible in logs
RUN echo "=== Starting Next.js build ===" && \
    echo "Node: $(node --version)" && \
    echo "NPM: $(npm --version)" && \
    npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the production server
CMD ["npm", "start"]
