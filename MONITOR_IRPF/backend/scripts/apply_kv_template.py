"""
Aplica pares chave -> valor na tabela app_kv do SQLite principal.

Ordem de leitura do JSON:
  1) backend/config/app_kv.local.json (se existir)
  2) backend/config/app_kv.template.json
  (Ou caminho absoluto: python apply_kv_template.py /caminho/ficheiro.json)

Valores dict/list são gravados como texto JSON. Escalares como str.
Chaves cujo nome começa por "_" são ignoradas (metadados / readme).

Por omissão só mostra o que seria gravado. Para gravar na base:
  python scripts/apply_kv_template.py --apply
"""
from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BACKEND_DIR / "data" / "irpf_carteira.db"
CONFIG_DIR = BACKEND_DIR / "config"
LOCAL = CONFIG_DIR / "app_kv.local.json"
TEMPLATE = CONFIG_DIR / "app_kv.template.json"


def _serialize(value: object) -> str:
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    if value is None:
        return ""
    return str(value)


def main() -> int:
    args = [a for a in sys.argv[1:] if a != "--apply"]
    do_apply = "--apply" in sys.argv[1:]
    path = Path(args[0]).resolve() if args else None
    if path is None:
        path = LOCAL if LOCAL.exists() else TEMPLATE
    if not path.is_file():
        print(f"Ficheiro não encontrado: {path}", file=sys.stderr)
        return 1
    if not DB_PATH.is_file():
        print(f"Base de dados não encontrada: {DB_PATH}", file=sys.stderr)
        return 1

    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        print("O JSON tem de ser um objeto na raiz.", file=sys.stderr)
        return 1

    to_write: list[tuple[str, str]] = []
    for key, value in data.items():
        if key.startswith("_"):
            continue
        to_write.append((key, _serialize(value)))

    print(f"Origem: {path}")
    print(f"Base:   {DB_PATH}")
    print(f"Chaves a gravar ({len(to_write)}):")
    for key, val in to_write:
        preview = val if len(val) <= 72 else val[:69] + "..."
        print(f"  - {key}: {preview}")

    if not do_apply:
        print("\nNada foi gravado. Para aplicar na base: adiciona --apply ao comando.")
        return 0

    conn = sqlite3.connect(DB_PATH)
    try:
        for key, val in to_write:
            conn.execute(
                "INSERT INTO app_kv (key, value) VALUES (?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (key, val),
            )
        conn.commit()
    finally:
        conn.close()

    print("\nGravado com sucesso na tabela app_kv.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
