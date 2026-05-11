import { Router, Request, Response } from 'express';
import { GerenciarGrupoUseCase } from '../use-cases/GerenciarGrupoUseCase.js';

/**
 * GrupoControlador — Endpoints de gerenciamento de grupos WhatsApp.
 */
export function criarGrupoControlador(gerenciarGrupo: GerenciarGrupoUseCase): Router {
  const router = Router();

  /**
   * @swagger
   * /api/whatsapp/groups:
   *   get:
   *     summary: Lista todos os grupos
   *     tags: [Grupos]
   */
  router.get('/groups', async (_req: Request, res: Response) => {
    try {
      const resultado = await gerenciarGrupo.listar();
      res.json(resultado);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/whatsapp/groups:
   *   post:
   *     summary: Cria um novo grupo
   *     tags: [Grupos]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               subject:
   *                 type: string
   *               participants:
   *                 type: array
   *                 items:
   *                   type: string
   */
  router.post('/groups', async (req: Request, res: Response) => {
    try {
      const { subject, participants } = req.body;
      const resultado = await gerenciarGrupo.criar(subject, participants);

      if (resultado.sucesso) {
        res.json({ success: true, groupId: resultado.grupoId });
      } else {
        res.status(500).json({ success: false, error: resultado.erro });
      }
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  /**
   * @swagger
   * /api/whatsapp/groups/{groupId}/participants:
   *   post:
   *     summary: Adiciona participante ao grupo
   *     tags: [Grupos]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               participantId:
   *                 type: string
   */
  router.post('/groups/:groupId/participants', async (req: Request, res: Response) => {
    try {
      const { participantId } = req.body;
      const resultado = await gerenciarGrupo.adicionarParticipante(req.params.groupId as string, participantId);

      if (resultado.sucesso) {
        res.json({ success: true });
      } else {
        res.status(500).json({ success: false, error: resultado.erro });
      }
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  return router;
}
