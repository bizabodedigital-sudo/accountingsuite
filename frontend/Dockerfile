# Use Debian-based Node image for better compatibility and full logs
FROM node:20-bullseye

# Enable verbose logging
ENV NPM_CONFIG_LOGLEVEL=verbose
ENV NEXT_TELEMETRY_DEBUG=1

# Fail-safe: Verify Dockerfile loaded
RUN echo "✅ Dockerfile loaded successfully"

WORKDIR /app

# Fail-safe: Verify build context has files
RUN echo "📁 Checking build context..." && ls -la || echo "❌ Build context is empty!"

# Copy package.json and install dependencies first (for caching)
COPY package*.json ./
RUN echo "📦 Installing dependencies..." && \
    npm install --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Fail-safe: Verify files were copied
RUN echo "📁 Files in build context:" && \
    ls -la && \
    echo "📁 Source files:" && \
    ls -la src/ 2>/dev/null || echo "❌ src/ directory missing!" && \
    echo "📁 Config files:" && \
    ls -la *.json *.ts *.mjs 2>/dev/null || echo "⚠️ Some config files missing"

# Set build-time environment variables (with defaults)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NODE_ENV=production

# Build the Next.js application
# Increase Node memory limit for build process
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Debug: Verify Node and NPM are working
RUN echo "🔍 Environment check:" && \
    echo "Node: $(node --version)" && \
    echo "NPM: $(npm --version)" && \
    echo "Working directory: $(pwd)" && \
    node -e "console.log('✅ Node is working...')"

# Pre-build checks
RUN echo "🔍 Pre-build checks:" && \
    echo "Next.js config exists: $(test -f next.config.ts && echo 'YES' || echo 'NO')" && \
    echo "PostCSS config exists: $(test -f postcss.config.mjs && echo 'YES' || echo 'NO')" && \
    echo "TypeScript config exists: $(test -f tsconfig.json && echo 'YES' || echo 'NO')" && \
    echo "Package.json scripts:" && \
    cat package.json | grep -A 3 '"scripts"'

# Run the build - let Next.js output go directly to stdout/stderr
RUN echo "🚀 Starting Next.js build..." && \
    npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the production server
CMD ["npm", "start"]
