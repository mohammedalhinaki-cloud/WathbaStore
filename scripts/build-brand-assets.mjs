// ============================================================
// معون — توليد أصول العلامة النقطية (PNG) من مصادر SVG
// ------------------------------------------------------------
// يقرأ ملفات SVG في public/ (mark / icon / logo / og-image)
// ويعيد توليد ملفات PNG المقابلة بنفس المقاسات المتوقعة في
// app/layout.tsx و components/site/site-json-ld.tsx:
//   favicon-16x16.png, favicon-32x32.png, icon.png (512),
//   apple-touch-icon.png (180), logo.png (512), og-image.png (1200x630)
//
// الاستخدام: node scripts/build-brand-assets.mjs
// يعتمد على sharp (متوفر ضمن اعتماديات next).
// ============================================================

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = (f) => path.join(root, "public", f);

const read = (f) => readFileSync(pub(f));

const jobs = [
  { src: "icon.svg", out: "favicon-16x16.png", width: 16, height: 16 },
  { src: "icon.svg", out: "favicon-32x32.png", width: 32, height: 32 },
  { src: "icon.svg", out: "icon.png", width: 512, height: 512 },
  { src: "icon.svg", out: "apple-touch-icon.png", width: 180, height: 180 },
  { src: "logo.svg", out: "logo.png", width: 512, height: 512 },
  { src: "og-image.svg", out: "og-image.png", width: 1200, height: 630 },
];

for (const job of jobs) {
  await sharp(read(job.src), { density: 384 })
    .resize(job.width, job.height)
    .png()
    .toFile(pub(job.out));
  console.log(`✓ public/${job.out} (${job.width}x${job.height})`);
}

console.log("done");
