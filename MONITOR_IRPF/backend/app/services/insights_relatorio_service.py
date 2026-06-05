import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.declaracao import Declaracao


def _digits(cpf: str) -> str:
    return re.sub(r"\D", "", cpf or "")


def _format_cpf_display(digits: str) -> str:
    if len(digits) != 11:
        return digits
    return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"


def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _dec_to_float(v: Decimal | float | int | str | None) -> float | None:
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _fmt_brl(v: float | None) -> str:
    if v is None or v != v:  # NaN
        return "—"
    neg = v < 0
    s = f"{abs(v):,.2f}"
    s = s.replace(",", "X").replace(".", ",").replace("X", ".")
    return ("−" if neg else "") + "R$ " + s


def _fmt_pct(v: float | None) -> str:
    if v is None or v != v:
        return "—"
    return f"{v:+.1f}%".replace(".", ",")


def _res_label(key: str) -> str:
    return {
        "imposto_pagar": "imposto a pagar",
        "restituir": "restituição",
        "isento": "isento",
        "nao_informado": "não informado",
    }.get(key, key)


def _total_rendimentos_decl(d: Declaracao) -> float | None:
    rt = _dec_to_float(d.rendimentos_tributaveis_total)
    ri = _dec_to_float(d.rendimentos_isentos_total)
    if rt is None and ri is None:
        return None
    return (rt or 0.0) + (ri or 0.0)


def _caixa_pos_ir_aprox(d: Declaracao, total_rend: float | None) -> float | None:
    if total_rend is None:
        return None
    res = (d.resultado_fiscal or "").strip()
    val = _dec_to_float(d.valor_imposto_ou_restituicao) or 0.0
    caixa = float(total_rend)
    if res == "imposto_pagar":
        caixa -= val
    elif res == "restituir":
        caixa += val
    return caixa


def _decl_por_ano_unica(decls: list[Declaracao]) -> dict[int, Declaracao]:
    by_ano: dict[int, list[Declaracao]] = defaultdict(list)
    for d in decls:
        by_ano[d.ano_calendario].append(d)
    return {ano: max(lst, key=lambda x: x.id) for ano, lst in by_ano.items()}


def _comparacoes_evolucao_caixa(decls: list[Declaracao], anos: list[int]) -> list[dict[str, Any]]:
    if len(anos) < 2:
        return []
    pick = _decl_por_ano_unica(decls)
    out: list[dict[str, Any]] = []
    for a0, a1 in zip(anos, anos[1:]):
        d0 = pick.get(a0)
        d1 = pick.get(a1)
        if d0 is None or d1 is None:
            continue
        tr0 = _total_rendimentos_decl(d0)
        tr1 = _total_rendimentos_decl(d1)
        if tr0 is None or tr1 is None:
            continue
        p0 = _dec_to_float(d0.patrimonio_liquido_declarado)
        p1 = _dec_to_float(d1.patrimonio_liquido_declarado)
        c0 = _caixa_pos_ir_aprox(d0, tr0)
        c1 = _caixa_pos_ir_aprox(d1, tr1)
        if c0 is None or c1 is None:
            continue
        delta_rend = tr1 - tr0
        delta_caixa = c1 - c0
        delta_pat = (p1 - p0) if (p0 is not None and p1 is not None) else None
        gap = (delta_pat - delta_caixa) if delta_pat is not None else None
        interpretacao = ""
        if delta_pat is not None and gap is not None:
            if gap > max(1.0, 0.05 * max(abs(delta_caixa), abs(delta_pat), 1.0)):
                interpretacao = (
                    "O patrimônio líquido declarado subiu mais do que a «caixa» pós-IR aproximada entre os dois anos — "
                    "pode indicar herança/doação, reavaliação de bens, dívida não mapeada ou rendimentos não lançados; "
                    "vale confrontar com o IRPF completo."
                )
            elif gap < -max(1.0, 0.05 * max(abs(delta_caixa), abs(delta_pat), 1.0)):
                interpretacao = (
                    "A «caixa» pós-IR cresceu mais do que o patrimônio líquido declarado — consumo, amortização de "
                    "dívidas ou saídas não patrimoniais podem explicar; confira dívidas e despesas."
                )
            else:
                interpretacao = (
                    "Variação de patrimônio e de caixa pós-IR aproximada são coerentes na ordem de grandeza "
                    "(aproximação; não substitui auditoria)."
                )
        else:
            interpretacao = (
                "Preencha «patrimônio líquido declarado» nos dois anos para comparar acumulação de bens com a "
                "evolução da caixa."
            )
        out.append(
            {
                "de": a0,
                "para": a1,
                "total_rendimentos_de_brl": _fmt_brl(tr0),
                "total_rendimentos_para_brl": _fmt_brl(tr1),
                "delta_total_rendimentos_brl": _fmt_brl(delta_rend),
                "caixa_pos_ir_de_brl": _fmt_brl(c0),
                "caixa_pos_ir_para_brl": _fmt_brl(c1),
                "delta_caixa_pos_ir_brl": _fmt_brl(delta_caixa),
                "patrimonio_liquido_de_brl": _fmt_brl(p0) if p0 is not None else None,
                "patrimonio_liquido_para_brl": _fmt_brl(p1) if p1 is not None else None,
                "delta_patrimonio_liquido_brl": _fmt_brl(delta_pat) if delta_pat is not None else None,
                "gap_patrimonio_menos_caixa_brl": _fmt_brl(gap) if gap is not None else None,
                "interpretacao": interpretacao,
            },
        )
    return out


def construir_metricas(decls: list[Declaracao]) -> dict[str, Any]:
    """Agrega números disponíveis na tabela `declaracoes` (sem parsing do PDF/XML)."""
    n = len(decls)
    anos = sorted({d.ano_calendario for d in decls})
    por_res: Counter[str] = Counter()
    soma_pagar = 0.0
    soma_restituir = 0.0
    soma_isento = 0.0
    soma_ni = 0.0

    por_ano: list[dict[str, Any]] = []
    for d in sorted(decls, key=lambda x: (x.ano_calendario, x.id)):
        res = (d.resultado_fiscal or "nao_informado").strip() or "nao_informado"
        por_res[res] += 1
        val = _dec_to_float(d.valor_imposto_ou_restituicao)
        if val is None:
            pass
        elif res == "imposto_pagar":
            soma_pagar += val
        elif res == "restituir":
            soma_restituir += val
        elif res == "isento":
            soma_isento += val
        else:
            soma_ni += val

        evo = (d.evolucao_patrimonial_resumo or "").strip()
        rt = _dec_to_float(d.rendimentos_tributaveis_total)
        ri = _dec_to_float(d.rendimentos_isentos_total)
        tr = _total_rendimentos_decl(d)
        pat = _dec_to_float(d.patrimonio_liquido_declarado)
        caixa = _caixa_pos_ir_aprox(d, tr)
        por_ano.append(
            {
                "declaracao_id": d.id,
                "ano_calendario": d.ano_calendario,
                "status": d.status,
                "resultado_fiscal": d.resultado_fiscal,
                "valor_imposto_ou_restituicao": val,
                "valor_imposto_ou_restituicao_brl": _fmt_brl(val),
                "rendimentos_tributaveis_brl": _fmt_brl(rt) if rt is not None else None,
                "rendimentos_isentos_brl": _fmt_brl(ri) if ri is not None else None,
                "total_rendimentos_brl": _fmt_brl(tr) if tr is not None else None,
                "patrimonio_liquido_declarado_brl": _fmt_brl(pat) if pat is not None else None,
                "caixa_pos_ir_aprox_brl": _fmt_brl(caixa) if caixa is not None else None,
                "malha_fina": bool(d.indicacao_malha_fina),
                "restituicao_paga": d.restituicao_paga,
                "data_entrega": d.data_entrega.isoformat() if d.data_entrega else None,
                "tem_resumo_patrimonio": bool(evo),
                "resumo_patrimonio_excerto": (evo[:280] + "…") if len(evo) > 280 else evo or None,
            },
        )

    variacoes: list[dict[str, Any]] = []
    if len(anos) > 1:
        by_ano: dict[int, list[Declaracao]] = {}
        for d in decls:
            by_ano.setdefault(d.ano_calendario, []).append(d)
        for a0, a1 in zip(anos, anos[1:]):
            v0_list = by_ano.get(a0, [])
            v1_list = by_ano.get(a1, [])
            v0 = _dec_to_float(v0_list[0].valor_imposto_ou_restituicao) if len(v0_list) == 1 else None
            v1 = _dec_to_float(v1_list[0].valor_imposto_ou_restituicao) if len(v1_list) == 1 else None
            if v0 is not None and v1 is not None:
                delta = v1 - v0
                pct = ((v1 - v0) / v0 * 100.0) if v0 != 0 else None
                variacoes.append(
                    {
                        "de": a0,
                        "para": a1,
                        "delta_brl": _fmt_brl(delta),
                        "delta_pct": pct,
                        "delta_pct_fmt": _fmt_pct(pct),
                    },
                )

    malha = sum(1 for d in decls if d.indicacao_malha_fina)
    rest_pagas = sum(1 for d in decls if d.restituicao_paga is True)
    com_evo = sum(1 for d in decls if (d.evolucao_patrimonial_resumo or "").strip())
    com_rend = sum(1 for d in decls if _total_rendimentos_decl(d) is not None)
    com_pat = sum(1 for d in decls if _dec_to_float(d.patrimonio_liquido_declarado) is not None)
    soma_tr = sum(t for d in decls if (t := _total_rendimentos_decl(d)) is not None)
    comps_caixa = _comparacoes_evolucao_caixa(decls, anos)

    return {
        "declaracoes_analisadas": n,
        "anos_calendario": anos,
        "por_resultado_fiscal": dict(sorted(por_res.items())),
        "totais_brl": {
            "imposto_pagar_soma": _fmt_brl(soma_pagar),
            "restituir_soma": _fmt_brl(soma_restituir),
            "isento_soma": _fmt_brl(soma_isento),
            "outros_soma": _fmt_brl(soma_ni),
            "imposto_pagar_soma_num": soma_pagar,
            "restituir_soma_num": soma_restituir,
        },
        "contagens": {
            "malha_fina": malha,
            "restituicao_marcada_paga": rest_pagas,
            "com_resumo_patrimonial_texto": com_evo,
            "com_rendimentos_totais_preenchidos": com_rend,
            "com_patrimonio_liquido_preenchido": com_pat,
        },
        "totais_rendimentos": {
            "soma_total_rendimentos_trib_mais_isentos_brl": _fmt_brl(soma_tr) if com_rend else None,
        },
        "evolucao_caixa": {
            "comparacoes_anuais": comps_caixa,
            "nota_metodologica": (
                "Total de rendimentos = soma (tributáveis + isentos) informada no cadastro da declaração. "
                "«Caixa pós-IR aprox.» = total de rendimentos − valor de imposto a pagar (se aplicável) "
                "+ valor de restituição (se aplicável), ignorando outras saídas de caixa."
            ),
        },
        "por_ano": por_ano,
        "variacao_valor_entre_anos": variacoes,
    }


def montar_relatorio_contribuinte(db: Session, cpf_query: str) -> dict[str, Any]:
    d = _digits(cpf_query)
    if len(d) != 11:
        return {
            "valido": False,
            "cpf": cpf_query,
            "message": "CPF inválido: indique 11 dígitos.",
            "gerado_em": _utc_iso(),
            "declaracoes": [],
            "resumo_executivo": "",
            "metricas": {},
            "analises": [],
        }

    rows = list(db.scalars(select(Declaracao).where(Declaracao.titular_cpf.isnot(None))).all())
    decls = [r for r in rows if _digits(r.titular_cpf or "") == d]
    decls.sort(key=lambda x: (x.ano_calendario, x.id))

    nome = ""
    for r in decls:
        if (r.titular_nome or "").strip():
            nome = (r.titular_nome or "").strip()
            break

    if not decls:
        return {
            "valido": True,
            "cpf": _format_cpf_display(d),
            "titular_nome": nome or None,
            "gerado_em": _utc_iso(),
            "declaracoes": [],
            "metricas": construir_metricas([]),
            "resumo_executivo": "Não há declarações gravadas para este CPF. Registe declarações em Declarações (CPF) para gerar análise.",
            "analises": _montar_analises([], construir_metricas([]), Counter(), []),
        }

    anos = sorted({r.ano_calendario for r in decls})
    anos_txt = ", ".join(str(a) for a in anos)
    res_counter: Counter[str] = Counter()
    for r in decls:
        key = (r.resultado_fiscal or "nao_informado").strip() or "nao_informado"
        res_counter[key] += 1

    m = construir_metricas(decls)
    tb = m["totais_brl"]

    resumo_parts = [
        f"Foram analisadas {len(decls)} declaração(ões) nos anos-calendário {anos_txt}.",
        f"Soma dos valores declarados como «imposto a pagar»: {tb['imposto_pagar_soma']}; "
        f"como «restituição»: {tb['restituir_soma']}.",
    ]
    if res_counter:
        frag = "; ".join(f"{_res_label(k)}: {v}" for k, v in sorted(res_counter.items()))
        resumo_parts.append(f"Distribuição por resultado fiscal (nº de declarações): {frag}.")
    crend = int(m.get("contagens", {}).get("com_rendimentos_totais_preenchidos") or 0)
    if crend:
        trb = (m.get("totais_rendimentos") or {}).get("soma_total_rendimentos_trib_mais_isentos_brl")
        resumo_parts.append(
            f"Soma dos totais de rendimentos (tributáveis + isentos) informados no cadastro: {trb} ({crend} declaração(ões)).",
        )

    return {
        "valido": True,
        "cpf": _format_cpf_display(d),
        "titular_nome": nome or None,
        "gerado_em": _utc_iso(),
        "metricas": m,
        "declaracoes": [
            {
                "id": r.id,
                "ano_calendario": r.ano_calendario,
                "titular_nome": r.titular_nome,
                "titular_cpf": r.titular_cpf,
                "status": r.status,
                "resultado_fiscal": r.resultado_fiscal,
                "valor_imposto_ou_restituicao": _dec_to_float(r.valor_imposto_ou_restituicao),
                "valor_imposto_ou_restituicao_brl": _fmt_brl(_dec_to_float(r.valor_imposto_ou_restituicao)),
                "rendimentos_tributaveis_total": _dec_to_float(r.rendimentos_tributaveis_total),
                "rendimentos_isentos_total": _dec_to_float(r.rendimentos_isentos_total),
                "patrimonio_liquido_declarado": _dec_to_float(r.patrimonio_liquido_declarado),
                "indicacao_malha_fina": r.indicacao_malha_fina,
                "restituicao_paga": r.restituicao_paga,
            }
            for r in decls
        ],
        "resumo_executivo": " ".join(resumo_parts),
        "analises": _montar_analises(decls, m, res_counter, anos),
    }


def _montar_analises(
    decls: list[Declaracao],
    metricas: dict[str, Any],
    res_counter: Counter[str],
    anos: list[int],
) -> list[dict[str, Any]]:
    n = len(decls)
    if n == 0:
        msg = "Sem declarações gravadas para este CPF na base."
        return [
            {"id": "patrimonio", "titulo": "Situação patrimonial", "pontos": [msg]},
            {"id": "evolucao_caixa", "titulo": "Evolução de caixa", "pontos": [msg]},
            {"id": "renda", "titulo": "Fontes de renda", "pontos": [msg]},
            {"id": "deducao", "titulo": "Perfil de dedução", "pontos": [msg]},
            {"id": "saude", "titulo": "Saúde financeira", "pontos": [msg]},
            {"id": "investimentos", "titulo": "Perfil de investimentos", "pontos": [msg]},
            {"id": "alertas", "titulo": "Alertas e oportunidades", "pontos": [msg]},
            {"id": "temporal", "titulo": "Análise temporal (comparando anos)", "pontos": [msg]},
        ]

    anos_txt = ", ".join(str(a) for a in anos) if anos else "—"
    tem_multi = len(anos) > 1
    tb = metricas.get("totais_brl") or {}
    por_ano = metricas.get("por_ano") or []
    cnt = metricas.get("contagens") or {}
    variacoes = metricas.get("variacao_valor_entre_anos") or []

    def patrimonio() -> list[str]:
        lines: list[str] = []
        c_evo = int(cnt.get("com_resumo_patrimonial_texto") or 0)
        if c_evo:
            lines.append(
                f"{c_evo} de {n} declaração(ões) com texto de «evolução patrimonial» preenchido no cadastro — "
                "use esse campo para notas sobre bens e variações entre exercícios.",
            )
            for row in por_ano:
                ex = row.get("resumo_patrimonio_excerto")
                if ex:
                    ano = row["ano_calendario"]
                    lines.append(f"{ano}: excerto — «{ex}»")
        else:
            lines.append(
                "Nenhum resumo de evolução patrimonial gravado nas declarações analisadas. "
                "Preencha o campo na ficha da declaração para contextualizar imóveis, veículos e investimentos.",
            )
        lines.extend(
            [
                "Detalhamento por classe de ativo (percentuais, imóveis vs renda variável, etc.) exige extração "
                "estruturada do arquivo da declaração — ainda não disponível nesta base.",
                "Com múltiplos anos, compare manualmente os excertos e valores de bens entre declarações.",
            ],
        )
        return lines

    def evolucao_caixa() -> list[str]:
        ec = metricas.get("evolucao_caixa") or {}
        cr = int(cnt.get("com_rendimentos_totais_preenchidos") or 0)
        cp = int(cnt.get("com_patrimonio_liquido_preenchido") or 0)
        trtot = (metricas.get("totais_rendimentos") or {}).get("soma_total_rendimentos_trib_mais_isentos_brl")
        lines: list[str] = []
        if cr == 0:
            lines.append(
                "Sem totais de rendimentos (tributáveis e/ou isentos) preenchidos nas declarações. "
                "Em Declarações → Editar cadastro, informe os valores para estimar caixa e comparar com o patrimônio.",
            )
        else:
            lines.append(
                f"{cr} declaração(ões) com total de rendimentos informado; soma na série: {trtot or '—'}. "
                f"{cp} com «patrimônio líquido declarado» preenchido (para confronto ano a ano).",
            )
            for row in por_ano:
                if row.get("total_rendimentos_brl"):
                    lines.append(
                        f"{row['ano_calendario']}: tributáveis {row.get('rendimentos_tributaveis_brl') or '—'}, "
                        f"isentos {row.get('rendimentos_isentos_brl') or '—'}, total {row['total_rendimentos_brl']}, "
                        f"caixa pós-IR aprox. {row.get('caixa_pos_ir_aprox_brl') or '—'}, "
                        f"patrimônio líquido {row.get('patrimonio_liquido_declarado_brl') or '—'}.",
                    )
            for c in ec.get("comparacoes_anuais") or []:
                gap = c.get("gap_patrimonio_menos_caixa_brl")
                gap_part = f"Diferença (patrimônio − caixa): {gap}. " if gap else ""
                lines.append(
                    f"De {c['de']} para {c['para']}: Δ rendimentos {c.get('delta_total_rendimentos_brl')}, "
                    f"Δ caixa pós-IR {c.get('delta_caixa_pos_ir_brl')}, Δ patrimônio líquido {c.get('delta_patrimonio_liquido_brl') or '—'}. "
                    f"{gap_part}{c.get('interpretacao', '')}",
                )
            if ec.get("nota_metodologica"):
                lines.append(str(ec["nota_metodologica"]))
        lines.append(
            "Modelo completo de caixa (dívidas, consumo, investimentos fora do IRPF) ainda não está na base — "
            "use esta leitura como sinalização, não como saldo bancário.",
        )
        return lines

    def renda() -> list[str]:
        entregues = sum(1 for d in decls if (d.status or "").lower() == "entregue")
        lines = [
            f"Declarações nos anos {anos_txt}: {n} registro(s), {entregues} com status «entregue».",
            "Rendimentos por categoria (salário, aluguéis, dividendos, exterior) não estão normalizados na base — "
            "só há metadados fiscais agregados por exercício.",
            "Para análise de concentração e renda passiva vs ativa, importe/evolua o parser da declaração (DEC/PDF).",
        ]
        return lines

    def deducao() -> list[str]:
        return [
            "A tabela atual não guarda despesas médicas, dependentes, previdência ou tipo de desconto "
            "(simplificado vs completo) por linha.",
            "Quando esses campos forem persistidos, este bloco mostrará totais e comparação com tetos legais por ano.",
            "Sugestão: registar no campo «observações» da declaração notas sobre deduções relevantes até haver extração automática.",
        ]

    def saude() -> list[str]:
        lines = [
            f"Valores monetários associados ao resultado fiscal: imposto a pagar (soma) = {tb.get('imposto_pagar_soma', '—')}; "
            f"restituição (soma dos valores declarados) = {tb.get('restituir_soma', '—')}.",
        ]
        if res_counter:
            parts = [f"{_res_label(k)}: {v} decl." for k, v in sorted(res_counter.items())]
            lines.append("Ocorrências por tipo de resultado: " + "; ".join(parts) + ".")
        crend = int(cnt.get("com_rendimentos_totais_preenchidos") or 0)
        if crend and tb.get("imposto_pagar_soma_num"):
            soma_ir = float(tb.get("imposto_pagar_soma_num") or 0)
            soma_rend = sum(_total_rendimentos_decl(d) or 0.0 for d in decls if _total_rendimentos_decl(d) is not None)
            if soma_rend > 0:
                carga = 100.0 * soma_ir / soma_rend
                lines.append(
                    f"Aproximação de carga sobre rendimentos declarados (soma imposto a pagar ÷ soma de rendimentos): "
                    f"{_fmt_pct(carga)} (base: {crend} ano(s) com rendimentos preenchidos).",
                )
        else:
            lines.append(
                "Carga tributária efetiva (imposto ÷ renda total) fica limitada enquanto não houver totais de "
                "rendimentos preenchidos no cadastro da declaração.",
            )
        if any((d.resultado_fiscal or "") == "imposto_pagar" for d in decls):
            lines.append(
                "Há exercício(s) com imposto a pagar — verifique planejamento (deduções, carnê-leão, retenções) "
                "nos anos seguintes.",
            )
        if any((d.resultado_fiscal or "") == "restituir" for d in decls):
            lines.append(
                "Há exercício(s) com restituição — confirme se o valor creditado bate com o declarado e com "
                f"«restituição paga» ({int(cnt.get('restituicao_marcada_paga') or 0)} declaração(ões) marcadas como pagas).",
            )
        return lines

    def investimentos() -> list[str]:
        return [
            "Sem posição consolidada de ativos (RF, RV, exterior) na base relacional — apenas texto livre de "
            "evolução patrimonial, quando preenchido.",
            "Dividendos e ganho de capital detalhados virão do extrato fiscal da declaração quando integrados.",
        ]

    def alertas() -> list[str]:
        lines: list[str] = []
        malha = int(cnt.get("malha_fina") or 0)
        if malha:
            lines.append(
                f"⚠ {malha} declaração(ões) com indicação de «malha fina» — priorizar revisão de consistência e documentação.",
            )
        else:
            lines.append("Nenhuma declaração analisada veio marcada com indicação de malha fina no cadastro.")
        lines.append(
            "Compare valores de restituição/imposto entre anos com os extratos da RFB para detetar retenções "
            "subaproveitadas ou divergências.",
        )
        lines.append(
            "Bens sem atualização de valor: validar no quadro de bens da declaração (não replicado numericamente aqui).",
        )
        return lines

    def temporal() -> list[str]:
        lines: list[str] = []
        if tem_multi and variacoes:
            for v in variacoes:
                lines.append(
                    f"Variação do valor declarado (imposto/restituição) de {v['de']} → {v['para']}: "
                    f"{v['delta_brl']} ({v.get('delta_pct_fmt', '—')} face ao ano anterior).",
                )
        elif n:
            lines.append(
                f"Apenas o ano {anos_txt} na série — inclua outras declarações do mesmo CPF para deltas e tendências.",
            )
        for row in por_ano:
            lines.append(
                f"{row['ano_calendario']}: status «{row['status']}», resultado «{row.get('resultado_fiscal') or '—'}», "
                f"valor {row.get('valor_imposto_ou_restituicao_brl', '—')}, malha fina={'sim' if row.get('malha_fina') else 'não'}.",
            )
        return lines

    return [
        {"id": "patrimonio", "titulo": "Situação patrimonial", "pontos": patrimonio()},
        {"id": "evolucao_caixa", "titulo": "Evolução de caixa", "pontos": evolucao_caixa()},
        {"id": "renda", "titulo": "Fontes de renda", "pontos": renda()},
        {"id": "deducao", "titulo": "Perfil de dedução", "pontos": deducao()},
        {"id": "saude", "titulo": "Saúde financeira", "pontos": saude()},
        {"id": "investimentos", "titulo": "Perfil de investimentos", "pontos": investimentos()},
        {"id": "alertas", "titulo": "Alertas e oportunidades", "pontos": alertas()},
        {"id": "temporal", "titulo": "Análise temporal (comparando anos)", "pontos": temporal()},
    ]
