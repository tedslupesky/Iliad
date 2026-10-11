const $ = (id) => document.getElementById(id);
const contentRoot = '/iliad/';
const cache = new Map();
let book;
let currentPage = -1;
let busy = false;
let requestVersion = 0;
let retryAction;

async function getText(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  const text = await response.text();
  if (!text.trim()) throw new Error(`Empty reading page: ${path}`);
  return text;
}

function loadPair(page) {
  if (!cache.has(page.id)) {
    const request = Promise.all([getText(contentRoot + page.greek), getText(contentRoot + page.english)])
      .then(([greek, english]) => ({
        greek: greek.trim().split(/\r?\n/).filter(Boolean),
        english: english.trim().split(/\r?\n\s*\r?\n/),
      }))
      .catch((error) => { cache.delete(page.id); throw error; });
    cache.set(page.id, request);
  }
  return cache.get(page.id);
}

function updateControls() {
  $('previous').disabled = busy || currentPage <= 0;
  $('next').disabled = busy || !book || currentPage >= book.pages.length - 1 || currentPage < 0;
  $('reading-layout').setAttribute('aria-busy', String(busy));
}

function showError(message, action) {
  $('error-message').textContent = message;
  $('reading-error').hidden = false;
  retryAction = action;
}

function render(page, content) {
  $('greek-range').textContent = `Lines ${page.lineStart}–${page.lineEnd} · p. ${page.greekPrintedPage}`;
  $('english-range').textContent = `p. ${page.englishPrintedPage}`;
  $('greek-text').replaceChildren(...content.greek.map((text, index) => {
    const line = document.createElement('div');
    line.className = 'verse';
    const number = document.createElement('span');
    number.className = 'verse-number';
    number.textContent = page.lineStart + index;
    number.setAttribute('aria-hidden', 'true');
    const verse = document.createElement('span');
    verse.className = 'verse-text';
    verse.textContent = text;
    line.append(number, verse);
    return line;
  }));
  $('english-text').replaceChildren(...content.english.map((text) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    return paragraph;
  }));
  $('page-status').textContent = `${page.id} · Page ${currentPage + 1} of ${book.pages.length}`;
  $('progress-fill').style.width = `${((currentPage + 1) / book.pages.length) * 100}%`;
  $('source-link').href = page.sourceUrl;
  $('source-link').hidden = false;
  document.title = `The Iliad · Book V · ${page.id}`;
}

async function showPage(index, { updateHash = true, scroll = false } = {}) {
  if (!book || index < 0 || index >= book.pages.length) return;
  const version = ++requestVersion;
  const page = book.pages[index];
  busy = true;
  $('reading-error').hidden = true;
  updateControls();
  try {
    const content = await loadPair(page);
    if (version !== requestVersion) return;
    currentPage = index;
    render(page, content);
    if (updateHash) history.replaceState(null, '', `#${page.id}`);
    if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
  } catch (error) {
    if (version !== requestVersion) return;
    console.error(error);
    showError(`Couldn’t load page ${page.id}. Please try again.`, () => showPage(index, { updateHash, scroll }));
    if (currentPage < 0) $('page-status').textContent = 'Page unavailable';
  } finally {
    if (version === requestVersion) { busy = false; updateControls(); }
  }
}

function turnPage(direction) {
  if (busy || currentPage < 0) return;
  showPage(currentPage + direction, { scroll: true });
}

function setTranslation(open) {
  $('translation').hidden = !open;
  $('reading-layout').classList.toggle('with-english', open);
  $('translation-toggle').setAttribute('aria-expanded', String(open));
  $('translation-toggle').querySelector('span').textContent = open ? 'Hide English' : 'Show English';
}

function indexFromHash() {
  const index = book.pages.findIndex((page) => `#${page.id}` === location.hash);
  return index < 0 ? 0 : index;
}

async function initialize() {
  busy = true;
  $('reading-error').hidden = true;
  $('page-status').textContent = 'Loading Book V…';
  updateControls();
  try {
    book = JSON.parse(await getText('/iliad/book-5.json'));
    if (!Array.isArray(book.pages) || !book.pages.length) throw new Error('Book has no pages');
    await showPage(indexFromHash());
  } catch (error) {
    busy = false;
    updateControls();
    $('page-status').textContent = 'Book unavailable';
    showError('Couldn’t load Book V. Please try again.', initialize);
    console.error(error);
  }
}

$('previous').addEventListener('click', () => turnPage(-1));
$('next').addEventListener('click', () => turnPage(1));
$('retry').addEventListener('click', () => retryAction?.());
$('translation-toggle').addEventListener('click', () => setTranslation($('translation').hidden));
$('close-translation').addEventListener('click', () => {
  setTranslation(false);
  $('translation-toggle').focus();
});
window.addEventListener('hashchange', () => { if (book) showPage(indexFromHash(), { scroll: true }); });
document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    turnPage(event.key === 'ArrowLeft' ? -1 : 1);
  }
  if (event.key === 'Escape' && !$('translation').hidden) {
    setTranslation(false);
    $('translation-toggle').focus();
  }
});
initialize();
