from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.orm import Session

from app.models.declaracao import Declaracao
from app.schemas.darf import DarfGerarOut, DarfItemOut, DarfListaOut


def _parcelas(row: Declaracao) -> int:
    n = row.imposto_quantidade_parcelas
    if n is None or n < 1:
        return 1
    return min(n, 12)


def _debito_automatico(row: Declaracao) -> bool:
    return bool(row.imposto_debito_automatico)


def valor_parcela_imposto(total: Decimal, parcela: int, total_parcelas: int) -> Decimal:
    if total_parcelas <= 1:
        return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    base = (total / total_parcelas).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if parcela < total_parcelas:
        return base
    anterior = base * (total_parcelas - 1)
    return (total - anterior).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class DarfService:
    def __init__(self, db: Session) -> None:
        self._db = db

    def listar_imposto_pagar(self, ano_calendario: int) -> DarfListaOut:
        rows = (
            self._db.query(Declaracao)
            .filter(
                Declaracao.ano_calendario == ano_calendario,
                Declaracao.resultado_fiscal == "imposto_pagar",
            )
            .order_by(Declaracao.titular_nome)
            .all()
        )
        itens: list[DarfItemOut] = []
        for row in rows:
            valor = row.valor_imposto_ou_restituicao
            if valor is None or valor <= 0:
                continue
            itens.append(
                DarfItemOut(
                    declaracao_id=row.id,
                    titular_nome=row.titular_nome,
                    titular_cpf=row.titular_cpf,
                    valor_imposto=valor,
                    quantidade_parcelas=_parcelas(row),
                    debito_automatico=_debito_automatico(row),
                )
            )
        return DarfListaOut(ano_calendario=ano_calendario, itens=itens)

    def gerar(
        self,
        row: Declaracao,
        parcela: int,
        confirmar_debito_automatico: bool,
    ) -> DarfGerarOut:
        if row.resultado_fiscal != "imposto_pagar":
            raise ValueError("Declaração não apurou imposto a pagar.")
        valor_total = row.valor_imposto_ou_restituicao
        if valor_total is None or valor_total <= 0:
            raise ValueError("Valor do imposto não informado.")
        total_parcelas = _parcelas(row)
        if parcela < 1 or parcela > total_parcelas:
            raise ValueError(f"Parcela inválida. Escolha entre 1 e {total_parcelas}.")
        debito = _debito_automatico(row)
        if debito and not confirmar_debito_automatico:
            raise ValueError(
                "Este pagamento está em débito automático. Confirme se deseja emitir o DARF manualmente."
            )
        valor_parcela = valor_parcela_imposto(valor_total, parcela, total_parcelas)
        ref = f"DARF-{row.ano_calendario}-{row.id}-P{parcela}"
        return DarfGerarOut(
            declaracao_id=row.id,
            ano_calendario=row.ano_calendario,
            titular_nome=row.titular_nome,
            titular_cpf=row.titular_cpf,
            parcela=parcela,
            total_parcelas=total_parcelas,
            valor_parcela=valor_parcela,
            valor_imposto_total=valor_total,
            debito_automatico=debito,
            referencia=ref,
            message="PDF de teste gerado e transferido para download.",
        )
