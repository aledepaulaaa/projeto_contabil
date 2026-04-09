import { describe, it, expect, vi } from 'vitest';
import { ObterContatosUseCase } from '../../src/use-cases/ObterContatosUseCase.js';
import { ProvedorWhatsApp } from '../../src/core/portas/ProvedorWhatsApp.js';

/**
 * Testes Unitários — ObterContatosUseCase
 */
describe('ObterContatosUseCase', () => {

  const criarProvedorMock = (): ProvedorWhatsApp => ({
    enviarMensagem: vi.fn(),
    enviarDocumento: vi.fn(),
    obterContatos: vi.fn().mockResolvedValue({
      itens: [{ id: '5511999999999', nome: 'João Silva', ehNegocio: false }],
      total: 1, contagem: 1, offset: 0
    }),
    obterContatoPorId: vi.fn().mockResolvedValue({ id: '5511999999999', nome: 'João Silva' }),
    obterChats: vi.fn(),
    obterChatPorId: vi.fn(),
    obterMensagens: vi.fn(),
    obterMensagensPorChatId: vi.fn(),
    criarGrupo: vi.fn(),
    adicionarParticipanteGrupo: vi.fn(),
    obterGrupos: vi.fn(),
    verificarSaude: vi.fn(),
  });

  it('deve listar contatos com paginação', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new ObterContatosUseCase(provedorMock);

    const resultado = await useCase.listar(10, 0);

    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0].nome).toBe('João Silva');
    expect(provedorMock.obterContatos).toHaveBeenCalledWith(10, 0);
  });

  it('deve buscar contato por ID', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new ObterContatosUseCase(provedorMock);

    const contato = await useCase.buscarPorId('5511999999999');

    expect(contato?.id).toBe('5511999999999');
    expect(provedorMock.obterContatoPorId).toHaveBeenCalledWith('5511999999999');
  });

  it('deve lançar erro quando ID do contato está vazio', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new ObterContatosUseCase(provedorMock);

    await expect(useCase.buscarPorId('')).rejects.toThrow('ID do contato é obrigatório');
  });
});
