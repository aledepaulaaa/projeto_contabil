import re
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.repositories.app_kv_repository import AppKvRepository
from app.repositories.cliente_manual_repository import ClienteManualRepository
from app.services.cliente_service import ClienteService, normalize_cpf_digits
from app.services.infosimples_crypto import encrypt_infosimples_aes_cbc

_K_RFB = "rfb_infosimples_config_v1"
_K_CERT_B64 = "contador_cert_a1_b64"
_K_CERT_PASS = "contador_cert_a1_pass"
_K_SERPRO = "serpro_integra_contador_config_v1"
_RFB_URL = "https://api.infosimples.com/api/v2/consultas/receita-federal/situacao"
_DOCS_RFB_SITUACAO = "https://api.infosimples.com/consultas/docs/receita-federal/situacao"


def _passos_orientacao_609() -> list[str]:
    return [
        "O código 609 indica que a InfoSimples já aceitou o pedido (parâmetros e autenticação no gateway), mas o "
        "site ou aplicativo da Receita Federal excedeu tentativas ou bloqueou o acesso temporariamente — não é o "
        "mesmo que o 604 «decriptar».",
        "Aguarde vários minutos (ou horas, em horários de pico) antes de repetir. Evite disparar muitas consultas "
        "seguidas na mesma conta.",
        "Na página de testes da InfoSimples a «Requisição» pode aparecer como GET com pkcs12_cert= vazio na URL: "
        "isso é esperado (limite de tamanho em query string). O conteúdo real do certificado cifrado vai no corpo do "
        "pedido POST; esta aplicação usa POST application/x-www-form-urlencoded, alinhado à API v2.",
        f"Instruções oficiais de parâmetros e criptografia (área do cliente): {_DOCS_RFB_SITUACAO}",
    ]


def _digits(v: str | None) -> str:
    return re.sub(r"\D", "", v or "")


def _json_or_default(raw: str | None, default: dict[str, Any]) -> dict[str, Any]:
    import json

    if not raw:
        return default
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return default


def _nome_cliente_na_carteira(db: Session, ano_carteira: int, cpf_11: str) -> str | None:
    """Nome no cadastro da carteira (clientes_manuais) para o ano, se o CPF coincidir."""
    repo = ClienteManualRepository(db)
    for m in repo.list_by_ano_carteira(ano_carteira):
        if normalize_cpf_digits(m.cpf) == cpf_11:
            return m.nome
    return None


def _autorizado_diagnostico_rfb(db: Session, ano_calendario: int, cpf_11: str) -> tuple[bool, str | None]:
    """Garante vínculo mínimo no sistema: cliente na carteira do ano, ou procuração/declaração registadas.

    A tabela ``procuracoes`` não é preenchida por todos os fluxos; exigir só esse registo bloqueava
    consultas legítimas quando a procuração existe na RFB e o contribuinte está na carteira.
    """
    if _nome_cliente_na_carteira(db, ano_calendario, cpf_11) is not None:
        return True, None
    cs = ClienteService(db)
    if cs._procuracao_exists_ano(ano_calendario, cpf_11, None):
        return True, None
    if cs._decl_exists_ano(ano_calendario, cpf_11, ""):
        return True, None
    return False, (
        "Este CPF não está na carteira deste exercício nem há procuração ou declaração "
        "associada neste ano-calendário no sistema. Adicione o cliente em Clientes ou registe a declaração."
    )


def _cfg(db: Session) -> dict[str, Any]:
    kv = AppKvRepository(db)
    return _json_or_default(
        kv.get(_K_RFB),
        {
            "enabled": False,
            "token": "",
            "tokenSecreto": "",
            "timeoutSec": 300,
            "perfilProcuradorCnpj": "",
            "useContadorCert": True,
            "pkcs12Cert": "",
            "pkcs12Pass": "",
            "loginCpf": "",
            "loginSenha": "",
            "criptografiaChave": "",
            "criptografiaMaterial": "chave_conta",
            "criptografiaBase64Ruby": True,
            "cifrarParametrosPkcs12": None,
            "cifrarApenasPkcs12Pass": False,
        },
    )


def _material_criptografia(cfg: dict[str, Any], token_plain: str) -> str | None:
    """Material para AES-256-CBC (32 primeiros caracteres → SHA-256, gem infosimples-data).

    «chave_conta» = CHAVE DE CRIPTOGRAFIA; «token» = token de acesso; «token_secreto» = token secreto do painel.
    """
    modo = str(cfg.get("criptografiaMaterial") or "chave_conta").lower().strip()
    if modo == "token":
        t = token_plain.strip()
        return t if len(t) >= 32 else None
    if modo == "token_secreto":
        ts = str(cfg.get("tokenSecreto") or "").strip()
        return ts if len(ts) >= 32 else None
    ch = str(cfg.get("criptografiaChave") or "").strip()
    return ch if len(ch) >= 32 else None


def _deve_cifrar_parametros(cfg: dict[str, Any], token_plain: str) -> bool:
    flag = cfg.get("cifrarParametrosPkcs12")
    if flag is False:
        return False
    mat = _material_criptografia(cfg, token_plain)
    if flag is True:
        return mat is not None
    # auto (null / omitido): cifrar se o material escolhido (chave, token de acesso ou token secreto) for válido
    return mat is not None


def _infosimples_consulta_negocio_falhou(body: dict[str, Any]) -> bool:
    """A API HTTP pode ser 200 com JSON contendo code ≠ 200 ou lista errors preenchida."""
    c = body.get("code")
    if isinstance(c, int) and c != 200:
        return True
    errs = body.get("errors")
    if isinstance(errs, list) and any(isinstance(x, str) and x.strip() for x in errs):
        return True
    return False


def _infosimples_errors_linhas(body: dict[str, Any]) -> list[str]:
    errs = body.get("errors")
    if not isinstance(errs, list):
        return []
    return [str(x) for x in errs if isinstance(x, str) and x.strip()]


def _mensagem_falha_infosimples_generica(body: dict[str, Any]) -> str:
    c = body.get("code")
    msg = body.get("code_message")
    linhas = _infosimples_errors_linhas(body)
    bits: list[str] = []
    if isinstance(c, int):
        bits.append(f"código {c}")
    if isinstance(msg, str) and msg.strip():
        bits.append(msg.strip())
    if linhas:
        bits.append(" ".join(linhas[:5]))
    core = ". ".join(bits) if bits else "sem mensagem detalhada"
    return f"A InfoSimples devolveu um erro na consulta ({core})."


def _passos_orientacao_604(cfg: dict[str, Any], *, cifrou: bool, enviou_pkcs12: bool, usou_login_gov: bool) -> list[str]:
    flag = cfg.get("cifrarParametrosPkcs12")
    modo_cifra = "automático" if flag is None else ("ligado" if flag is True else "desligado")
    mat = str(cfg.get("criptografiaMaterial") or "chave_conta").lower().strip()
    if mat == "token":
        material_txt = "Token para acesso à API (primeiros 32 caracteres do token no pedido)"
    elif mat == "token_secreto":
        material_txt = "Token secreto do painel (primeiros 32 caracteres do valor guardado em «Token secreto»)"
    else:
        material_txt = "CHAVE DE CRIPTOGRAFIA / Chave de criptografia"
    ruby = bool(cfg.get("criptografiaBase64Ruby", True))
    ruby_txt = "ligado" if ruby else "desligado"
    passos: list[str] = [
        "Este 604 ocorre antes da RFB: a InfoSimples tentou validar o pedido e não conseguiu reverter a cifra ou o "
        "conteúdo dos parâmetros sensíveis (pkcs12_cert, pkcs12_pass ou login_senha). O CPF pode estar correto; "
        "o bloqueio é de integração.",
    ]
    if enviou_pkcs12:
        passos.append(
            "Contador: confirme a «Senha do certificado» e execute «Testar certificado». Senha errada, P12 truncado "
            "(ex.: cópia) ou ficheiro que não corresponde ao A1 esperado impedem a validação do lado da InfoSimples."
        )
    if usou_login_gov:
        passos.append(
            "Se usa login GOV.BR em vez de PKCS12, confira CPF e senha; estes campos seguem a mesma regra de cifra."
        )
    passos.append(
        f"Em Configurações → API RFB: «Cifrar pkcs12 / login_senha» está {modo_cifra}. "
        f"O material AES selecionado é: {material_txt}. "
        f"«Base64 estilo Ruby» está {ruby_txt}. "
        f"Neste envio, os parâmetros sensíveis foram "
        f"{'cifrados por este servidor antes do POST' if cifrou else 'enviados em claro (esta app não aplicou AES)'}.",
    )
    if cifrou and mat == "chave_conta":
        passos.append(
            "A «Chave de criptografia» na app tem de coincidir com a «CHAVE DE CRIPTOGRAFIA» do painel (sem espaços a "
            "mais). A AES usa os primeiros 32 caracteres dessa chave, como no gem infosimples-data."
        )
    elif cifrou and mat == "token":
        passos.append(
            "Com material «Token para acesso à API», a AES usa os primeiros 32 caracteres do mesmo token enviado no "
            "parâmetro token do POST — tem de ser idêntico ao do painel."
        )
    elif cifrou and mat == "token_secreto":
        passos.append(
            "Com material «Token secreto», a AES usa os primeiros 32 caracteres do valor guardado em «Token secreto» "
            "(painel InfoSimples). Guarde o token secreto na app e escolha esta opção se a conta não decriptar com a "
            "CHAVE DE CRIPTOGRAFIA."
        )
    elif not cifrou:
        passos.append(
            "Com envio em claro por esta app, a «CHAVE DE CRIPTOGRAFIA» não altera o corpo deste pedido — a mensagem "
            "«decriptar» costuma indicar que a conta/token no painel InfoSimples está em modo que exige parâmetros já "
            "cifrados (integração criptografada). Nesse caso ligue «Cifrar = Sim» (ou Automático com chave ≥32), "
            "confira a chave no painel e teste também com material AES «Token para acesso à API», «Token secreto» "
            f"(se guardado) e «Base64 estilo Ruby» ({ruby_txt})."
        )
    passos.append(
        "O «Token para acesso à API» na app tem de ser o mesmo valor usado no painel (parâmetro token do POST). "
        "O «Token secreto» é outro valor do painel — pode servir como material AES (opção dedicada), mas não "
        "substitui o token de acesso no POST.",
    )
    if cifrou:
        passos.append(
            "Com cifra ativa neste envio: (1) ligue/desligue «Base64 estilo Ruby»; (2) alterne o material AES entre "
            "CHAVE DE CRIPTOGRAFIA, Token para acesso à API e Token secreto (com o «Token secreto» guardado na app); "
            "(3) teste «Cifrar = Não» — se a consulta passar, o problema é só o alinhamento da cifra com o que a "
            "conta espera."
        )
        if not bool(cfg.get("cifrarApenasPkcs12Pass")):
            passos.append(
                "Se o 604 mantém-se com o certificado cifrado: em API RFB ative «Cifrar apenas a senha PKCS12» "
                "(envia pkcs12_cert em Base64 claro e só cifra pkcs12_pass/login_senha). Algumas contas esperam só a "
                "senha cifrada."
            )
    else:
        passos.append(
            "Com cifra desligada e ainda 604: (1) no painel InfoSimples confirme se este token/serviço obriga cifra — "
            "se sim, ative a cifra na app com chave e formato corretos; (2) reimporte o P12 no Contador (Base64 "
            "completo, sem cortar linhas) e volte a testar o certificado; (3) se o painel afirma envio em claro e o "
            "erro mantém-se, envie este JSON ao suporte com o token_name do cabeçalho."
        )
    passos.append(
        "Se nada resolver, contacte o suporte InfoSimples com o serviço receita-federal/situacao e o token_name "
        "(ex.: MONITOR_IRPF).",
    )
    return passos


def _pedido_diagnostico_seguro(args: dict[str, str], cfg: dict[str, Any], *, cifrou: bool) -> dict[str, Any]:
    """Metadados sem segredos para anexar a tickets InfoSimples (tamanhos e opções)."""
    ch = str(cfg.get("criptografiaChave") or "").strip()
    tok = str(cfg.get("token") or "").strip()
    flag = cfg.get("cifrarParametrosPkcs12")
    modo_cifrar = "auto" if flag is None else ("sim" if flag is True else "nao")
    return {
        "cifrar_parametros_modo": modo_cifrar,
        "cifrou_pkcs12_pass_login_antes_post": cifrou,
        "material_aes": str(cfg.get("criptografiaMaterial") or "chave_conta").lower().strip(),
        "base64_ruby": bool(cfg.get("criptografiaBase64Ruby", True)),
        "chave_criptografia_chars_guardados": len(ch),
        "chave_tem_pelo_menos_32_chars": len(ch) >= 32,
        "token_acesso_chars": len(tok),
        "token_secreto_chars_guardados": len(str(cfg.get("tokenSecreto") or "").strip()),
        "token_secreto_tem_pelo_menos_32_chars": len(str(cfg.get("tokenSecreto") or "").strip()) >= 32,
        "cifrar_apenas_senha_pkcs12": bool(cfg.get("cifrarApenasPkcs12Pass")),
        "use_contador_cert": bool(cfg.get("useContadorCert", True)),
        "chaves_no_form": sorted(args.keys()),
        "tamanho_pkcs12_cert_enviado": len(args.get("pkcs12_cert") or ""),
        "tamanho_pkcs12_pass_enviado": len(args.get("pkcs12_pass") or ""),
        "tamanho_login_senha_enviado": len(args.get("login_senha") or ""),
        "tem_login_cpf": bool(args.get("login_cpf")),
    }


def _aplicar_criptografia_infosimples(args: dict[str, str], cfg: dict[str, Any], token_plain: str) -> None:
    if not _deve_cifrar_parametros(cfg, token_plain):
        return
    material = _material_criptografia(cfg, token_plain)
    if not material:
        return
    ruby = bool(cfg.get("criptografiaBase64Ruby", True))
    apenas_senha = bool(cfg.get("cifrarApenasPkcs12Pass"))
    campos = ("pkcs12_pass", "login_senha") if apenas_senha else ("pkcs12_cert", "pkcs12_pass", "login_senha")
    for campo in campos:
        if campo not in args or not args[campo]:
            continue
        args[campo] = encrypt_infosimples_aes_cbc(args[campo], material, base64_multiline=ruby)


async def consultar_situacao_rfb_infosimples(db: Session, cpf: str, ano_calendario: int) -> tuple[int, dict[str, Any]]:
    d = _digits(cpf)
    if len(d) != 11:
        return 400, {"ok": False, "message": "CPF inválido para diagnóstico fiscal."}

    ok_ctx, msg_ctx = _autorizado_diagnostico_rfb(db, ano_calendario, d)
    if not ok_ctx:
        return 400, {
            "ok": False,
            "message": msg_ctx or "Consulta não autorizada para este CPF e ano.",
            "cpf": d,
            "ano_calendario": ano_calendario,
        }

    cfg = _cfg(db)
    if not cfg.get("enabled"):
        return 400, {"ok": False, "message": "Integração API RFB está desativada em Configurações."}
    token = str(cfg.get("token") or "").strip()
    if not token:
        return 400, {
            "ok": False,
            "message": "Configure o «Token para acesso à API» (campo token no pedido InfoSimples) na integração API RFB.",
        }

    kv = AppKvRepository(db)
    serpro_cfg = _json_or_default(kv.get(_K_SERPRO), {})

    args: dict[str, str] = {
        "token": token,
        "perfil_procurador_cpf": d,
        "timeout": str(int(cfg.get("timeoutSec") or 300)),
    }
    cnpj = str(cfg.get("perfilProcuradorCnpj") or "").strip()
    if cnpj:
        args["perfil_procurador_cnpj"] = cnpj

    login_cpf = str(cfg.get("loginCpf") or "").strip()
    login_senha = str(cfg.get("loginSenha") or "").strip()
    pkcs12_cert = ""
    pkcs12_pass = ""
    if login_cpf and login_senha:
        args["login_cpf"] = login_cpf
        args["login_senha"] = login_senha
    else:
        use_contador_cert = bool(cfg.get("useContadorCert", True))
        pkcs12_cert = str(cfg.get("pkcs12Cert") or "").strip()
        pkcs12_pass = str(cfg.get("pkcs12Pass") or "").strip()
        if use_contador_cert:
            pkcs12_cert = str(kv.get(_K_CERT_B64) or "").strip()
            cont_pass = str(kv.get(_K_CERT_PASS) or "").strip()
            if cont_pass:
                pkcs12_pass = cont_pass
            elif not pkcs12_pass:
                pkcs12_pass = str(serpro_cfg.get("certPassword") or "").strip()
        if pkcs12_cert:
            args["pkcs12_cert"] = pkcs12_cert
        if pkcs12_pass:
            args["pkcs12_pass"] = pkcs12_pass

        if pkcs12_cert and not pkcs12_pass:
            return 400, {
                "ok": False,
                "message": (
                    "Falta a senha do certificado digital (PFX/P12). A InfoSimples não consegue abrir o PKCS12 sem ela "
                    "(erro típico: «Não foi possível decriptar os parâmetros»). "
                    "Em Configurações → Contador: preencha «Senha do certificado» e clique em «Guardar senha». "
                    "Alternativa: com «Usar certificado enviado no painel RFB» desmarcado, defina a senha PKCS12 na própria integração API RFB."
                ),
            }

    if cfg.get("cifrarParametrosPkcs12") is True and _material_criptografia(cfg, token) is None:
        return 400, {
            "ok": False,
            "message": (
                "«Cifrar parâmetros PKCS12» está ativo, mas falta material válido para o modo AES escolhido: "
                "«CHAVE DE CRIPTOGRAFIA» (≥32 caracteres), «Token para acesso à API» (≥32) ou «Token secreto» (≥32) "
                "conforme o material selecionado."
            ),
        }

    enviou_pkcs12 = bool(args.get("pkcs12_cert"))
    usou_login_gov = bool(args.get("login_senha"))
    cifrou = _deve_cifrar_parametros(cfg, token)
    _aplicar_criptografia_infosimples(args, cfg, token)

    try:
        # Corpo application/x-www-form-urlencoded. Contas/token com «integração criptografada» na InfoSimples
        # exigem parâmetros pré-cifrados (doc. «Integração com criptografia»); em claro, o gateway pode
        # responder com código 604 e «Não foi possível decriptar os parâmetros».
        async with httpx.AsyncClient(timeout=35.0) as client:
            resp = await client.post(_RFB_URL, data=args)
        body = resp.json()
    except httpx.RequestError as e:
        return 502, {"ok": False, "message": f"Falha de rede ao consultar InfoSimples: {e}"}
    except ValueError:
        return 502, {"ok": False, "message": "Resposta inválida da InfoSimples (não-JSON)."}

    if not isinstance(body, dict):
        return 502, {"ok": False, "message": "Resposta inesperada da InfoSimples."}

    header = body.get("header") if isinstance(body.get("header"), dict) else {}
    billable = bool(header.get("billable")) if header else None
    price = header.get("price") if header else None

    if _infosimples_consulta_negocio_falhou(body):
        errs = _infosimples_errors_linhas(body)
        code_int = body.get("code") if isinstance(body.get("code"), int) else None
        decriptar = any("decriptar" in e.lower() for e in errs)
        falha_604_decriptar = code_int == 604 or decriptar

        payload: dict[str, Any] = {
            "ok": False,
            "billable": billable,
            "price": price,
            "infosimples": body,
        }
        if falha_604_decriptar:
            if cifrou:
                payload["message"] = (
                    "A consulta não chegou à Receita Federal: a InfoSimples rejeitou a validação porque não "
                    "conseguiu decriptar ou interpretar os parâmetros sensíveis cifrados por esta app "
                    "(PKCS12/senhas). Revise «CHAVE DE CRIPTOGRAFIA», material AES, Base64 Ruby e a senha do "
                    "certificado em Contador."
                )
            else:
                payload["message"] = (
                    "A consulta não chegou à Receita Federal: a InfoSimples devolveu 604 «decriptar» mesmo com "
                    "cifra desligada nesta app — em muitas contas o painel exige integração criptografada; o gateway "
                    "pode estar a esperar conteúdo cifrado. Ative a cifra com a chave correta do painel ou confirme "
                    "no suporte se este token aceita envio em claro. Verifique também P12 e senha no Contador."
                )
            payload["passos"] = _passos_orientacao_604(
                cfg,
                cifrou=cifrou,
                enviou_pkcs12=enviou_pkcs12,
                usou_login_gov=usou_login_gov,
            )
            payload["pedido_diagnostico"] = _pedido_diagnostico_seguro(args, cfg, cifrou=cifrou)
            payload["documentacao_url"] = _DOCS_RFB_SITUACAO
        elif code_int == 609:
            payload["message"] = (
                "A InfoSimples processou o pedido, mas a origem (site ou aplicativo da Receita Federal) excedeu "
                "tentativas ou não respondeu a tempo (código 609). Não indica falha de cifra do certificado — tente "
                "de novo após um intervalo."
            )
            payload["passos"] = _passos_orientacao_609()
            payload["documentacao_url"] = _DOCS_RFB_SITUACAO
        else:
            payload["message"] = _mensagem_falha_infosimples_generica(body)

        return 200, payload

    return 200, {
        "ok": True,
        "billable": billable,
        "price": price,
        "infosimples": body,
    }
