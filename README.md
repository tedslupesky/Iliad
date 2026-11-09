# Iliad reader

A small, dependency-free reading prototype. Requires Node.js 18+.

Run `npm run dev`, then open http://localhost:3000. Use `PORT=3001 npm run dev` to choose another port.

Books V, VI and VII are included: 34 pairs (909 Greek verses), 20 pairs (529 verses) and 18 pairs (482 verses), respectively. The book selector switches between them; a fresh visit opens Book VII. Pagination follows the Internet Archive Loeb scan (printed pages 194–337). See `iliad/README.md` for sources and transcription notes.

"Show notes & English" opens a companion pane on the right; on small screens it appears beneath the Greek. A Notes | English switch at the top of the pane chooses what it shows, and the app remembers whether the pane is open and which view was last used. Previous/Next and the left/right arrow keys turn the Greek and the companion together. All 72 pages have lexical, grammatical, and literary notes. Book VI uses vocabulary bullets in reading order, with abbreviated morphology. Escape closes the pane.

The frontend is static HTML, CSS, and JavaScript; no build step or external services are required. The local server serves only the app files and reading data. Each UTF-8 text file lives in `iliad/greek` or `iliad/english`, named by book and page, such as `6.1.txt`. `iliad/books.json` lists available books; each `book-N.json` records reading order, verse ranges, and links to the original spreads. The URL fragment (for example `#5.12`) opens a specific pair.

Run `npm run check` for JavaScript syntax checks and `npm test` to validate the reading catalog, paired texts, and commentary ranges.

## Deploy to Vercel

Run `npm run build` to create `dist/`, containing only the reader and its published reading files. Vercel uses `vercel.json` to run this build and serve the static output; `server.js` remains the local development server. Downloaded scans, extraction files, and previews are excluded from deployment.

To deploy from this directory, sign in with `npx vercel login`, then run `npx vercel --prod`. Subsequent deployments use the project connection in the ignored `.vercel/` directory.


