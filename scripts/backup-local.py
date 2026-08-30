"""Read-only SQLite export before moving the local demo to Convex."""
import datetime
import hashlib
import json
from pathlib import Path
import sqlite3
import sys

root = Path(__file__).resolve().parents[1]
candidates = []
for path in (root / '.wrangler/state/v3/d1').rglob('*.sqlite'):
    with sqlite3.connect(path.resolve().as_uri() + '?mode=ro', uri=True) as db:
        exists = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='app_state'").fetchone()
        if exists:
            row = db.execute('SELECT revision,data FROM app_state WHERE id=1').fetchone()
            if row:
                candidates.append((path, row))
if len(candidates) != 1:
    raise SystemExit(f'Expected one populated app database; found {len(candidates)}. No backup or changes made.')
source, row = candidates[0]
if len(sys.argv) == 3 and sys.argv[1] == '--verify':
    saved = json.loads(Path(sys.argv[2]).read_text(encoding='utf-8'))
    if row[0] != saved['revision'] or row[1] != saved['data']:
        raise SystemExit('Local data changed since the backup. Migration stopped; take a fresh backup.')
    print('Backup exactly matches the current local data.')
    raise SystemExit(0)
target = root.parent / 'outputs' / 'migration-backups' / datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
target.mkdir(parents=True, exist_ok=False)
with sqlite3.connect(source.resolve().as_uri() + '?mode=ro', uri=True) as db, sqlite3.connect(target / 'local.sqlite') as backup:
    db.backup(backup)
with sqlite3.connect(target / 'local.sqlite') as backup:
    revision, data = backup.execute('SELECT revision,data FROM app_state WHERE id=1').fetchone()
state = json.loads(data)
payload = {'key': 'main', 'revision': revision, 'data': data}
(target / 'app-state.json').write_text(json.dumps(payload, ensure_ascii=False), encoding='utf-8')
digest = hashlib.sha256(data.encode()).hexdigest()
(target / 'manifest.json').write_text(json.dumps({'revision': revision, 'sha256': digest, 'source': str(source), 'entries': len(state['entries']), 'cases': len(state['cases']), 'notices': len(state['notices'])}, indent=2), encoding='utf-8')
print(json.dumps({'backup': str(target), 'revision': revision, 'entries': len(state['entries']), 'cases': len(state['cases']), 'notices': len(state['notices']), 'sha256': digest}))
