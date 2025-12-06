# Dockerfile for Node.js Express TypeScript Backend
FROM node:20-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci || npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production || npm install --only=production

# Copy built files from base stage
COPY --from=base /app/dist ./dist

# Create tsconfig for production (map @ to dist)
RUN echo '{ \
  "compilerOptions": { \
    "baseUrl": "./dist", \
    "paths": { \
      "@/*": ["*"] \
    } \
  } \
}' > tsconfig.json

# Install tsconfig-paths
RUN npm install tsconfig-paths

# Expose port
EXPOSE 8080

# Start the server with tsconfig-paths
CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]