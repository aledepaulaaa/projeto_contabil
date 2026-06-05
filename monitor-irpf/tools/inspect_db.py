import sqlite3
from pathlib import Path

db = Path(__file__).resolve().parents[1] / "backend" / "data" / "irpf_carteira.db"
if not db.exists():
    raise SystemExit(f"DB not found: {db}")

conn = sqlite3.connect(db)
cur = conn.cursor()
tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
print("tables:", tables)
for t in tables:
    print("---", t)
    for row in cur.execute(f"PRAGMA table_info({t})"):
        print(" ", row)
