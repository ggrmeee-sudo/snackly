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
const hasBuiltClient = fs.existsSync(path.join(frontendDist, "index.html"));

if (hasBuiltClient) {
  app.use(express.static(frontendDist, { index: "index.html", extensions: ["html"] }));
} else {
  console.warn(
    "[snackly] Нет frontend/dist — запустите сборку: npm run build:client\n" +
      "  В разработке UI: npm run dev:client (Vite, порт 5173)"
  );
}

app.get("/api/health", function (req, res) {
  res.json({ ok: true, service: "snackly" });
});

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
