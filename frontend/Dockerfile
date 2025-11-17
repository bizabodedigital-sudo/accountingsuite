# Use Node 20 for compatibility with Next.js 15+
FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies first (for caching)
COPY package*.json ./
RUN npm ci --only=production=false

# Copy the rest of the app
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the production server
CMD ["npm", "start"]
