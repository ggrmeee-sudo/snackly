/**
 * Snackly (@SnacklySvetaBot) — ответы на команды + пересылка текста админу (если задан TELEGRAM_ADMIN_CHAT_ID).
 * Токен и id админа — только в корневом .env (файл в .gitignore), см. telegram-bot.env.example
 */

(function loadEnvFile() {
  try {
    var fs = require("fs");
    var path = require("path");
    var p = path.join(__dirname, "..", "..", ".env");
    if (!fs.existsSync(p)) return;
    var raw = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
    raw.split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (!line || line[0] === "#") return;
      var i = line.indexOf("=");
      if (i === -1) return;
      var k = line.slice(0, i).trim();
      var v = line.slice(i + 1).trim();
      if (
        (v.charAt(0) === '"' && v.charAt(v.length - 1) === '"') ||
        (v.charAt(0) === "'" && v.charAt(v.length - 1) === "'")
      ) {
        v = v.slice(1, -1);
      }
      /* Пустая строка в process.env (часто Windows) не даёт подставить значение из .env */
      if (k && (process.env[k] === undefined || process.env[k] === "")) process.env[k] = v;
    });
  } catch (e) {
    /* ignore */
  }
})();

var fs = require("fs");
var path = require("path");

const token = process.env.TELEGRAM_BOT_TOKEN;
const adminRaw = process.env.TELEGRAM_ADMIN_CHAT_ID || "";

/** Логотип — аватар бота (setMyProfilePhoto); иллюстрация — к /start (sendPhoto) */
var ASSET_DIR = path.join(__dirname, "..", "assets", "telegram-bot");
var BOT_AVATAR_PNG = path.join(ASSET_DIR, "bot-profile-logo.png");
var START_WELCOME_PNG = path.join(ASSET_DIR, "start-welcome.png");

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
    "Команды: /help, /order, /ideas, /bug, /review.",
  help: "Кратко:\n\n" + INTRO + "\n\nМожно выбрать команду в меню или написать текстом.",
  order:
    "🛒 Вопрос по заказу или товару\n\n" +
    "Одним сообщением: что заказывали или какой товар, в чём вопрос. Номер заказа и дата — если есть.",
  ideas:
    "💡 Ассортимент\n\n" +
    "Напишите, что хотели бы видеть на сайте Snackly и зачем вам это.",
  bug:
    "🐛 Ошибка на сайте\n\n" +
    "Что делали, что ожидали, что пошло не так. По возможности: браузер и телефон/ПК.",
  review:
    "⭐ Отзыв\n\n" +
    "Поделитесь впечатлением о сервисе или товарах.",
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

function sendUser(chatId, text) {
  return api("sendMessage", {
    chat_id: chatId,
    text: text,
    disable_web_page_preview: true,
  });
}

/**
 * multipart/form-data вручную — в Node fetch+FormData+Blob Telegram часто не видит файл
 * («photo isn't specified»).
 */
function multipartPost(url, fieldParts) {
  var boundary = "----SnacklyForm" + String(Math.random()).replace(/\D/g, "").slice(0, 12);
  var chunks = [];
  fieldParts.forEach(function (p) {
    chunks.push(Buffer.from("--" + boundary + "\r\n", "utf8"));
    if (p.buffer) {
      var fn = String(p.filename || "file.png").replace(/["\r\n]/g, "");
      var ct = p.contentType || "application/octet-stream";
      chunks.push(
        Buffer.from(
          'Content-Disposition: form-data; name="' +
            p.name +
            '"; filename="' +
            fn +
            '"\r\nContent-Type: ' +
            ct +
            "\r\n\r\n",
          "utf8"
        )
      );
      chunks.push(p.buffer);
      chunks.push(Buffer.from("\r\n", "utf8"));
    } else {
      chunks.push(
        Buffer.from(
          'Content-Disposition: form-data; name="' + p.name + '"\r\n\r\n',
          "utf8"
        )
      );
      chunks.push(Buffer.from(String(p.value), "utf8"));
      chunks.push(Buffer.from("\r\n", "utf8"));
    }
  });
  chunks.push(Buffer.from("--" + boundary + "--\r\n", "utf8"));
  var body = Buffer.concat(chunks);
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "multipart/form-data; boundary=" + boundary },
    body: body,
  }).then(function (r) {
    return r.json();
  });
}

/** Отправка локального PNG в чат (подпись до 1024 символов) */
function sendPhotoFile(chatId, filePath, caption) {
  var buf = fs.readFileSync(filePath);
  var fn = path.basename(filePath);
  var parts = [
    { name: "chat_id", value: String(chatId) },
    { name: "photo", buffer: buf, filename: fn, contentType: "image/png" },
  ];
  if (caption) {
    var cap = caption.length > 1024 ? caption.slice(0, 1021) + "…" : caption;
    parts.push({ name: "caption", value: cap });
  }
  return multipartPost("https://api.telegram.org/bot" + token + "/sendPhoto", parts);
}

/** Аватар бота в Telegram */
function setBotProfilePhotoFromFile(filePath) {
  var buf = fs.readFileSync(filePath);
  var fn = path.basename(filePath);
  return multipartPost("https://api.telegram.org/bot" + token + "/setMyProfilePhoto", [
    { name: "photo", buffer: buf, filename: fn, contentType: "image/png" },
  ]);
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

function main() {
  if (!token || !token.includes(":")) {
    console.error(
      "[telegram-bot] Создайте в корне проекта файл .env с TELEGRAM_BOT_TOKEN=... (см. telegram-bot.env.example)"
    );
    process.exit(1);
  }

  var admins = adminIds();
  var offset = 0;
  console.log("[telegram-bot] SnacklySvetaBot — long polling…");
  if (admins.length) {
    console.log("[telegram-bot] Пересылка админам: " + admins.join(", "));
  } else {
    console.log("[telegram-bot] TELEGRAM_ADMIN_CHAT_ID пуст — пересылки нет. Команды работают.");
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
            if (cmd === "start") {
              if (fs.existsSync(START_WELCOME_PNG)) {
                sendPhotoFile(chatId, START_WELCOME_PNG, REPLIES.start)
                  .then(function (res) {
                    if (!res.ok) {
                      console.error("[telegram-bot] sendPhoto:", res.description || res);
                      return sendUser(chatId, REPLIES.start);
                    }
                  })
                  .catch(function (e) {
                    console.error(e);
                    return sendUser(chatId, REPLIES.start);
                  });
              } else {
                sendUser(chatId, REPLIES.start).catch(function (e) {
                  console.error(e);
                });
              }
              return;
            }
            var reply = REPLIES[cmd];
            if (reply) {
              sendUser(chatId, reply).catch(function (e) {
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
            sendUser(chatId, "Неизвестная команда. Попробуйте /help").catch(function (e) {
              console.error(e);
            });
            return;
          }

          if (!text || !String(text).trim()) {
            sendUser(
              chatId,
              "Пока принимаем только текст. Или откройте меню команд (кнопка рядом с полем ввода)."
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
              "Спасибо! Чтобы сообщение дошло до команды Snackly, владелец должен добавить TELEGRAM_ADMIN_CHAT_ID в файл .env на компьютере, где запущен бот. В .env можно узнать свой id: напишите боту @userinfobot."
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
              return sendUser(chatId, "Не удалось отправить. Попробуйте позже.");
            });
        });

        setImmediate(loop);
      })
      .catch(function (e) {
        console.error("[telegram-bot]", e);
        setTimeout(loop, 4000);
      });
  }

  fetch("https://api.telegram.org/bot" + token + "/deleteWebhook")
    .then(function () {
      if (fs.existsSync(BOT_AVATAR_PNG)) {
        return setBotProfilePhotoFromFile(BOT_AVATAR_PNG).then(function (j) {
          if (j && j.ok) {
            console.log("[telegram-bot] Аватар бота обновлён из bot-profile-logo.png");
          } else if (j) {
            console.warn(
              "[telegram-bot] setMyProfilePhoto: " +
                (j.description || JSON.stringify(j)) +
                " — при необходимости задайте фото в @BotFather: /setuserpic"
            );
          }
        });
      }
      console.warn("[telegram-bot] Нет файла " + BOT_AVATAR_PNG + " — аватар не менялся.");
      return Promise.resolve();
    })
    .catch(function (e) {
      console.error("[telegram-bot] deleteWebhook / аватар:", e);
    })
    .finally(function () {
      loop();
    });
}

main();
