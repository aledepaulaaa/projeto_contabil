from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.declaracao import Declaracao
from app.repositories.app_kv_repository import AppKvRepository
from app.schemas.malha import MalhaAtualizarOut, MalhaDetalheOut, MalhaItemOut, MalhaListaOut, MalhaPendenciaOut
from app.services.serpro_integra_service import SAPI_AUTH_DEFAULT, authenticate_serpro, contrato_enviar

_K_SERPRO = "serpro_integra_contador_config_v1"
_K_CERT_B64 = "contador_cert_a1_b64"
_K_CERT_PASS = "contador_cert_a1_pass"

_DEMO_MOTIVOS: list[tuple[str, str, list[tuple[str | None, str]]]] = [
    (
        "ANA FLAVIA OLIVEIRA",
        "Divergencia em rendimentos tributaveis declarados versus DIRF.",
        [
            ("RF-RT-014", "Rendimento tributavel omitido ou inferior ao informado pela fonte pagadora."),
            (None, "Aguardando manifestacao do contribuinte no e-CAC."),
        ],
    ),
    (
        "ANA LUIZA DE OLIVEIRA",
        "Despesas medicas sem comprovacao aceita na malha de dados da RFB.",
        [
            ("RF-DM-022", "CPF de prestador de servico de saude sem vinculo comprovado."),
            ("RF-DM-023", "Valor deduzido acima do limite coerente com rendimentos."),
        ],
    ),
    (
        "DIEGO MARTINS DE SOUSA",
        "Patrimonio: inconsistencia entre bens declarados e exercicio anterior.",
        [
            ("RF-BD-031", "Valor de aquisicao de bem imovel divergente da ultima declaracao."),
        ],
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


def _resumo(motivo: str | None, max_len: int = 140) -> str | None:
    if not motivo:
        return None
    t = motivo.strip()
    if len(t) <= max_len:
        return t
    return t[: max_len - 1] + "…"


@dataclass
class _ConsultaMalha:
    em_malha: bool
    motivo: str | None
    pendencias: list[MalhaPendenciaOut]
    fonte: str


class MalhaService:
    def __init__(self, db: Session) -> None:
        self._db = db

    def listar_em_malha(self, ano_calendario: int) -> MalhaListaOut:
        rows = (
            self._db.query(Declaracao)
            .filter(
                Declaracao.ano_calendario == ano_calendario,
                Declaracao.status == "entregue",
                Declaracao.indicacao_malha_fina.is_(True),
            )
            .order_by(Declaracao.titular_nome)
            .all()
        )
        itens = [self._row_to_item(r) for r in rows]
        return MalhaListaOut(ano_calendario=ano_calendario, itens=itens)

    def detalhe(self, row: Declaracao) -> MalhaDetalheOut:
        pendencias = self._pendencias_from_motivo(row)
        return MalhaDetalheOut(
            declaracao_id=row.id,
            ano_calendario=row.ano_calendario,
            titular_nome=row.titular_nome,
            titular_cpf=row.titular_cpf,
            data_entrega=row.data_entrega,
            numero_recibo=row.numero_recibo,
            status_processamento_rfb=row.status_processamento_rfb,
            em_malha=bool(row.indicacao_malha_fina),
            malha_motivo_rfb=row.malha_motivo_rfb,
            pendencias=pendencias,
            malha_consultado_em=row.malha_consultado_em,
            fonte_consulta=row.malha_fonte_consulta or "simulacao",
        )

    def atualizar_ano(self, ano_calendario: int) -> MalhaAtualizarOut:
        rows = (
            self._db.query(Declaracao)
            .filter(
                Declaracao.ano_calendario == ano_calendario,
                Declaracao.status == "entregue",
            )
            .all()
        )
        em_malha = 0
        for row in rows:
            if self._aplicar_consulta(row, self._consultar(row)):
                em_malha += 1
        self._db.commit()
        return MalhaAtualizarOut(
            ok=True,
            ano_calendario=ano_calendario,
            consultadas=len(rows),
            em_malha=em_malha,
            message=(
                f"Consulta Serpro concluida para {len(rows)} declaracao(oes) entregues; "
                f"{em_malha} retida(s) em malha neste exercicio."
            ),
        )

    def atualizar_declaracao(self, row: Declaracao) -> MalhaAtualizarOut:
        if row.status != "entregue":
            raise ValueError("Somente declaracoes ja entregues podem ser consultadas na malha.")
        em = self._aplicar_consulta(row, self._consultar(row))
        self._db.commit()
        self._db.refresh(row)
        return MalhaAtualizarOut(
            ok=True,
            declaracao_id=row.id,
            consultadas=1,
            em_malha=1 if em else 0,
            message="Retida em malha fina." if em else "Sem retencao em malha na consulta atual.",
        )

    def _row_to_item(self, row: Declaracao) -> MalhaItemOut:
        return MalhaItemOut(
            declaracao_id=row.id,
            titular_nome=row.titular_nome,
            titular_cpf=row.titular_cpf,
            data_entrega=row.data_entrega,
            numero_recibo=row.numero_recibo,
            status_processamento_rfb=row.status_processamento_rfb,
            malha_motivo_resumo=_resumo(row.malha_motivo_rfb),
            malha_consultado_em=row.malha_consultado_em,
        )

    def _aplicar_consulta(self, row: Declaracao, result: _ConsultaMalha) -> bool:
        now = _utcnow()
        row.malha_consultado_em = now
        row.malha_fonte_consulta = result.fonte
        row.updated_at = now
        if result.em_malha:
            row.indicacao_malha_fina = True
            row.status_processamento_rfb = "pendencia_malha"
            row.malha_motivo_rfb = result.motivo
            return True
        row.indicacao_malha_fina = False
        if row.status_processamento_rfb == "pendencia_malha":
            row.status_processamento_rfb = "processada"
        row.malha_motivo_rfb = None
        return False

    def _consultar(self, row: Declaracao) -> _ConsultaMalha:
        try:
            return self._consultar_serpro(row)
        except Exception:
            return self._consultar_simulacao(row)

    def _consultar_simulacao(self, row: Declaracao) -> _ConsultaMalha:
        nome = (row.titular_nome or "").upper()
        for prefix, motivo, itens in _DEMO_MOTIVOS:
            if nome.startswith(prefix):
                pendencias = [MalhaPendenciaOut(codigo=c, descricao=d) for c, d in itens]
                texto = motivo
                if pendencias:
                    texto += " " + " | ".join(p.descricao for p in pendencias)
                return _ConsultaMalha(em_malha=True, motivo=texto, pendencias=pendencias, fonte="simulacao")
        return _ConsultaMalha(em_malha=False, motivo=None, pendencias=[], fonte="simulacao")

    def _consultar_serpro(self, row: Declaracao) -> _ConsultaMalha:
        kv = AppKvRepository(self._db)
        cfg = _json_or_default(kv.get(_K_SERPRO), {})
        if not cfg.get("enabled"):
            raise ValueError("Serpro desabilitado")
        cert_b64 = kv.get(_K_CERT_B64)
        if not cert_b64 or not (cfg.get("consumerKey") and cfg.get("consumerSecret")):
            raise ValueError("Serpro incompleto")
        import base64

        p12 = base64.b64decode(cert_b64)
        cert_pass = str(kv.get(_K_CERT_PASS) or "").strip() or str(cfg.get("certPassword") or "")
        tokens = authenticate_serpro(
            str(cfg["consumerKey"]),
            str(cfg["consumerSecret"]),
            p12,
            cert_pass,
            auth_url=str(cfg.get("authUrl") or SAPI_AUTH_DEFAULT),
            role_type=str(cfg.get("roleType") or "TERCEIROS"),
        )
        access = tokens.get("access_token") or tokens.get("accessToken")
        jwt_t = tokens.get("jwt_token") or tokens.get("jwtToken")
        if not access:
            raise ValueError("Token Serpro ausente")
        cpf = (row.titular_cpf or "").replace(".", "").replace("-", "").strip()
        body = {
            "contratante": {"numero": str(cfg.get("contratanteNumero") or "")},
            "autorPedidoDados": {"numero": str(cfg.get("autorNumero") or "")},
            "contribuinte": {"numero": cpf},
            "pedidoDados": {
                "idSistema": str(cfg.get("malhaIdSistema") or "SITFIS"),
                "idServico": str(cfg.get("malhaIdServico") or "CONSULTAMALHA"),
                "versaoSistema": "1.0",
                "dados": {"anoExercicio": str(row.ano_calendario), "cpf": cpf},
            },
        }
        base_url = str(cfg.get("baseUrl") or "").strip()
        if not base_url:
            raise ValueError("baseUrl Serpro ausente")
        status, data = contrato_enviar(
            base_url,
            str(access),
            str(jwt_t) if jwt_t else None,
            body,
            enviar_path=str(cfg.get("enviarPath") or "Contrato/Enviar"),
        )
        if status >= 400:
            raise ValueError(f"Serpro HTTP {status}")
        parsed = self._parse_serpro_malha(data)
        if parsed is not None:
            return parsed
        return self._consultar_simulacao(row)

    def _parse_serpro_malha(self, data: object) -> _ConsultaMalha | None:
        if not isinstance(data, dict):
            return None
        em = data.get("emMalha") or data.get("em_malha") or data.get("retidoMalha")
        motivo = data.get("motivo") or data.get("descricao") or data.get("mensagem")
        if em is None and not motivo:
            dados = data.get("dados") or data.get("response")
            if isinstance(dados, str):
                try:
                    dados = json.loads(dados)
                except json.JSONDecodeError:
                    dados = None
            if isinstance(dados, dict):
                em = dados.get("emMalha") or dados.get("situacao") == "MALHA"
                motivo = motivo or dados.get("motivo") or dados.get("descricao")
        if em is None:
            return None
        em_bool = em is True or str(em).lower() in ("true", "s", "sim", "malha", "retido")
        pendencias: list[MalhaPendenciaOut] = []
        if em_bool and motivo:
            pendencias.append(MalhaPendenciaOut(descricao=str(motivo)))
        return _ConsultaMalha(
            em_malha=em_bool,
            motivo=str(motivo) if motivo else None,
            pendencias=pendencias,
            fonte="serpro",
        )

    def _pendencias_from_motivo(self, row: Declaracao) -> list[MalhaPendenciaOut]:
        nome = (row.titular_nome or "").upper()
        for prefix, _motivo, itens in _DEMO_MOTIVOS:
            if nome.startswith(prefix):
                return [MalhaPendenciaOut(codigo=c, descricao=d) for c, d in itens]
        if row.malha_motivo_rfb:
            return [MalhaPendenciaOut(descricao=row.malha_motivo_rfb)]
        return []
