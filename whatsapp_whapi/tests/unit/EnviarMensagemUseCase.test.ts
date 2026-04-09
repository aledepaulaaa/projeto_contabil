import { describe, it, expect, vi } from 'vitest';
import { EnviarMensagemUseCase } from '../../src/use-cases/EnviarMensagemUseCase.js';
import { ProvedorWhatsApp } from '../../src/core/portas/ProvedorWhatsApp.js';

/**
 * Testes Unitários — EnviarMensagemUseCase
 * Ciclo TDD: RED → GREEN → REFACTOR
 */
describe('EnviarMensagemUseCase', () => {

  /** Cria um mock do provedor com todas as funções */
  const criarProvedorMock = (): ProvedorWhatsApp => ({
    enviarMensagem: vi.fn().mockResolvedValue({ sucesso: true, idMensagem: 'MSG-001', timestamp: Date.now() }),
    enviarDocumento: vi.fn(),
    obterContatos: vi.fn(),
    obterContatoPorId: vi.fn(),
    obterChats: vi.fn(),
    obterChatPorId: vi.fn(),
    obterMensagens: vi.fn(),
    obterMensagensPorChatId: vi.fn(),
    criarGrupo: vi.fn(),
    adicionarParticipanteGrupo: vi.fn(),
    obterGrupos: vi.fn(),
    verificarSaude: vi.fn(),
  });

  it('deve enviar mensagem com sucesso quando parâmetros válidos', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new EnviarMensagemUseCase(provedorMock);

    const resultado = await useCase.executar('5511999999999', 'Olá, teste!');

    expect(resultado.sucesso).toBe(true);
    expect(resultado.idMensagem).toBe('MSG-001');
    expect(provedorMock.enviarMensagem).toHaveBeenCalledOnce();
    expect(provedorMock.enviarMensagem).toHaveBeenCalledWith('5511999999999', 'Olá, teste!');
  });

  it('deve lançar erro quando número de destino está vazio', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new EnviarMensagemUseCase(provedorMock);

    await expect(useCase.executar('', 'Mensagem')).rejects.toThrow('Número de destino é obrigatório');
    expect(provedorMock.enviarMensagem).not.toHaveBeenCalled();
  });

  it('deve lançar erro quando mensagem está vazia', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new EnviarMensagemUseCase(provedorMock);

    await expect(useCase.executar('5511999999999', '')).rejects.toThrow('Mensagem é obrigatória');
    expect(provedorMock.enviarMensagem).not.toHaveBeenCalled();
  });

  it('deve lançar erro quando provedor não configurado (null)', async () => {
    const useCase = new EnviarMensagemUseCase(null as unknown as ProvedorWhatsApp);

    await expect(useCase.executar('5511999999999', 'Teste')).rejects.toThrow('Provedor WhatsApp não configurado');
  });

  it('deve fazer trim nos parâmetros antes de enviar', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new EnviarMensagemUseCase(provedorMock);

    await useCase.executar('  5511999999999  ', '  Mensagem com espaços  ');

    expect(provedorMock.enviarMensagem).toHaveBeenCalledWith('5511999999999', 'Mensagem com espaços');
  });

  it('deve retornar resultado de falha do provedor sem lançar exceção', async () => {
    const provedorMock = criarProvedorMock();
    (provedorMock.enviarMensagem as ReturnType<typeof vi.fn>).mockResolvedValue({
      sucesso: false,
      erro: 'Número inválido'
    });
    const useCase = new EnviarMensagemUseCase(provedorMock);

    const resultado = await useCase.executar('123', 'Teste');

    expect(resultado.sucesso).toBe(false);
    expect(resultado.erro).toBe('Número inválido');
  });
});
