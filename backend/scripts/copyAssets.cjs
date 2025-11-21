const fs = require("fs");
const path = require("path");

const assets = [
  {
    src: path.resolve(__dirname, "../src/lib/geminiTraining.json"),
    dest: path.resolve(__dirname, "../dist/src/lib/geminiTraining.json"),
  },
  {
    src: path.resolve(__dirname, "../src/lib/taskTitleTraining.json"),
    dest: path.resolve(__dirname, "../dist/src/lib/taskTitleTraining.json"),
  },
];

for (const asset of assets) {
  try {
    if (!fs.existsSync(asset.src)) {
      console.warn(`Asset not found: ${asset.src}`);
      continue;
    }

    fs.mkdirSync(path.dirname(asset.dest), { recursive: true });
    fs.copyFileSync(asset.src, asset.dest);
    console.log(`Copied ${asset.src} -> ${asset.dest}`);
  } catch (err) {
    console.error(`Failed to copy asset ${asset.src}`, err);
    process.exitCode = 1;
  }
}
