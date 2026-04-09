import { describe, it, expect, vi } from 'vitest';
import { ObterMensagensUseCase } from '../../src/use-cases/ObterMensagensUseCase.js';
import { ProvedorWhatsApp } from '../../src/core/portas/ProvedorWhatsApp.js';

/**
 * Testes Unitários — ObterMensagensUseCase
 */
describe('ObterMensagensUseCase', () => {

  const criarProvedorMock = (): ProvedorWhatsApp => ({
    enviarMensagem: vi.fn(),
    enviarDocumento: vi.fn(),
    obterContatos: vi.fn(),
    obterContatoPorId: vi.fn(),
    obterChats: vi.fn(),
    obterChatPorId: vi.fn(),
    obterMensagens: vi.fn().mockResolvedValue({
      itens: [{ id: 'MSG-1', chatId: 'chat1', deMim: true, texto: 'Olá', timestamp: 1234567890 }],
      total: 1, contagem: 1, offset: 0
    }),
    obterMensagensPorChatId: vi.fn().mockResolvedValue({
      itens: [{ id: 'MSG-2', chatId: 'chat1', deMim: false, texto: 'Resposta', timestamp: 1234567891 }],
      total: 1, contagem: 1, offset: 0
    }),
    criarGrupo: vi.fn(),
    adicionarParticipanteGrupo: vi.fn(),
    obterGrupos: vi.fn(),
    verificarSaude: vi.fn(),
  });

  it('deve listar mensagens gerais', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new ObterMensagensUseCase(provedorMock);

    const resultado = await useCase.listar(50, 0);

    expect(resultado.itens).toHaveLength(1);
    expect(provedorMock.obterMensagens).toHaveBeenCalledWith(50, 0);
  });

  it('deve listar mensagens por chat ID', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new ObterMensagensUseCase(provedorMock);

    const resultado = await useCase.listarPorChat('chat1', 20);

    expect(resultado.itens[0].texto).toBe('Resposta');
    expect(provedorMock.obterMensagensPorChatId).toHaveBeenCalledWith('chat1', 20);
  });

  it('deve lançar erro quando chat ID está vazio', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new ObterMensagensUseCase(provedorMock);

    await expect(useCase.listarPorChat('')).rejects.toThrow('ID do chat é obrigatório');
  });
});
