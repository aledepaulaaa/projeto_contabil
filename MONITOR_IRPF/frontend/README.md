# 🟩 MONITOR_IRPF — Frontend (React + Vite + TypeScript)

Interface do usuário da sub-aplicação **MONITOR_IRPF**. Parte do [Projeto Contábil](../../README.md).

---

## 🎯 Propósito

SPA (Single Page Application) para o contador gerenciar sua carteira de clientes de IRPF, acompanhar situação fiscal, emitir cobranças e configurar integrações com APIs governamentais e financeiras.

---

## 🏛️ Arquitetura

```
src/
├── api/
│   └── client.ts         → Todas as chamadas HTTP para o backend (fetch API)
├── components/
│   ├── AppShell.tsx       → Layout principal: sidebar + outlet de conteúdo
│   ├── NavIcons.tsx       → Ícones SVG customizados da barra lateral
│   ├── SerproIntegracaoPanel.tsx   → Configuração credenciais SERPRO
│   ├── ContaAzulIntegracaoPanel.tsx→ Config OAuth Conta Azul
│   ├── RfbIntegracaoPanel.tsx      → Config InfoSimples
│   ├── AsaasIntegracaoPanel.tsx    → Config Asaas pagamentos
│   └── ContadorPanel.tsx           → Config perfil + certificado A1
├── interfaces/            → Tipos TypeScript (contratos de API)
├── pages/                 → Componentes de página (um por rota)
├── styles/                → Vanilla CSS global
└── utils/                 → Helpers (formatação, máscaras CPF/CNPJ)
```

**Padrão de chamada de API:** Todas as funções de I/O estão centralizadas em `api/client.ts`. Os componentes de página chamam diretamente as funções do client via `useState` + `useEffect`, sem camada de state management global (projeto intencional para simplicidade — ver plano de escalabilidade para Zustand/TanStack Query).

---

## 📋 Páginas e Rotas

| Rota | Página | Descrição |
|---|---|---|
| `/` | `DashboardPage` | Métricas gerais da carteira |
| `/declaracoes` | `DeclaracoesPage` | Listagem e edição de declarações por CPF |
| `/clientes` | `ClientesPage` | Carteira de clientes com precificação |
| `/usuarios` | `UsuariosPage` | Controle de acesso de usuários |
| `/documentos` | `DocumentosPage` | Checklist de documentos por cliente |
| `/procuracoes` | `ProcuracoesPage` | Situação de declarações por procuração |
| `/precificacao` | `PrecificacaoCobrancaPage` | Honorários e geração de cobranças Asaas |
| `/darf` | `DarfPage` | Emissão e histórico de DARFs |
| `/malha` | `MalhaPage` | Status de malha fiscal por contribuinte |
| `/restituicoes` | `RestituicoesPage` | Lotes e status de restituição IRPF |
| `/diagnostico-fiscal` | `DiagnosticoFiscalPage` | Diagnóstico completo RFB por CPF |
| `/mensagens-ecac` | `MensagensEcacPage` | Caixa de mensagens e-CAC |
| `/insights` | `InsightsPage` | Relatórios analíticos por contribuinte |
| `/consulta-serpro` | `ConsultaSerproPage` | Consulta Renda via API SERPRO |
| `/configuracoes` | `ConfigPage` | Integrações + perfil do contador |
| `/enviar-documentos/:token` | `PortalClienteDocumentosPage` | Portal público para envio de documentos |

---

## 🛠️ Stack

| Categoria | Tecnologia |
|---|---|
| Core | React, TypeScript, Vite |
| Estilo | Vanilla CSS (variáveis CSS custom properties) |
| Roteamento | React Router DOM v6 |
| HTTP Client | Fetch API nativa (centralizada em `client.ts`) |
| Ícones | SVG inline customizados (`NavIcons.tsx`) |
| Build | Vite + TypeScript strict |

---

## 🔗 Integrações (via Backend)

| Integração | Configurada em |
|---|---|
| SERPRO (SAPI + Consulta Renda) | `SerproIntegracaoPanel.tsx` |
| InfoSimples / RFB | `RfbIntegracaoPanel.tsx` |
| Asaas (cobranças) | `AsaasIntegracaoPanel.tsx` |
| Conta Azul (ERP, OAuth 2.0) | `ContaAzulIntegracaoPanel.tsx` |
| Certificado Digital A1 | `ContadorPanel.tsx` |

---

## 🚀 Executar Localmente

```bash
npm install
npm run dev        # http://localhost:5173

# Type check
npx tsc --noEmit

# Build de produção
npm run build
```

**Proxy de desenvolvimento** (definido no `vite.config.ts`):
```
/api/* → http://localhost:8000
```

---

## 🧪 Verificação de Tipos

```bash
npx tsc --noEmit   # Deve retornar 0 erros
```

---

## ☁️ Deploy (Vercel)

O `vercel.json` deve redirecionar `/api/*` para a URL do backend no Render:
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://seu-backend.onrender.com/api/:path*" }
  ]
}
```

---

*MONITOR_IRPF Frontend — Advanced Agentic Coding Team 2026*
