# Сборка и запуск Snackly (Express + статика из frontend/dist)
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY frontend/package.json frontend/package-lock.json* ./frontend/

RUN npm ci 2>/dev/null || npm install
RUN cd frontend && (npm ci 2>/dev/null || npm install)

COPY . .
RUN npm run build:client

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "backend/src/server.js"]
