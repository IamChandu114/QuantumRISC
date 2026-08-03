import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const studioSrc = resolve(root, "frontend/studio");
const studioDest = resolve(root, "frontend/website/public/studio");

mkdirSync(resolve(studioDest, "static"), { recursive: true });
copyFileSync(
  resolve(studioSrc, "quantumrisc-studio.html"),
  resolve(studioDest, "index.html"),
);
copyFileSync(
  resolve(studioSrc, "backend-bridge.js"),
  resolve(studioDest, "static/backend-bridge.js"),
);

console.log("Synced studio → frontend/website/public/studio");
