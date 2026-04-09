import { Router, Request, Response } from 'express';
import { ProvedorWhatsApp } from '../core/portas/ProvedorWhatsApp.js';

/**
 * StatusControlador — Endpoints de verificação de status e saúde.
 * 
 * Compatível com o endpoint antigo GET /api/whatsapp/status
 * usado pelo frontend (WhatsAppConnection.tsx).
 */
export function criarStatusControlador(provedor: ProvedorWhatsApp): Router {
  const router = Router();

  /**
   * @swagger
   * /api/whatsapp/status:
   *   get:
   *     summary: Verifica status da conexão WhatsApp
   *     tags: [Status]
   *     responses:
   *       200:
   *         description: Status atual do canal
   */
  router.get('/status', async (_req: Request, res: Response) => {
    try {
      const saude = await provedor.verificarSaude();
      const conectado = saude.status.texto === 'AUTH' || saude.status.codigo === 200;

      res.json({
        ready: conectado,
        provider: 'whapi',
        canal: saude.canalId || null,
        uptime: saude.uptime || 0,
        statusCanal: saude.status.texto
      });
    } catch (error: any) {
      res.json({
        ready: false,
        provider: 'whapi',
        erro: error.message
      });
    }
  });

  /**
   * @swagger
   * /api/whatsapp/qr:
   *   get:
   *     summary: QR Code (redirecionamento para painel Whapi)
   *     tags: [Status]
   *     responses:
   *       200:
   *         description: Informação sobre autenticação
   */
  router.get('/qr', async (req, res) => {
    const qr = await provedor.obterQR();

    if (qr) {
      return res.json({
        qr,
        provider: 'whapi',
        message: 'Escaneie este QR Code para conectar a instância.'
      });
    }

    res.json({
      message: 'QR Code não disponível ou instância já autenticada. Use o painel da Whapi se necessário.',
      provider: 'whapi',
      painelUrl: 'https://panel.whapi.cloud'
    });
  });

  /**
   * POST /api/whatsapp/logout
   * Desconecta a instância atual.
   */
  router.post('/logout', async (req, res) => {
    const sucesso = await provedor.desconectar();
    
    if (sucesso) {
      return res.json({ success: true, message: 'Instância desconectada com sucesso.' });
    }

    res.status(500).json({ success: false, message: 'Falha ao desconectar instância.' });
  });

  return router;
}
