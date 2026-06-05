# Histórico de Alterações — Frontend (MONITOR_IRPF)

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

