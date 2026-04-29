FROM oven/bun:1.2.22-alpine AS builder

WORKDIR /app

# Install dependencies first (caching layer)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy the rest of the source and build
COPY . .
RUN bun run build

# Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install Chromium and dependencies for whatsapp-web.js/puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use the installed Chromium instead of downloading
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Copy package.json and install production dependencies (for native bindings if any)
COPY package.json ./
RUN npm install --omit=dev

# Copy the bundled server from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads && chown -R node:node uploads

EXPOSE 5000

# Start the server using node as specified in package.json
CMD ["node", "dist/server.js"]
