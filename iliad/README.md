# Iliad reading text

Each facing pair has the same base filename in `greek/` and `english/`: `5.1.txt` means Book 5, reading page 1. Files use UTF-8. Greek has one verse per line; English has paragraphs separated by blank lines. Pagination follows the printed edition, so English sentences can continue into the next file. English page 5.29 ends with `white-`, continued by `armed` on 5.30.

`books.json` lists the available books and defaults to Book VI. Each `book-N.json` supplies numeric reading order, Greek verse ranges, printed page numbers, and source links. Book V has 34 pairs covering verses 1–909, printed pages 194–261 (PDF pages 210–277, counted from 1). Book VI has 20 pairs covering verses 1–529, printed pages 262–301 (PDF pages 278–317). English 6.19 ends with `right-`, continued by `minded` on 6.20.

## Sources and method

The page boundaries and translation follow [The Iliad, Volume I, Loeb Classical Library, translated by A. T. Murray, Internet Archive scan](https://archive.org/details/in.ernet.dli.2015.12689/page/194/mode/2up). This is the user-selected online edition, rather than the original local `loeb.pdf`.

For Book V, fresh OCR of the scanned pages was aligned and cleaned using the Perseus Digital Library's [Greek Monro/Allen text](https://github.com/PerseusDL/canonical-greekLit/blob/master/data/tlg0012/tlg001/tlg0012.tlg001.perseus-grc2.xml) and [Murray English translation](https://github.com/PerseusDL/canonical-greekLit/blob/master/data/tlg0012/tlg001/tlg0012.tlg001.perseus-eng3.xml). Disputed readings were checked against scan crops. `transcription-variants.json` records Greek lexical variants restored from the scan relative to that reference text.

For Book VI, Greek comes from the normalized Perseus Monro/Allen reference, split at the Loeb page boundaries. Its lexical variants have not been systematically reconciled to the Loeb Greek; it should not be treated as an exact transcription of that edition. English uses the Murray reference aligned with the scan OCR, with page boundaries and identified errors checked against the scan.

This is a normalized reading transcription, not a diplomatic transcription or a fully proofread scholarly edition. Greek punctuation, capitalization, and diacritics generally follow the reference text. Printed line wrapping is removed; footnotes, critical apparatus, running headers, and note callouts are omitted. English OCR/reference errors were corrected and paragraph breaks retained where identified. Further proofreading may still find differences. Each reader page links to the original spread for comparison.

To correct a reading, edit its text file directly; preserve one verse per Greek line so that verse numbering stays accurate. If pagination changes, also update the manifest.

## Commentary

Commentary lives alongside the reading texts in `commentary/5.1.json` through `commentary/5.34.json` and `commentary/6.1.json` through `commentary/6.20.json`. JSON keeps each note's verse range, Greek lemma, explanation, and reference links separate for readable rendering without a Markdown dependency. The page ID uses the same book/page convention as the Greek and English files. Add a `commentary` path to the matching manifest entry when a new page is ready; pages without it display an explicit empty state.

All 54 pages contain original explanatory notes for a returning reader of Homer, including morphology, syntax, vocabulary, and literary observations. Reference links accompany the notes. These are reading aids, not a critical apparatus; interpretive observations are distinguished from grammatical parsing.

Book V pages 20–34 and all Book VI pages use `"format": "vocabulary"`: compact bullet notes in Greek reading order, with expanded vocabulary coverage and abbreviated morphology (e.g. `dat pl`, `3sg aor`, `ptc`, `inf`). Each entry retains the same `lines`, `lemma`, and `text` fields. Pages without this format flag retain the original paragraph layout. Keep notes ordered by their first occurrence in the Greek, including within a verse.

Each page was written and saved separately, with its manifest entry added immediately. The helper `scripts/save-commentary.py` accepts a new page as JSON on standard input, checks its ID and verse ranges, refuses to overwrite an existing page, then saves and registers it. Sources listed as Greek text and word lookup identify the primary text used; the explanations are original reading notes, not quotations from a published commentary.
