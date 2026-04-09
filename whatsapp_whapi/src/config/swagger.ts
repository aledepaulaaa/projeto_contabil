import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

/**
 * Configuração do Swagger/OpenAPI para documentação automática.
 * Acesso via: GET /api-docs
 */
const opcoes: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WhatsApp Whapi Gateway — API',
      version: '1.0.0',
      description: 'Gateway WhatsApp via Whapi Cloud para o Sistema Contábil SaaS. Provê endpoints de envio de mensagens, consulta de contatos, chats, mensagens e gerenciamento de grupos.',
      contact: {
        name: 'Projeto Contábil',
        email: 'suporte@projetocontabil.com'
      }
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Desenvolvimento' }
    ],
    tags: [
      { name: 'Status', description: 'Verificação de saúde e status do canal' },
      { name: 'Mensagens', description: 'Envio e consulta de mensagens' },
      { name: 'Contatos', description: 'Consulta de contatos WhatsApp' },
      { name: 'Chats', description: 'Consulta de chats/conversas' },
      { name: 'Grupos', description: 'Gerenciamento de grupos WhatsApp' }
    ]
  },
  apis: ['./src/controllers/*.ts']
};

const especificacaoSwagger = swaggerJsdoc(opcoes);

/**
 * Registra o Swagger UI no Express.
 */
export function configurarSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(especificacaoSwagger, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'WhatsApp Whapi Gateway — Docs'
  }));

  console.log('[Swagger] 📚 Documentação disponível em /api-docs');
}
