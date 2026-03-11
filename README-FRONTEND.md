# ⚛️ Frontend UI: Reactive & High-Fidelity (React + Vite)

## 🎨 1. Design System & UX (2026 Trends)
Interface focada em **Glassmorphism**, layouts fluidos e assistência por IA.

* **Tipografia**: Hierarquia com **Manrope** (Títulos) e **Inter** (Textos).
* **Visual**: Uso de `backdrop-blur`, sombras suaves e bordas finas.
* **Ícones**: Exclusivamente **Lucide React**. (Sem emojis).
* **Animações**: **Framer Motion** para transições de status e feedbacks fluidos.

## ⚡ 2. Reatividade e Estado SaaS
* **Zustand (Global State)**: Gerencia `authStore`, `planStore` (Paywall) e `sidebarStore`.
* **Real-time**: **WebSockets** ouvindo o RabbitMQ para atualizar status de guias e notificações de contratos assinados sem refresh.
* **Atomic Design**: Reutilização rigorosa de componentes (Atoms -> Molecules -> Organisms).

## 🛡️ 3. Engenharia de Frontend & Performance
* **Playwright E2E**: Testes cobrindo o fluxo completo de "Pagamento de Assinatura" até "Geração de Guia".
* **PWA**: Instalável com suporte a **Push Notifications via Firebase (FCM)**.
* **Segurança**: Sanitização contra XSS e CSP (Content Security Policy) ativa.

## 🔧 4. Recomendações Adicionais de Desenvolvimento
* **Comunicação Reativa**: Componentes devem reagir a eventos de "Background Tasks" (ex: "Sua guia está sendo gerada..."). Usar Snackbars persistentes para ações de longa duração.
* **Dica de Performance**: Utilizar o plugin `vite-plugin-pwa` com estratégia de `CacheFirst` para assets estáticos e `NetworkFirst` para dados da API, garantindo carregamento instantâneo ( < 1s).
* **IA Contextual (AIAssistantContainer)**: Criar um wrapper global de IA que injeta metadados da rota atual no prompt. Se o usuário estiver na tela de "CRM", a IA automaticamente prioriza comandos de "vendas e leads".