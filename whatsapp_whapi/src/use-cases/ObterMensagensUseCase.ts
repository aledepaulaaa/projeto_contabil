import { ProvedorWhatsApp, MensagemWhatsApp, ListaPaginada } from '../core/portas/ProvedorWhatsApp.js';

/**
 * Caso de Uso: Obter Mensagens do WhatsApp.
 * 
 * Permite listar mensagens gerais ou filtrar por chat específico.
 */
export class ObterMensagensUseCase {
  constructor(private readonly provedor: ProvedorWhatsApp) {}

  /** Lista mensagens gerais com paginação */
  async listar(limite?: number, offset?: number): Promise<ListaPaginada<MensagemWhatsApp>> {
    if (!this.provedor) {
      throw new Error('Provedor WhatsApp não configurado');
    }
    return this.provedor.obterMensagens(limite, offset);
  }

  /** Lista mensagens de um chat específico */
  async listarPorChat(chatId: string, limite?: number): Promise<ListaPaginada<MensagemWhatsApp>> {
    if (!this.provedor) {
      throw new Error('Provedor WhatsApp não configurado');
    }

    if (!chatId || !chatId.trim()) {
      throw new Error('ID do chat é obrigatório');
    }

    return this.provedor.obterMensagensPorChatId(chatId.trim(), limite);
  }
}
