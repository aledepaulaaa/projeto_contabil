# ☕ Backend Core: Accounting Enterprise SaaS (Java 21 & Spring Boot 3)

## 🏛️ 1. Arquitetura e Filosofia de Engenharia
Sistema **SaaS Multi-tenant** baseado em **Clean Architecture**. O isolamento entre a lógica de negócio contábil e a infraestrutura é absoluto.

* **Domain Layer (Core)**: Entidades puras e Regras de Negócio imutáveis.
* **Application Layer (Use Cases)**: Orquestração de fluxos (ex: `FinalizarOnboardingUseCase`).
* **Infrastructure Layer**: Implementações de persistência, APIs (ZapSign, Conta Azul, Z-API) e Gateways.
* **Multi-tenancy**: Isolamento lógico via `TenantIdentifierResolver` no PostgreSQL. Dados de diferentes escritórios nunca se cruzam.

## 🚀 2. Módulos e Fluxo de Negócio (Interconectividade)
Os módulos operam de forma interligada, onde a saída de um é o gatilho (trigger) do outro.

1.  **CRM & Onboarding**: Lead -> Qualificação -> Assinatura (ZapSign) -> Ativação de Cliente.
2.  **Motor de Rotinas**: Geração de guias (DAS, FGTS, ISS) baseada no Regime Tributário via padrão **Strategy**.
3.  **Alvarás & Processos**: Monitoramento de datas. O vencimento de um alvará dispara automaticamente a abertura de um processo de renovação.

## 🛡️ 3. Implementações Bulletproof & SaaS
* **Pagamentos**: Integração via Webhooks (Stripe/ASAAS). Liberação reativa de features baseada no plano.
* **Resiliência**: **Resilience4j** com Circuit Breaker em todas as integrações externas.
* **Auditoria**: **Spring Data Envers** para rastreabilidade total de alterações fiscais.
* **HATEOAS**: API auto-descritiva com links de navegação dinâmica.

## 🔧 4. Recomendações Adicionais de Desenvolvimento
* **Comunicação entre Módulos (Domain Events)**: Utilizar `ApplicationEventPublisher` do Spring. Quando um alvará vence, o módulo de Alvarás emite um `AlvaraVencidoEvent`. O módulo de Processos escuta esse evento e inicia o workflow de renovação sem acoplamento direto de classes.
* **Dica de Performance**: Implementar **Connection Pooling (HikariCP)** ajustado e índices parciais no PostgreSQL para consultas de "obrigações pendentes", garantindo respostas rápidas mesmo com milhões de registros.
* **IA Contextual**: O serviço de IA deve receber um "Context Snapshot" do Tenant (Regime, pendências, histórico) para que o assistente não apenas responda dúvidas, mas sugira ações proativas baseadas em dados reais.