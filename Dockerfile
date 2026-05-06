# Stage 1: Build the frontend
FROM node:18-slim AS client-builder
WORKDIR /usr/src/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
# Build with empty VITE_API_URL to use relative paths for API calls
RUN npm run build

# Stage 2: Install backend dependencies
FROM node:18-slim AS server-deps
WORKDIR /usr/src/server
COPY server/package*.json ./
RUN npm install --omit=dev

# Stage 3: Runner
FROM node:18-slim AS runner
WORKDIR /usr/src/app

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production

RUN useradd --create-home --shell /usr/sbin/nologin appuser

# Copy server dependencies
COPY --from=server-deps /usr/src/server/node_modules ./node_modules
# Copy server source
COPY server/ .
# Copy built client to server's public folder (server/src/app.js expects ../public)
COPY --from=client-builder /usr/src/client/dist ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

USER appuser

CMD ["npm", "start"]
