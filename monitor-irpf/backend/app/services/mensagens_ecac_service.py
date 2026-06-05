from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.repositories.app_kv_repository import AppKvRepository
from app.schemas.mensagens_ecac import (
    MensagemEcacOut,
    MensagensEcacAtualizarOut,
    MensagensEcacCaixaOut,
    MensagensEcacItemOut,
    MensagensEcacListaOut,
)
from app.services.cliente_service import ClienteService, normalize_cpf_digits
from app.services.mensagens_ecac_cache import (
    get_entrada,
    marcar_todas_lidas,
    nova_mensagem_id,
    set_entrada,
    status_label,
)
from app.services.mensagens_ecac_simulacao_seed import _gerar_mensagens

_K_RFB = "rfb_infosimples_config_v1"


def _json_or_default(raw: str | None, default: dict) -> dict:
    if not raw:
        return default
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return default


def _integracao_habilitada(db: Session) -> bool:
    cfg = _json_or_default(AppKvRepository(db).get(_K_RFB), {})
    return bool(cfg.get("enabled"))


class MensagensEcacService:
    def __init__(self, db: Session) -> None:
        self._db = db
        self._kv = AppKvRepository(db)

    def listar(self, ano_calendario: int) -> MensagensEcacListaOut:
        itens: list[MensagensEcacItemOut] = []
        seen: set[str] = set()
        for c in ClienteService(self._db).list_carteira_exercicio(ano_calendario):
            cpf = normalize_cpf_digits(c.cpf_digits or c.cpf_exibicao)
            if not cpf or len(cpf) != 11 or cpf in seen:
                continue
            seen.add(cpf)
            entry = get_entrada(self._kv, ano_calendario, cpf)
            total = 0
            nao_lidas = 0
            consultado_em = None
            if entry:
                total = int(entry.get("total_mensagens") or 0)
                nao_lidas = int(entry.get("nao_lidas") or 0)
                raw_em = entry.get("consultado_em")
                if isinstance(raw_em, str):
                    try:
                        consultado_em = datetime.fromisoformat(raw_em)
                    except ValueError:
                        pass
            label = status_label(nao_lidas, total) if entry else "Não consultado"
            itens.append(
                MensagensEcacItemOut(
                    cpf=cpf,
                    nome=c.nome,
                    total_mensagens=total,
                    nao_lidas=nao_lidas,
                    status_label=label,
                    todas_lidas=total > 0 and nao_lidas == 0,
                    email=c.email,
                    telefone=c.telefone,
                    consultado_em=consultado_em,
                )
            )
        itens.sort(key=lambda x: x.nome.lower())
        return MensagensEcacListaOut(
            ano_calendario=ano_calendario,
            integracao_habilitada=_integracao_habilitada(self._db),
            itens=itens,
        )

    async def consultar_cpf(self, ano_calendario: int, cpf: str, nome: str | None = None) -> MensagensEcacAtualizarOut:
        d = normalize_cpf_digits(cpf) or ""
        if len(d) != 11:
            raise ValueError("CPF inválido.")
        display = nome or d
        for c in ClienteService(self._db).list_carteira_exercicio(ano_calendario):
            if normalize_cpf_digits(c.cpf_digits or c.cpf_exibicao) == d:
                display = c.nome
                break
        mensagens = await self._buscar_mensagens_simulacao(display, d, ano_calendario)
        set_entrada(self._kv, ano_calendario, d, nome=display, mensagens=mensagens)
        self._db.commit()
        nao = sum(1 for m in mensagens if not m.get("lida"))
        return MensagensEcacAtualizarOut(
            ok=True,
            cpf=d,
            consultadas=1,
            message=f"{len(mensagens)} mensagem(ns), {nao} não lida(s).",
        )

    async def consultar_lote(self, ano_calendario: int) -> MensagensEcacAtualizarOut:
        lista = self.listar(ano_calendario)
        for item in lista.itens:
            try:
                await self.consultar_cpf(ano_calendario, item.cpf, item.nome)
            except ValueError:
                continue
        return MensagensEcacAtualizarOut(
            ok=True,
            consultadas=len(lista.itens),
            message=f"Consulta em lote concluída para {len(lista.itens)} contribuinte(s).",
        )

    def caixa(self, ano_calendario: int, cpf: str, marcar_lidas: bool = False) -> MensagensEcacCaixaOut:
        d = normalize_cpf_digits(cpf) or ""
        entry = get_entrada(self._kv, ano_calendario, d)
        if not entry:
            raise ValueError("Caixa não consultada. Use Consultar primeiro.")
        if marcar_lidas:
            marcar_todas_lidas(self._kv, ano_calendario, d)
            self._db.commit()
            entry = get_entrada(self._kv, ano_calendario, d) or entry
        raw_msgs = entry.get("mensagens") if isinstance(entry.get("mensagens"), list) else []
        mensagens = [
            MensagemEcacOut(
                id=str(m.get("id") or nova_mensagem_id()),
                assunto=str(m.get("assunto") or "Sem assunto"),
                data=str(m.get("data") or ""),
                lida=bool(m.get("lida")),
                corpo_resumo=str(m.get("corpo_resumo")) if m.get("corpo_resumo") else None,
            )
            for m in raw_msgs
            if isinstance(m, dict)
        ]
        nao = sum(1 for m in mensagens if not m.lida)
        return MensagensEcacCaixaOut(
            cpf=d,
            nome=str(entry.get("nome") or d),
            ano_calendario=ano_calendario,
            total_mensagens=len(mensagens),
            nao_lidas=nao,
            mensagens=mensagens,
        )

    async def _buscar_mensagens_simulacao(
        self, nome: str, cpf: str, ano: int
    ) -> list[dict[str, Any]]:
        """Substituir por integração InfoSimples/e-CAC quando disponível."""
        _ = ano, cpf
        nome_upper = nome.upper()
        from app.services.mensagens_ecac_simulacao_seed import _DEMO

        nao_lidas = next((n for prefix, n in _DEMO if nome_upper.startswith(prefix)), 3)
        return _gerar_mensagens(nome, nao_lidas)
