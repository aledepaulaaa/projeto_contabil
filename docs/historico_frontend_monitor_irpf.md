# Histórico de Alterações — Frontend (MONITOR_IRPF)

## v1.4.0 - Integração das APIs "Integra Contador" (SERPRO) & Agrupamento de Integrações (10/06/2026)
* **Reorganização Visual do Menu de Configurações**:
  - Refatorada a página de configurações (`ConfigPage.tsx`), simplificando o grid de áreas principais para apenas 4 itens: *Pasta IRPF*, *Integrações*, *Preferências* e *Contador*.
  - Criada uma barra de sub-menu lateral (sidebar de duas colunas responsiva no desktop, com empilhamento automático em mobile) dentro da aba *Integrações*, agrupando de forma limpa e organizada os painéis da *Conta Azul*, *Asaas*, *API RFB (InfoSimples)*, *Serpro* e *WhatsApp*.
  - Adicionados novos estilos CSS globais em `global.css` (`.integration-layout` e `.integration-menu-item`) com efeitos hover/active premium.
* **Ativação Granular das APIs**:
  - Adicionados checkboxes de ativação individual para 5 novas APIs do Integra Contador na aba "Configurações" do SERPRO (*Integra Procurações*, *Integra Sicalc*, *Integra Caixa Postal*, *Integra Pagamento* e *Integra Sitfis*) com rótulos limpos e simplificados.
  - Adicionado banner de alerta amarelo em formato de aviso de atenção destacado sobre LGPD e consentimento obrigatório do cidadão no portal e-CAC (Compartilha Receita Federal) para funcionamento em produção.
  - Persistência em banco local de todas as preferências salvas através do GET/PUT da configuração do SERPRO.
* **Simulador Sandbox Expandido**:
  - Adicionado suporte a 8 módulos no total (dropdown com Renda, Restituição, Autorizações, Procurações, Sicalc/DARF, Caixa Postal, Pagamento e Sitfis/Situação Fiscal).
  - Criados campos de formulário reativos e dinâmicos específicos para cada uma das 5 novas APIs (ex: CPF/CNPJ, Outorgante/Outorgado, isn do e-CAC, serviços Sicalc/Pagtoweb/Sitfis, intervalo de datas de arrecadação, número do documento).
  - Implementação de botões de atalho ("Preencher Dados de Teste") para carga rápida de massas de testes oficiais de cada serviço.
  - Desenvolvimento de visualizações customizadas (Cards e Listas formatadas de forma premium com estilo HSL) para exibição formatada dos resultados simulados retornados pelo backend, além da visualização do JSON bruto correspondente.
  - Solucionado erro de compilação do TypeScript no componente `SerproIntegracaoPanel.tsx` através da criação do estado `simMethod` para compartilhar de forma segura o método HTTP no painel de visualização da execução sandbox.

## v1.3.0 - Ambientes Sandbox & Refatoração SERPRO (09/06/2026)
* **Asaas (Sandbox/Prod Keys)**:
  * Adicionado toggle visual de "Modo Sandbox (Testes)".
  * Separados os campos de chaves da API para `sandboxApiKey` e `productionApiKey`, com indicação visual de cor (laranja para testes, verde para produção) e badges explicativos.
  * Otimizada a experiência removendo campos manuais de URLs que agora são computados no backend.
* **Conta Azul (Ativação de APIs)**:
  * Adicionado checkbox reativo para ativar de forma granular a **API de Cobranças (Emissão de Boletos/Pix)**.
* **SERPRO (Refatoração e Testes Sandbox)**:
  * Renomeado o painel principal de configurações para **Configurações de Integração SERPRO** e removida a seção do simulador da tela de configuração principal.
  * Criado um layout de abas premium (Vanilla CSS): **Configurações** (controle de credenciais, toggle sandbox, APIs ativas, upload de certs) e **Testar Sandbox** (simulador sandbox).
  * Adicionado suporte no simulador para testar múltiplos módulos (Renda, Restituição e Autorizações/Procurações), com botões para auto-preencher dados de teste da documentação, visualização dos cards e tabela de dados parseados, e detalhes de URL executada, status code e JSON de retorno técnico.
  * Correção de warning de variável não lida (`id`) em `PrecificacaoCobrancaPage.tsx` para assegurar que a compilação do TypeScript ocorra com zero erros.

## v1.2.0 - Página Consulta Renda SERPRO (05/06/2026)
* **Contexto**: Implementação da página de consulta de renda via API SERPRO, replicando e adaptando o design premium da aplicação CONTABIL_PRO para a stack CSS nativa do MONITOR_IRPF.
* **Nova Página `ConsultaSerproPage.tsx`**:
  * Campo de token de compartilhamento (36 caracteres) com validação em tempo real e badge verde de confirmação ao atingir o formato correto.
  * Botão clicável no token de demonstração (`06aef429-a981-3ec5-a1f8-71d38d86481e`) que preenche o campo automaticamente — facilita testes de desenvolvimento.
  * Aviso LGPD explícito sobre a necessidade de consentimento no e-CAC.
  * Skeletons de carregamento animados (shimmer effect) para Cards e Tabela.
  * **Cards de métricas** em 3 colunas: Patrimônio Total, Rendimentos Tributáveis e Rendimento de Fontes PJ (com bordas laterais coloridas por tipo).
  * **Painel de metadados**: Titular criptografado, CNPJ do destinatário, data/hora do registro, token utilizado e botão "Limpar Resultados".
  * **Tabela analítica**: Todos os campos retornados pela API em zebra-striping + hover highlight azul, valores monetários formatados em BRL.
  * **Badge amarelo "Modo Demonstração"** exibido quando os dados são mock.
  * Aviso Legal integral da LGPD / SERPRO no rodapé da consulta.
* **Interfaces e Cliente de API**:
  * Adição das interfaces `DadoRendaItem` e `ConsultaRendaResult` ao `client.ts`.
  * Implementação do método `postSerproConsultaRenda(token)` com tratamento de erros de negócio (resposta ok: false) separado de erros de rede.
* **Navegação**:
  * Adição de `IconSerpro` ao `NavIcons.tsx` (ícone de escudo com símbolo de banco de dados).
  * Novo item "Consulta SERPRO" no array `NAV` do `AppShell.tsx`.
  * Nova rota `/consulta-serpro` registrada em `App.tsx`.
* **Compilação e Tipagem**:
  * `npx tsc --noEmit` — 0 erros após todas as alterações.

---

## v1.1.0 - Configuração e Extração SERPRO (05/06/2026)
* **Contexto**: Painel de controle, cliente de API e interface de extração de chaves para a integração SERPRO na aplicação `MONITOR_IRPF`.
* **Interfaces & Clientes (TypeScript)**:
  * Criação da interface `ISerproConfig.ts` representando a estrutura de dados de chaves de API, certificados e chaves privadas do SERPRO.
  * Implementação de métodos no cliente de API `client.ts` (`fetchSerproConfig`, `putSerproConfig`, `postSerproExtrairChave`, `postSerproTestarToken`).
* **Componentes Visuais**:
  * Desenvolvimento do componente `SerproIntegracaoPanel.tsx` contendo checkbox de ativação, inputs para credenciais do SERPRO (Consumer Key / Consumer Secret / URLs), painel de status do Certificado A1 e da Chave Privada, botão para acionar a extração e botão para testar a autenticação (SAPI) com retorno de sucesso/erro.
  * Roteamento e renderização do painel no `ConfigPage.tsx`.
* **Compilação e Tipagem**:
  * Compilação estática concluída com sucesso via TypeScript (`tsc`).

---

## v1.0.0 - Integração Conta Azul (OAuth 2.0) (05/06/2026)
* **Contexto**: Painel de controle, cliente de API e interface de autorização OAuth 2.0 para a integração Conta Azul na aplicação `MONITOR_IRPF`.
* **Interfaces & Clientes (TypeScript)**:
  * Criação da interface `IContaAzulConfig.ts` representando a estrutura reativa do estado de configuração.
  * Implementação de métodos no cliente de API `client.ts` (`fetchContaAzulConfig`, `putContaAzulConfig`, `postContaAzulConfigurarCode`, `postContaAzulTestarConexao`).
* **Componentes Visuais**:
  * Desenvolvimento do componente `ContaAzulIntegracaoPanel.tsx` contemplando checkbox de ativação, inputs mascarados para credenciais, botão para iniciar o fluxo OAuth na Conta Azul, campo de colagem do código retornado com validação, e teste de conexão dinâmico com feedback colorido de sucesso/erro.
  * Integração do painel na `ConfigPage.tsx` renderizando a área de configuração da Conta Azul.
* **Compilação e Tipagem**:
  * Compilação estática (`npx tsc --noEmit`) concluída com 100% de sucesso e zero erros de tipagem.

