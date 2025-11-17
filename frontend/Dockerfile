# Use Node 20 for compatibility with Next.js 15+
FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies first (for caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port Next.js runs on
EXPOSE 3000

# Default command for development
CMD ["npm", "run", "dev"]
