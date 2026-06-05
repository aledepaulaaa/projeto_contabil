# Histórico de Alterações — Backend (MONITOR_IRPF)

## v1.2.0 - Módulo Consulta Renda SERPRO + Mensagens de Erro Inteligentes (05/06/2026)
* **Contexto**: Implementação do endpoint de consulta de renda da Receita Federal via API SERPRO, com suporte a modo de demonstração (sem custo) e chamada real em produção.
* **Novo Endpoint `POST /api/integracoes/serpro/consulta-renda`**:
  * Recebe `tokenCompartilhamento` (token gerado pelo contribuinte no Portal e-CAC).
  * **Modo Mock**: se o token for igual ao token de demonstração da documentação SERPRO (`06aef429-a981-3ec5-a1f8-71d38d86481e`), retorna um dataset simulado pré-descriptografado imediatamente, sem autenticar ou cobrar da API.
  * **Modo Produção**: autentica via SAPI (mTLS) com as credenciais salvas, chama `/Consultar/{token}` na URL base configurada e retorna os dados reais.
  * Tratamento diferenciado de HTTP 404 (CPF sem declaração no exercício) com mensagem clara.
* **Mock Bypass via Consumer Key**:
  * Se o campo `consumerKey` iniciar com a string `"mock"`, a autenticação SAPI é ignorada e um token simulado é retornado. Permite testar a UI sem credenciais reais.
* **Mensagens de Erro Inteligentes**:
  * A função `_serpro_http_error_message` foi reescrita para parsear o JSON de erro da SAPI e extrair o campo `message`.
  * Dicas contextuais inseridas automaticamente: erro de `Role-Type` → sugestão de usar `TERCEIROS`; HTTP 401 → verificar Consumer Key/Secret; HTTP 403 → CNPJ do certificado divergente do contrato.

---

## v1.1.0 - Configuração e Extração SERPRO (05/06/2026)
* **Contexto**: Implementação da interface de configuração do SERPRO e do mecanismo de extração automática da chave privada RSA PKCS8 em formato Base64.
* **Extração Criptográfica**:
  * Criação da função `extrair_chave_privada_pfx` em `serpro_integra_service.py` utilizando a biblioteca `cryptography`. A função lê o certificado Base64 e sua senha, extrai a chave privada RSA e a exporta em formato PKCS8 DER Base64, garantindo compatibilidade multiplataforma (Windows e Linux/Render).
  * Persistência isolada do Base64 da chave na tabela SQLite `app_kv` sob a chave `"serpro_private_key_base64"`.
* **API e Rotas (FastAPI)**:
  * Criação do endpoint `POST /api/integracoes/serpro/extrair-chave` para acionar a extração.
  * Correção de bug de mascaramento no endpoint `PUT /api/integracoes/serpro/config` (mesclagem com chaves existentes para evitar sobrescrita com asteriscos) e sincronização automática de `certPassword` com a credencial do Contador (`contador_cert_a1_pass`).
* **TDD / Testes**:
  * Escrita de 5 testes unitários em `tests/test_serpro.py` cobrindo cenários de sucesso, falhas de certificado e sincronização de senha.

---

## v1.0.0 - Integração Conta Azul (OAuth 2.0) (05/06/2026)
* **Contexto**: Integração do ERP Conta Azul na nova aplicação `MONITOR_IRPF` (Python/FastAPI) para automação de faturamento, conciliação e exportação de clientes.
* **Autenticação e Token (OAuth 2.0)**:
  * Criação de `conta_azul_service.py` gerenciando a troca inicial de authorization codes por tokens, auto-refresh de access token expirado com margem de segurança de 5 minutos, e checagem de expiração de token.
  * Armazenamento seguro de credenciais e tokens em formato JSON no SQLite local através da tabela `app_kv` (chave `"conta_azul_config_v1"`), garantindo conformidade com Clean Architecture.
* **API e Rotas (FastAPI)**:
  * Implementação de endpoints REST no roteador de integrações (`GET /conta-azul/config`, `PUT /conta-azul/config`, `POST /conta-azul/configurar-code`, `POST /conta-azul/testar-conexao`).
  * Mascaramento estrito de dados sensíveis (`clientSecret`, `accessToken`, `refreshToken`) nas respostas HTTP retornadas aos clientes do frontend.
* **TDD / Testes**:
  * Desenvolvimento orientado a testes (TDD) com cobertura completa de cenários de sucesso, erro (incluindo tratamento correto de `HTTPException` do FastAPI) e bypass de rede simulados via mocks de `httpx.Client`.

