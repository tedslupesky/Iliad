# Iliad reader

A small, dependency-free reading prototype. Requires Node.js 18+.

Run `npm run dev`, then open http://localhost:3000. Use `PORT=3001 npm run dev` to choose another port.

Book V is included as 34 pairs of Greek and English pages, following the Internet Archive Loeb scan (printed pages 194–261). The Greek contains all 909 verses. See `iliad/README.md` for sources and transcription notes.

Show English opens a companion pane on the right; on small screens it appears beneath the Greek. Previous/Next and the left/right arrow keys turn both texts together. Show notes opens an independently scrollable commentary pane on the left. Page 5.1 has detailed lexical and grammatical notes; later pages show an empty state. On narrow screens, notes appear below the Greek. Escape closes the active companion pane (English first when neither pane has focus).

The frontend is static HTML, CSS, and JavaScript; no build step or external services are required. The local server serves only the app files and reading data. Each UTF-8 text file lives in `iliad/greek` or `iliad/english`, named `5.1.txt` through `5.34.txt`. `iliad/book-5.json` records reading order, verse ranges, and links to the original spreads. The URL fragment (for example `#5.12`) opens a specific pair.

Run `npm run check` for JavaScript syntax checks.
