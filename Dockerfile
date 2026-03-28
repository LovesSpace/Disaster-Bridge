# Use Node.js for both building and running
FROM node:20-slim AS base

# --- Stage 1: Build the client ---
FROM base AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# --- Stage 2: Final image ---
FROM base
WORKDIR /app

# Copy server package files and install production dependency
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --production

# Return to root and copy logic
WORKDIR /app
COPY server/ ./server/
# Copy built client from the first stage into the server's expected path
COPY --from=client-build /app/client/dist ./client/dist

# Expose port and start
EXPOSE 8080
ENV PORT=8080

CMD ["node", "server/server.js"]
