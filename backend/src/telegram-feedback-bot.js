/**
 * Snackly — бот обратной связи: ответы на команды + пересылка текста админу (опционально).
 *
 * Переменные окружения:
 *   TELEGRAM_BOT_TOKEN       — токен от @BotFather (обязательно)
 *   TELEGRAM_ADMIN_CHAT_ID   — твой id (через запятую можно несколько); если задан — обычные
 *                              текстовые сообщения дублируются админам
 *
 * Запуск: npm run bot:telegram
 */

const token = process.env.TELEGRAM_BOT_TOKEN;
const adminRaw = process.env.TELEGRAM_ADMIN_CHAT_ID || "";

var INTRO =
  "Напишите сюда:\n" +
  "1️⃣ Вопрос по заказу или товару.\n" +
  "2️⃣ Что вы хотели бы видеть у нас на сайте в ассортименте.\n" +
  "3️⃣ Сообщите об ошибках.\n" +
  "4️⃣ Оставьте отзыв.\n\n" +
  "Рабочее время:\n" +
  "🕖 Пн–Вс: 9:00–21:00";

var REPLIES = {
  start:
    "Привет! Это бот обратной связи Snackly.\n\n" +
    INTRO +
    "\n\n" +
    "Команды: /help — кратко, /order, /ideas, /bug, /review — подсказки по теме.",
  help: "Кратко:\n\n" + INTRO + "\n\nВыберите команду снизу или просто напишите текстом.",
  order:
    "🛒 **Вопрос по заказу или товару**\n\n" +
    "Одним сообщением укажите: что заказывали (или какой товар с сайта), в чём вопрос. " +
    "Если есть номер заказа или дата — напишите тоже.",
  ideas:
    "💡 **Ассортимент**\n\n" +
    "Напишите, какие товары или категории вы хотели бы видеть на сайте Snackly и почему это вам важно.",
  bug:
    "🐛 **Ошибка на сайте**\n\n" +
    "Опишите: что делали, что ожидали и что пошло не так. Если можете — укажите телефон и браузер (например, Safari на iPhone).",
  review:
    "⭐ **Отзыв**\n\n" +
    "Расскажите впечатление о сервисе или товарах. Честные отзывы помогаем нам становиться лучше.",
};

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
    body: JSON.stringify(body),
  }).then(function (r) {
    return r.json();
  });
}

function sendUser(chatId, text, parseMode) {
  var o = {
    chat_id: chatId,
    text: text,
    disable_web_page_preview: true,
  };
  if (parseMode) o.parse_mode = parseMode;
  return api("sendMessage", o);
}

function commandFromMessage(msg) {
  var text = msg.text;
  if (!text || text[0] !== "/") return null;
  var part = text.split(/\s/)[0];
  var cmd = part.indexOf("@") !== -1 ? part.split("@")[0] : part;
  return cmd.slice(1).toLowerCase() || null;
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

function mdToPlainForTelegram(s) {
  return String(s || "").replace(/\*\*/g, "");
}

function main() {
  if (!token || !token.includes(":")) {
    console.error("[telegram-bot] Нужен TELEGRAM_BOT_TOKEN от @BotFather.");
    process.exit(1);
  }

  var admins = adminIds();
  var offset = 0;
  console.log("[telegram-bot] Запущен. Команды: start, help, order, ideas, bug, review.");
  if (admins.length) {
    console.log("[telegram-bot] Пересылка текста админам: да (" + admins.join(", ") + ")");
  } else {
    console.log("[telegram-bot] TELEGRAM_ADMIN_CHAT_ID не задан — пересылки нет, только ответы на команды.");
  }

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
        (data.result || []).forEach(function (u) {
          offset = u.update_id + 1;
          var msg = u.message;
          if (!msg || !msg.chat) return;

          var chatId = msg.chat.id;
          var from = msg.from;
          var text = msg.text;

          var cmd = commandFromMessage(msg);
          if (cmd) {
            var reply = REPLIES[cmd];
            if (reply) {
              var plain = mdToPlainForTelegram(reply);
              sendUser(chatId, plain).catch(function (e) {
                console.error(e);
              });
              return;
            }
            if (cmd === "id" && admins.indexOf(chatId) !== -1) {
              sendUser(chatId, "Ваш chat_id: " + chatId).catch(function (e) {
                console.error(e);
              });
              return;
            }
            sendUser(
              chatId,
              "Такой команды нет. Откройте меню команд или отправьте /help"
            ).catch(function (e) {
              console.error(e);
            });
            return;
          }

          if (!text || !String(text).trim()) {
            sendUser(
              chatId,
              "Пока обрабатываем только текст. Или выберите команду в меню — например /help"
            ).catch(function (e) {
              console.error(e);
            });
            return;
          }

          if (admins.indexOf(chatId) !== -1) {
            return;
          }

          if (!admins.length) {
            sendUser(
              chatId,
              "Спасибо за сообщение! Чтобы оно дошло до команды Snackly, администратору нужно задать TELEGRAM_ADMIN_CHAT_ID на сервере с ботом. Пока можно написать через форму на сайте."
            ).catch(function (e) {
              console.error(e);
            });
            return;
          }

          var adminText =
            "📩 <b>Snackly</b>\n" +
            "От: " +
            formatUserLine(from) +
            "\n\n" +
            escapeHtml(text);

          Promise.all(
            admins.map(function (aid) {
              return api("sendMessage", {
                chat_id: aid,
                text: adminText,
                parse_mode: "HTML",
                disable_web_page_preview: true,
              });
            })
          )
            .then(function () {
              return sendUser(
                chatId,
                "Сообщение отправлено. Ответим в рабочее время (Пн–Вс: 9:00–21:00)."
              );
            })
            .catch(function (err) {
              console.error(err);
              return sendUser(
                chatId,
                "Не удалось доставить сообщение. Попробуйте позже."
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
