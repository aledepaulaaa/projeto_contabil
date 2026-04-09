import { Router, Request, Response } from 'express';
import { ObterChatUseCase } from '../use-cases/ObterChatUseCase.js';

/**
 * ChatControlador — Endpoints de consulta de chats WhatsApp.
 */
export function criarChatControlador(obterChat: ObterChatUseCase): Router {
  const router = Router();

  /**
   * @swagger
   * /api/whatsapp/chats:
   *   get:
   *     summary: Lista chats do WhatsApp
   *     tags: [Chats]
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
  router.get('/chats', async (req: Request, res: Response) => {
    try {
      const limite = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const resultado = await obterChat.listar(limite, offset);
      res.json(resultado);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/whatsapp/chats/{chatId}:
   *   get:
   *     summary: Obtém chat por ID
   *     tags: [Chats]
   */
  router.get('/chats/:chatId', async (req: Request, res: Response) => {
    try {
      const chat = await obterChat.buscarPorId(req.params.chatId);
      if (chat) {
        res.json(chat);
      } else {
        res.status(404).json({ error: 'Chat não encontrado' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
