# Plano de Escalonamento SaaS Multi-tenant — MONITOR_IRPF

Este documento descreve a estratégia de engenharia recomendada para transicionar o MVP do **MONITOR_IRPF** de um modelo de banco local de tenant único (SQLite) para uma infraestrutura SaaS escalável multi-tenant, permitindo que vários escritórios de contabilidade utilizem a plataforma de forma isolada e segura.

---

## 1. Arquitetura de Rede & Banco de Dados

Atualmente, o sistema utiliza SQLite (`data/irpf_carteira.db`). Para escala de produção SaaS, o banco de dados deve ser migrado para o **PostgreSQL 16** (conforme já provisionado no contêiner do `docker-compose.yaml` do repositório).

### Isolamento de Dados (Tabelas Compartilhadas - Shared Schema)
A abordagem recomendada é o isolamento por chave (`tenant_id` ou `empresa_id`) em todas as tabelas transacionais e de cadastros, garantindo que os dados nunca se cruzem.

```sql
-- Exemplo de tabela de configurações de integração com isolamento por Tenant
CREATE TABLE tenant_integracoes_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    provedor VARCHAR(50) NOT NULL, -- 'CONTA_AZUL', 'ASAAS', 'SERPRO'
    config_json TEXT NOT NULL,      -- JSON criptografado com credenciais
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_provedor UNIQUE (tenant_id, provedor)
);

CREATE INDEX idx_tenant_integracao ON tenant_integracoes_config(tenant_id);
```

---

## 2. Injeção de Contexto Multi-tenant no FastAPI

Para garantir que o backend FastAPI identifique qual contador/escritório está requisitando a ação, utilizaremos a biblioteca nativa do Python `contextvars` associada a uma Dependência do FastAPI:

```python
import contextvars
from fastapi import Request, Depends, HTTPException

# Variável de contexto assíncrona para isolamento de thread/task
tenant_context = contextvars.ContextVar("tenant_id")

def obter_tenant_id(request: Request):
    tenant_id = request.headers.get("X-Tenant-Id")
    if not tenant_id:
        # Em produção, este valor é extraído diretamente do JWT descodificado
        raise HTTPException(status_code=401, detail="Header X-Tenant-Id ausente.")
    
    token = tenant_context.set(tenant_id)
    try:
        yield tenant_id
    finally:
        tenant_context.reset(token)
```

Toda query executada por meio do SQLAlchemy deve injetar automaticamente um filtro baseado em `tenant_context.get()`.

---

## 3. Segurança e Criptografia em Repouso

Dado que a aplicação persistirá credenciais sensíveis (Client Secrets, API Keys do Asaas e Chaves Privadas RSA do eCNPJ do SERPRO), o banco de dados **não** deve guardar esses valores em texto puro.

1. **Cifragem AES-GCM-256**: No backend, criar um serviço utilitário de criptografia.
2. **Chave Mestra Global**: Definir a variável de ambiente `APP_ENCRYPTION_KEY` nos servidores da Render/Docker.
3. **Cifragem de Payload**:
   * Toda gravação de credenciais na tabela `tenant_integracoes_config` deve encriptar o campo `config_json` antes do `INSERT`/`UPDATE`.
   * A decodificação ocorre estritamente em memória durante a montagem das chamadas de API externas.

---

## 4. Roteiro de Migração da Infraestrutura (Docker-compose)

Para habilitar e testar o ambiente em escala local:
1. **Adicionar o Serviço MONITOR_IRPF ao Docker**:
   ```yaml
   monitor-irpf-backend:
     build: ./MONITOR_IRPF/backend
     container_name: irpf-api
     ports:
       - "8000:8000"
     environment:
       - DATABASE_URL=postgresql://admin:password@postgres:5432/accounting_saas
       - APP_ENCRYPTION_KEY=super_secret_aes_key_32_bytes_len
     depends_on:
       - postgres
       - rabbitmq
       - redis
   ```
2. **Gerenciamento de Migrações**: Adicionar **Alembic** ao backend Python para controle de versionamento de tabelas e schema, equivalente ao Flyway utilizado no backend Java do Projeto Contábil.

---

## 5. Integração com Serviços de Infraestrutura do Projeto Contábil

Conforme configurado no [docker-compose.yaml](file:///e:/projeto_contabil/docker-compose.yaml) da raiz, a infraestrutura compartilhada já possui os contêineres necessários para suportar a escalabilidade do **MONITOR_IRPF**:

### A. Banco de Dados Centralizado (PostgreSQL: `accounting-db`)
* **Uso**: Substituição do SQLite (`irpf_carteira.db`) por um esquema dedicado ou banco compartilhado no PostgreSQL 16.
* **Multi-tenancy**: Adição do campo `tenant_id` ou `empresa_id` em todas as tabelas (conforme descrito na Seção 1) e aplicação de filtros dinâmicos no SQLAlchemy (ou ativação de RLS - *Row Level Security* no PostgreSQL).
* **Conectividade**: O backend FastAPI se conecta via `DATABASE_URL=postgresql://admin:password@postgres:5432/accounting_saas`.

### B. Cache e Controle de Concorrência (Redis: `accounting-cache`)
* **Uso**: Armazenamento de cache de curta duração para tokens de acesso de APIs externas (como tokens de sessão SAPI do SERPRO e tokens de autenticação Conta Azul).
* **Benefício**: Evita chamadas repetidas de autenticação às APIs externas, diminuindo o consumo de banda, custos de requisição e prevenindo bloqueios por limite de taxa (*rate limiting*).
* **Implementação**: Uso da biblioteca `redis-py` ou pacotes como `fastapi-cache2`.
* **Multi-tenancy**: Chaves de cache prefixadas com o `tenant_id` (ex: `tenant:{tenant_id}:serpro_token`).

### C. Execução Assíncrona e Background Jobs (RabbitMQ: `accounting-mq`)
* **Uso**: Processamento em segundo plano de consultas pesadas de IRPF no e-CAC/SERPRO.
* **Benefício**: Como as APIs do SERPRO e diagnósticos fiscais da RFB podem demorar segundos ou minutos, as requisições HTTP do frontend não devem ficar aguardando de forma síncrona.
* **Implementação**: Integração com **Celery** no backend FastAPI, apontando para o RabbitMQ (`amqp://guest:guest@rabbitmq:5672//`) como message broker.
* **Processamento**: O usuário solicita uma consulta pelo painel, a rota enfileira a tarefa assíncrona com seu respectivo `tenant_id`, e workers processam a fila de forma distribuída, atualizando o status no banco de dados.

### D. Armazenamento de Certificados Digitais (MinIO: `accounting-storage`)
* **Uso**: Persistência duradoura e isolada dos arquivos `.pfx`/`.p12` enviados pelos contadores de cada tenant.
* **Benefício**: Em ambientes de nuvem efêmeros (como Render ou contêineres Docker replicados), os arquivos não podem ser salvos no sistema de arquivos local de forma estática.
* **Implementação**: Integração com SDK do MinIO (`boto3` ou `minio-py`) usando as credenciais do `accounting-storage` (porta `9000`).
* **Multi-tenancy**: Armazenamento de cada certificado sob uma estrutura de diretórios baseada no ID do Tenant (ex: `/certificados/{tenant_id}/contador_cert.pfx`), encriptados em repouso no próprio bucket.
