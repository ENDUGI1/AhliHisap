/**
 * Rasterize the brand SVGs into PNG app icons.
 * Run: node scripts/gen-icons.mjs
 * Apple / Android "Add to Home Screen" needs raster icons (SVG-only is unreliable).
 */
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");

const tiled = readFileSync(join(pub, "icon.svg"));
const maskable = readFileSync(join(pub, "icon-maskable.svg"));

const jobs = [
  // full-bleed (petrol background) → best for iOS, which rounds corners itself
  { src: maskable, size: 180, out: "apple-touch-icon.png" },
  { src: maskable, size: 192, out: "maskable-192.png" },
  { src: maskable, size: 512, out: "maskable-512.png" },
  // tiled mark for "any" purpose
  { src: tiled, size: 192, out: "icon-192.png" },
  { src: tiled, size: 512, out: "icon-512.png" },
];

for (const j of jobs) {
  await sharp(j.src, { density: 384 })
    .resize(j.size, j.size)
    .png()
    .toFile(join(pub, j.out));
  console.log(`✓ ${j.out} (${j.size}px)`);
}
console.log("icons done");
