import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const files = {
  '/': ['index.html', 'text/html'],
  '/index.html': ['index.html', 'text/html'],
  '/styles.css': ['styles.css', 'text/css'],
  '/app.js': ['app.js', 'text/javascript'],
  '/iliad/book-5.json': ['iliad/book-5.json', 'application/json'],
  '/iliad/book-6.json': ['iliad/book-6.json', 'application/json'],
  '/iliad/books.json': ['iliad/books.json', 'application/json'],
};
const port = Number(process.env.PORT || 3000);
createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  let file = files[pathname];
  // Only expose reading content, never PDFs, extraction files, or arbitrary paths.
  if (/^\/iliad\/(greek|english)\/[56]\.[1-9]\d*\.txt$/.test(pathname)) {
    file = [pathname.slice(1), 'text/plain'];
  }
  if (/^\/iliad\/commentary\/[56]\.[1-9]\d*\.json$/.test(pathname)) {
    file = [pathname.slice(1), 'application/json'];
  }
  if (!file) { response.writeHead(404); response.end('Not found'); return; }
  try {
    const body = await readFile(new URL(file[0], import.meta.url));
    response.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8`, 'Cache-Control': 'no-cache' });
    response.end(body);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500);
    response.end('Unable to load this page.');
  }
}).listen(port, '127.0.0.1', () => console.log(`Iliad reader: http://localhost:${port}`));
