import { ProvedorWhatsApp, ResultadoEnvio } from '../core/portas/ProvedorWhatsApp.js';

/**
 * Caso de Uso: Enviar Documento via WhatsApp.
 * 
 * Valida os parâmetros e delega o envio de arquivo ao provedor.
 */
export class EnviarDocumentoUseCase {
  constructor(private readonly provedor: ProvedorWhatsApp) {}

  /**
   * Executa o envio de documento.
   * @param para - Número do destinatário
   * @param urlArquivo - URL do arquivo a ser enviado
   * @param nomeArquivo - Nome de exibição do arquivo
   */
  async executar(para: string, urlArquivo: string, nomeArquivo: string): Promise<ResultadoEnvio> {
    if (!this.provedor) {
      throw new Error('Provedor WhatsApp não configurado');
    }

    if (!para || !para.trim()) {
      throw new Error('Número de destino é obrigatório');
    }

    if (!urlArquivo || !urlArquivo.trim()) {
      throw new Error('URL do arquivo é obrigatória');
    }

    if (!nomeArquivo || !nomeArquivo.trim()) {
      throw new Error('Nome do arquivo é obrigatório');
    }

    const resultado = await this.provedor.enviarDocumento(para.trim(), urlArquivo.trim(), nomeArquivo.trim());

    if (resultado.sucesso) {
      console.log(`[EnviarDocumento] ✅ Documento "${nomeArquivo}" enviado com sucesso para ${para}`);
    }

    return resultado;
  }
}
