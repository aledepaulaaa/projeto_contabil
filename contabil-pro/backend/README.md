# ☕ CONTABIL_PRO — Backend (Java 21 + Spring Boot 3)

API REST principal do ecossistema **CONTABIL_PRO**. Parte do [Projeto Contábil](../README.md).

---

## 🏛️ Arquitetura: Clean Architecture Multi-tenant

```
backend/
├── core/              → Domínio puro (Entidades, Value Objects, Regras de Negócio)
│   └── domain/        → Lead, Cliente, Rotina, Alvará, Processo...
├── application/       → Use Cases (orquestração de fluxos)
│   └── usecases/      → FinalizarOnboardingUseCase, GerarGuiaUseCase...
├── ports/             → Interfaces (contratos entre camadas)
│   ├── input/         → InputPorts (chamadas da interface → aplicação)
│   └── output/        → OutputPorts (aplicação → infra)
└── infrastructure/    → Implementações concretas
    ├── persistence/   → JPA Repositories, Hibernate Envers (auditoria)
    ├── web/           → Controllers REST, DTOs, Mappers
    └── integrations/  → ZapSign, Conta Azul, Asaas, SERPRO, WhatsApp
```

**Multi-tenancy**: Isolamento lógico por `empresa_locataria_id` via `TenantIdentifierResolver`. Dados de diferentes escritórios nunca se cruzam.

---

## 🚀 Módulos de Negócio

| Módulo | Descrição |
|---|---|
| **CRM & Leads** | Pipeline Kanban, qualificação, histórico JSONB, notificações via WhatsApp |
| **Onboarding** | Fluxo de ativação: proposta → assinatura (ZapSign) → cliente ativo |
| **Motor de Rotinas** | Geração de guias (DAS, FGTS, ISS, IRPF) por regime tributário via padrão **Strategy** |
| **Alvarás & Licenças** | Monitoramento de vencimentos; vencimento dispara abertura automática de processo |
| **Processos** | Gestão de processos administrativos com rastreabilidade de etapas |
| **Cobranças** | Webhook Asaas — liberação de features por plano pago |
| **SERPRO** | Autenticação mTLS (SAPI) + Consulta Renda PF via Compartilha Receita Federal |

---

## 🛡️ Qualidade e Resiliência

| Aspecto | Implementação |
|---|---|
| **Segurança** | Argon2 para senhas via `DelegatingPasswordEncoder` |
| **Auditoria** | Spring Data Envers em todas as tabelas de negócio |
| **Circuit Breaker** | Resilience4j em todas as integrações externas |
| **API Auto-descritiva** | Spring HATEOAS com links de navegação dinâmica |
| **Histórico LGPD** | Timeline do Lead persistida como JSONB para auditoria imutável |

---

## 🛠️ Stack

| Categoria | Tecnologia |
|---|---|
| Linguagem | Java 21 |
| Framework | Spring Boot 3.x |
| Persistência | Spring Data JPA, Hibernate, PostgreSQL 16 |
| Auditoria | Spring Data Envers |
| Resiliência | Resilience4j (Circuit Breaker, Retry) |
| Mensageria | RabbitMQ (Spring AMQP) |
| Cache | Redis |
| Testes | JUnit 5, Mockito |

---

## 🔧 Como Executar

```bash
# 1. Subir infraestrutura
docker-compose up -d   # PostgreSQL + RabbitMQ + Redis

# 2. Iniciar backend
./mvnw spring-boot:run

# API disponível em: http://localhost:8080
```

---

## 🧪 Testes

```bash
./mvnw test                   # Todos os testes
./mvnw test -Dtest=NomeTest   # Teste específico
```

Cobertura obrigatória em todos os Use Cases e regras de domínio. Isolamento multi-tenant validado em testes de integração.

---

## 🔗 Integrações Externas

| Integração | Finalidade |
|---|---|
| **ZapSign** | Assinatura digital de contratos |
| **Conta Azul** | ERP contábil (OAuth 2.0) |
| **Asaas** | Pagamentos e cobranças |
| **SERPRO / SAPI** | Consulta Renda PF (mTLS com certificado A1) |
| **WhatsApp (via gateway)** | Notificações via fila RabbitMQ |

---

*CONTABIL_PRO Backend — Advanced Agentic Coding Team 2026*
