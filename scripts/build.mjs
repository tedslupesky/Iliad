import { mkdir, readFile, copyFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
const catalog = JSON.parse(await readFile(resolve(root, 'iliad/books.json'), 'utf8'));
const files = ['index.html', 'styles.css', 'app.js', 'iliad/books.json'];
for (const entry of catalog.books) {
  if (!/^book-[1-9]\d*\.json$/.test(entry.manifest)) throw new Error('Invalid book path');
  files.push(`iliad/${entry.manifest}`);
  const book = JSON.parse(await readFile(resolve(root, `iliad/${entry.manifest}`), 'utf8'));
  for (const page of book.pages) {
    for (const key of ['greek', 'english', 'commentary']) {
      const path = page[key];
      if (!path) continue;
      if (!/^(greek|english|commentary)\/[1-9]\d*\.\d+\.(txt|json)$/.test(path)) {
        throw new Error(`Invalid reading path: ${path}`);
      }
      files.push(`iliad/${path}`);
    }
  }
}
await rm(output, { recursive: true, force: true });
for (const file of files) {
  const target = resolve(output, file);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(root, file), target);
}
console.log(`Built ${files.length} public files in dist/`);
