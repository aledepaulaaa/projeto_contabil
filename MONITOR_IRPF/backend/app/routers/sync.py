import sqlite3
from pathlib import Path

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.app_kv_repository import AppKvRepository

router = APIRouter(prefix="/sync", tags=["sync"])

_KV_AUX_SQLITE = "sqlite_auxiliar_path"


@router.get("/fonte-local")
def get_fonte_local(db: Session = Depends(get_db)) -> dict:
    kv = AppKvRepository(db)
    path_raw = kv.get(_KV_AUX_SQLITE)
    if not path_raw:
        return {"configured": False}
    path = Path(path_raw.strip())
    if not path.exists():
        return {"configured": True, "ok": False, "message": "Arquivo SQLite auxiliar não encontrado no caminho configurado."}
    try:
        conn = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
        cur = conn.cursor()
        rows = cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()
        conn.close()
        tables = [{"name": r[0]} for r in rows]
        return {"configured": True, "ok": True, "tables": tables}
    except Exception as exc:  # noqa: BLE001
        return {"configured": True, "ok": False, "message": str(exc)}
