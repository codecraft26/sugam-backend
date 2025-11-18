ARG NODE_IMAGE=node:20-alpine

FROM ${NODE_IMAGE} AS base
WORKDIR /app
ENV CI=true

FROM base AS deps
COPY package*.json ./
# Install only the dependencies needed to run the app
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS builder
COPY package*.json ./
# Install full dependency tree (includes devDeps for TypeScript build)
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

# Copy production dependencies and compiled sources
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server.js"]

