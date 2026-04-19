# Snackly («Полезные снеки»)

Монорепозиторий: статичный клиент и лёгкий сервер Node.js.

## Структура

| Каталог | Назначение |
|--------|------------|
| **`frontend/`** | Сайт: Vite, Vue 3 (точечно), ES-модули, `index.html`, `public/` (ассеты, `robots.txt`, `sitemap.xml`). |
| **`backend/`** | Express: раздача `frontend/dist`, `GET /api/health`. Скрипт Telegram-бота и ассеты бота в `backend/assets/telegram-bot/`. |

Корневой **`package.json`** — общие команды (`dev`, `build`, `bot:telegram`).

## Команды (из корня репозитория)

```bash
npm install
npm run dev:full      # Express :3000 + Vite :5173
npm run build         # сборка клиента в frontend/dist
npm start             # только Express (нужен собранный frontend/dist)
npm run bot:telegram  # бот (токен в .env в корне, см. backend/env.example)
```

**Публичный сайт (GitHub Pages):** https://ggrmeee-sudo.github.io/snackly/ — после изменений: `npm run build`, затем опубликуйте `frontend/dist` (ветка `gh-pages` или действие в настройках репозитория **Pages**).

**`.cursor/`** — только локально для Cursor; в git не попадает (см. `.gitignore`). Каталог можно удалить у себя на диске, на проект это не влияет.

## Конфигурация бота

Скопируйте `backend/env.example` в **`.env`** в **корне** репозитория (рядом с корневым `package.json`) и заполните переменные.

## Безопасность (кратко)

HTTPS на GitHub Pages выдаёт хостинг. В `backend/src/server.js` для продакшена за прокси: редирект на HTTPS, базовые заголовки (`X-Content-Type-Options`, `X-Frame-Options`, и т.д.). Сессии и корзина в учебном прототипе — в `localStorage` браузера; для боевого магазина нужны сервер и проверка прав.

## Деплой на Render (по желанию)

Сервис **Web**: runtime Node 20+, команда сборки `npm install && npm run build`, старт `npm start`, проверка здоровья `GET /api/health`.
