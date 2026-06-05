from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from app.repositories.app_kv_repository import AppKvRepository
from app.schemas.diagnostico_fiscal import (
    DiagnosticoFiscalAtualizarOut,
    DiagnosticoFiscalDetalheOut,
    DiagnosticoFiscalItemOut,
    DiagnosticoFiscalListaOut,
)
from app.services.cliente_service import ClienteService, normalize_cpf_digits
from app.services.diagnostico_fiscal_cache import (
    extrair_situacao,
    get_entrada,
    label_situacao,
    set_entrada,
)
from app.services.infosimples_rfb_service import consultar_situacao_rfb_infosimples

_K_RFB = "rfb_infosimples_config_v1"


def _json_or_default(raw: str | None, default: dict) -> dict:
    if not raw:
        return default
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return default


def _rfb_habilitado(db: Session) -> bool:
    cfg = _json_or_default(AppKvRepository(db).get(_K_RFB), {})
    return bool(cfg.get("enabled"))


class DiagnosticoFiscalService:
    def __init__(self, db: Session) -> None:
        self._db = db
        self._kv = AppKvRepository(db)

    def listar(self, ano_calendario: int) -> DiagnosticoFiscalListaOut:
        clientes = ClienteService(self._db).list_carteira_exercicio(ano_calendario)
        itens: list[DiagnosticoFiscalItemOut] = []
        seen: set[str] = set()
        for c in clientes:
            cpf = normalize_cpf_digits(c.cpf_digits or c.cpf_exibicao)
            if not cpf or len(cpf) != 11 or cpf in seen:
                continue
            seen.add(cpf)
            entry = get_entrada(self._kv, ano_calendario, cpf)
            situacao = "nao_consultado"
            consultado_em = None
            tem_resultado = False
            if entry:
                situacao = str(entry.get("situacao") or "nao_consultado")
                raw_em = entry.get("consultado_em")
                if isinstance(raw_em, str):
                    try:
                        from datetime import datetime

                        consultado_em = datetime.fromisoformat(raw_em)
                    except ValueError:
                        consultado_em = None
                tem_resultado = entry.get("resultado") is not None
            itens.append(
                DiagnosticoFiscalItemOut(
                    cpf=cpf,
                    nome=c.nome,
                    situacao=situacao,
                    situacao_label=label_situacao(situacao),
                    email=c.email,
                    telefone=c.telefone,
                    consultado_em=consultado_em,
                    tem_resultado=tem_resultado,
                )
            )
        itens.sort(key=lambda x: x.nome.lower())
        return DiagnosticoFiscalListaOut(
            ano_calendario=ano_calendario,
            rfb_habilitado=_rfb_habilitado(self._db),
            itens=itens,
        )

    async def atualizar_cpf(self, ano_calendario: int, cpf: str, nome: str | None = None) -> DiagnosticoFiscalAtualizarOut:
        d = normalize_cpf_digits(cpf) or ""
        if len(d) != 11:
            raise ValueError("CPF inválido.")
        display_nome = nome or d
        for c in ClienteService(self._db).list_carteira_exercicio(ano_calendario):
            if normalize_cpf_digits(c.cpf_digits or c.cpf_exibicao) == d:
                display_nome = c.nome
                break
        status, body = await consultar_situacao_rfb_infosimples(self._db, d, ano_calendario)
        situacao = extrair_situacao(body if isinstance(body, dict) else None)
        set_entrada(
            self._kv,
            ano_calendario,
            d,
            nome=display_nome,
            situacao=situacao,
            resultado=body if isinstance(body, dict) else {"ok": False, "message": str(body)},
        )
        self._db.commit()
        msg = label_situacao(situacao)
        if isinstance(body, dict) and body.get("ok") is False and body.get("message"):
            msg = f"{msg} — {body['message']}"
        return DiagnosticoFiscalAtualizarOut(
            ok=status < 500,
            cpf=d,
            consultadas=1,
            message=msg,
        )

    async def atualizar_ano(self, ano_calendario: int) -> DiagnosticoFiscalAtualizarOut:
        lista = self.listar(ano_calendario)
        ok_count = 0
        for item in lista.itens:
            try:
                r = await self.atualizar_cpf(ano_calendario, item.cpf, item.nome)
                if r.ok:
                    ok_count += 1
            except ValueError:
                continue
        return DiagnosticoFiscalAtualizarOut(
            ok=True,
            consultadas=len(lista.itens),
            message=f"Consulta concluída para {len(lista.itens)} contribuinte(s) ({ok_count} com retorno válido).",
        )

    def detalhe(self, ano_calendario: int, cpf: str) -> DiagnosticoFiscalDetalheOut:
        d = normalize_cpf_digits(cpf) or ""
        entry = get_entrada(self._kv, ano_calendario, d)
        if not entry:
            raise ValueError("Nenhum diagnóstico guardado para este CPF. Use Atualizar.")
        nome = str(entry.get("nome") or d)
        situacao = str(entry.get("situacao") or "nao_consultado")
        consultado_em = None
        raw_em = entry.get("consultado_em")
        if isinstance(raw_em, str):
            try:
                from datetime import datetime

                consultado_em = datetime.fromisoformat(raw_em)
            except ValueError:
                pass
        historico = entry.get("historico") if isinstance(entry.get("historico"), list) else []
        resultado = entry.get("resultado") if isinstance(entry.get("resultado"), dict) else None
        return DiagnosticoFiscalDetalheOut(
            cpf=d,
            nome=nome,
            ano_calendario=ano_calendario,
            situacao=situacao,
            situacao_label=label_situacao(situacao),
            consultado_em=consultado_em,
            resultado=resultado,
            historico=historico,
        )

    def resultado_bruto(self, ano_calendario: int, cpf: str) -> dict[str, Any] | None:
        entry = get_entrada(self._kv, ano_calendario, normalize_cpf_digits(cpf) or "")
        if not entry:
            return None
        res = entry.get("resultado")
        return res if isinstance(res, dict) else None
