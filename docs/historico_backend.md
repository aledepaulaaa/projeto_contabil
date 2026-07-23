# Histórico de Alterações — Backend (Projeto Contábil)

## v3.11.0 - Resiliência de Configuração de E-mail (JavaMailSender) & Migração Flyway V27 (23/07/2026 16:52)
* **Contexto**: Resolução da falha de inicialização de bean do Spring Boot em ambiente cloud (`UnsatisfiedDependencyException: No qualifying bean of type JavaMailSender`).
* **Configuração Resiliente de E-mail (`MailConfig.java`)**:
  * Criada a classe `MailConfig.java` anotada com `@Configuration` e `@ConditionalOnMissingBean(JavaMailSender.class)`. Se as propriedades `spring.mail.*` não forem injetadas no ambiente cloud, o bean `JavaMailSender` é provido automaticamente com fallbacks seguros, evitando o travamento do container no boot.
* **Migrações Flyway V26 e V27**:
  * Criado o script `V26__criar_tabela_etapas_funil.sql` para suporte às etapas do funil de vendas do CRM.
  * Criado o script `V27__add_colunas_automacao_e_mensagens_nao_lidas.sql` adicionando colunas de automação em `empresas_locatarias` e `leads`.
* **TDD & Validação**:
  * 62 de 62 testes JUnit 5 executados e aprovados (`BUILD SUCCESS`).

---

## v3.10.0 - Migração Flyway V25 (Anotações de Contato) e Suporte ao Perfil Prod (23/07/2026 16:09)
* **Contexto**: Resolução da falha de validação de schema do Hibernate em ambiente de produção/Render (`missing table [anotacoes_contato]`).
* **Migração Flyway V25**:
  * Criado o script `V25__criar_tabela_anotacoes_contato.sql` definindo as tabelas `anotacoes_contato` (com `id`, `contato_id`, `empresa_locataria_id`, `autor`, `setor`, `conteudo`, `criado_em`) e `anotacoes_contato_aud` para suporte ao Hibernate Envers.
* **Leitura Dinâmica do Perfil Cloud**:
  * Atualizado `ProjetoContabilApplication.java` para priorizar a variável de ambiente `SPRING_PROFILES_ACTIVE`, garantindo inicialização correta no perfil `prod` no Render.
* **TDD & Validação**:
  * Bateria de 62 testes JUnit 5 executada com sucesso (`BUILD SUCCESS`).

---

## v3.9.0 - Estabilização de Rotas, Dashboard e Cascata de Exclusão no CRM (23/07/2026 15:02)
* **Contexto**: Correção de exceções de persistência SQL no PostgreSQL, implementação de exclusão em cascata transacional para leads e limpeza de dados fictícios no Dashboard.
* **Correções de Persistência JPA**:
  * Adicionada a anotação `@Transient` na propriedade `cliente` de `ContatoEmpresaJpaEntity.java`, solucionando a exceção PostgreSQL `column c1_0.cliente does not exist` na rota `GET /api/empresas`.
* **Cascata Transacional no CRM**:
  * Adicionado o método `deleteAllByLeadId` em `AtendimentoJpaRepository.java`.
  * Atualizada a rota `@DeleteMapping("/{id}")` em `LeadController.java` com `@Transactional` para remover atendimentos vinculados antes de deletar o lead, evitando a falha de chave estrangeira `fk_atendimento_lead`.
* **Cálculo de Dados Reais no Dashboard**:
  * Refatorado `DashboardController.java` para eliminar dados fictícios hardcodeados (R$ 1.500 de ticket, R$ 4.500 de marketing e 12,5% de variação). O cálculo de LTV, CAC e Faturamento agora reflete estritamente os contratos e leads reais da locatária.

---

## v3.8.0 - Integração SERPRO & Compartilha Receita (03/06/2026)
* **Contexto**: Integração da API Consulta Renda da Receita Federal (SERPRO) para acesso e descriptografia assimétrica de dados fiscais sob consentimento.
* **Segurança e Criptografia (RSA)**:
  * Criação do utilitário `DecryptionUtil.java` no backend para decodificação e descriptografia assimétrica via `RSA/ECB/PKCS1Padding` usando a chave privada RSA do eCNPJ do cliente.
  * Criação de script PowerShell compilável em C# (`extrair_chave_serpro.ps1`) para exportação segura da chave privada RSA PKCS8 do certificado eCNPJ (`.pfx`) do cliente, salvando em Base64 no `.env` (ocultada do Git no `.gitignore`).
* **Resiliência e Gateway**:
  * Implementação da porta driven `ConsultaRendaGateway` e adaptador `SerproIntegration` com suporte a autenticação OAuth2 dinâmica do SERPRO.
  * Desenvolvimento de bypass local em ambiente Trial para o token de demonstração público (`06aef429-a981-3ec5-a1f8-71d38d86481e`), servindo dados mockados simulados realistas para permitir o desenvolvimento contínuo frente a indisponibilidades do gateway externo.
  * Implementação do usecase `ConsultarRendaSerproUseCase` integrado e isolado por `EmpresaLocatariaId` (multi-tenant) e exposto via `SerproController`.

---

## v3.7.0 - Gov.br Scraper, Deploy em Produção & Multi-Tenancy (12/05/2026)
* **Contexto**: Lançamento do motor de automação fiscal para monitoramento de IRPF via portal Gov.br/e-CAC e estabilização de deploys de infraestrutura do backend.
* **Automação Fiscal (Scraper)**:
  * Criação do crawler em Python 3.12 (`scraper-contabil/main.py`) com Playwright e `playwright-stealth` para login humanizado e bypass de detecção automatizada do Gov.br.
  * Integração do Google Gemini Vision (`gemini-3-flash-preview`) para resolver captchas visuais em iframes, calculando coordenadas cartesianas com offset de tela.
  * Persistência de cookies e sessões em `session_cookies.json` com standby keep-alive de 60s.
* **Infraestrutura & Deploy (Render)**:
  * Dockerização da API Spring Boot e deploy no Render.
  * Resolução de conflitos de migrações Flyway no banco de dados Supabase usando Transaction Pooler.
  * CORS habilitado para a URL definitiva da Vercel.

---

## v3.5.0 - Gestão de Empresas & Agregação JPA (11/05/2026)
* **Contexto**: Implementação das regras mestre de persistência do Aggregate Root de empresas e isolamento rigoroso de locatários.
* **Domínio e Persistência**:
  * Expansão do Aggregate Root `Empresa` para conter coleções complexas aninhadas de `ContatoEmpresa` e `EnderecoEmpresa` com Cascade total.
  * Criação do caso de uso `AtualizarEmpresaUseCase` com tratamento transacional e reconstituição de agregados para evitar erros de `LazyInitializationException`.
* **Segurança e API**:
  * Endpoint `PUT /api/empresas/{id}` adicionado no `EmpresaController` e validações robustas de formato para CNPJ e CPF.
  * Filtro estrito de multi-tenancy injetado nos Repository Adapters via `EmpresaLocatariaId`.

---

## v3.4.0 - Fluxo Onboarding Digital & ZapSign (21/04/2026)
* **Contexto**: Geração automatizada de contratos e persistência do histórico do lead no onboarding.
* **ZapSign & Mensageria**:
  * Gatilho de mudança de status para `PROPOSTA` dispara automaticamente a chamada para a API da ZapSign, gerando contratos baseados em PDF Base64 via One-Click.
  * Integração de disparos automáticos de WhatsApp e e-mail com links de assinatura digital.
* **Persistência**:
  * Criação das entidades `Onboarding` e `TarefaOnboarding` com isolamento por tenant.
  * Migração Flyway `V22__criar_tabelas_onboarding.sql` auditada pelo Hibernate Envers.

---

## v3.2.0 - Hotfixes Críticos & Segurança Contextual (16/04/2026)
* **Contexto**: Sessão de depuração para resolver falhas 500 no core e refatoração do contexto de autenticação em testes TDD.
* **Correções no LeadController**:
  * Correção de importação duplicada da classe `Usuario` no pacote `core.domain.usuario`.
  * Ajuste de variáveis de tenant incorretas e mapeamento da propriedade `Atendimento.puxar()` para realizar a transição de fila.
* **Autenticação Dual**:
  * `aceitarAtendimento` adaptado para ler tanto o `SecurityContext` (para TDD) quanto o header de gateway `X-Usuario-Id` (para produção).
  * Migração de testes mockados de JWT para injeção via `@WithMockUser`.

---

## v3.1.1-hotfix - Validação de Contatos (16/04/2026)
* **Contexto**: Tratamento robusto para a fila de atendimento.
* **Ajuste de Segurança**:
  * Resolução de erro 500 no endpoint `GET /api/leads/contatos` quando o usuário era nulo/anônimo, substituído por tratamento customizado de HTTP 401.

---

## v3.1.1 - Atribuição Automática & Cronômetros (16/04/2026)
* **Contexto**: Regras de urgência e atribuição automática comercial.
* **Distribuição de Leads**:
  * Lógica para atribuir automaticamente leads movidos sem departamento definido ao setor "Comercial".
  * Eventos de WebSocket setoriais disparados para alertar a equipe em tempo real sobre a chegada de novos leads.
