import { ProvedorWhatsApp, ResultadoEnvio } from '../core/portas/ProvedorWhatsApp.js';

/**
 * Caso de Uso: Enviar Mensagem de Texto via WhatsApp.
 * 
 * Valida os parâmetros de entrada e delega o envio ao provedor injetado.
 * Segue SRP — apenas orquestra a validação e delegação.
 */
export class EnviarMensagemUseCase {
  constructor(private readonly provedor: ProvedorWhatsApp) {}

  /**
   * Executa o envio de mensagem.
   * @param para - Número do destinatário (com DDI)
   * @param mensagem - Conteúdo textual da mensagem
   * @returns Resultado padronizado do envio
   */
  async executar(para: string, mensagem: string): Promise<ResultadoEnvio> {
    if (!this.provedor) {
      throw new Error('Provedor WhatsApp não configurado');
    }

    if (!para || !para.trim()) {
      throw new Error('Número de destino é obrigatório');
    }

    if (!mensagem || !mensagem.trim()) {
      throw new Error('Mensagem é obrigatória');
    }

    const resultado = await this.provedor.enviarMensagem(para.trim(), mensagem.trim());

    if (resultado.sucesso) {
      console.log(`[EnviarMensagem] ✅ Mensagem enviada com sucesso para ${para}`);
    }

    return resultado;
  }
}
