import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

await cp(path.join(ROOT, "index.html"), path.join(DIST, "index.html"));
await cp(path.join(ROOT, "src"), path.join(DIST, "src"), { recursive: true });
await cp(path.join(ROOT, "public"), DIST, { recursive: true });

const built = await stat(path.join(DIST, "index.html"));
if (!built.isFile()) throw new Error("Production build did not create dist/index.html");

console.log("Static production build completed: dist/");
