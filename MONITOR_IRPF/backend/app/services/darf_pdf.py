import unicodedata
from decimal import Decimal
from io import BytesIO

from fpdf import FPDF

from app.schemas.darf import DarfGerarOut


def _ascii_safe(text: str) -> str:
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii") or text


def _fmt_brl(value: Decimal) -> str:
    s = f"{value:,.2f}"
    return "R$ " + s.replace(",", "X").replace(".", ",").replace("X", ".")


def build_darf_test_pdf(data: DarfGerarOut) -> tuple[bytes, str]:
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_margins(18, 18, 18)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(180, 0, 0)
    pdf.cell(0, 14, _ascii_safe("DARF emitido em ambiente de testes"), align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "", 11)
    linhas = [
        ("Referencia", data.referencia),
        ("Exercicio (ano-calendario)", str(data.ano_calendario)),
        ("Titular", _ascii_safe(data.titular_nome)),
        ("CPF", data.titular_cpf or "—"),
        ("Parcela", f"{data.parcela} de {data.total_parcelas}"),
        ("Valor desta parcela", _fmt_brl(data.valor_parcela)),
        ("Imposto total da declaracao", _fmt_brl(data.valor_imposto_total)),
        (
            "Forma de pagamento na declaracao",
            "Debito automatico em conta" if data.debito_automatico else "Guia DARF (manual)",
        ),
    ]
    for rotulo, valor in linhas:
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 6, _ascii_safe(rotulo + ":"), new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 6, _ascii_safe(str(valor)))
        pdf.ln(1)
    pdf.ln(6)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(80, 80, 80)
    pdf.multi_cell(
        0,
        5,
        _ascii_safe(
            "Documento ficticio para homologacao do fluxo de emissao. "
            "Nao possui codigo de barras nem validade perante a Receita Federal."
        ),
    )
    buf = BytesIO()
    pdf.output(buf)
    filename = f"{data.referencia}.pdf"
    return buf.getvalue(), filename
