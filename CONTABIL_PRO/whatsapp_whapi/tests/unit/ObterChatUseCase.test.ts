import { describe, it, expect, vi } from 'vitest';
import { ObterChatUseCase } from '../../src/use-cases/ObterChatUseCase.js';
import { ProvedorWhatsApp } from '../../src/core/portas/ProvedorWhatsApp.js';

/**
 * Testes Unitários — ObterChatUseCase
 */
describe('ObterChatUseCase', () => {

  const criarProvedorMock = (): ProvedorWhatsApp => ({
    enviarMensagem: vi.fn(),
    enviarDocumento: vi.fn(),
    obterContatos: vi.fn(),
    obterContatoPorId: vi.fn(),
    obterChats: vi.fn().mockResolvedValue({
      itens: [{ id: '5511999999999@s.whatsapp.net', nome: 'Chat Teste', tipo: 'individual' }],
      total: 1, contagem: 1, offset: 0
    }),
    obterChatPorId: vi.fn().mockResolvedValue({ id: '5511999999999@s.whatsapp.net', nome: 'Chat Teste' }),
    obterMensagens: vi.fn(),
    obterMensagensPorChatId: vi.fn(),
    criarGrupo: vi.fn(),
    adicionarParticipanteGrupo: vi.fn(),
    obterGrupos: vi.fn(),
    verificarSaude: vi.fn(),
  });

  it('deve listar chats com paginação', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new ObterChatUseCase(provedorMock);

    const resultado = await useCase.listar(20, 0);

    expect(resultado.itens).toHaveLength(1);
    expect(provedorMock.obterChats).toHaveBeenCalledWith(20, 0);
  });

  it('deve buscar chat por ID', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new ObterChatUseCase(provedorMock);

    const chat = await useCase.buscarPorId('5511999999999@s.whatsapp.net');

    expect(chat?.nome).toBe('Chat Teste');
  });

  it('deve lançar erro quando ID do chat está vazio', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new ObterChatUseCase(provedorMock);

    await expect(useCase.buscarPorId('  ')).rejects.toThrow('ID do chat é obrigatório');
  });
});
