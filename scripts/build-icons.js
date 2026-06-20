const fs = require("fs");
const path = require("path");

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.log("sharp not installed — skipping PNG icon build");
    return;
  }

  const iconsDir = path.join(__dirname, "..", "icons");
  const jobs = [
    ["icon-192.svg", "icon-192.png", 192],
    ["icon-512.svg", "icon-512.png", 512],
    ["icon-192.svg", "apple-touch-icon.png", 180],
  ];

  for (const [src, dest, size] of jobs) {
    const input = path.join(iconsDir, src);
    const output = path.join(iconsDir, dest);
    if (!fs.existsSync(input)) continue;
    await sharp(input).resize(size, size).png().toFile(output);
    console.log(`Wrote ${dest} (${size}x${size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
