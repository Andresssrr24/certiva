import { readFile } from "node:fs/promises";
import http from "node:http";
import { extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../public");
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      const file = resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
      if (!file.startsWith(root + "/")) throw new Error("Invalid path");
      const data = await readFile(file);
      res.writeHead(200, {
        "Content-Type":
          {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css",
            ".js": "text/javascript",
            ".png": "image/png",
            ".svg": "image/svg+xml",
            ".json": "application/json",
          }[extname(file)] || "application/octet-stream",
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("No encontrado");
    }
  })
  .listen(4317, "127.0.0.1", () => console.log("Local: http://127.0.0.1:4317"));
