# 🏗️ CONTABIL_PRO — Frontend (React 19 + Vite 6)

Interface SaaS Premium para escritórios de contabilidade. Parte do ecossistema **CONTABIL_PRO** do [Projeto Contábil](../README.md).

---

## 🏛️ Arquitetura e Filosofia de Design

Construído sobre **Atomic Design** + **MVVM (Custom Hooks)**, com separação rigorosa entre lógica de negócio e visualização.

```
src/
├── components/
│   ├── atoms/        → Botão, Texto, Card, Skeleton, Badge
│   ├── molecules/    → CardMetrica, InputComLabel
│   └── organisms/    → TabelaGenerica, TimelineLateral, BarraLateral
├── hooks/            → ViewModels (lógica + estado + API calls)
├── pages/            → Views declarativas (Dashboard, CRM, Onboarding...)
├── services/         → Clientes HTTP e integrações
└── store/            → Zustand (auth, UI global)
```

---

## 🎨 Stack e Ferramentas

| Categoria | Tecnologia |
|---|---|
| Core | React 19, TypeScript, Vite 6 |
| Estilo | TailwindCSS (tokens centralizados), Glassmorphism |
| Animações | Framer Motion (micro-interações, transições de página) |
| Estado Global | Zustand (auth, dark mode, notificações) |
| Cache / Async | TanStack Query v5 (skeletons, retries, mutações otimistas) |
| Real-time | WebSockets via STOMP/SockJS |
| Dark Mode | Nativo — respeita preferência do sistema |

---

## 📋 Módulos e Páginas

| Página | Rota | Descrição |
|---|---|---|
| Dashboard | `/dashboard` | Métricas gerais, ações rápidas, alertas |
| CRM / Leads | `/dashboard/crm` | Kanban + timeline de leads |
| Contratos | `/dashboard/contratos` | Assinatura digital via ZapSign |
| Onboarding | `/dashboard/onboarding` | Fluxo de ativação de novos clientes |
| Rotinas | `/dashboard/rotinas` | Motor de guias fiscais (DAS, ISS, FGTS) |
| Alvarás | `/dashboard/alvaras` | Monitoramento de vencimentos |
| Processos | `/dashboard/processos` | Gestão de processos administrativos |
| Configurações | `/dashboard/configuracoes` | Perfil, integrações (Asaas, SERPRO) |
| Consulta SERPRO | `/dashboard/serpro` | Consulta Renda PF via Compartilha RF |

---

## 🧪 Qualidade (TDD)

- **Vitest**: Testes unitários em hooks e utilitários de negócio
- **Playwright (E2E)**: Fluxos críticos (Jornada Lead → Contrato, Rotinas, Cobranças)
- **TypeScript Strict**: Tipagem absoluta, sem `any` em código de produção

```bash
npm run test          # Vitest (unitários)
npm run test:e2e      # Playwright (headless)
npm run test:e2e:ui   # Playwright (UI Mode)
```

---

## 🚀 Executar Localmente

```bash
npm install
npm run dev     # http://localhost:5173
```

> **Pré-requisito**: Backend Java rodando em `localhost:8080`

---

## 🔗 Integrações

- **Backend Java** (`../backend`) — API REST via HTTP
- **Gateway WhatsApp** (`../whatsapp_whapi`) — Socket.IO porta 3001
- **ZapSign** — Assinatura digital de contratos
- **SERPRO** — Consulta Renda via Compartilha Receita Federal

---

*CONTABIL_PRO Frontend — Advanced Agentic Coding Team 2026*