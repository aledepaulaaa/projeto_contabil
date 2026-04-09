import { describe, it, expect, vi } from 'vitest';
import { EnviarDocumentoUseCase } from '../../src/use-cases/EnviarDocumentoUseCase.js';
import { ProvedorWhatsApp } from '../../src/core/portas/ProvedorWhatsApp.js';

/**
 * Testes Unitários — EnviarDocumentoUseCase
 */
describe('EnviarDocumentoUseCase', () => {

  const criarProvedorMock = (): ProvedorWhatsApp => ({
    enviarMensagem: vi.fn(),
    enviarDocumento: vi.fn().mockResolvedValue({ sucesso: true, idMensagem: 'DOC-001' }),
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

  it('deve enviar documento com sucesso', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new EnviarDocumentoUseCase(provedorMock);

    const resultado = await useCase.executar('5511999999999', 'https://example.com/doc.pdf', 'Contrato.pdf');

    expect(resultado.sucesso).toBe(true);
    expect(provedorMock.enviarDocumento).toHaveBeenCalledWith(
      '5511999999999', 'https://example.com/doc.pdf', 'Contrato.pdf'
    );
  });

  it('deve lançar erro quando URL do arquivo está vazia', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new EnviarDocumentoUseCase(provedorMock);

    await expect(useCase.executar('5511999999999', '', 'Doc.pdf'))
      .rejects.toThrow('URL do arquivo é obrigatória');
  });

  it('deve lançar erro quando nome do arquivo está vazio', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new EnviarDocumentoUseCase(provedorMock);

    await expect(useCase.executar('5511999999999', 'https://x.com/f.pdf', ''))
      .rejects.toThrow('Nome do arquivo é obrigatório');
  });

  it('deve lançar erro quando número de destino está vazio', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new EnviarDocumentoUseCase(provedorMock);

    await expect(useCase.executar('', 'https://x.com/f.pdf', 'Doc.pdf'))
      .rejects.toThrow('Número de destino é obrigatório');
  });
});
