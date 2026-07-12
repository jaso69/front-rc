# ── Builder: compila el editor React con Vite ──
FROM node:22-slim AS builder
WORKDIR /app

# Instala dependencias (cacheable)
COPY package.json package-lock.json ./
RUN npm ci

# Copia lo mínimo necesario para compilar el editor
COPY tsconfig.json tsconfig.refs.json vite.config.ts ./
COPY editor/ ./editor/
COPY src/ ./src/

RUN npm run build:editor

# ── Runtime: sirve editor + API + diseños generados ──
FROM node:22-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

# El backend corre con tsx (devDependency) Ejecuta TypeScript directamente,
# así que copiamos node_modules del builder que ya tiene tsx instalado.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist-editor ./dist-editor
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY src/ ./src/

# Directorios de datos en tiempo de ejecución (se montan como volúmenes)
RUN mkdir -p data/designs data/assets generated

EXPOSE 3000

CMD ["npm", "start"]