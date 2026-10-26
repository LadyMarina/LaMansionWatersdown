// Servidor estático SOLO para pruebas locales. Emula el comportamiento de
// GitHub Pages / Netlify: sirve archivos existentes y, ante cualquier ruta
// inexistente, devuelve 404.html con código 404. Además fuerza la distinción
// de mayúsculas/minúsculas (como el hosting Linux) para probar bien el router.
import http from 'node:http';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.ics': 'text/calendar; charset=utf-8', '.css': 'text/css' };

// Comprobación sensible a mayúsculas, segmento a segmento (emula Linux)
function resolveCaseSensitive(urlPath) {
  const parts = urlPath.split('/').filter(Boolean);
  let cur = root;
  for (const part of parts) {
    if (!existsSync(cur)) return null;
    const entries = readdirSync(cur);
    if (!entries.includes(part)) return null; // distingue mayúsc./minúsc.
    cur = join(cur, part);
  }
  return cur;
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let f = resolveCaseSensitive(urlPath);
  if (f && statSync(f).isDirectory()) {
    const idx = join(f, 'index.html');
    f = existsSync(idx) ? idx : null;
  }
  if (f && existsSync(f) && statSync(f).isFile()) {
    res.writeHead(200, { 'Content-Type': types[extname(f)] || 'application/octet-stream' });
    return res.end(readFileSync(f));
  }
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(readFileSync(join(root, '404.html')));
}).listen(8099, () => console.log('Servidor de pruebas en http://localhost:8099'));
