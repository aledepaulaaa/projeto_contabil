import { ProvedorWhatsApp, ContatoWhatsApp, ListaPaginada } from '../core/portas/ProvedorWhatsApp.js';

/**
 * Caso de Uso: Obter Contatos do WhatsApp.
 * 
 * Permite listar contatos com paginação ou buscar um contato específico.
 */
export class ObterContatosUseCase {
  constructor(private readonly provedor: ProvedorWhatsApp) {}

  /** Lista contatos com paginação */
  async listar(limite?: number, offset?: number): Promise<ListaPaginada<ContatoWhatsApp>> {
    if (!this.provedor) {
      throw new Error('Provedor WhatsApp não configurado');
    }
    return this.provedor.obterContatos(limite, offset);
  }

  /** Busca contato por ID */
  async buscarPorId(contatoId: string): Promise<ContatoWhatsApp | null> {
    if (!this.provedor) {
      throw new Error('Provedor WhatsApp não configurado');
    }

    if (!contatoId || !contatoId.trim()) {
      throw new Error('ID do contato é obrigatório');
    }

    return this.provedor.obterContatoPorId(contatoId.trim());
  }
}
