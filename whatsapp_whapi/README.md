# 🚀 WhatsApp Whapi Gateway

Gateway de WhatsApp via **Whapi Cloud API** para o Sistema Contábil SaaS (Multi-tenant).

## Arquitetura

```
Clean Architecture + SOLID + DIP
├── core/portas/    → Interface ProvedorWhatsApp (contrato)
├── use-cases/      → Regras de negócio (enviar, obter, gerenciar)
├── infra/whapi/    → Implementação Whapi Cloud  
├── infra/mensageria/ → Consumer RabbitMQ
├── controllers/    → Endpoints Express REST
└── config/         → Ambiente + Swagger
```

## Pré-requisitos

- **Node.js** 20+ 
- **RabbitMQ** rodando em `localhost:5672`
- **Token Whapi** — obter em [panel.whapi.cloud](https://panel.whapi.cloud)

## Instalação

```bash
cd whatsapp_whapi
npm install
```

## Configuração

Copie `.env.example` para `.env` e preencha:

```env
WHAPI_BASE_URL=https://gate.whapi.cloud/
WHAPI_API_TOKEN=SEU_TOKEN_AQUI
BACKEND_WEBHOOK_URL=http://localhost:8080/api/whatsapp/webhook
RABBITMQ_URL=amqp://guest:guest@localhost:5672
PORT=3001
```

## Executar

```bash
npm run dev      # Desenvolvimento (nodemon + tsx)
npm run build    # Compilar TypeScript
npm start        # Produção
```

## Testes

```bash
npm test         # Executa todos os testes (Vitest)
npm run test:watch  # Watch mode
```

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/whatsapp/status` | Status do canal |
| GET | `/api/whatsapp/qr` | Info autenticação |
| POST | `/api/whatsapp/messages/send` | Enviar mensagem texto |
| POST | `/api/whatsapp/messages/send-document` | Enviar documento |
| GET | `/api/whatsapp/messages` | Listar mensagens |
| GET | `/api/whatsapp/messages/:chatId` | Mensagens por chat |
| GET | `/api/whatsapp/contacts` | Listar contatos |
| GET | `/api/whatsapp/contacts/:id` | Contato por ID |
| GET | `/api/whatsapp/chats` | Listar chats |
| GET | `/api/whatsapp/chats/:id` | Chat por ID |
| GET | `/api/whatsapp/groups` | Listar grupos |
| POST | `/api/whatsapp/groups` | Criar grupo |
| POST | `/api/whatsapp/groups/:id/participants` | Adicionar participante |

## Documentação Swagger

Acesse: `http://localhost:3001/api-docs`

## Integração

- **Backend Java** → Publica na fila `q.whatsapp.envio` via `WhatsAppProducer.java`
- **Frontend React** → Conecta via HTTP e Socket.IO na porta 3001
- **RabbitMQ** → Consumer processa mensagens automaticamente
