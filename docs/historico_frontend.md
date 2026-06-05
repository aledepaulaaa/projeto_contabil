# Histórico de Alterações — Frontend (Projeto Contábil)

## v3.8.0 - UI Consulta SERPRO & ViewModel TDD (03/06/2026)
* **Contexto**: Interface de consulta, controle de estados e visualização detalhada de renda do contribuinte via SERPRO.
* **TDD & ViewModel**:
  * Desenvolvimento guiado por testes unitários com Vitest do hook reativo `useConsultaRenda.ts` (e `useConsultaRenda.test.ts`), gerindo estados de loading, success e formatação/tratamento de erros HTTP.
  * Criação do `SerproService.ts` utilizando a instância do `apiClient` com injeção automática de JWT e Tenant Headers.
* **Interface Visual (Atomic Design)**:
  * Criação do organism/view `Serpro.tsx` em páginas do Dashboard, exibindo metadados do titular/destinatário, cards de destaque financeiro (`CardMetrica` para Patrimônio, Rendimentos PJ e Tributáveis) e tabela dinâmica com formatação monetária (Intl pt-BR).
  * Inclusão do link de navegação no menu lateral (`BarraLateral.tsx` usando ícone `Database` do Lucide React) e roteamento de subpáginas em `Dashboard.tsx`.

---

## v3.7.0 - Configurações SPA & Vercel Deploy (12/05/2026)
* **Contexto**: Ajuste fino do build e preparação para o ambiente de produção serverless da Vercel.
* **Deploy Frontend**:
  * Adicionado arquivo `frontend/vercel.json` com regras de reescrita global (`rewrites` para `/index.html`) para evitar erros 404 em rotas acessadas diretamente no navegador.
  * Mapeamento de variáveis de ambiente do gateway API (`VITE_API_URL`) no console administrativo da Vercel.

---

## v3.6.0 - Estabilização de Build & TypeScript Rígido (11/05/2026)
* **Contexto**: Resolução de erros latentes de tipagem e limpeza de dependências mortas no frontend.
* **Limpeza e Compilação**:
  * Eliminação de dead code e imports não utilizados em mais de 25 arquivos de componentes, hooks e testes (ex: `authStore_TDD.test.ts`).
  * Ativação de flags estritas (`noUnusedLocals` e `noUnusedParameters`) em `tsconfig.app.json` e `tsconfig.node.json`.
  * Validação com sucesso do build estático (`npm run build`) gerando bundle otimizado de 882kB.

---

## v3.5.0 - Visualização Avançada de Empresas Clientes (11/05/2026)
* **Contexto**: Criação das views interativas de cadastro e listagem de empresas no dashboard contábil.
* **Componentes de Listagem**:
  * Integração da `TabelaGenerica` na view `Onboarding.tsx` suportando buscas globais, filtros por regime fiscal e paginação local fluida.
  * Desenvolvimento de Drawer Lateral animado (framer-motion) com exibição densa de dados das empresas, endereços e contatos.
* **Formulários Interativos**:
  * Adaptação do `ModalCadastroEmpresa.tsx` usando estados reativos para comportar tanto a criação quanto a edição estruturada de empresas existentes.

---

## v3.4.0 - Quadro Kanban & Adoção (21/04/2026)
* **Contexto**: Implementação da trilha visual de onboarding do cliente.
* **Kanban de Adoção**:
  * Criação do componente `OnboardingKanban` simulando colunas do Trello (`A_FAZER`, `EM_ANDAMENTO`, `CONCLUIDO`).
  * Desenvolvimento do `ResumoIAPanel` com estilo **Glassmorphism** e editor em tempo real integrado.

---

## v3.3.0 - UI do Chat & Transições Otimistas (16/04/2026)
* **Contexto**: Otimização de tempo de resposta percebido e melhorias estéticas na conversação.
* **ChatWindow Refinements**:
  * Expandida caixa de texto com suporte nativo a Dark Mode e redimensionamento do botão de envio (h-10 w-10).
  * Adicionado estado `isAceitando` para feedback imediato ao aceitar chats na fila.
* **Optimistic UI**:
  * Disparo de evento customizado `atendimento-aceito` escutado por `ContactSidebar.tsx` para mover leads da fila para chats ativos de forma instantânea na UI, sem atrasos de WebSocket.

---

## v3.1.1-hotfix.2 - Cadeia de Autenticação local (16/04/2026)
* **Contexto**: Sincronização do ID de usuário nas requisições.
* **Autenticação**:
  * Adaptação de `AutenticacaoService.ts` e `useAutenticacao.ts` para carregar e salvar o `usuarioId` no localStorage.
  * Interceptor de requisições em `apiClient.ts` atualizado para injetar automaticamente o cabeçalho `X-Usuario-Id` em todas as chamadas HTTP.
