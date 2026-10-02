FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npx tsc

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "dist/index.js"]
