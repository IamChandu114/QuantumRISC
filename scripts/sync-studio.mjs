import { cpSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const studioSrc = resolve(root, "frontend/studio");
const studioDest = resolve(root, "frontend/website/public/studio");

// 1. Install and Build the new Studio SPA
console.log("Installing studio dependencies...");
execSync("npm install", { cwd: studioSrc, stdio: "inherit" });

console.log("Building studio SPA...");
execSync("npm run build", { cwd: studioSrc, stdio: "inherit" });

// 2. Copy the dist folder to the website's public/studio folder
console.log("Copying studio build to website public folder...");
rmSync(studioDest, { recursive: true, force: true });
cpSync(resolve(studioSrc, "dist"), studioDest, { recursive: true });

console.log("Successfully synced studio → frontend/website/public/studio");
