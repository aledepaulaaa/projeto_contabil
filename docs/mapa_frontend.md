# Mapa da Aplicação — Frontend (Projeto Contábil)

## 1. Módulos Principais (Frontend)
A estrutura de diretórios do frontend React segue convenções modernas de divisão de responsabilidades, alinhada com princípios declarativos de design:
* **`/src/components/atoms`**: Componentes básicos e puramente estéticos (ex: `Botao`, `Texto`, `Card`).
* **`/src/components/molecules`**: Componentes compostos de média complexidade (ex: `CardMetrica`, `WaitTimer`, `ResumoIAPanel`).
* **`/src/components/organisms`**: Componentes complexos e funcionais que encapsulam múltiplos átomos e moléculas (ex: `TimelineLateral`, `OnboardingKanban`, `TabelaGenerica`, `ModalCadastroEmpresa`).
* **`/src/pages`**: Contém as Views completas e páginas do projeto (ex: CRM, Clientes, Contratos, Onboarding, Atendimento, Processos, Alvarás, Rotinas, Perfil, Configuracoes).
* **`/src/hooks`**: Custom hooks atuando como ViewModels (dentro do conceito de MVVM da arquitetura limpa), onde reside toda a lógica isolada de chamadas e estado de visualização (ex: `useChat`, `useEmpresas`, `useLeads`, `useContratos`, `useDashboard`, `useOnboarding`).
* **`/src/services`**: Camada de comunicação pura com o backend via requisições HTTP (Axios client, ex: `SerproService`).
* **`/src/store`**: Gerenciamento de estado global da aplicação usando **Zustand** (autenticação, preferências de temas, etc.).

---

## 2. Tecnologias & UI/UX
* **Vanilla CSS**: Controle completo e personalizado de estilos, maximizando flexibilidade visual, sombras complexas, glassmorphism e responsividade.
* **Framer Motion**: Utilizado para animações e transições fluidas de elementos de UI (como drawers laterais e transição de abas).
* **Lucide React**: Biblioteca de ícones padrão para uniformidade estética de alta densidade visual.

---

## 3. Infraestrutura & Deploy
* **Frontend (Vercel)**: Hospedagem da aplicação React SPA com deploy contínuo integrado. 
* **SPA Routing**: Configurado via `vercel.json` usando regras de rewrites (`"source": "/(.*)" -> "/index.html"`) para resolver erros 404 de rotas físicas nas views internas do React Router.
* **Build e Validação**: Compilação rígida no deploy contínuo com flags de checagem estritas do TypeScript (`noUnusedLocals` e `noUnusedParameters`).
