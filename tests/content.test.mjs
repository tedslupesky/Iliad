import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../iliad/', import.meta.url);
const text = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await text(path));
const catalog = await json('books.json');

test('catalog has unique books and an available default', () => {
  assert.equal(new Set(catalog.books.map(b => b.number)).size, catalog.books.length);
  assert.ok(catalog.books.some(b => b.number === catalog.defaultBook));
});

for (const entry of catalog.books) {
  test(`Book ${entry.number}: complete paired texts and matching commentary`, async () => {
    const book = await json(entry.manifest);
    assert.equal(book.book, entry.number);
    let expectedLine = 1;
    for (const [index, page] of book.pages.entries()) {
      assert.equal(page.id, `${book.book}.${index + 1}`);
      assert.equal(page.lineStart, expectedLine, `Gap/overlap at ${page.id}`);
      const greek = (await text(page.greek)).trim().split(/\r?\n/);
      assert.equal(greek.length, page.lineEnd - page.lineStart + 1, page.id);
      assert.ok(greek.every(line => line.trim()), `Blank verse at ${page.id}`);
      assert.ok((await text(page.english)).trim(), `Missing English at ${page.id}`);
      const notes = await json(page.commentary);
      assert.equal(notes.id, page.id);
      assert.ok(notes.title && notes.intro && notes.notes.length);
      let previous = 0;
      for (const note of notes.notes) {
        assert.ok(note.lemma && note.text, `Empty note at ${page.id}`);
        assert.match(note.lines, /^\d+(?:–\d+)?(?:,\s*\d+(?:–\d+)?)*$/);
        const numbers = note.lines.match(/\d+/g).map(Number);
        assert.ok(numbers.every(n => n >= page.lineStart && n <= page.lineEnd), `Note outside ${page.id}: ${note.lines}`);
        if (notes.format === 'vocabulary') {
          assert.ok(numbers[0] >= previous, `Notes out of order at ${page.id}`);
          previous = numbers[0];
        }
      }
      expectedLine = page.lineEnd + 1;
    }
    assert.equal(expectedLine - 1, { 5: 909, 6: 529 }[book.book]);
  });
}
