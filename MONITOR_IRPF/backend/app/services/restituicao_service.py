from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.declaracao import Declaracao
from app.repositories.app_kv_repository import AppKvRepository
from app.schemas.restituicoes import (
    RestituicaoAtualizarOut,
    RestituicaoDetalheOut,
    RestituicaoEventoOut,
    RestituicaoItemOut,
    RestituicaoListaOut,
)
from app.services.restituicao_status import (
    STATUS_A_RESTITUIR,
    STATUS_ERRO_CREDITO,
    STATUS_PENDENTE,
    STATUS_RESTITUIDO,
    derivar_status_restituicao,
    label_status,
)
from app.services.serpro_integra_service import SAPI_AUTH_DEFAULT, authenticate_serpro, contrato_enviar

_K_SERPRO = "serpro_integra_contador_config_v1"
_K_CERT_B64 = "contador_cert_a1_b64"
_K_CERT_PASS = "contador_cert_a1_pass"

_DEMO_CONSULTA: list[tuple[str, str, str | None]] = [
    ("GEOVANA RIBEIRO", STATUS_RESTITUIDO, None),
    ("FERNANDA FERNANDES", STATUS_A_RESTITUIR, None),
    ("GABRIEL DE PAIVA", STATUS_PENDENTE, "Restituicao em fila suspensa por retencao em malha fina."),
    (
        "DIOGO PENA",
        STATUS_ERRO_CREDITO,
        "Falha no credito: dados bancarios invalidos ou conta encerrada (simulacao Serpro).",
    ),
]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _json_or_default(raw: str | None, default: dict) -> dict:
    if not raw:
        return default
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return default


@dataclass
class _ConsultaRestituicao:
    status: str
    erro_motivo: str | None
    observacao: str | None
    fonte: str


class RestituicaoService:
    def __init__(self, db: Session) -> None:
        self._db = db

    def listar(self, ano_calendario: int) -> RestituicaoListaOut:
        rows = (
            self._db.query(Declaracao)
            .filter(
                Declaracao.ano_calendario == ano_calendario,
                Declaracao.status == "entregue",
                Declaracao.resultado_fiscal == "restituir",
            )
            .order_by(Declaracao.titular_nome)
            .all()
        )
        itens: list[RestituicaoItemOut] = []
        for row in rows:
            valor = row.valor_imposto_ou_restituicao
            if valor is None or valor <= 0:
                continue
            status = derivar_status_restituicao(row)
            itens.append(self._row_to_item(row, status, valor))
        return RestituicaoListaOut(ano_calendario=ano_calendario, itens=itens)

    def detalhe(self, row: Declaracao) -> RestituicaoDetalheOut:
        valor = row.valor_imposto_ou_restituicao or Decimal("0")
        status = derivar_status_restituicao(row)
        return RestituicaoDetalheOut(
            declaracao_id=row.id,
            ano_calendario=row.ano_calendario,
            titular_nome=row.titular_nome,
            titular_cpf=row.titular_cpf,
            data_entrega=row.data_entrega,
            numero_recibo=row.numero_recibo,
            valor_restituicao=valor,
            status_restituicao=status,
            status_restituicao_label=label_status(status),
            status_processamento_rfb=row.status_processamento_rfb,
            em_malha=bool(row.indicacao_malha_fina),
            restituicao_paga=row.restituicao_paga,
            data_pagamento_restituicao=row.data_pagamento_restituicao,
            restituicao_erro_motivo=row.restituicao_erro_motivo,
            observacao=row.restituicao_observacao,
            historico=self._historico(row, status),
            restituicao_consultado_em=row.restituicao_consultado_em,
            fonte_consulta=row.restituicao_fonte_consulta or "simulacao",
        )

    def atualizar_ano(self, ano_calendario: int) -> RestituicaoAtualizarOut:
        rows = (
            self._db.query(Declaracao)
            .filter(
                Declaracao.ano_calendario == ano_calendario,
                Declaracao.status == "entregue",
                Declaracao.resultado_fiscal == "restituir",
            )
            .all()
        )
        for row in rows:
            self._aplicar_consulta(row, self._consultar(row))
        self._db.commit()
        return RestituicaoAtualizarOut(
            ok=True,
            ano_calendario=ano_calendario,
            consultadas=len(rows),
            message=f"Consulta Serpro de restituicao concluida para {len(rows)} declaracao(oes) entregues.",
        )

    def atualizar_declaracao(self, row: Declaracao) -> RestituicaoAtualizarOut:
        if row.status != "entregue":
            raise ValueError("Somente declaracoes entregues podem ser consultadas.")
        if row.resultado_fiscal != "restituir":
            raise ValueError("Declaracao sem resultado fiscal de restituicao.")
        self._aplicar_consulta(row, self._consultar(row))
        self._db.commit()
        return RestituicaoAtualizarOut(
            ok=True,
            declaracao_id=row.id,
            consultadas=1,
            message=f"Situacao atualizada: {label_status(derivar_status_restituicao(row))}.",
        )

    def _row_to_item(self, row: Declaracao, status: str, valor: Decimal) -> RestituicaoItemOut:
        return RestituicaoItemOut(
            declaracao_id=row.id,
            titular_nome=row.titular_nome,
            titular_cpf=row.titular_cpf,
            data_entrega=row.data_entrega,
            numero_recibo=row.numero_recibo,
            valor_restituicao=valor,
            status_restituicao=status,
            status_restituicao_label=label_status(status),
            status_processamento_rfb=row.status_processamento_rfb,
            em_malha=bool(row.indicacao_malha_fina),
            restituicao_consultado_em=row.restituicao_consultado_em,
        )

    def _aplicar_consulta(self, row: Declaracao, result: _ConsultaRestituicao) -> None:
        now = _utcnow()
        row.restituicao_status = result.status
        row.restituicao_observacao = result.observacao
        row.restituicao_erro_motivo = result.erro_motivo if result.status == STATUS_ERRO_CREDITO else None
        row.restituicao_consultado_em = now
        row.restituicao_fonte_consulta = result.fonte
        row.updated_at = now
        if result.status == STATUS_RESTITUIDO:
            row.restituicao_paga = True
            if row.status_processamento_rfb not in ("pendencia_malha",):
                row.status_processamento_rfb = "processada"
        elif result.status == STATUS_PENDENTE:
            row.indicacao_malha_fina = True
            row.status_processamento_rfb = "pendencia_malha"
            row.restituicao_paga = False
        elif result.status == STATUS_ERRO_CREDITO:
            row.restituicao_paga = False
        elif result.status == STATUS_A_RESTITUIR:
            row.indicacao_malha_fina = False
            if row.status_processamento_rfb == "pendencia_malha":
                row.status_processamento_rfb = "fila_restituicao"
            row.restituicao_paga = False

    def _consultar(self, row: Declaracao) -> _ConsultaRestituicao:
        try:
            parsed = self._consultar_serpro(row)
            if parsed is not None:
                return parsed
        except Exception:
            pass
        return self._consultar_simulacao(row)

    def _consultar_simulacao(self, row: Declaracao) -> _ConsultaRestituicao:
        nome = (row.titular_nome or "").upper()
        for prefix, status, obs in _DEMO_CONSULTA:
            if nome.startswith(prefix):
                erro = obs if status == STATUS_ERRO_CREDITO else None
                observacao = obs if status != STATUS_ERRO_CREDITO else None
                return _ConsultaRestituicao(status=status, erro_motivo=erro, observacao=observacao, fonte="simulacao")
        if row.indicacao_malha_fina:
            return _ConsultaRestituicao(
                status=STATUS_PENDENTE,
                erro_motivo=None,
                observacao="Restituicao pendente enquanto declaracao permanece em malha.",
                fonte="simulacao",
            )
        if row.restituicao_paga:
            return _ConsultaRestituicao(status=STATUS_RESTITUIDO, erro_motivo=None, observacao=None, fonte="simulacao")
        return _ConsultaRestituicao(
            status=STATUS_A_RESTITUIR,
            erro_motivo=None,
            observacao="Declaracao na fila de restituicao da Receita Federal.",
            fonte="simulacao",
        )

    def _consultar_serpro(self, row: Declaracao) -> _ConsultaRestituicao | None:
        kv = AppKvRepository(self._db)
        cfg = _json_or_default(kv.get(_K_SERPRO), {})
        if not cfg.get("enabled"):
            raise ValueError("Serpro desabilitado")
        import base64

        cert_b64 = kv.get(_K_CERT_B64)
        if not cert_b64:
            raise ValueError("Certificado ausente")
        p12 = base64.b64decode(cert_b64)
        cert_pass = str(kv.get(_K_CERT_PASS) or "").strip() or str(cfg.get("certPassword") or "")
        tokens = authenticate_serpro(
            str(cfg["consumerKey"]),
            str(cfg["consumerSecret"]),
            p12,
            cert_pass,
            auth_url=str(cfg.get("authUrl") or SAPI_AUTH_DEFAULT),
        )
        access = tokens.get("access_token") or tokens.get("accessToken")
        jwt_t = tokens.get("jwt_token") or tokens.get("jwtToken")
        cpf = (row.titular_cpf or "").replace(".", "").replace("-", "").strip()
        body = {
            "contratante": {"numero": str(cfg.get("contratanteNumero") or "")},
            "autorPedidoDados": {"numero": str(cfg.get("autorNumero") or "")},
            "contribuinte": {"numero": cpf},
            "pedidoDados": {
                "idSistema": str(cfg.get("restituicaoIdSistema") or "SITFIS"),
                "idServico": str(cfg.get("restituicaoIdServico") or "CONSULTARESTITUICAO"),
                "versaoSistema": "1.0",
                "dados": {"anoExercicio": str(row.ano_calendario), "cpf": cpf},
            },
        }
        base_url = str(cfg.get("baseUrl") or "").strip()
        status_code, data = contrato_enviar(
            base_url,
            str(access),
            str(jwt_t) if jwt_t else None,
            body,
        )
        if status_code >= 400:
            raise ValueError(f"Serpro HTTP {status_code}")
        return self._parse_serpro_restituicao(data)

    def _parse_serpro_restituicao(self, data: object) -> _ConsultaRestituicao | None:
        if not isinstance(data, dict):
            return None
        raw_status = data.get("statusRestituicao") or data.get("situacaoRestituicao")
        motivo = data.get("motivoErro") or data.get("erro") or data.get("mensagem")
        if raw_status is None:
            return None
        s = str(raw_status).lower()
        if "erro" in s or "falha" in s or "recus" in s:
            st = STATUS_ERRO_CREDITO
        elif "paga" in s or "credit" in s or "restituid" in s:
            st = STATUS_RESTITUIDO
        elif "malha" in s or "pend" in s:
            st = STATUS_PENDENTE
        else:
            st = STATUS_A_RESTITUIR
        return _ConsultaRestituicao(
            status=st,
            erro_motivo=str(motivo) if st == STATUS_ERRO_CREDITO and motivo else None,
            observacao=str(motivo) if st != STATUS_ERRO_CREDITO and motivo else None,
            fonte="serpro",
        )

    def _historico(self, row: Declaracao, status: str) -> list[RestituicaoEventoOut]:
        eventos: list[RestituicaoEventoOut] = []
        if row.data_entrega:
            eventos.append(
                RestituicaoEventoOut(
                    data=row.data_entrega.isoformat(),
                    descricao="Declaracao entregue com resultado de restituicao.",
                )
            )
        if row.indicacao_malha_fina:
            eventos.append(
                RestituicaoEventoOut(
                    data=None,
                    descricao="Retencao em malha fina — restituicao pode ficar suspensa.",
                )
            )
        if row.data_pagamento_restituicao:
            eventos.append(
                RestituicaoEventoOut(
                    data=row.data_pagamento_restituicao.isoformat(),
                    descricao="Data de credito da restituicao registrada.",
                )
            )
        if row.restituicao_erro_motivo:
            eventos.append(RestituicaoEventoOut(data=None, descricao=row.restituicao_erro_motivo))
        if row.restituicao_consultado_em:
            eventos.append(
                RestituicaoEventoOut(
                    data=row.restituicao_consultado_em.date().isoformat(),
                    descricao=f"Ultima consulta Serpro — situacao: {label_status(status)}.",
                )
            )
        return eventos
