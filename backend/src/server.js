/**
 * API и раздача собранного клиента (frontend/dist).
 */
const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();
const port = Number(process.env.PORT) || 3000;

const projectRoot = path.join(__dirname, "..", "..");
const frontendDist = path.join(projectRoot, "frontend", "dist");
const distIndex = path.join(frontendDist, "index.html");
const hasBuiltClient = fs.existsSync(distIndex);

function isLocalHost(host) {
  if (!host) return true;
  var h = String(host).split(":")[0];
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
}

/** Редирект на HTTPS за обратным прокси (Render и т.п.); localhost не трогаем. */
app.use(function (req, res, next) {
  var host = req.get("host");
  if (isLocalHost(host)) return next();
  if (req.secure || req.headers["x-forwarded-proto"] === "https") return next();
  return res.redirect(301, "https://" + host + req.originalUrl);
});

app.use(function (req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

if (hasBuiltClient) {
  app.use(express.static(frontendDist, { index: "index.html", extensions: ["html"] }));
} else {
  console.warn(
    "[snackly] Нет frontend/dist — запустите сборку: npm run build:client\n" +
      "  В разработке UI: npm run dev:client (Vite, порт 5173)"
  );
}

app.get("/api/health", function (req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok: true, service: "snackly", channel: "express" });
});

if (hasBuiltClient) {
  app.get("*", function (req, res, next) {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    var ext = path.extname(req.path || "");
    if (ext && ext !== ".html") return next();
    res.sendFile(distIndex, function (err) {
      if (err) next(err);
    });
  });
}

var host = process.env.HOST || "0.0.0.0";
var server = app.listen(port, host, function () {
  console.log("Snackly: http://localhost:" + port + "  (API: /api/health)");
  if (hasBuiltClient) {
    console.log("  статика: " + frontendDist);
  }
});

server.on("error", function (err) {
  if (err.code === "EADDRINUSE") {
    console.error(
      "Порт " +
        port +
        " занят. Закройте другой сервер на этом порту или запустите с другим портом:\n" +
        "  Windows (cmd):  set PORT=3001 && npm run dev\n" +
        "  PowerShell:     $env:PORT=3001; npm run dev"
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
