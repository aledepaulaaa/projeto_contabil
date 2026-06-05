# 📱 CONTABIL_PRO — Gateway WhatsApp (Node.js + Whapi Cloud)

Microsserviço de mensageria WhatsApp para o ecossistema **CONTABIL_PRO**. Parte do [Projeto Contábil](../README.md).

---

## 🎯 Propósito

Gateway responsável por enviar e receber mensagens de WhatsApp em nome dos escritórios de contabilidade, integrando-se ao backend Java via fila **RabbitMQ** e disponibilizando uma API REST para o frontend.

**Casos de uso:**
- Notificação de leads e clientes sobre status de processos
- Envio de documentos (contratos, DARFs, guias)
- Notificações de vencimento de alvarás
- Confirmação de assinaturas digitais (ZapSign)

---

## 🏛️ Arquitetura: Clean Architecture

```
whatsapp_whapi/
├── core/
│   └── portas/           → Interface ProvedorWhatsApp (contrato abstrato)
├── use-cases/            → Regras de negócio (enviar, obter, gerenciar)
├── infra/
│   ├── whapi/            → Implementação concreta: Whapi Cloud API
│   └── mensageria/       → Consumer RabbitMQ (fila q.whatsapp.envio)
├── controllers/          → Endpoints Express REST
└── config/               → Ambiente (.env) + Swagger UI
```

---

## 🛠️ Stack

| Categoria | Tecnologia |
|---|---|
| Runtime | Node.js 20+ |
| Linguagem | TypeScript |
| Framework | Express.js |
| Mensageria | RabbitMQ (amqplib) |
| API WhatsApp | Whapi Cloud API |
| Testes | Vitest |
| Documentação | Swagger / OpenAPI |

---

## ⚙️ Configuração

```bash
cd whatsapp_whapi
npm install
cp .env.example .env  # Preencher com suas credenciais
```

**Variáveis de ambiente:**

```env
WHAPI_BASE_URL=https://gate.whapi.cloud/
WHAPI_API_TOKEN=SEU_TOKEN_AQUI
BACKEND_WEBHOOK_URL=http://localhost:8080/api/whatsapp/webhook
RABBITMQ_URL=amqp://guest:guest@localhost:5672
PORT=3001
```

> Obtenha o token Whapi em [panel.whapi.cloud](https://panel.whapi.cloud)

---

## 🚀 Executar

```bash
npm run dev      # Desenvolvimento (nodemon + tsx)
npm run build    # Compilar TypeScript
npm start        # Produção
```

---

## 🧪 Testes

```bash
npm test            # Todos os testes (Vitest)
npm run test:watch  # Watch mode
```

---

## 📡 Endpoints REST

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/whatsapp/status` | Status do canal WhatsApp |
| `GET` | `/api/whatsapp/qr` | Info de autenticação QR Code |
| `POST` | `/api/whatsapp/messages/send` | Enviar mensagem de texto |
| `POST` | `/api/whatsapp/messages/send-document` | Enviar documento/arquivo |
| `GET` | `/api/whatsapp/messages` | Listar mensagens recentes |
| `GET` | `/api/whatsapp/messages/:chatId` | Mensagens de um chat específico |
| `GET` | `/api/whatsapp/contacts` | Listar contatos |
| `GET` | `/api/whatsapp/contacts/:id` | Contato por ID |
| `GET` | `/api/whatsapp/chats` | Listar chats |
| `POST` | `/api/whatsapp/groups` | Criar grupo |
| `POST` | `/api/whatsapp/groups/:id/participants` | Adicionar participante |

**Swagger UI:** `http://localhost:3001/api-docs`

---

## 🔗 Integração com o Ecossistema

```
[Backend Java] → publica em fila RabbitMQ (q.whatsapp.envio)
      ↓
[Gateway WhatsApp] → Consumer processa → Whapi Cloud API → WhatsApp
      ↓
[Webhook] → Backend Java recebe confirmações e status
```

---

*CONTABIL_PRO WhatsApp Gateway — Advanced Agentic Coding Team 2026*
