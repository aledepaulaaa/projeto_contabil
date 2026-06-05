# 🟩 MONITOR_IRPF — Carteira de Declarações IRPF

Sub-aplicação SaaS especializada na **gestão da carteira de clientes IRPF** de um escritório de contabilidade. Parte do [Projeto Contábil](../README.md).

---

## 🎯 Propósito

O MONITOR_IRPF centraliza todas as operações relacionadas às declarações de Imposto de Renda de Pessoa Física (IRPF) que o contador gerencia. Oferece monitoramento em tempo real da situação fiscal dos contribuintes, integração com a Receita Federal e ferramentas de cobrança de honorários.

---

## 📦 Estrutura

```
MONITOR_IRPF/
├── frontend/     → Interface React + Vite + TypeScript (Vanilla CSS)
├── backend/      → API FastAPI + Python 3.12 + SQLAlchemy + SQLite
└── documentacao/ → Credenciais e configurações (git-ignored)
```

---

## ✨ Funcionalidades

### 📊 Gestão da Carteira
- **Clientes**: Cadastro manual e importação por ano-calendário
- **Declarações**: Acompanhamento de status por CPF e exercício (Pendente, Entregue, Em Malha...)
- **Dashboard**: Métricas agregadas da carteira (total declarações, situação, pendências)

### 🏛️ Integrações com Receita Federal
- **Diagnóstico Fiscal** (InfoSimples): situação na RFB, procurações e-CAC
- **Malha Fiscal**: monitoramento de declarações em malha fina por contribuinte
- **Restituições**: status e lotes de restituição do IRPF
- **Mensagens e-CAC**: caixa de entrada fiscal por CPF

### 🛡️ Integração SERPRO
- **Consulta Renda PF**: acesso a dados de renda via Compartilha Receita Federal
- Token de demonstração (`06aef429-a981-3ec5-a1f8-71d38d86481e`) para testes sem custo
- Modo produção com autenticação mTLS (SAPI) usando certificado A1 do contador
- Extração automática da chave privada RSA do certificado PFX pela interface web

### 💰 Financeiro
- **DARF**: emissão de DARFs para contribuintes da carteira
- **Precificação e Cobrança**: cálculo de honorários + cobrança automática via Asaas
- **Conta Azul** (OAuth 2.0): integração com ERP para faturamento e conciliação

### ⚙️ Configurações
- Perfil do Contador (nome, CRC, CPF, CNPJ)
- Upload de certificado digital A1 (PFX/P12) — extração de chave RSA pela UI
- Configurações de integrações: SERPRO, Asaas, InfoSimples, Conta Azul
- Monitor de pastas locais de declarações (integração com pasta IRPF local)

---

## 🚀 Executar Localmente

### Backend (FastAPI)
```bash
cd MONITOR_IRPF/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### Frontend (React + Vite)
```bash
cd MONITOR_IRPF/frontend
npm install
npm run dev
# App: http://localhost:5173
```

> O Vite proxy redireciona automaticamente `/api/*` → `localhost:8000`

---

## ☁️ Deploy em Produção

| Camada | Plataforma | Config |
|---|---|---|
| Backend | **Render** (Web Service Python) | Persistent Disk em `/app/data/` para o SQLite |
| Frontend | **Vercel** (SPA) | `vercel.json` redireciona `/api/*` → URL do Render |

**Variáveis de ambiente necessárias no Render:**
```env
CORS_ORIGINS=https://seu-frontend.vercel.app
# O banco SQLite é gerenciado pelo Persistent Disk; não requer DATABASE_URL
```

---

## 📐 Roadmap para Multi-tenancy

O MONITOR_IRPF foi arquitetado com escalabilidade em mente. O plano de migração de SQLite → PostgreSQL multi-tenant está documentado em:

📄 [`../docs/plano_escalabilidade_monitor_IRPF.md`](../docs/plano_escalabilidade_monitor_IRPF.md)

---

## 📚 Documentação Técnica

| Arquivo | Conteúdo |
|---|---|
| [`../docs/historico_backend_monitor_irpf.md`](../docs/historico_backend_monitor_irpf.md) | Histórico de versões do backend |
| [`../docs/historico_frontend_monitor_irpf.md`](../docs/historico_frontend_monitor_irpf.md) | Histórico de versões do frontend |
| [`../docs/mapa_backend_monitor_irpf.md`](../docs/mapa_backend_monitor_irpf.md) | Mapa de rotas e serviços FastAPI |
| [`../docs/mapa_frontend_monitor_irpf.md`](../docs/mapa_frontend_monitor_irpf.md) | Mapa de componentes React |

---

*MONITOR_IRPF — Advanced Agentic Coding Team 2026*
