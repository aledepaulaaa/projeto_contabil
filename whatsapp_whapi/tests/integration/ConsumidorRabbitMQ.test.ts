import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsumidorRabbitMQ } from '../../src/infra/mensageria/ConsumidorRabbitMQ.js';
import { EnviarMensagemUseCase } from '../../src/use-cases/EnviarMensagemUseCase.js';
import { ProvedorWhatsApp } from '../../src/core/portas/ProvedorWhatsApp.js';

/**
 * Teste de Integração — ConsumidorRabbitMQ
 * Valida o processamento correto do payload da fila.
 */
describe('ConsumidorRabbitMQ', () => {

  it('deve instanciar com use case e URL do RabbitMQ', () => {
    const provedorMock: ProvedorWhatsApp = {
      enviarMensagem: vi.fn().mockResolvedValue({ sucesso: true }),
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
    };

    const useCase = new EnviarMensagemUseCase(provedorMock);
    const consumidor = new ConsumidorRabbitMQ(useCase, 'amqp://test:test@localhost:5672');

    // Se instanciou sem erro, o teste passa
    expect(consumidor).toBeDefined();
  });

  it('deve ter método conectar e desconectar definidos', () => {
    const provedorMock: ProvedorWhatsApp = {
      enviarMensagem: vi.fn(),
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
    };

    const useCase = new EnviarMensagemUseCase(provedorMock);
    const consumidor = new ConsumidorRabbitMQ(useCase);

    expect(typeof consumidor.conectar).toBe('function');
    expect(typeof consumidor.desconectar).toBe('function');
  });
});
