import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.app_kv_repository import AppKvRepository
from app.schemas.monitor import MonitorPathsUpdate

router = APIRouter(prefix="/monitor", tags=["monitor"])

_KV_GOVBOX = "irpf_govbox_root"
_KV_GOVBOX_LIST = "irpf_govbox_roots_v1"
_KV_MONITOR_ENABLED = "irpf_monitor_enabled"
_KV_MONITOR_CONFIG = "monitor_config_v1"
_KV_LAST_SCAN = "monitor_last_scan_at_v1"


def _utc_iso() -> str:
    return datetime.now(timezone.utc).replace(tzinfo=None).isoformat()


def _load_monitored_paths(kv: AppKvRepository) -> list[str]:
    raw = kv.get(_KV_GOVBOX_LIST)
    if raw:
        try:
            data = json.loads(raw)
            if isinstance(data, list):
                seen: set[str] = set()
                out: list[str] = []
                for item in data:
                    p = str(item).strip()
                    if p and p not in seen:
                        seen.add(p)
                        out.append(p)
                if out:
                    return out
        except json.JSONDecodeError:
            pass
    legacy = kv.get(_KV_GOVBOX)
    if legacy and legacy.strip():
        return [legacy.strip()]
    return []


@router.get("/status")
def monitor_status(db: Session = Depends(get_db)) -> dict:
    kv = AppKvRepository(db)
    paths = _load_monitored_paths(kv)
    raw = (kv.get(_KV_MONITOR_ENABLED) or "").strip().lower()
    enabled = raw in {"1", "true", "yes", "on"}
    last = kv.get(_KV_LAST_SCAN)
    first = paths[0] if paths else None
    return {
        "irpf_root_paths": paths,
        "irpf_root_path": first,
        "monitor_enabled": enabled,
        "last_scan_at": last,
    }


@router.put("/paths")
def monitor_paths_put(payload: MonitorPathsUpdate, db: Session = Depends(get_db)) -> dict:
    kv = AppKvRepository(db)
    paths = payload.paths
    kv.upsert(_KV_GOVBOX_LIST, json.dumps(paths, ensure_ascii=False))
    kv.upsert(_KV_GOVBOX, paths[0] if paths else None)
    db.commit()
    raw_en = (kv.get(_KV_MONITOR_ENABLED) or "").strip().lower()
    enabled = raw_en in {"1", "true", "yes", "on"}
    last = kv.get(_KV_LAST_SCAN)
    return {
        "irpf_root_paths": paths,
        "irpf_root_path": paths[0] if paths else None,
        "monitor_enabled": enabled,
        "last_scan_at": last,
    }


@router.put("/config")
def monitor_config_put(payload: dict, db: Session = Depends(get_db)) -> dict:
    kv = AppKvRepository(db)
    kv.upsert(_KV_MONITOR_CONFIG, json.dumps(payload, ensure_ascii=False))
    db.commit()
    return payload


@router.post("/scan")
def monitor_scan(db: Session = Depends(get_db)) -> dict:
    kv = AppKvRepository(db)
    kv.upsert(_KV_LAST_SCAN, _utc_iso())
    db.commit()
    return {"ok": True, "last_scan_at": kv.get(_KV_LAST_SCAN)}


@router.get("/snapshot")
def monitor_snapshot(db: Session = Depends(get_db)) -> dict:
    kv = AppKvRepository(db)
    raw = kv.get("monitor_snapshot_v1")
    if raw:
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {}
    return {}
