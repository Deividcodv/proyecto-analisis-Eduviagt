# Build context: raíz del repositorio (monorepo npm workspaces).
# Next.js se compila con output: 'standalone' (ver apps/web/next.config.js).

# ---------- Dependencias ----------
FROM node:20-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci

# ---------- Compilación ----------
FROM node:20-slim AS build
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN cd apps/web && npx next build

# ---------- Runtime ----------
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN groupadd --system webapp && useradd --system --create-home --gid webapp webapp

# El output standalone incluye el server y las dependencias trazadas.
# En un monorepo, la estructura resultante es <standalone>/apps/web/server.js.
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

USER webapp

EXPOSE 3000
CMD ["node", "apps/web/server.js"]