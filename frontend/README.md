# 🏗️ Frontend Core: Modern SaaS Accounting UI (React 19 & Vite 6)

## 🏛️ 1. Arquitetura e Filosofia de Design
O frontend deste projeto é construído sobre uma base altamente modular, escalável e performática, focada em entregar uma experiência **SaaS Premium**.

*   **Atomic Design**: Organização rigorosa de componentes em **Atoms** (botões, textos), **Molecules** (cards de métricas, inputs com label) e **Organisms** (tabelas, dashboards, timelines).
*   **MVVM / Custom Hooks**: Toda a lógica de negócio, chamadas de API e transformações de dados residem em Hooks customizados (`src/hooks`), que atuam como ViewModels. Os componentes de visualização permanecem "burros" e declarativos.
*   **Atomic CSS (Tailwind)**: Estilização utilitária de alta performance com tokens de design centralizados para garantir consistência visual em todo o ecossistema.

## 🎨 2. Experiência do Usuário e Estética
O design é inspirado em referências modernas de fintechs e sistemas contábeis de elite (como Conta Azul).

*   **Premium UI**: Uso extensivo de **Glassmorphism**, gradientes suaves e sombras profundas para criar uma interface que parece viva e tridimensional.
*   **Framer Motion**: Micro-interações e transições de página fluidas que elevam a percepção de qualidade do usuário final.
*   **Dark Mode Native**: Suporte completo a temas claros e escuros, respeitando a preferência do sistema ou do usuário.

## 🔄 3. Fluxo de Dados e Gerenciamento de Estado
A sincronização de dados entre cliente e servidor é tratada de forma resiliente e em tempo real.

*   **TanStack Query (React Query) v5**: Gerenciamento de cache, estados de carregamento (skeletons), retries automáticos e mutações otimistas.
*   **Zustand**: Armazenamento de estado global leve para autenticação, preferências de UI e estados efêmeros que não precisam de cache.
*   **WebSockets (STOMP/SockJS)**: Pipeline de dados em tempo real para notificações de sistema, atualizações de status de leads e geração de relatórios em background.

## 🧪 4. Qualidade e Engenharia (TDD)
O desenvolvimento é guiado por uma estratégia rigorosa de garantia de qualidade (TDD obrigatório).

*   **Vitest**: Testes unitários focados na lógica de negócio contida nos hooks custmizados e utilitários.
*   **Playwright (E2E)**: Validação de fluxos críticos de ponta a ponta (Jornada do Lead, Fechamento de Contratos, Configurações de Perfil), garantindo que nada quebre na visão do usuário.
*   **TypeScript Estrito**: Tipagem absoluta em todos os fluxos de dados, minimizando erros em tempo de execução.

## 🚀 5. Comandos de Desenvolvimento

### Instalação
```bash
npm install
```

### Ambiente de Desenvolvimento
```bash
npm run dev
```

### Testes
*   **Unitários/Hooks**: `npm run test`
*   **E2E (Headless)**: `npm run test:e2e`
*   **E2E (UI Mode)**: `npm run test:e2e:ui`

---
*Assinado: Advanced Agentic Coding Team — Para a melhor experiência contábil do mercado.*