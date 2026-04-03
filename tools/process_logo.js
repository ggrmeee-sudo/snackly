/**
 * Удаляет чёрный / нейтральный тёмный фон у PNG логотипа → frontend/public/assets/logo.png
 * Запуск: npm run process-logo  (из корня проекта)
 */
const path = require("path");
const fs = require("fs");
const Jimp = require("jimp");

function rgbaForPixel(r, g, b) {
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  const avg = (r + g + b) / 3;
  const mx = Math.max(r, g, b);

  if (spread > 20) {
    return { r, g, b, a: 255 };
  }

  if (mx < 40 && avg < 48) {
    return { r, g, b, a: 0 };
  }

  if (spread <= 8) {
    if (avg < 32) {
      return { r, g, b, a: 0 };
    }
    if (avg < 52) {
      const t = (avg - 28) / 26;
      const a = Math.round(255 * Math.max(0, Math.min(1, t)) ** 1.8);
      return { r, g, b, a };
    }
  }

  return { r, g, b, a: 255 };
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const assetsDir = path.join(root, "frontend", "public", "assets");
  let src = path.join(assetsDir, "logo_src.png");
  if (!fs.existsSync(src)) {
    console.error("Нет файла:", src);
    process.exit(1);
  }
  const dst = path.join(assetsDir, "logo.png");

  const image = await Jimp.read(src);
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const oldA = this.bitmap.data[idx + 3];
    if (oldA === 0) {
      return;
    }
    const { r: nr, g: ng, b: nb, a: na } = rgbaForPixel(r, g, b);
    this.bitmap.data[idx] = nr;
    this.bitmap.data[idx + 1] = ng;
    this.bitmap.data[idx + 2] = nb;
    this.bitmap.data[idx + 3] = Math.min(oldA, na);
  });

  await image.writeAsync(dst);
  console.log("Wrote", dst);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
