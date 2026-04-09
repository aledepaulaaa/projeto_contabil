import { describe, it, expect, vi } from 'vitest';
import { GerenciarGrupoUseCase } from '../../src/use-cases/GerenciarGrupoUseCase.js';
import { ProvedorWhatsApp } from '../../src/core/portas/ProvedorWhatsApp.js';

/**
 * Testes Unitários — GerenciarGrupoUseCase
 */
describe('GerenciarGrupoUseCase', () => {

  const criarProvedorMock = (): ProvedorWhatsApp => ({
    enviarMensagem: vi.fn(),
    enviarDocumento: vi.fn(),
    obterContatos: vi.fn(),
    obterContatoPorId: vi.fn(),
    obterChats: vi.fn(),
    obterChatPorId: vi.fn(),
    obterMensagens: vi.fn(),
    obterMensagensPorChatId: vi.fn(),
    criarGrupo: vi.fn().mockResolvedValue({ sucesso: true, grupoId: 'GRP-001' }),
    adicionarParticipanteGrupo: vi.fn().mockResolvedValue({ sucesso: true }),
    obterGrupos: vi.fn().mockResolvedValue({
      itens: [{ id: 'GRP-001', nome: 'Grupo Teste', tipo: 'group' }],
      total: 1, contagem: 1, offset: 0
    }),
    verificarSaude: vi.fn(),
  });

  it('deve criar grupo com nome e participantes', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new GerenciarGrupoUseCase(provedorMock);

    const resultado = await useCase.criar('Clientes VIP', ['5511999999999', '5521888888888']);

    expect(resultado.sucesso).toBe(true);
    expect(resultado.grupoId).toBe('GRP-001');
    expect(provedorMock.criarGrupo).toHaveBeenCalledWith('Clientes VIP', ['5511999999999', '5521888888888']);
  });

  it('deve lançar erro quando nome do grupo está vazio', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new GerenciarGrupoUseCase(provedorMock);

    await expect(useCase.criar('', ['5511999999999'])).rejects.toThrow('Nome do grupo é obrigatório');
  });

  it('deve lançar erro quando lista de participantes está vazia', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new GerenciarGrupoUseCase(provedorMock);

    await expect(useCase.criar('Grupo', [])).rejects.toThrow('É necessário pelo menos um participante');
  });

  it('deve adicionar participante a grupo existente', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new GerenciarGrupoUseCase(provedorMock);

    const resultado = await useCase.adicionarParticipante('GRP-001', '5511999999999');

    expect(resultado.sucesso).toBe(true);
    expect(provedorMock.adicionarParticipanteGrupo).toHaveBeenCalledWith('GRP-001', '5511999999999');
  });

  it('deve lançar erro quando ID do grupo está vazio', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new GerenciarGrupoUseCase(provedorMock);

    await expect(useCase.adicionarParticipante('', '5511999999999')).rejects.toThrow('ID do grupo é obrigatório');
  });

  it('deve lançar erro quando ID do participante está vazio', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new GerenciarGrupoUseCase(provedorMock);

    await expect(useCase.adicionarParticipante('GRP-001', '')).rejects.toThrow('ID do participante é obrigatório');
  });

  it('deve listar todos os grupos', async () => {
    const provedorMock = criarProvedorMock();
    const useCase = new GerenciarGrupoUseCase(provedorMock);

    const resultado = await useCase.listar();

    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0].nome).toBe('Grupo Teste');
  });
});
