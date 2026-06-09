import base64
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.models.cliente_manual import ClienteManual
from app.models.procuracao import Procuracao
from app.repositories.app_kv_repository import AppKvRepository
from app.services.serpro_integra_service import authenticate_serpro, SAPI_AUTH_DEFAULT

logger = logging.getLogger("procuracao_service")

_K_SERPRO = "serpro_integra_contador_config_v1"
_K_CERT_B64 = "contador_cert_a1_b64"
_K_CERT_PASS = "contador_cert_a1_pass"
_K_CONTADOR = "contador_config_v1"


def _json_or_default(raw: str | None, default: dict) -> dict:
    if not raw:
        return default
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return default


class ProcuracaoService:
    def __init__(self, db: Session) -> None:
        self._db = db

    def obter_token_acesso_serpro(self, cfg: dict) -> str:
        """
        Obtém o token de acesso para a API do Serpro.
        - Se for trial (URL contém '-trial'), retorna o token estático.
        - Caso contrário, faz POST dinâmico para obter o token de acesso OAuth2.
        """
        base_url = str(cfg.get("baseUrl") or "").lower()
        if "-trial" in base_url or "trial" in str(cfg.get("consumerKey") or "").lower():
            logger.info("🧪 [SERPRO] URL ou chave contêm trial. Utilizando token estático de demonstração.")
            return "06aef429-a981-3ec5-a1f8-71d38d86481e"

        # Autenticação OAuth2 padrão via POST /token
        consumer_key = str(cfg.get("consumerKey") or "").strip()
        consumer_secret = str(cfg.get("consumerSecret") or "").strip()
        if not consumer_key or not consumer_secret:
            raise ValueError("Consumer Key ou Consumer Secret não configurados no painel Serpro.")

        token_url = str(cfg.get("authUrl") or "https://gateway.apiserpro.serpro.gov.br/token")
        # Se for a url do SAPI, mas não estamos usando mTLS, ajustamos para a do token
        if "sapi.serpro.gov.br" in token_url:
            token_url = "https://gateway.apiserpro.serpro.gov.br/token"

        logger.info(f"🔑 [SERPRO] Obtendo bearer token OAuth2 em {token_url}...")
        credentials = f"{consumer_key}:{consumer_secret}"
        basic_auth = base64.b64encode(credentials.encode("utf-8")).decode("ascii")

        headers = {
            "Authorization": f"Basic {basic_auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        payload = {"grant_type": "client_credentials"}

        with httpx.Client(verify=True, timeout=30.0) as client:
            r = client.post(token_url, headers=headers, data=payload)
        
        if r.status_code != 200:
            raise RuntimeError(f"Erro na autenticação Serpro ({r.status_code}): {r.text}")
        
        res_data = r.json()
        token = res_data.get("access_token")
        if not token:
            raise RuntimeError("Nenhum access_token retornado no JSON da autenticação Serpro.")
        
        return str(token)

    def sincronizar(self, ano_calendario: int) -> dict[str, Any]:
        """
        Sincroniza todas as procurações dos clientes ativos para o exercício informado.
        """
        clientes = (
            self._db.query(ClienteManual)
            .filter(
                ClienteManual.ano_carteira == ano_calendario,
                ClienteManual.ativo == True,
            )
            .all()
        )

        kv = AppKvRepository(self._db)
        cfg = _json_or_default(kv.get(_K_SERPRO), {})
        
        consumer_key = str(cfg.get("consumerKey") or "").strip()
        # Modo de simulação/mock
        is_mock = not cfg.get("enabled") or consumer_key.lower().startswith("mock")

        sincronizados = 0
        erros = 0
        access_token = None
        ni_contratante = None
        base_url = None

        if not is_mock:
            try:
                access_token = self.obter_token_acesso_serpro(cfg)
                
                # Obter CNPJ do contador como NI do Contratante
                cnt_cfg = _json_or_default(kv.get(_K_CONTADOR), {})
                ni_contratante = (cnt_cfg.get("cnpj") or "").replace(".", "").replace("-", "").replace("/", "").strip()
                if not ni_contratante:
                    ni_contratante = str(cfg.get("contratanteNumero") or "").strip()
                if not ni_contratante:
                    # Fallback padrão de trial do Serpro
                    ni_contratante = "33683111000107"

                # Obter base_url
                base_url = str(cfg.get("baseUrl") or "").strip()
                sandbox_mode = bool(cfg.get("sandboxMode", True))
                
                if "gateway.apiserpro.serpro.gov.br" in base_url and not any(x in base_url for x in ["consulta-restituicao", "restituicao-pf"]):
                    module_route = "consulta-restituicao-trial/v1" if sandbox_mode else "consulta-restituicao/v1"
                    base_url = f"{base_url.rstrip('/')}/{module_route}"
                elif not base_url:
                    base_url = "https://gateway.apiserpro.serpro.gov.br/consulta-restituicao-trial/v1" if sandbox_mode else "https://gateway.apiserpro.serpro.gov.br/consulta-restituicao/v1"
            except Exception as e:
                logger.error(f"⚠️ Erro ao preparar chamada real Serpro. Entrando em modo mock. Erro: {e}")
                is_mock = True

        for cli in clientes:
            if not cli.cpf:
                continue
            cpf_limpo = "".join(c for c in cli.cpf if c.isdigit())
            if len(cpf_limpo) != 11:
                continue

            autorizacoes = []

            if is_mock:
                # Mock simulando o e-CAC Compartilha Receita
                if cpf_limpo == "12345678909":
                    # Token Com Declaração (de demonstração)
                    autorizacoes = [{
                        "ni": "12345678909",
                        "token": "nchRml3PnHfUNC6hxowNnqYMfqMETs8WbYIaCfOKRgKm",
                        "status": "ATIVA",
                        "dataHoraStatus": "2022-06-17T20:01:46.143",
                        "dataHoraVigenciaInicial": "2022-06-17T20:01:46.143",
                        "dataHoraVigenciaFinal": "2027-06-17T20:01:46.143"
                    }]
                elif cpf_limpo == "11111111111":
                    # Token Sem Declaração (de demonstração)
                    autorizacoes = [{
                        "ni": "11111111111",
                        "token": "mWLQjmHUVY9Thsf88NlJ0ta7YHRmC8ZyMEpxFAuj6zmA",
                        "status": "EXPIRADA",
                        "dataHoraStatus": "2020-01-01T00:00:00",
                        "dataHoraVigenciaInicial": "2020-01-01T00:00:00",
                        "dataHoraVigenciaFinal": "2025-01-01T00:00:00"
                    }]
                else:
                    # Gera procurações mockadas com base no hash do nome do cliente
                    nome_hash = sum(ord(c) for c in cli.nome)
                    today = datetime.now()
                    if nome_hash % 3 == 0:
                        # Ativa e vai vencer nos próximos 30 dias (ex: daqui a 15 dias)
                        data_fim = today + timedelta(days=15)
                        status = "ATIVA"
                    elif nome_hash % 3 == 1:
                        # Ativa e vence a longo prazo (ex: daqui a 120 dias)
                        data_fim = today + timedelta(days=120)
                        status = "ATIVA"
                    else:
                        # Expirada (vencida)
                        data_fim = today - timedelta(days=60)
                        status = "EXPIRADA"
                    
                    autorizacoes = [{
                        "ni": cpf_limpo,
                        "token": f"mock_token_{cpf_limpo[:3]}_{nome_hash}",
                        "status": status,
                        "dataHoraStatus": (data_fim - timedelta(days=365)).isoformat(),
                        "dataHoraVigenciaInicial": (data_fim - timedelta(days=365)).isoformat(),
                        "dataHoraVigenciaFinal": data_fim.isoformat()
                    }]
            else:
                # Chamada real de integração
                try:
                    url = f"{base_url.rstrip('/')}/Autorizacoes/{ni_contratante}/{cpf_limpo}"
                    headers = {
                        "Authorization": f"Bearer {access_token}",
                        "Accept": "application/json",
                    }
                    with httpx.Client(verify=True, timeout=15.0) as client:
                        r = client.get(url, headers=headers)
                    
                    if r.status_code == 200:
                        res_data = r.json()
                        # O retorno pode vir como dict contendo lista de autorizacoes
                        if isinstance(res_data, dict):
                            autorizacoes = res_data.get("autorizacoes", [])
                        elif isinstance(res_data, list):
                            autorizacoes = res_data
                    elif r.status_code == 404:
                        autorizacoes = []
                    else:
                        logger.error(f"Erro ao obter autorizações para CPF {cpf_limpo}: HTTP {r.status_code} - {r.text}")
                        erros += 1
                        continue
                except Exception as ex:
                    logger.error(f"Falha de rede na chamada de autorizações para CPF {cpf_limpo}: {ex}")
                    erros += 1
                    continue

            # Gravar no banco de dados
            for aut in autorizacoes:
                # Procura por procuração existente para o CPF e ano
                proc = (
                    self._db.query(Procuracao)
                    .filter(
                        Procuracao.titular_cpf == cpf_limpo,
                        Procuracao.ano_calendario == ano_calendario,
                    )
                    .first()
                )

                now_dt = datetime.now()
                # Parse datas de vigência
                try:
                    dt_ini = datetime.fromisoformat(aut["dataHoraVigenciaInicial"].replace("Z", ""))
                except Exception:
                    dt_ini = now_dt
                try:
                    dt_fim = datetime.fromisoformat(aut["dataHoraVigenciaFinal"].replace("Z", ""))
                except Exception:
                    dt_fim = now_dt

                if not proc:
                    proc = Procuracao(
                        ano_calendario=ano_calendario,
                        titular_cpf=cpf_limpo,
                        titular_nome=cli.nome,
                        created_at=now_dt,
                        updated_at=now_dt,
                    )
                    self._db.add(proc)

                proc.token = aut.get("token")
                proc.status = aut.get("status")
                proc.data_inicio = dt_ini
                proc.data_fim = dt_fim
                proc.updated_at = now_dt
                sincronizados += 1

        self._db.commit()
        
        mode_str = " (MOCK)" if is_mock else ""
        return {
            "ok": True,
            "sincronizados": sincronizados,
            "erros": erros,
            "message": f"Sincronização concluída{mode_str}. {sincronizados} procuração(ões) atualizada(s)."
        }
