# Build context: raíz del repositorio (monorepo npm workspaces + Turborepo).
# La imagen usa un Chromium del sistema (instalado vía apt) como navegador
# headless para la generación de constancias en PDF (US-F7), evitando que
# puppeteer descargue su propio navegador dentro de la imagen.

# ---------- Dependencias ----------
FROM node:20-slim AS deps
WORKDIR /app

# puppeteer no debe descargar Chromium aquí: en runtime se usa el del sistema.
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci

# ---------- Compilación ----------
FROM node:20-slim AS build
WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN cd apps/api \
  && npx prisma generate \
  && npm run build

# ---------- Runtime ----------
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV CHROME_EXECUTABLE_PATH=/usr/bin/chromium

# Chromium + dependencias para el modo headless de puppeteer.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnss3 \
    libxkbcommon0 \
    libxshmfence1 \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*
RUN groupadd --system nodeapp && useradd --system --create-home --gid nodeapp nodeapp

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api
USER nodeapp

EXPOSE 3000
CMD ["node", "dist/main"]