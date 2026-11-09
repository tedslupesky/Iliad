const $ = (id) => document.getElementById(id);
const contentRoot = '/iliad/';
const cache = new Map();
let book;
let catalog;
let bookLoadVersion = 0;
let currentPage = -1;
let busy = false;
let requestVersion = 0;
let retryAction;
let commentaryVersion = 0;
const commentaryCache = new Map();

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
  renderCommentary(page);
  const entry = catalog.books.find((entry) => entry.number === book.book);
  $('chapter-title').textContent = book.title;
  $('book-select').value = String(book.book);
  document.title = `The Iliad · ${entry.label} · ${page.id}`;
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

const paneKey = 'iliad-pane';
const pane = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(paneKey));
    if (saved && typeof saved.open === 'boolean' && ['notes', 'english'].includes(saved.view)) return saved;
  } catch {}
  return { open: false, view: 'notes' };
})();

function applyPane() {
  const notes = pane.view === 'notes';
  $('companion').hidden = !pane.open;
  $('commentary').hidden = !notes;
  $('translation').hidden = notes;
  $('reading-layout').classList.toggle('with-pane', pane.open);
  $('pane-toggle').setAttribute('aria-expanded', String(pane.open));
  $('pane-toggle').querySelector('span').textContent = pane.open ? 'Hide pane' : 'Show pane';
  $('view-notes').setAttribute('aria-pressed', String(notes));
  $('view-english').setAttribute('aria-pressed', String(!notes));
  try { localStorage.setItem(paneKey, JSON.stringify(pane)); } catch {}
}

function setPane(changes) {
  Object.assign(pane, changes);
  applyPane();
}

// Keyboard shortcut: open the pane on this view, or close it if the view is already showing.
function toggleView(view) {
  setPane(pane.open && pane.view === view ? { open: false } : { open: true, view });
}

async function renderCommentary(page) {
  const version = ++commentaryVersion;
  const container = $('commentary-text');
  $('commentary-range').textContent = `${page.id} · Lines ${page.lineStart}–${page.lineEnd}`;
  $('commentary').scrollTop = 0;
  $('translation').scrollTop = 0;
  container.replaceChildren();
  container.setAttribute('aria-busy', 'false');
  if (!page.commentary) {
    container.textContent = 'Commentary hasn’t been added to this page yet.';
    return;
  }
  container.textContent = 'Loading notes…';
  container.setAttribute('aria-busy', 'true');
  try {
    let notes = commentaryCache.get(page.id);
    if (!notes) {
      notes = JSON.parse(await getText(contentRoot + page.commentary));
      if (notes.id !== page.id || !Array.isArray(notes.notes)) throw new Error('Mismatched commentary');
      commentaryCache.set(page.id, notes);
    }
    if (version !== commentaryVersion) return;
    const element = (tag, text, className) => {
      const el = document.createElement(tag);
      el.textContent = text;
      if (className) el.className = className;
      return el;
    };
    container.replaceChildren(element('h3', notes.title), element('p', notes.intro, 'commentary-intro'));
    const compact = notes.format === 'vocabulary';
    const noteList = compact ? element('ul', '', 'vocabulary-notes') : container;
    if (compact) container.append(noteList);
    for (const note of notes.notes) {
      const section = document.createElement(compact ? 'li' : 'section');
      section.className = 'commentary-entry';
      if (compact) {
        section.append(element('span', note.lines, 'note-lines'), document.createTextNode(' · '), element('strong', note.lemma), document.createTextNode(` — ${note.text}`));
      } else {
        section.append(element('span', `${/^\d+$/.test(note.lines) ? 'Line' : 'Lines'} ${note.lines}`, 'note-lines'), element('h4', note.lemma), element('p', note.text));
      }
      noteList.append(section);
    }
    const sources = element('div', '', 'commentary-sources');
    sources.append(element('h4', 'References'));
    for (const source of notes.sources || []) {
      const link = element('a', source.title);
      const url = new URL(source.url);
      if (url.protocol !== 'https:') continue;
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      sources.append(link);
    }
    container.append(sources);
  } catch (error) {
    if (version !== commentaryVersion) return;
    container.textContent = 'Couldn’t load these notes. ';
    const retry = document.createElement('button');
    retry.textContent = 'Try again';
    retry.addEventListener('click', () => renderCommentary(page));
    container.append(retry);
    console.error(error);
  } finally {
    if (version === commentaryVersion) container.setAttribute('aria-busy', 'false');
  }
}

function indexFromHash() {
  const index = book.pages.findIndex((page) => `#${page.id}` === location.hash);
  return index < 0 ? 0 : index;
}

async function initialize() {
  const version = ++bookLoadVersion;
  ++requestVersion;
  ++commentaryVersion;
  busy = true;
  $('reading-error').hidden = true;
  $('page-status').textContent = 'Loading…';
  updateControls();
  try {
    if (!catalog) {
      catalog = JSON.parse(await getText('/iliad/books.json'));
      $('book-select').replaceChildren(...catalog.books.map((entry) => new Option(entry.label, entry.number)));
    }
    if (version !== bookLoadVersion) return;
    const requested = Number(location.hash.match(/^#(\d+)\.\d+$/)?.[1]);
    const entry = catalog.books.find((entry) => entry.number === requested)
      || catalog.books.find((entry) => entry.number === catalog.defaultBook);
    if (!book || book.book !== entry.number) {
      currentPage = -1;
      book = undefined;
      $('greek-text').replaceChildren();
      $('english-text').replaceChildren();
      $('commentary-text').replaceChildren();
      $('greek-range').textContent = '';
      $('english-range').textContent = '';
      $('commentary-range').textContent = '';
      $('source-link').hidden = true;
      $('chapter-title').textContent = `Loading ${entry.label}…`;
      const loaded = JSON.parse(await getText(contentRoot + entry.manifest));
      if (version !== bookLoadVersion) return;
      if (loaded.book !== entry.number || !Array.isArray(loaded.pages) || !loaded.pages.length) throw new Error('Invalid book');
      book = loaded;
    }
    $('book-select').disabled = false;
    await showPage(indexFromHash());
  } catch (error) {
    if (version !== bookLoadVersion) return;
    busy = false;
    updateControls();
    $('page-status').textContent = 'Book unavailable';
    showError('Couldn’t load this book. Please try again.', initialize);
    console.error(error);
  }
}

$('pane-toggle').addEventListener('click', () => setPane({ open: !pane.open }));
$('close-pane').addEventListener('click', () => {
  setPane({ open: false });
  $('pane-toggle').focus();
});
$('view-notes').addEventListener('click', () => setPane({ view: 'notes' }));
$('view-english').addEventListener('click', () => setPane({ view: 'english' }));
$('previous').addEventListener('click', () => turnPage(-1));
$('next').addEventListener('click', () => turnPage(1));
$('retry').addEventListener('click', () => retryAction?.());
$('book-select').addEventListener('change', () => { location.hash = `${$('book-select').value}.1`; });
window.addEventListener('hashchange', initialize);
document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    turnPage(event.key === 'ArrowLeft' ? -1 : 1);
  }
  const key = event.key.toLowerCase();
  if (key === 'n' || key === 'e') {
    event.preventDefault();
    toggleView(key === 'n' ? 'notes' : 'english');
  }
  if (event.key === 'Escape' && pane.open) {
    setPane({ open: false });
    $('pane-toggle').focus();
  }
});
applyPane();
initialize();
