// Serves dist/ the way GitHub Pages does: /features → features.html, /routes/ → routes/index.html,
// unknown paths → 404.html with status 404. Used by the Playwright web server.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = 'dist';
const port = Number(process.argv[2] ?? 4322);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.xml': 'application/xml', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();

function resolve(pathname) {
  const base = normalize(join(root, decodeURIComponent(pathname)));
  if (!base.startsWith(root)) return null;
  for (const candidate of [base, `${base}.html`, join(base, 'index.html')]) if (isFile(candidate)) return candidate;
  return null;
}

createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const file = resolve(pathname);
  const status = file ? 200 : 404;
  const path = file ?? join(root, '404.html');
  res.writeHead(status, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
  createReadStream(path).pipe(res);
}).listen(port, () => console.log(`serving ${root}/ on http://localhost:${port}`));
