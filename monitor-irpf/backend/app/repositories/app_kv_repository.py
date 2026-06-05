from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.app_kv import AppKv


class AppKvRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get(self, key: str) -> str | None:
        row = self._db.get(AppKv, key)
        return row.value if row else None

    def upsert(self, key: str, value: str | None) -> None:
        row = self._db.get(AppKv, key)
        if row is None:
            self._db.add(AppKv(key=key, value=value))
        else:
            row.value = value
        self._db.flush()
