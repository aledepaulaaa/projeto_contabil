import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { criarStatusControlador } from '../../src/controllers/StatusControlador.js';
import { criarMensagemControlador } from '../../src/controllers/MensagemControlador.js';
import { criarContatoControlador } from '../../src/controllers/ContatoControlador.js';
import { criarChatControlador } from '../../src/controllers/ChatControlador.js';
import { criarGrupoControlador } from '../../src/controllers/GrupoControlador.js';
import { EnviarMensagemUseCase } from '../../src/use-cases/EnviarMensagemUseCase.js';
import { EnviarDocumentoUseCase } from '../../src/use-cases/EnviarDocumentoUseCase.js';
import { ObterMensagensUseCase } from '../../src/use-cases/ObterMensagensUseCase.js';
import { ObterContatosUseCase } from '../../src/use-cases/ObterContatosUseCase.js';
import { ObterChatUseCase } from '../../src/use-cases/ObterChatUseCase.js';
import { GerenciarGrupoUseCase } from '../../src/use-cases/GerenciarGrupoUseCase.js';
import { ProvedorWhatsApp } from '../../src/core/portas/ProvedorWhatsApp.js';

/**
 * Testes de Integração — Controladores Express
 * Valida endpoints HTTP com mock do provedor.
 */
describe('Controladores — Integração HTTP', () => {

  const provedorMock: ProvedorWhatsApp = {
    enviarMensagem: vi.fn().mockResolvedValue({ sucesso: true, idMensagem: 'MSG-TEST', timestamp: Date.now() }),
    enviarDocumento: vi.fn().mockResolvedValue({ sucesso: true, idMensagem: 'DOC-TEST' }),
    obterContatos: vi.fn().mockResolvedValue({ itens: [{ id: '123', nome: 'Teste' }], contagem: 1, offset: 0 }),
    obterContatoPorId: vi.fn().mockResolvedValue({ id: '123', nome: 'Teste' }),
    obterChats: vi.fn().mockResolvedValue({ itens: [{ id: 'chat1', nome: 'Chat Teste' }], contagem: 1, offset: 0 }),
    obterChatPorId: vi.fn().mockResolvedValue({ id: 'chat1', nome: 'Chat Teste' }),
    obterMensagens: vi.fn().mockResolvedValue({ itens: [], contagem: 0, offset: 0 }),
    obterMensagensPorChatId: vi.fn().mockResolvedValue({ itens: [], contagem: 0, offset: 0 }),
    criarGrupo: vi.fn().mockResolvedValue({ sucesso: true, grupoId: 'GRP-TEST' }),
    adicionarParticipanteGrupo: vi.fn().mockResolvedValue({ sucesso: true }),
    obterGrupos: vi.fn().mockResolvedValue({ itens: [], contagem: 0, offset: 0 }),
    verificarSaude: vi.fn().mockResolvedValue({ status: { codigo: 200, texto: 'AUTH' }, uptime: 3600 }),
    obterQR: vi.fn().mockResolvedValue('QR_CODE_MOCK'),
  };

  const app = express();
  app.use(express.json());

  // Instanciar use cases com provedor mock
  const enviarMsg = new EnviarMensagemUseCase(provedorMock);
  const enviarDoc = new EnviarDocumentoUseCase(provedorMock);
  const obterMsgs = new ObterMensagensUseCase(provedorMock);
  const obterContatos = new ObterContatosUseCase(provedorMock);
  const obterChat = new ObterChatUseCase(provedorMock);
  const gerenciarGrupo = new GerenciarGrupoUseCase(provedorMock);

  // Registrar rotas
  app.use('/api/whatsapp', criarStatusControlador(provedorMock));
  app.use('/api/whatsapp', criarMensagemControlador(enviarMsg, enviarDoc, obterMsgs));
  app.use('/api/whatsapp', criarContatoControlador(obterContatos));
  app.use('/api/whatsapp', criarChatControlador(obterChat));
  app.use('/api/whatsapp', criarGrupoControlador(gerenciarGrupo));

  // === STATUS ===
  it('GET /api/whatsapp/status → retorna status do canal', async () => {
    const res = await request(app).get('/api/whatsapp/status');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
    expect(res.body.provider).toBe('whapi');
  });

  it('GET /api/whatsapp/qr → retorna dados do QR Code', async () => {
    const res = await request(app).get('/api/whatsapp/qr');
    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('whapi');
    expect(res.body.qr).toBe('QR_CODE_MOCK');
  });

  // === MENSAGENS ===
  it('POST /api/whatsapp/messages/send → envia mensagem com sucesso', async () => {
    const res = await request(app)
      .post('/api/whatsapp/messages/send')
      .send({ to: '5511999999999', message: 'Teste integração' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.messageId).toBe('MSG-TEST');
  });

  it('POST /api/whatsapp/messages/send → retorna 400 sem parâmetros', async () => {
    const res = await request(app)
      .post('/api/whatsapp/messages/send')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/whatsapp/messages/send-document → envia documento', async () => {
    const res = await request(app)
      .post('/api/whatsapp/messages/send-document')
      .send({ to: '5511999999999', fileUrl: 'https://x.com/doc.pdf', fileName: 'Doc.pdf' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/whatsapp/messages → lista mensagens', async () => {
    const res = await request(app).get('/api/whatsapp/messages');
    expect(res.status).toBe(200);
    expect(res.body.itens).toBeDefined();
  });

  // === CONTATOS ===
  it('GET /api/whatsapp/contacts → lista contatos', async () => {
    const res = await request(app).get('/api/whatsapp/contacts');
    expect(res.status).toBe(200);
    expect(res.body.itens).toHaveLength(1);
  });

  it('GET /api/whatsapp/contacts/:id → busca contato', async () => {
    const res = await request(app).get('/api/whatsapp/contacts/123');
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Teste');
  });

  // === CHATS ===
  it('GET /api/whatsapp/chats → lista chats', async () => {
    const res = await request(app).get('/api/whatsapp/chats');
    expect(res.status).toBe(200);
    expect(res.body.itens).toHaveLength(1);
  });

  it('GET /api/whatsapp/chats/:id → busca chat', async () => {
    const res = await request(app).get('/api/whatsapp/chats/chat1');
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Chat Teste');
  });

  // === GRUPOS ===
  it('POST /api/whatsapp/groups → cria grupo', async () => {
    const res = await request(app)
      .post('/api/whatsapp/groups')
      .send({ subject: 'Grupo Teste', participants: ['5511999999999'] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.groupId).toBe('GRP-TEST');
  });

  it('GET /api/whatsapp/groups → lista grupos', async () => {
    const res = await request(app).get('/api/whatsapp/groups');
    expect(res.status).toBe(200);
    expect(res.body.itens).toBeDefined();
  });

  it('POST /api/whatsapp/groups/:id/participants → adiciona participante', async () => {
    const res = await request(app)
      .post('/api/whatsapp/groups/GRP-001/participants')
      .send({ participantId: '5511999999999' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
