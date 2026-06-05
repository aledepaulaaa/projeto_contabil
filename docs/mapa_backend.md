# Mapa da Aplicação — Backend (Projeto Contábil)

## 1. Arquitetura Limpa (Clean Architecture Hierarchy)
O backend da aplicação é estruturado seguindo os princípios de Clean Architecture para garantir desacoplamento técnico e manutenibilidade das regras de negócio:
* **`core/domain`**: Entidades puras ricas de negócio (ex: `Lead.java`, `Atendimento.java`, `Contrato.java`). Não possuem qualquer acoplamento com frameworks ou JPA.
* **`core/usecases`**: Casos de uso complexos que orquestram a lógica e regras de negócio que envolvem mais de uma entidade.
* **`core/ports`**: Interfaces de entrada (driver ports) e saída (driven ports, ex: `LeadRepository`, `SignatureGateway`).
* **`infra/persistence`**: Adaptadores e repositórios físicos do banco de dados (Spring Data JPA, Envers, `LeadRepositoryAdapter`).
* **`interfaces/rest/controller`**: Controladores HTTP/REST de entrada para comunicação com o frontend e terceiros.

---

## 2. Componentes Críticos & Lógica de Negócio
* **CRM & Atendimento**: Centraliza a entrada do cliente via chat e leads. Possui métricas sofisticadas, separação de Abas (Fila vs Chats ativos) guiadas pelo `LeadController` e `AtendimentoMetricsController`.
* **Onboarding & Gestão de Empresas**: Gerencia a transição de leads convertidos para empresas ativas. Inclui cadastro detalhado (contatos/endereços), importação massiva e gestão de regimes tributários via `EmpresaController`.
* **Consulta Renda Contribuinte (SERPRO)**: Caso de uso `ConsultarRendaSerproUseCase` e controller `SerproController` isolados por locatária (`X-EmpresaLocataria-Id`).
* **Multi-tenancy Rigoroso**: Isolamento lógico estrito através de `empresa_locataria_id` (via `EmpresaLocatariaContext` ThreadLocal) em todas as tabelas e consultas de dados.

---

## 3. Microsserviços & Gateways
* **Node.js WhatsApp WHAPI** (`whatsapp_whapi/`): Executado separadamente, gerencia webhooks, escuta e envia mensagens via WebSockets/WHAPI com foco puro num Gateway isolado de IA. É responsável por traduzir requisições de mensageria para o Backend em Java.
* **Integração SERPRO (Consulta Renda)**: Adaptador de infraestrutura `SerproIntegration` encapsulando autenticação OAuth2 baseada em chaves do cliente, descriptografia RSA assimétrica e bypass local para ambiente Trial.

---

## 4. Automação Fiscal (Scraper Contábil)
* **Diretório**: `scraper-contabil/`
* **Tecnologias**: Python 3.12 + Playwright + `playwright-stealth` + Google Gemini Vision (`gemini-3-flash-preview`).
* **Função**: Executa login automatizado no portal Gov.br com resolução de captcha grid 3x3 por meio da IA do Gemini Vision, permitindo a extração de dados fiscais (IRPF, DARF, situação fiscal e malha fina).
* **Características**:
  * Detecção de captchas em iframes com cálculo dinâmico de coordenadas (offsets).
  * Retry automático de login (até 3 tentativas).
  * Persistência de cookies de sessão (`session_cookies.json`).
  * Modo standby com ping a cada 60s para manter a sessão ativa.

---

## 5. Infraestrutura & Deploy
* **Backend (Render)**: API Spring Boot executada via Docker no Render. Conexão com Supabase PostgreSQL via Transaction Pooler (porta 6543, `prepareThreshold=0`).
* **Serviços Auxiliares (Railway)**: Recomendado para o cluster Docker do WhatsApp Gateway, Redis e RabbitMQ.
* **CORS**: Configurado dinamicamente para liberar a origem autorizada da Vercel em `SecurityConfig.java`.
