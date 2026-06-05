import re
from pathlib import Path

from fastapi import HTTPException, UploadFile

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_UPLOAD_ROOT = _BACKEND_DIR / "data" / "documentos_uploads"

_MAX_BYTES = 15 * 1024 * 1024

_ALLOWED_EXT = frozenset({
    ".pdf",
    ".doc",
    ".docx",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".heic",
    ".heif",
})

_ALLOWED_MIME_PREFIXES = ("image/", "application/pdf", "application/msword")
_ALLOWED_MIME_EXACT = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
)


def upload_root() -> Path:
    root = _UPLOAD_ROOT
    root.mkdir(parents=True, exist_ok=True)
    return root


def _safe_filename(name: str) -> str:
    base = Path(name).name
    base = re.sub(r"[^\w.\- ]", "_", base, flags=re.UNICODE)
    return base[:180] or "arquivo"


def validate_upload(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nome do ficheiro em falta.")
    ext = Path(file.filename).suffix.lower()
    if ext not in _ALLOWED_EXT:
        raise HTTPException(
            status_code=400,
            detail="Formato não permitido. Use PDF, Word (.doc/.docx) ou imagem (JPG, PNG, etc.).",
        )
    ct = (file.content_type or "").lower()
    if ct:
        ok = ct in _ALLOWED_MIME_EXACT or any(ct.startswith(p) for p in _ALLOWED_MIME_PREFIXES)
        if not ok and not ct.startswith("image/"):
            raise HTTPException(status_code=400, detail=f"Tipo de ficheiro não permitido: {ct}")


async def save_upload(
    *,
    documentacao_id: int,
    checklist_item_id: int,
    file: UploadFile,
) -> tuple[str, str, int, str | None]:
    validate_upload(file)
    data = await file.read()
    if len(data) > _MAX_BYTES:
        raise HTTPException(status_code=400, detail="Ficheiro demasiado grande (máximo 15 MB).")
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Ficheiro vazio.")

    safe = _safe_filename(file.filename or "arquivo")
    folder = upload_root() / str(documentacao_id) / str(checklist_item_id)
    folder.mkdir(parents=True, exist_ok=True)
    for old in folder.iterdir():
        if old.is_file():
            old.unlink()
    dest = folder / safe
    dest.write_bytes(data)
    return safe, str(dest.resolve()), len(data), file.content_type


def delete_entrega_file(path_str: str | None) -> None:
    if not path_str:
        return
    try:
        p = Path(path_str)
        if p.is_file():
            p.unlink()
    except OSError:
        pass
