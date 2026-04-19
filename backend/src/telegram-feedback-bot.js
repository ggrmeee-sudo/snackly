/**
 * Простой Telegram-бот обратной связи для Snackly.
 *
 * Как завести бота:
 * 1) В Telegram открой @BotFather → /newbot → имя и username → скопируй токен.
 * 2) Узнай свой числовой chat id: напиши боту @userinfobot или @getmyid_bot — пришлёт id.
 *    (Это id получателя: ты как владелец будешь получать сообщения пользователей.)
 * 3) Задай переменные окружения и запусти:
 *    PowerShell:
 *      $env:TELEGRAM_BOT_TOKEN="123456:ABC..."
 *      $env:TELEGRAM_ADMIN_CHAT_ID="123456789"
 *      npm run bot:telegram
 *
 * На сервере (Render и т.п.) добавь те же env и отдельный процесс/Worker с этой командой.
 *
 * Пользователь пишет боту текст — тебе приходит копия; ему бот отвечает «спасибо».
 */

const token = process.env.TELEGRAM_BOT_TOKEN;
const adminRaw = process.env.TELEGRAM_ADMIN_CHAT_ID || "";

function adminIds() {
  return adminRaw
    .split(/[,\s]+/)
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean)
    .map(function (s) {
      return Number(s);
    })
    .filter(function (n) {
      return !Number.isNaN(n);
    });
}

function api(method, body) {
  var url = "https://api.telegram.org/bot" + token + "/" + method;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }).then(function (r) {
    return r.json();
  });
}

function sendUser(chatId, text) {
  return api("sendMessage", {
    chat_id: chatId,
    text: text,
    disable_web_page_preview: true,
  });
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatUserLine(from) {
  if (!from) return "Неизвестно";
  var parts = [];
  if (from.first_name) parts.push(from.first_name);
  if (from.last_name) parts.push(from.last_name);
  var name = parts.join(" ") || "—";
  var un = from.username ? "@" + from.username : "нет username";
  return escapeHtml(name) + " (" + un + "), id: <code>" + from.id + "</code>";
}

function main() {
  if (!token || !token.includes(":")) {
    console.error(
      "[telegram-bot] Задайте TELEGRAM_BOT_TOKEN (токен от @BotFather).\n" +
        "  Пример: $env:TELEGRAM_BOT_TOKEN=\"...\"; npm run bot:telegram"
    );
    process.exit(1);
  }

  var admins = adminIds();
  if (!admins.length) {
    console.error(
      "[telegram-bot] Задайте TELEGRAM_ADMIN_CHAT_ID (ваш числовой id из @userinfobot).\n" +
        "  Пример: $env:TELEGRAM_ADMIN_CHAT_ID=\"123456789\""
    );
    process.exit(1);
  }

  var offset = 0;
  console.log("[telegram-bot] Запущен. Ожидаю сообщения (long polling)…");

  function loop() {
    var url =
      "https://api.telegram.org/bot" +
      token +
      "/getUpdates?timeout=50&allowed_updates=" +
      encodeURIComponent(JSON.stringify(["message"])) +
      (offset ? "&offset=" + offset : "");

    fetch(url)
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data.ok) {
          console.error("[telegram-bot] getUpdates:", data.description || data);
          return setTimeout(loop, 3000);
        }
        var updates = data.result || [];
        updates.forEach(function (u) {
          offset = u.update_id + 1;
          var msg = u.message;
          if (!msg || !msg.chat) return;

          var chatId = msg.chat.id;
          var from = msg.from;
          var text = msg.text;

          if (text && text.startsWith("/")) {
            var cmd = text.split(/\s/)[0].toLowerCase();
            if (cmd === "/start" || cmd === "/help") {
              sendUser(
                chatId,
                "Привет! Это бот обратной связи Snackly.\n\n" +
                  "Напишите сюда текст сообщения — мы передадим его команде сайта. " +
                  "Можно описать вопрос, пожелание или проблему с заказом."
              ).catch(function (e) {
                console.error(e);
              });
              return;
            }
          }

          if (admins.indexOf(chatId) !== -1) {
            return;
          }

          if (!text || !String(text).trim()) {
            sendUser(
              chatId,
              "Пока принимаем только текстовые сообщения. Напишите, пожалуйста, текстом."
            ).catch(function (e) {
              console.error(e);
            });
            return;
          }

          var adminText =
            "📩 <b>Snackly — обратная связь</b>\n" +
            "От: " +
            formatUserLine(from) +
            "\n\n" +
            escapeHtml(text);

          var p = Promise.all(
            admins.map(function (aid) {
              return api("sendMessage", {
                chat_id: aid,
                text: adminText,
                parse_mode: "HTML",
                disable_web_page_preview: true,
              });
            })
          );

          p.then(function () {
            return sendUser(
              chatId,
              "Спасибо! Сообщение получено. Мы ответим вам при необходимости в рабочее время."
            );
          }).catch(function (err) {
            console.error("[telegram-bot] Ошибка отправки:", err);
            return sendUser(
              chatId,
              "Не удалось отправить сообщение. Попробуйте позже или напишите на почту с сайта."
            );
          });
        });

        setImmediate(loop);
      })
      .catch(function (e) {
        console.error("[telegram-bot]", e);
        setTimeout(loop, 4000);
      });
  }

  loop();
}

main();
