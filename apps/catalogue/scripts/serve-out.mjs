// Serves the static export in out/ the way a static host would, for checking
// a production build locally:  pnpm --filter @dtc/catalogue preview
import { createReadStream, existsSync, statSync } from "fs"
import { createServer } from "http"
import path from "path"

const root = path.resolve("out")
const port = Number(process.env.PORT ?? 8100)
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".woff2": "font/woff2",
}

if (!existsSync(root)) {
  console.error("out/ not found. Run `pnpm --filter @dtc/catalogue build` first.")
  process.exit(1)
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost")
  let file = path.join(root, decodeURIComponent(url.pathname))
  if (!file.startsWith(root)) {
    res.writeHead(403).end()
    return
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html")
  if (!existsSync(file)) file = path.join(root, "404.html")
  const status = file.endsWith("404.html") && !url.pathname.endsWith("404.html") ? 404 : 200
  res.writeHead(status, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" })
  createReadStream(file).pipe(res)
}).listen(port, () => console.log(`Serving out/ on http://localhost:${port}`))
