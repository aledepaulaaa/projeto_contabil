# 🏢 Projeto Contábil — Ecossistema SaaS Multi-Tenant

Repositório principal do ecossistema de software para automação contábil, desenvolvido com arquitetura Clean Architecture, multi-tenancy e integração com APIs governamentais brasileiras.

---

## 📦 Aplicações

### 1. 🟦 CONTABIL_PRO
> Plataforma principal SaaS para escritórios de contabilidade.

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, Vite 6, TypeScript, TailwindCSS, Framer Motion, Zustand |
| Backend | Java 21, Spring Boot 3.x, Spring Data JPA, Hibernate Envers, Resilience4j |
| Gateway WhatsApp | Node.js 20, TypeScript, Express, Whapi Cloud API, RabbitMQ Consumer |

**Diretórios:**
- [`frontend/`](./frontend) — Interface SaaS Premium (React + Vite)
- [`backend/`](./backend) — API REST Core (Java + Spring Boot)
- [`whatsapp_whapi/`](./whatsapp_whapi) — Gateway de mensagens WhatsApp (Node.js)

**Funcionalidades:**
- CRM de Leads com timeline e Kanban
- Onboarding de clientes com assinatura digital (ZapSign)
- Motor de Rotinas fiscais (DAS, FGTS, ISS, IRPF)
- Alvarás & Licenças com monitoramento de vencimentos
- Gestão de Processos administrativos
- Precificação e geração de cobranças (Asaas)
- Consulta Renda SERPRO (via Compartilha Receita Federal)
- Módulo de Relatórios e Insights com IA contextual

---

### 2. 🟩 MONITOR_IRPF
> Sub-aplicação especializada para gestão da carteira de declarações de IRPF de um escritório.

| Camada | Tecnologia |
|---|---|
| Frontend | React, Vite, TypeScript, Vanilla CSS |
| Backend | Python 3.12, FastAPI, SQLAlchemy, SQLite (Render Disk) |

**Diretório:** [`MONITOR_IRPF/`](./MONITOR_IRPF)

**Funcionalidades:**
- Monitoramento de declarações de IRPF por CPF e ano-calendário
- Integração com Receita Federal / InfoSimples (diagnóstico fiscal, malha, restituições)
- Consulta de Renda via API SERPRO (com token de demonstração e modo produção)
- Mensagens do e-CAC por contribuinte
- Emissão e gestão de DARFs
- Gestão de clientes da carteira com precificação
- Geração de cobranças de honorários (Asaas)
- Integração com ERP Conta Azul (OAuth 2.0)
- Configuração de credenciais do Contador (certificado A1 PFX, SERPRO SAPI)

---

## 🏗️ Infraestrutura Compartilhada

Gerenciada via [`docker-compose.yaml`](./docker-compose.yaml):

| Serviço | Imagem | Porta | Uso |
|---|---|---|---|
| `accounting-db` | PostgreSQL 16 | 5432 | Banco principal do CONTABIL_PRO |
| `accounting-pgadmin` | pgAdmin 4 | 5050 | Administração do banco |
| `accounting-mq` | RabbitMQ 3 | 5672 / 15672 | Fila de mensagens assíncronas |
| `accounting-cache` | Redis 7 | 6379 | Cache de tokens e sessões |
| `accounting-storage` | MinIO | 9000 / 9001 | Armazenamento de certificados e documentos |

```bash
# Subir toda a infraestrutura
docker-compose up -d
```

---

## 📐 Princípios de Engenharia

- **Clean Architecture**: `core` (Domínio) → `ports` (Interfaces) → `infra` (Implementações)
- **Multi-tenancy**: Isolamento estrito por `tenant_id` / `empresa_id`
- **TDD Obrigatório**: Red-Green-Refactor em todo novo código de negócio
- **DRY**: Lógica de negócio nunca duplicada; componentes reusáveis
- **LGPD**: Consentimento ativo do titular obrigatório para acesso a dados fiscais via SERPRO

---

## 📂 Documentação Técnica

Todos os relatórios técnicos estão em [`docs/`](./docs):

| Arquivo | Conteúdo |
|---|---|
| `historico_backend.md` | Histórico de alterações do backend Java (CONTABIL_PRO) |
| `historico_frontend.md` | Histórico de alterações do frontend React (CONTABIL_PRO) |
| `historico_backend_monitor_irpf.md` | Histórico do backend Python (MONITOR_IRPF) |
| `historico_frontend_monitor_irpf.md` | Histórico do frontend React (MONITOR_IRPF) |
| `mapa_backend.md` | Mapa de rotas e serviços do backend Java |
| `mapa_frontend.md` | Mapa de componentes do frontend (CONTABIL_PRO) |
| `mapa_backend_monitor_irpf.md` | Mapa do backend FastAPI (MONITOR_IRPF) |
| `mapa_frontend_monitor_irpf.md` | Mapa dos componentes React (MONITOR_IRPF) |
| `plano_escalabilidade_monitor_IRPF.md` | Estratégia de migração para PostgreSQL multi-tenant |

---

*Mantido pelo time de Advanced Agentic Coding — 2026*