# Mapa da Aplicação — Backend (MONITOR_IRPF)

## 1. Arquitetura Geral
O backend da sub-aplicação `MONITOR_IRPF` é construído com Python 3.12, FastAPI, SQLite e SQLAlchemy para garantir uma API leve, assíncrona e rápida.

* **Diretório Principal**: `MONITOR_IRPF/backend/`
* **Banco de Dados**: SQLite local em `data/irpf_carteira.db`.
* **Configurações Genéricas**: Armazenadas como chave-valor serializadas em JSON na tabela `app_kv`.

---

## 2. Estrutura de Pastas e Componentes

* **`app/models`**: Modelos ORM do SQLAlchemy (ex: `app_kv.py`, `cobranca.py`, `cliente.py`, `declaracao.py`).
* **`app/repositories`**: Repositórios de persistência de dados (ex: `app_kv_repository.py`).
* **`app/services`**: Camada de lógica de negócios e integrações externas:
  * **Conta Azul** (`conta_azul_service.py`): Autenticação OAuth 2.0, troca de authorization code, renovação automática (`refresh_token`) e resolvedor transparente de token válido (`obter_access_token_valido`).
  * **Asaas** (`asaas_api_service.py`, `asaas_cobranca_cliente_service.py`): Geração e sincronização de cobranças.
  * **RFB / InfoSimples** (`infosimples_rfb_service.py`): Integração para diagnóstico fiscal de contribuintes (situação fiscal, e-CAC).
  * **SERPRO / Integra Contador** (`serpro_integra_service.py`): Autenticação mTLS (SAPI) + envio de contratos + extração RSA do certificado PFX + função `extrair_chave_privada_pfx` para exportação da chave privada RSA PKCS8 DER Base64.
  * **Outros Serviços**: Lógica para DARFs (`darf_service.py`), malha fina (`malha_service.py`), restituições (`restituicao_service.py`), e mensagens do e-CAC (`mensagens_ecac_service.py`).
* **`app/routers`**: Controladores de rotas HTTP do FastAPI:
  * **Integrações** (`integracoes.py`): Endpoints de configuração e teste para Asaas, InfoSimples/RFB, Conta Azul e SERPRO.
  * **Outros Roteadores**: Clientes (`clientes.py`), declarações (`declaracoes.py`), DARF (`darf.py`), malha (`malha.py`), restituições (`restituicoes.py`) e mensagens e-CAC (`mensagens_ecac.py`).

---

## 3. Endpoints Principais de Integração SERPRO

| Rota | Método | Descrição |
|---|---|---|
| `/api/integracoes/serpro/config` | GET / PUT | Ler/salvar credenciais, configurações e `sandboxMode` |
| `/api/integracoes/serpro/extrair-chave` | POST | Extrair RSA PKCS8 do certificado PFX armazenado |
| `/api/integracoes/serpro/integra-contador/token` | POST | Autenticar via SAPI (mTLS) e obter access token |
| `/api/integracoes/serpro/consulta-renda` | POST | Consultar renda do contribuinte (sandbox ou produção) |
| `/api/integracoes/serpro/chamar` | POST | Realiza chamadas dinâmicas/testes para as APIs da SERPRO |
| `/api/integracoes/contador/certificado/upload` | POST | Upload do certificado digital A1 (PFX/P12) |
| `/api/integracoes/contador/testar-certificado` | POST | Verificar integridade e senha do PFX |

> **Rotas Dinâmicas de Sandbox**: Dependendo da flag `sandboxMode` na configuração, o backend roteia dinamicamente os módulos: `renda-pf-trial/v1` vs `renda-pf/v1`, e `consulta-restituicao-trial/v1` vs `consulta-restituicao/v1`.
> **Mock automático de Sandbox**: Módulo `/chamar` e `/consulta-renda` interceptam tokens conhecidos de demonstração (`06aef429-a981-3ec5-a1f8-71d38d86481e` para Renda, `nchRml3PnHfUNC6hxowNnqYMfqMETs8WbYIaCfOKRgKm` ou `mWLQjmHUVY9Thsf88NlJ0ta7YHRmC8ZyMEpxFAuj6zmA` para Restituição, e CPF `12345678909` ou `11111111111` para Autorizações) retornando dados mockados.
> **Bypass de SAPI**: Se `consumerKey` começar com `"mock"`, ou se o modo sandbox estiver ativo sem chaves configuradas, a autenticação SAPI real é contornada com mock.

---

## 4. Testes Automatizados (TDD)
* **Diretório**: `tests/`
* **Testes da Conta Azul** (`tests/test_conta_azul.py`): Validações unitárias de expiração do token, persistência em `app_kv`, tratamento de erros HTTP e simulação de requisições de rede utilizando mocks do `httpx.Client`.
* **Testes do SERPRO** (`tests/test_serpro.py`): Validação unitária da decodificação do certificado PFX, extração da chave privada RSA PKCS8 Base64, e sincronização de senhas.

---

## 5. Infraestrutura & Deploy
* **Hospedagem (Render)**: API FastAPI dockerizada ou executada diretamente via Python 3.12 no Render.
* **Persistência de Dados**: Exige um **Render Persistent Disk** montado em `/app/data/` para reter o arquivo do banco SQLite `irpf_carteira.db`.
* **CORS**: Restrito à URL do frontend (Vercel) via variável de ambiente `CORS_ORIGINS`.

