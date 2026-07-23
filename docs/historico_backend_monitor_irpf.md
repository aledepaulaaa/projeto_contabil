# Histórico de Alterações — Backend (MONITOR_IRPF)

## v1.5.0 - Leitura Recursiva Multidirecional de Declarações e Resiliência (23/07/2026 15:35)
* **Contexto**: Aprimoramento da varredura (`MonitorScanService`) de pastas locais (`C:\ARQUIVOS_DECLARACOES`) para leitura recursiva dinâmica de declarações e recibos do IRPF nas pastas pai e subpastas (`gravadas/`, `transmitidas/`).
* **Extração Resiliente de CPF e Extensões**:
  * Adicionada a função `extract_cpf_from_file(file_path)` para extrair 11 dígitos numéricos do conteúdo dos arquivos `.dec`/`.rec` caso o nome do arquivo contenha pontuação ou prefixos customizados.
  * Suporte expandido para varredura de múltiplas extensoes e formatos (`.dec`, `.rec`, `.bak`, `.dbk`, `.xml`).
* **Processamento e Status**:
  * Leitura automática de subpastas `gravadas` (marcando status como `GRAVADA`) e `transmitidas` (marcando status como `TRANSMITIDA` / `ENTREGUE`).
  * Atualização da data do último scan (`monitor_last_scan_at_v1`) e retorno do resumo de criados e atualizados para o frontend.
* **TDD & Validação**:
  * 33 de 33 testes pytest executados com sucesso em 1.87s.

---

## v1.4.0 - Integração das APIs "Integra Contador" (SERPRO) (10/06/2026)
* **Modelo e Persistência de Configuração**:
  * Mapeamento dos 5 novos campos booleanos (`apiProcuracoesAtiva`, `apiDarfAtiva`, `apiMensagensEcacAtiva`, `apiDebitosAtiva` e `apiDiagnosticoFiscalAtiva`) com defaults como `False` no endpoint `GET /api/integracoes/serpro/config` e persistência reativa em banco SQLite no endpoint `PUT /api/integracoes/serpro/config`.
* **Motor de Simulação de Mocks (Integra Contador)**:
  * Atualização do endpoint `/serpro/chamar` para interceptar as requisições de teste Sandbox das novas APIs do Integra Contador (`PROCURACOES`, `SICALC`, `CAIXAPOSTAL`, `PAGTOWEB` e `SITFIS`) baseando-se no `idSistema` e `idServico` passados.
  * Implementação de respostas de alta fidelidade simulando cenários da documentação oficial (comprovantes de arrecadação, DARFs com códigos de barra e linha digitável, mensagens do e-CAC, situação fiscal cadastral e relatórios criptografados em Base64).
* **Testes de Integração**:
  * Expansão da suíte de testes unitários `tests/test_serpro.py` para cobrir os defaults dos novos campos, a persistência de gravação na tabela `app_kv`, e a simulação de chamadas do Integra Contador com asserts estritos de payload e status HTTP.

## v1.3.0 - Ambientes Sandbox & Refatoração SERPRO (09/06/2026)
* **Asaas (Sandbox/Prod Keys)**:
  * Atualizada a configuração reativa no app_kv (`asaas_config_v1`) com suporte aos campos `sandboxMode`, `sandboxApiKey` e `productionApiKey`.
  * Ajustada a lógica de criação de cobranças (`criar_cobranca_para_cliente`) para utilizar a URL base dinâmica (`https://api-sandbox.asaas.com/v3` se `sandboxMode` for verdadeiro, caso contrário `https://api.asaas.com/v3`) e a respectiva API key.
* **Conta Azul (Ativação de APIs)**:
  * Adicionado suporte ao campo `apiCobrancasAtiva` nas rotas e persistência de configuração da Conta Azul.
* **SERPRO (Sandbox & Rotas Dinâmicas)**:
  * Adicionado `sandboxMode` no dicionário padrão em `serpro_config_get` e manipulado corretamente no `serpro_config_put`.
  * URL base padrão alterada para `https://gateway.apiserpro.serpro.gov.br/`.
  * Implementação de rotas dinâmicas nos serviços de Restituição (`restituicao_service.py`) e Procuração (`procuracao_service.py`), selecionando os sufixos correspondentes (`-trial/v1` vs `/v1`) dinamicamente dependendo da propriedade `sandboxMode` salva no banco.
  * Endpoint de chamadas genéricas (`/serpro/chamar`) atualizado para interceptar os tokens conhecidos de demonstração do Trial (Renda, Restituição Com Declaração / Sem Declaração - retornando erro 404 - e Autorizações/Procurações) e retornar os payloads mock correspondentes imediatamente sem exigir comunicação externa ou chaves.
  * Criado teste de unidade em `test_serpro.py` para validar a inicialização do `sandboxMode` e a URL padrão.

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

