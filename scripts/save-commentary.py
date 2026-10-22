"""Save one reviewed page from JSON on stdin, then register it in the reader."""
import json
import sys
import re
from pathlib import Path
root = Path(__file__).resolve().parents[1]
data = json.load(sys.stdin)
assert re.fullmatch(r'[1-9]\d*\.[1-9]\d*', data['id']), 'Invalid page ID'
book_number = data['id'].split('.')[0]
manifest_path = root / f'iliad/book-{book_number}.json'
manifest = json.loads(manifest_path.read_text())
page = next(p for p in manifest['pages'] if p['id'] == data['id'])
assert data['title'] and data['intro'] and data['notes']
for note in data['notes']:
    assert all(note.get(k) for k in ('lines', 'lemma', 'text'))
    for group in note['lines'].split(','):
        for line in group.strip().split('–'):
            assert page['lineStart'] <= int(line) <= page['lineEnd'], (data['id'], note)
data.setdefault('sources', [{
    'title': f'Greek text and word lookup · Perseus, Iliad {book_number}',
    'url': f'https://www.perseus.tufts.edu/hopper/text?doc=Perseus%3Atext%3A1999.01.0133%3Abook%3D{book_number}'
}])
relative = f"commentary/{data['id']}.json"
path = root / 'iliad' / relative
assert not path.exists(), f'Refusing to overwrite {path}'
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
page['commentary'] = relative
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(f"Saved {data['id']}: {len(data['notes'])} notes, lines {page['lineStart']}–{page['lineEnd']}")
