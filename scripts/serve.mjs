import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.argv[2] ?? "source";
const port = Number(process.argv[3] ?? (mode === "dist" ? 4173 : 5173));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".csv": "text/csv; charset=utf-8"
};

function sourcePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  if (mode === "dist") return path.join(ROOT, "dist", clean === "/" ? "index.html" : clean.slice(1));
  if (clean === "/") return path.join(ROOT, "index.html");
  if (clean.startsWith("/src/")) return path.join(ROOT, clean.slice(1));
  if (clean.startsWith("/data/") || clean.startsWith("/assets/")) return path.join(ROOT, "public", clean.slice(1));
  return null;
}

const server = http.createServer(async (req, res) => {
  try {
    const filePath = sourcePath(req.url ?? "/");
    if (!filePath) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not a file");
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`${mode === "dist" ? "Preview" : "Development"} server: http://127.0.0.1:${port}`);
});
