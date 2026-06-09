import hashlib
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.cliente_manual import (
    ORIGEM_IMPORTACAO,
    ORIGEM_MANUAL,
    ORIGEM_SINC,
    TIPO_PRECIFICACAO_PADRAO,
    TIPO_PRECIFICACAO_PERSONALIZADO,
    TIPOS_COBRANCA_PADRAO_IMPORTACAO,
    TIPOS_PRECIFICACAO_CLIENTE,
    ClienteManual,
)
from app.models.cobranca import Cobranca
from app.models.declaracao import Declaracao
from app.models.procuracao import Procuracao
from app.models.usuario import Usuario
from app.repositories.cliente_manual_repository import ClienteManualRepository
from app.schemas.cliente import (
    ClienteImportarAnoOut,
    ClienteListRowOut,
    ClienteManualCreate,
    ClienteManualUpdate,
    ClienteSincronizarDeclOut,
)
from app.schemas.procuracao import CarteiraDeclaracaoSituacaoRow
from app.services.precificacao_parametros_service import PrecificacaoParametrosService


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _validar_tipo_valor_precificacao(tipo: str, valor_personalizado: Decimal | None) -> None:
    if tipo not in TIPOS_PRECIFICACAO_CLIENTE:
        raise ValueError("Tipo de precificação inválido.")
    if tipo == TIPO_PRECIFICACAO_PERSONALIZADO:
        if valor_personalizado is None or valor_personalizado <= 0:
            raise ValueError("Para «valor personalizado», indique um valor maior que zero.")


def _tipo_carteira_seguro(tipo: str | None) -> str:
    if tipo and tipo in TIPOS_PRECIFICACAO_CLIENTE:
        return tipo
    return TIPO_PRECIFICACAO_PADRAO


def normalize_cpf_digits(value: str | None) -> str | None:
    if not value or not str(value).strip():
        return None
    digits = "".join(c for c in str(value) if c.isdigit())
    if len(digits) >= 11:
        return digits[:11]
    if len(digits) == 0:
        return None
    return digits


def format_cpf_display(digits: str | None) -> str | None:
    if not digits or len(digits) != 11:
        return digits
    return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"


def carteira_key_manual(manual_id: int) -> str:
    return f"manual:{manual_id}"


def carteira_key_sem_cpf(nome_exibicao: str) -> str:
    n = (nome_exibicao or "").strip().lower()
    h = hashlib.sha256(n.encode("utf-8")).hexdigest()[:32]
    return f"nome:{h}"


def _declaracoes_matching_from_list(
    decls: list[Declaracao],
    cpf_digits: str | None,
    nome: str,
) -> list[Declaracao]:
    nl = (nome or "").strip().lower()
    out: list[Declaracao] = []
    for d in decls:
        if cpf_digits and len(cpf_digits) == 11 and normalize_cpf_digits(d.titular_cpf) == cpf_digits:
            out.append(d)
        elif (not cpf_digits or len(cpf_digits) != 11) and nl and (d.titular_nome or "").strip().lower() == nl:
            out.append(d)
    return out


def _declaracao_status_norm(s: str | None) -> str:
    return (s or "").strip().lower()


def _prazo_entrega_irpf(ano_calendario: int) -> date:
    """Referência de prazo de entrega (31/05 do ano seguinte ao calendário IRPF)."""
    return date(ano_calendario + 1, 5, 31)


def _classify_situacao_declaracao(
    ano_calendario: int,
    decls: list[Declaracao],
) -> tuple[Literal["nao_existe", "valido_ate", "vencida"], date | None]:
    """Classifica situação para ecrã Procurações: nao_existe | valido_ate | vencida."""
    today = date.today()
    prazo = _prazo_entrega_irpf(ano_calendario)
    if not decls:
        return "nao_existe", None
    if all(_declaracao_status_norm(d.status) == "cancelada" for d in decls):
        return "vencida", None
    entregues = [d for d in decls if _declaracao_status_norm(d.status) == "entregue"]
    if entregues:
        def _ref_date(d: Declaracao) -> date:
            if d.data_entrega:
                return d.data_entrega
            return d.updated_at.date()

        best = max(entregues, key=_ref_date)
        base = best.data_entrega or best.updated_at.date()
        valid_until = base + timedelta(days=5 * 365)
        if today > valid_until:
            return "vencida", None
        return "valido_ate", valid_until
    if today > prazo:
        return "vencida", None
    return "valido_ate", prazo


class ClienteService:
    def __init__(self, db: Session) -> None:
        self._db = db
        self._manual_repo = ClienteManualRepository(db)

    def _tipo_precificacao_sinc_import(self) -> str:
        t = PrecificacaoParametrosService(self._db).get().tipo_cobranca_padrao
        if t in TIPOS_COBRANCA_PADRAO_IMPORTACAO:
            return t
        return TIPO_PRECIFICACAO_PADRAO

    def _open_honorario_sets(self) -> tuple[set[str], set[str]]:
        cpfs: set[str] = set()
        nome_keys: set[str] = set()
        q = (
            select(Declaracao.titular_cpf, Declaracao.titular_nome)
            .join(Cobranca, Cobranca.declaracao_id == Declaracao.id)
            .where(Cobranca.paid_at.is_(None))
        )
        for cpf, nome in self._db.execute(q).all():
            d = normalize_cpf_digits(cpf)
            if d and len(d) == 11:
                cpfs.add(d)
            else:
                nome_keys.add(carteira_key_sem_cpf((nome or "").strip() or "—"))
        return cpfs, nome_keys

    def _decl_exists_ano(self, ano_calendario: int, cpf_digits: str | None, nome: str | None) -> bool:
        return self._count_declaracoes_ano_cliente(ano_calendario, cpf_digits, nome) > 0

    def _procuracao_exists_ano(self, ano_calendario: int, cpf_digits: str | None, nome: str | None) -> bool:
        rows = self._db.execute(
            select(Procuracao.titular_cpf, Procuracao.titular_nome).where(
                Procuracao.ano_calendario == ano_calendario,
            ),
        ).all()
        nl = (nome or "").strip().lower() if nome else ""
        for cpf, nom in rows:
            if cpf_digits and len(cpf_digits) == 11 and normalize_cpf_digits(cpf) == cpf_digits:
                return True
            if (not cpf_digits or len(cpf_digits) != 11) and nl and (nom or "").strip().lower() == nl:
                return True
        return False

    def _count_declaracoes_ano_cliente(self, ano_calendario: int, cpf_digits: str | None, nome: str) -> int:
        rows = list(self._db.scalars(select(Declaracao).where(Declaracao.ano_calendario == ano_calendario)).all())
        return len(_declaracoes_matching_from_list(rows, cpf_digits, nome))

    def _bloqueio_declaracao_ou_procuracao_msg(
        self,
        ano_calendario: int,
        cpf_digits: str | None,
        nome: str,
    ) -> str | None:
        if self._decl_exists_ano(ano_calendario, cpf_digits, nome):
            return "Este cliente possui declaração neste exercício."
        if self._procuracao_exists_ano(ano_calendario, cpf_digits, nome):
            return "Este cliente possui procuração neste exercício."
        return None

    def _manual_cliente_refs(self, m: ClienteManual) -> tuple[str | None, str]:
        d = normalize_cpf_digits(m.cpf)
        cpf_d = d if d and len(d) == 11 else None
        return cpf_d, m.nome

    def list_carteira_exercicio(self, ano_carteira: int) -> list[ClienteListRowOut]:
        hon_cpfs, hon_nomes = self._open_honorario_sets()
        all_decl = list(self._db.scalars(select(Declaracao).where(Declaracao.ano_calendario == ano_carteira)).all())
        uid_set = {d.usuario_responsavel_id for d in all_decl if d.usuario_responsavel_id}
        id_to_nome: dict[int, str] = {}
        if uid_set:
            for u in self._db.scalars(select(Usuario).where(Usuario.id.in_(uid_set))).all():
                id_to_nome[u.id] = u.nome

        items: list[ClienteListRowOut] = []

        for m in self._manual_repo.list_by_ano_carteira(ano_carteira):
            d = normalize_cpf_digits(m.cpf)
            cpf_d = d if d and len(d) == 11 else None
            matched = _declaracoes_matching_from_list(all_decl, cpf_d, m.nome)
            n_decl = len(matched)
            if m.origem_cadastro == ORIGEM_IMPORTACAO and n_decl == 0:
                decl_out: int | None = None
            else:
                decl_out = n_decl

            hon = (cpf_d in hon_cpfs) if cpf_d else (carteira_key_sem_cpf(m.nome) in hon_nomes)
            tem_decl = n_decl > 0
            tem_proc = self._procuracao_exists_ano(ano_carteira, cpf_d, m.nome)

            r_labels = sorted(
                {
                    id_to_nome[uid]
                    for uid in (x.usuario_responsavel_id for x in matched)
                    if uid and uid in id_to_nome
                },
            )
            responsaveis_txt = ", ".join(r_labels) if r_labels else None

            origem: str = m.origem_cadastro
            if origem not in (ORIGEM_MANUAL, ORIGEM_IMPORTACAO, ORIGEM_SINC):
                origem = ORIGEM_MANUAL

            items.append(
                ClienteListRowOut(
                    estado_key=carteira_key_manual(m.id),
                    origem_cadastro=origem,
                    nome=m.nome,
                    cpf_exibicao=format_cpf_display(d) if d and len(d) == 11 else (m.cpf.strip() if m.cpf else None),
                    declaracoes_count=decl_out,
                    manual_id=m.id,
                    telefone=m.telefone,
                    email=m.email,
                    observacoes=m.observacoes,
                    cpf_digits=cpf_d,
                    ativo=m.ativo,
                    honorarios_em_aberto=hon,
                    tem_declaracao_exercicio=tem_decl,
                    tem_procuracao_exercicio=tem_proc,
                    declaracao_responsaveis=responsaveis_txt,
                    tipo_precificacao=_tipo_carteira_seguro(m.tipo_precificacao),
                    valor_personalizado=m.valor_personalizado,
                    asaas_customer_id=(m.asaas_customer_id or "").strip() or None,
                ),
            )

        items.sort(key=lambda r: r.nome.lower())
        return items

    def _declaracoes_ano_cliente(self, ano_calendario: int, cpf_digits: str | None, nome: str) -> list[Declaracao]:
        rows = list(self._db.scalars(select(Declaracao).where(Declaracao.ano_calendario == ano_calendario)).all())
        return _declaracoes_matching_from_list(rows, cpf_digits, nome)

    def list_carteira_declaracao_situacao(self, ano_carteira: int) -> list[CarteiraDeclaracaoSituacaoRow]:
        items: list[CarteiraDeclaracaoSituacaoRow] = []
        for m in self._manual_repo.list_by_ano_carteira(ano_carteira):
            d = normalize_cpf_digits(m.cpf)
            cpf_d = d if d and len(d) == 11 else None
            
            # Buscar procuração no banco de dados se houver CPF
            proc = (
                self._db.query(Procuracao)
                .filter(
                    Procuracao.titular_cpf == cpf_d,
                    Procuracao.ano_calendario == ano_carteira,
                )
                .first()
                if cpf_d
                else None
            )
            
            if proc:
                token = proc.token
                status_real = proc.status
                validade = proc.data_fim.date() if proc.data_fim else None
                
                # Deriva a situacao_declaracao baseada na procuração real
                if proc.status == "ATIVA":
                    if proc.data_fim and proc.data_fim.date() < date.today():
                        sit = "vencida"
                    else:
                        sit = "valido_ate"
                elif proc.status in ("EXPIRADA", "REVOGADA"):
                    sit = "vencida"
                else:
                    sit = "nao_existe"
            else:
                # Fallback baseado nas declarações
                decls = self._declaracoes_ano_cliente(ano_carteira, cpf_d, m.nome)
                sit, validade = _classify_situacao_declaracao(ano_carteira, decls)
                token = None
                status_real = None

            items.append(
                CarteiraDeclaracaoSituacaoRow(
                    estado_key=carteira_key_manual(m.id),
                    nome=m.nome,
                    cpf_exibicao=format_cpf_display(d) if d and len(d) == 11 else (m.cpf.strip() if m.cpf else None),
                    manual_id=m.id,
                    ativo=m.ativo,
                    situacao_declaracao=sit,
                    validade_ate=validade,
                    token=token,
                    status_real=status_real,
                ),
            )
        items.sort(key=lambda r: r.nome.lower())
        return items

    def set_ativo(self, estado_key: str, ativo: bool, ano_calendario: int) -> None:
        if not estado_key.startswith("manual:"):
            raise ValueError("Chave inválida. Utilize manual:{id}.")
        mid = int(estado_key.split(":", 1)[1])
        m = self._manual_repo.get(mid)
        if m is None:
            raise ValueError("Cliente não encontrado")
        cpf_d, nome = self._manual_cliente_refs(m)

        if not ativo:
            msg = self._bloqueio_declaracao_ou_procuracao_msg(ano_calendario, cpf_d, nome)
            if msg:
                raise ValueError(f"{msg} Não é possível inativá-lo.")

        m.ativo = ativo
        m.updated_at = _utcnow()

    def ensure_exclusao_permitida(self, m: ClienteManual, ano_calendario: int) -> None:
        cpf_d, nome = self._manual_cliente_refs(m)
        msg = self._bloqueio_declaracao_ou_procuracao_msg(ano_calendario, cpf_d, nome)
        if msg:
            raise ValueError(f"{msg} Não é possível excluir o cadastro.")

    def sincronizar_declaracoes_banco(self, ano_calendario: int) -> ClienteSincronizarDeclOut:
        decl_rows = self._db.execute(
            select(Declaracao.titular_cpf, Declaracao.titular_nome, Declaracao.updated_at).where(
                Declaracao.ano_calendario == ano_calendario,
            ),
        ).all()

        by_cpf: dict[str, dict] = defaultdict(lambda: {"nome": "", "last": None})
        no_cpf: dict[str, dict] = {}

        for cpf, nome, upd in decl_rows:
            key = normalize_cpf_digits(cpf)
            nome_clean = (nome or "").strip() or "—"
            if key:
                e = by_cpf[key]
                if upd is not None and (e["last"] is None or upd > e["last"]):
                    e["last"] = upd
                    e["nome"] = nome_clean
            else:
                nl = nome_clean.lower()
                if nl not in no_cpf:
                    no_cpf[nl] = {"nome": nome_clean}

        existentes = self._manual_repo.list_by_ano_carteira(ano_calendario)
        cpf_ocup = {normalize_cpf_digits(x.cpf) for x in existentes if normalize_cpf_digits(x.cpf)}
        nome_ocup = {(x.nome or "").strip().lower() for x in existentes}

        criados = 0
        now = _utcnow()

        for digits in by_cpf.keys():
            if digits in cpf_ocup:
                continue
            nome_clean = by_cpf[digits]["nome"]
            row = ClienteManual(
                ano_carteira=ano_calendario,
                origem_cadastro=ORIGEM_SINC,
                nome=nome_clean,
                cpf=format_cpf_display(digits),
                telefone=None,
                email=None,
                observacoes=None,
                ativo=True,
                tipo_precificacao=self._tipo_precificacao_sinc_import(),
                valor_personalizado=None,
                created_at=now,
                updated_at=now,
            )
            self._manual_repo.add(row)
            cpf_ocup.add(digits)
            criados += 1

        for nl, e in no_cpf.items():
            if nl in nome_ocup:
                continue
            nome_clean = e["nome"]
            row = ClienteManual(
                ano_carteira=ano_calendario,
                origem_cadastro=ORIGEM_SINC,
                nome=nome_clean,
                cpf=None,
                telefone=None,
                email=None,
                observacoes=None,
                ativo=True,
                tipo_precificacao=self._tipo_precificacao_sinc_import(),
                valor_personalizado=None,
                created_at=now,
                updated_at=now,
            )
            self._manual_repo.add(row)
            nome_ocup.add(nl)
            criados += 1

        return ClienteSincronizarDeclOut(
            criados=criados,
            message=f"{criados} cliente(s) incluído(s) na carteira a partir das declarações de {ano_calendario} no banco.",
        )

    def importar_do_ano_anterior(self, ano_origem: int, ano_destino: int) -> ClienteImportarAnoOut:
        if ano_origem == ano_destino:
            return ClienteImportarAnoOut(criados=0, message="Ano de origem e destino não podem ser iguais.")

        decl_origem = self._db.execute(
            select(Declaracao.titular_cpf, Declaracao.titular_nome).where(Declaracao.ano_calendario == ano_origem),
        ).all()

        dest_rows = self._db.execute(
            select(Declaracao.titular_cpf, Declaracao.titular_nome).where(Declaracao.ano_calendario == ano_destino),
        ).all()
        dest_cpfs = {normalize_cpf_digits(c) for c, _ in dest_rows if normalize_cpf_digits(c)}
        dest_nomes = {(n or "").strip().lower() for _, n in dest_rows if n}

        existentes = self._manual_repo.list_by_ano_carteira(ano_destino)
        bloqueio_cpfs = set(dest_cpfs) | {
            normalize_cpf_digits(m.cpf) for m in existentes if normalize_cpf_digits(m.cpf)
        }
        bloqueio_nomes = set(dest_nomes) | {(m.nome or "").strip().lower() for m in existentes}

        vistos_origem_cpf: set[str] = set()
        vistos_origem_nome: set[str] = set()
        criados = 0
        now = _utcnow()

        for cpf, nome in decl_origem:
            nome_clean = (nome or "").strip() or "—"
            d = normalize_cpf_digits(cpf)
            if d and len(d) == 11:
                if d in vistos_origem_cpf:
                    continue
                vistos_origem_cpf.add(d)
                if d in bloqueio_cpfs:
                    continue
                row = ClienteManual(
                    ano_carteira=ano_destino,
                    origem_cadastro=ORIGEM_IMPORTACAO,
                    nome=nome_clean,
                    cpf=format_cpf_display(d),
                    telefone=None,
                    email=None,
                    observacoes=f"Importado das declarações de {ano_origem}. Contagem de declarações aparece após registo no exercício (ex.: pasta monitorada).",
                    ativo=True,
                    tipo_precificacao=self._tipo_precificacao_sinc_import(),
                    valor_personalizado=None,
                    created_at=now,
                    updated_at=now,
                )
                self._manual_repo.add(row)
                bloqueio_cpfs.add(d)
                criados += 1
            else:
                nl = nome_clean.lower()
                if nl in vistos_origem_nome:
                    continue
                vistos_origem_nome.add(nl)
                if nl in bloqueio_nomes:
                    continue
                row = ClienteManual(
                    ano_carteira=ano_destino,
                    origem_cadastro=ORIGEM_IMPORTACAO,
                    nome=nome_clean,
                    cpf=None,
                    telefone=None,
                    email=None,
                    observacoes=f"Importado das declarações de {ano_origem} (sem CPF). Contagem após registo no exercício.",
                    ativo=True,
                    tipo_precificacao=self._tipo_precificacao_sinc_import(),
                    valor_personalizado=None,
                    created_at=now,
                    updated_at=now,
                )
                self._manual_repo.add(row)
                bloqueio_nomes.add(nl)
                criados += 1

        return ClienteImportarAnoOut(
            criados=criados,
            message=f"{criados} cliente(s) importado(s) para a carteira de {ano_destino}.",
        )

    def create_manual(self, payload: ClienteManualCreate) -> ClienteManual:
        now = _utcnow()
        vp = payload.valor_personalizado if payload.tipo_precificacao == TIPO_PRECIFICACAO_PERSONALIZADO else None
        row = ClienteManual(
            ano_carteira=payload.ano_carteira,
            origem_cadastro=ORIGEM_MANUAL,
            nome=payload.nome.strip(),
            cpf=payload.cpf.strip() if payload.cpf else None,
            telefone=payload.telefone.strip() if payload.telefone else None,
            email=payload.email.strip() if payload.email else None,
            observacoes=payload.observacoes.strip() if payload.observacoes else None,
            ativo=payload.ativo,
            tipo_precificacao=payload.tipo_precificacao,
            valor_personalizado=vp,
            asaas_customer_id=payload.asaas_customer_id.strip()
            if payload.asaas_customer_id and str(payload.asaas_customer_id).strip()
            else None,
            created_at=now,
            updated_at=now,
        )
        _validar_tipo_valor_precificacao(row.tipo_precificacao, row.valor_personalizado)
        self._manual_repo.add(row)
        return row

    def update_manual(self, row: ClienteManual, payload: ClienteManualUpdate) -> ClienteManual:
        data = payload.model_dump(exclude_unset=True)
        if "nome" in data and data["nome"] is not None:
            row.nome = data["nome"].strip()
        if "cpf" in data:
            v = data["cpf"]
            row.cpf = None if v is None else (str(v).strip() or None)
        if "telefone" in data:
            v = data["telefone"]
            row.telefone = None if v is None else (str(v).strip() or None)
        if "email" in data:
            v = data["email"]
            row.email = None if v is None else (str(v).strip() or None)
        if "observacoes" in data:
            v = data["observacoes"]
            row.observacoes = None if v is None else (str(v).strip() or None)
        if "ativo" in data and data["ativo"] is not None:
            row.ativo = data["ativo"]
        if "tipo_precificacao" in data and data["tipo_precificacao"] is not None:
            row.tipo_precificacao = data["tipo_precificacao"]
        if "valor_personalizado" in data:
            row.valor_personalizado = data["valor_personalizado"]
        if "asaas_customer_id" in data:
            v = data["asaas_customer_id"]
            row.asaas_customer_id = None if v is None else (str(v).strip() or None)
        if row.tipo_precificacao != TIPO_PRECIFICACAO_PERSONALIZADO:
            row.valor_personalizado = None
        _validar_tipo_valor_precificacao(row.tipo_precificacao, row.valor_personalizado)
        row.updated_at = _utcnow()
        return row

    def get_manual(self, cliente_id: int) -> ClienteManual | None:
        return self._manual_repo.get(cliente_id)

    def delete_manual(self, row: ClienteManual) -> None:
        self._manual_repo.delete(row)
