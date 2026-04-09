import { Router, Request, Response } from 'express';
import { ObterContatosUseCase } from '../use-cases/ObterContatosUseCase.js';

/**
 * ContatoControlador — Endpoints de consulta de contatos WhatsApp.
 */
export function criarContatoControlador(obterContatos: ObterContatosUseCase): Router {
  const router = Router();

  /**
   * @swagger
   * /api/whatsapp/contacts:
   *   get:
   *     summary: Lista contatos do WhatsApp
   *     tags: [Contatos]
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
  router.get('/contacts', async (req: Request, res: Response) => {
    try {
      const limite = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const resultado = await obterContatos.listar(limite, offset);
      res.json(resultado);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/whatsapp/contacts/{contactId}:
   *   get:
   *     summary: Obtém contato por ID
   *     tags: [Contatos]
   */
  router.get('/contacts/:contactId', async (req: Request, res: Response) => {
    try {
      const contato = await obterContatos.buscarPorId(req.params.contactId);
      if (contato) {
        res.json(contato);
      } else {
        res.status(404).json({ error: 'Contato não encontrado' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
