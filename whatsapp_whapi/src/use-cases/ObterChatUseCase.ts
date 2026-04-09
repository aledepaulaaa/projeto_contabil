import { ProvedorWhatsApp, ChatWhatsApp, ListaPaginada } from '../core/portas/ProvedorWhatsApp.js';

/**
 * Caso de Uso: Obter Chats do WhatsApp.
 * 
 * Permite listar chats com paginação ou buscar um chat específico.
 */
export class ObterChatUseCase {
  constructor(private readonly provedor: ProvedorWhatsApp) {}

  /** Lista chats com paginação */
  async listar(limite?: number, offset?: number): Promise<ListaPaginada<ChatWhatsApp>> {
    if (!this.provedor) {
      throw new Error('Provedor WhatsApp não configurado');
    }
    return this.provedor.obterChats(limite, offset);
  }

  /** Busca chat por ID */
  async buscarPorId(chatId: string): Promise<ChatWhatsApp | null> {
    if (!this.provedor) {
      throw new Error('Provedor WhatsApp não configurado');
    }

    if (!chatId || !chatId.trim()) {
      throw new Error('ID do chat é obrigatório');
    }

    return this.provedor.obterChatPorId(chatId.trim());
  }
}
