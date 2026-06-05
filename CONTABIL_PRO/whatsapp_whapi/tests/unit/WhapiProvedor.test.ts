import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { WhapiProvedor } from '../../src/infra/whapi/WhapiProvedor.js';

/**
 * Testes Unitários — WhapiProvedor
 * Valida que as chamadas HTTP são feitas corretamente para a API Whapi.
 * 
 * Estratégia: Espionar axios.create para capturar a instância interna
 * e mockar seus métodos (get, post, put).
 */
describe('WhapiProvedor', () => {

  // Mock da instância axios retornada por axios.create
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const mockPut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Espionar axios.create para retornar nossa instância mock
    vi.spyOn(axios, 'create').mockReturnValue({
      get: mockGet,
      post: mockPost,
      put: mockPut,
      defaults: { headers: { common: {} } },
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
    } as any);
  });

  const criarProvedor = () => new WhapiProvedor('TOKEN_TESTE', 'https://gate.whapi.cloud');

  it('deve criar instância axios com headers de autenticação', () => {
    criarProvedor();

    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: 'https://gate.whapi.cloud',
      headers: expect.objectContaining({
        'Authorization': 'Bearer TOKEN_TESTE',
        'Content-Type': 'application/json'
      })
    }));
  });

  it('deve enviar mensagem com formato correto para /messages/text', async () => {
    mockPost.mockResolvedValue({
      data: { message: { id: 'MSG-789' } }
    });
    const provedor = criarProvedor();

    const resultado = await provedor.enviarMensagem('5511999999999', 'Olá mundo');

    expect(mockPost).toHaveBeenCalledWith('/messages/text', {
      typing_time: 2,
      to: '5511999999999@s.whatsapp.net',
      body: 'Olá mundo'
    });
    expect(resultado.sucesso).toBe(true);
    expect(resultado.idMensagem).toBe('MSG-789');
  });

  it('deve enviar documento com formato correto para /messages/document', async () => {
    mockPost.mockResolvedValue({
      data: { message: { id: 'DOC-456' } }
    });
    const provedor = criarProvedor();

    const resultado = await provedor.enviarDocumento('5511999999999', 'https://x.com/doc.pdf', 'Contrato.pdf');

    expect(mockPost).toHaveBeenCalledWith('/messages/document', {
      to: '5511999999999@s.whatsapp.net',
      media: 'https://x.com/doc.pdf',
      caption: 'Contrato.pdf'
    });
    expect(resultado.sucesso).toBe(true);
  });

  it('deve preservar sufixo @s.whatsapp.net quando já presente', async () => {
    mockPost.mockResolvedValue({ data: { message: { id: 'MSG-X' } } });
    const provedor = criarProvedor();

    await provedor.enviarMensagem('5511999999999@s.whatsapp.net', 'Teste');

    expect(mockPost).toHaveBeenCalledWith('/messages/text', expect.objectContaining({
      to: '5511999999999@s.whatsapp.net'
    }));
  });

  it('deve retornar erro quando envio de mensagem falha', async () => {
    mockPost.mockRejectedValue({
      response: { data: { error: { message: 'Token expirado' } } },
      message: 'Request failed'
    });
    const provedor = criarProvedor();

    const resultado = await provedor.enviarMensagem('123', 'Teste');

    expect(resultado.sucesso).toBe(false);
    expect(resultado.erro).toBe('Token expirado');
  });

  it('deve verificar saúde via GET /health', async () => {
    mockGet.mockResolvedValue({
      data: {
        channel_id: 'CH-001',
        start_at: 1234567890,
        uptime: 3600,
        status: { code: 200, text: 'AUTH' }
      }
    });
    const provedor = criarProvedor();

    const saude = await provedor.verificarSaude();

    expect(saude.canalId).toBe('CH-001');
    expect(saude.status.texto).toBe('AUTH');
    expect(mockGet).toHaveBeenCalledWith('/health');
  });

  it('deve obter contatos via GET /contacts com paginação', async () => {
    mockGet.mockResolvedValue({
      data: {
        contacts: [{ id: '5511999999999', name: 'João', is_business: false }],
        total: 1
      }
    });
    const provedor = criarProvedor();

    const resultado = await provedor.obterContatos(10, 0);

    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0].nome).toBe('João');
    expect(mockGet).toHaveBeenCalledWith('/contacts', { params: { count: 10, offset: 0 } });
  });

  it('deve criar grupo via POST /groups', async () => {
    mockPost.mockResolvedValue({
      data: { group_id: 'GRP-001' }
    });
    const provedor = criarProvedor();

    const resultado = await provedor.criarGrupo('Equipe', ['5511999999999']);

    expect(resultado.sucesso).toBe(true);
    expect(resultado.grupoId).toBe('GRP-001');
    expect(mockPost).toHaveBeenCalledWith('/groups', {
      subject: 'Equipe',
      participants: ['5511999999999@s.whatsapp.net']
    });
  });

  it('deve adicionar participante via PUT /groups/{id}/participants', async () => {
    mockPut.mockResolvedValue({ data: {} });
    const provedor = criarProvedor();

    const resultado = await provedor.adicionarParticipanteGrupo('GRP-001', '5511999999999');

    expect(resultado.sucesso).toBe(true);
    expect(mockPut).toHaveBeenCalledWith('/groups/GRP-001/participants', {
      participants: ['5511999999999@s.whatsapp.net']
    });
  });

  it('deve obter mensagens via GET /messages/list', async () => {
    mockGet.mockResolvedValue({
      data: {
        messages: [{ id: 'MSG-1', chat_id: 'c1', from_me: true, timestamp: 123, text: { body: 'Olá' } }],
        total: 1
      }
    });
    const provedor = criarProvedor();

    const resultado = await provedor.obterMensagens(50, 0);

    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0].texto).toBe('Olá');
    expect(mockGet).toHaveBeenCalledWith('/messages/list', { params: { count: 50, offset: 0 } });
  });

  it('deve obter QR Code via GET /users/login', async () => {
    mockGet.mockResolvedValue({
      data: {
        status: 'OK',
        rowdata: 'QR_CODE_DATA_TEST',
        base64: 'BASE64_IMAGE'
      }
    });
    const provedor = criarProvedor();

    const qr = await provedor.obterQR();

    expect(qr).toBe('QR_CODE_DATA_TEST');
    expect(mockGet).toHaveBeenCalledWith('/users/login');
  });

  it('deve obter QR Code quando status é WAITING mas tem rowdata', async () => {
    mockGet.mockResolvedValue({
      data: {
        status: 'WAITING',
        rowdata: 'QR_WAITING_DATA'
      }
    });
    const provedor = criarProvedor();

    const qr = await provedor.obterQR();

    expect(qr).toBe('QR_WAITING_DATA');
  });

  it('deve retornar null se já estiver autenticado (409) ao obter QR', async () => {
    mockGet.mockRejectedValue({
      response: { status: 409 }
    });
    const provedor = criarProvedor();

    const qr = await provedor.obterQR();

    expect(qr).toBeNull();
  });

  it('deve retornar null se desconectar falhar com 404', async () => {
    mockPost.mockRejectedValue({
      response: { status: 404, data: { error: { message: 'Not found' } } }
    });
    const provedor = criarProvedor();

    const result = await provedor.desconectar();

    expect(result).toBe(false);
  });

  it('deve sanitizar números brasileiros corretamente (unidade interna)', async () => {
    const provedor = criarProvedor() as any; // acesso privado para teste
    
    expect(provedor.sanitizarNumero('(31) 98742-4020')).toBe('5531987424020');
    expect(provedor.sanitizarNumero('31 987424020')).toBe('5531987424020');
    expect(provedor.sanitizarNumero('5531987424020')).toBe('5531987424020');
  });

  it('deve usar wa_id retornado pela API de verificação de contatos', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        contacts: [{ status: 'valid', wa_id: '553187424020@s.whatsapp.net' }]
      }
    }).mockResolvedValueOnce({
      data: { message: { id: 'MSG123' } }
    });

    const provedor = criarProvedor();
    const result = await provedor.enviarMensagem('(31) 98742-4020', 'Olá');

    expect(result.sucesso).toBe(true);
    expect(mockPost).toHaveBeenCalledWith('/contacts', expect.any(Object));
    expect(mockPost).toHaveBeenCalledWith('/messages/text', expect.objectContaining({
      to: '553187424020@s.whatsapp.net'
    }));
  });

  it('deve desconectar via POST /users/logout', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    const provedor = criarProvedor();

    const sucesso = await provedor.desconectar();

    expect(sucesso).toBe(true);
    expect(mockPost).toHaveBeenCalledWith('/users/logout');
  });

  it('deve obter grupos via GET /groups', async () => {
    mockGet.mockResolvedValue({
      data: {
        groups: [{ id: 'GRP-1', subject: 'Grupo One', timestamp: 123 }],
        total: 1
      }
    });
    const provedor = criarProvedor();

    const resultado = await provedor.obterGrupos();

    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0].nome).toBe('Grupo One');
  });
});
