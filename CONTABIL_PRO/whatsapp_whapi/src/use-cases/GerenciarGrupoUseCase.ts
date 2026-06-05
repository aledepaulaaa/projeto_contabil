import { ProvedorWhatsApp, ResultadoGrupo, ChatWhatsApp, ListaPaginada } from '../core/portas/ProvedorWhatsApp.js';

/**
 * Caso de Uso: Gerenciar Grupos do WhatsApp.
 * 
 * Centraliza criação de grupos, adição de participantes e listagem.
 */
export class GerenciarGrupoUseCase {
  constructor(private readonly provedor: ProvedorWhatsApp) {}

  /** Cria um novo grupo com nome e lista de participantes */
  async criar(nome: string, participantes: string[]): Promise<ResultadoGrupo> {
    if (!this.provedor) {
      throw new Error('Provedor WhatsApp não configurado');
    }

    if (!nome || !nome.trim()) {
      throw new Error('Nome do grupo é obrigatório');
    }

    if (!participantes || participantes.length === 0) {
      throw new Error('É necessário pelo menos um participante');
    }

    const resultado = await this.provedor.criarGrupo(nome.trim(), participantes);

    if (resultado.sucesso) {
      console.log(`[GerenciarGrupo] ✅ Grupo "${nome}" criado com ${participantes.length} participante(s)`);
    }

    return resultado;
  }

  /** Adiciona um participante a um grupo existente */
  async adicionarParticipante(grupoId: string, participanteId: string): Promise<ResultadoGrupo> {
    if (!this.provedor) {
      throw new Error('Provedor WhatsApp não configurado');
    }

    if (!grupoId || !grupoId.trim()) {
      throw new Error('ID do grupo é obrigatório');
    }

    if (!participanteId || !participanteId.trim()) {
      throw new Error('ID do participante é obrigatório');
    }

    return this.provedor.adicionarParticipanteGrupo(grupoId.trim(), participanteId.trim());
  }

  /** Lista todos os grupos */
  async listar(): Promise<ListaPaginada<ChatWhatsApp>> {
    if (!this.provedor) {
      throw new Error('Provedor WhatsApp não configurado');
    }
    return this.provedor.obterGrupos();
  }
}
