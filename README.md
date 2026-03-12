Repositório de um projeto contábil para um Software em construção.
# Accounting System - Enterprise Core 2026

## 🎯 Objetivo
Sistema de contabilidade escalável focado em automação de rotinas, CRM e gestão de alvarás.

## 🏛️ Princípios de Engenharia
- **Arquitetura:** Clean Architecture (Domain, Application, Infrastructure, Interface).
- **Metodologia:** TDD (Red-Green-Refactor) e BDD.
- **Padrões:** SOLID, DRY, KISS e YAGNI.
- **Comunicação:** Assíncrona via RabbitMQ para tarefas de background (Envios de WhatsApp/Contratos).

## 🛠️ Stack Tecnológica
- **Backend:** Java 21+, Spring Boot 3.x, Spring Data JPA, Spring HATEOAS.
- **Mensageria:** RabbitMQ (Broker para Cronjobs e notificações).
- **Banco de Dados:** PostgreSQL (Relacional) + Redis (Cache de requisições).
- **Frontend:** React (Vite), TypeScript, TailwindCSS, Framer Motion, Zustand.
- **Infra:** Docker, Kubernetes (K8s), Firebase (FCM para Push Notifications).

## 🚀 Como Executar (Local)
1. `docker-compose up -d` (PostgreSQL, RabbitMQ, Redis).
2. `./mvnw spring-boot:run` (Backend).
3. `npm run dev` (Frontend).