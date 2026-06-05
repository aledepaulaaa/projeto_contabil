import { Router, Request, Response } from 'express';
import { EnviarMensagemUseCase } from '../use-cases/EnviarMensagemUseCase.js';
import { EnviarDocumentoUseCase } from '../use-cases/EnviarDocumentoUseCase.js';
import { ObterMensagensUseCase } from '../use-cases/ObterMensagensUseCase.js';

/**
 * MensagemControlador — Endpoints de envio e consulta de mensagens.
 * 
 * POST /messages/send → compatível com gateway antigo
 * POST /messages/send-document → novo endpoint
 * GET /messages → mensagens gerais
 * GET /messages/:chatId → mensagens por chat
 */
export function criarMensagemControlador(
  enviarMensagem: EnviarMensagemUseCase,
  enviarDocumento: EnviarDocumentoUseCase,
  obterMensagens: ObterMensagensUseCase
): Router {
  const router = Router();

  /**
   * @swagger
   * /api/whatsapp/messages/send:
   *   post:
   *     summary: Envia mensagem de texto
   *     tags: [Mensagens]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               to:
   *                 type: string
   *                 description: Número do destinatário com DDI
   *               message:
   *                 type: string
   *                 description: Conteúdo da mensagem
   *     responses:
   *       200:
   *         description: Mensagem enviada com sucesso
   */
  router.post('/messages/send', async (req: Request, res: Response) => {
    try {
      const { to, message } = req.body;
      const resultado = await enviarMensagem.executar(to, message);

      if (resultado.sucesso) {
        // Formato compatível com gateway antigo: { success, messageId, timestamp }
        res.json({
          success: true,
          messageId: resultado.idMensagem,
          timestamp: resultado.timestamp
        });
      } else {
        res.status(500).json({ success: false, error: resultado.erro });
      }
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  /**
   * @swagger
   * /api/whatsapp/messages/send-document:
   *   post:
   *     summary: Envia documento/arquivo
   *     tags: [Mensagens]
   */
  router.post('/messages/send-document', async (req: Request, res: Response) => {
    try {
      const { to, fileUrl, fileName } = req.body;
      const resultado = await enviarDocumento.executar(to, fileUrl, fileName);

      if (resultado.sucesso) {
        res.json({ success: true, messageId: resultado.idMensagem });
      } else {
        res.status(500).json({ success: false, error: resultado.erro });
      }
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  /**
   * @swagger
   * /api/whatsapp/messages:
   *   get:
   *     summary: Lista mensagens gerais
   *     tags: [Mensagens]
   *     parameters:
   *       - name: limit
   *         in: query
   *         schema:
   *           type: number
   *       - name: offset
   *         in: query
   *         schema:
   *           type: number
   */
  router.get('/messages', async (req: Request, res: Response) => {
    try {
      const limite = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const resultado = await obterMensagens.listar(limite, offset);
      res.json(resultado);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/whatsapp/messages/{chatId}:
   *   get:
   *     summary: Lista mensagens de um chat específico
   *     tags: [Mensagens]
   */
  router.get('/messages/:chatId', async (req: Request, res: Response) => {
    try {
      const limite = parseInt(req.query.limit as string) || 100;
      const resultado = await obterMensagens.listarPorChat(req.params.chatId as string, limite);
      res.json(resultado);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
