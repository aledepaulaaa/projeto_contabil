import { connect, Connection, Channel, ConsumeMessage } from 'amqplib';
import { EnviarMensagemUseCase } from '../../use-cases/EnviarMensagemUseCase.js';

/**
 * ConsumidorRabbitMQ — Ponte entre o Backend Java e o provedor Whapi.
 * 
 * Consome mensagens da fila "q.whatsapp.envio" e delega o envio
 * ao caso de uso EnviarMensagemUseCase.
 * 
 * Payload esperado (publicado pelo WhatsAppProducer.java):
 * { leadId: string, numero: string, mensagem: string, tenantId: string, timestamp: number }
 */

interface PayloadMensagemWhatsApp {
  leadId: string;
  numero: string;
  mensagem: string;
  tenantId: string;
  timestamp: number;
}

export class ConsumidorRabbitMQ {
  private readonly fila = 'q.whatsapp.envio';
  private conexao: any = null;
  private canal: any = null;

  constructor(
    private readonly enviarMensagemUseCase: EnviarMensagemUseCase,
    private readonly urlRabbit: string = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'
  ) {}

  /**
   * Estabelece conexão com RabbitMQ e inicia o consumo da fila.
   * Reconecta automaticamente em caso de falha (retry a cada 5s).
   */
  async conectar(): Promise<void> {
    try {
      console.log(`[RabbitMQ] Conectando em ${this.urlRabbit}...`);
      const conn = await connect(this.urlRabbit);
      this.conexao = conn;
      
      this.canal = await conn.createChannel();
      await this.canal.assertQueue(this.fila, { durable: true });

      console.log(`[RabbitMQ] ✅ Aguardando mensagens na fila: ${this.fila}`);

      this.canal.consume(this.fila, async (msg: ConsumeMessage | null) => {
        if (msg !== null) {
          await this.processarMensagem(msg);
        }
      });

      // Reconexão automática em caso de erro/desconexão
      this.conexao.on('error', (err: Error) => {
        console.error('[RabbitMQ] ❌ Erro na conexão:', err.message);
        setTimeout(() => this.conectar(), 5000);
      });

      this.conexao.on('close', () => {
        console.warn('[RabbitMQ] ⚠️ Conexão fechada. Tentando reconectar em 5s...');
        setTimeout(() => this.conectar(), 5000);
      });

    } catch (error: any) {
      console.error('[RabbitMQ] Falha ao conectar. Retentando em 5s...', error.message);
      setTimeout(() => this.conectar(), 5000);
    }
  }

  /**
   * Processa uma mensagem individual da fila.
   * ACK é feito mesmo em caso de erro para evitar loop infinito.
   * Em produção, usar Dead Letter Queue (DLQ) para mensagens falhadas.
   */
  private async processarMensagem(msg: ConsumeMessage): Promise<void> {
    try {
      const payload: PayloadMensagemWhatsApp = JSON.parse(msg.content.toString());
      console.log(`[RabbitMQ] 📩 Mensagem recebida para ${payload.numero} (Tenant: ${payload.tenantId})`);

      const resultado = await this.enviarMensagemUseCase.executar(payload.numero, payload.mensagem);

      if (resultado.sucesso) {
        console.log(`[RabbitMQ] ✅ Enviado com sucesso para ${payload.numero}`);
      } else {
        console.error(`[RabbitMQ] ❌ Falha ao enviar para ${payload.numero}:`, resultado.erro);
      }

      // ACK em ambos os casos para evitar loop infinito
      // TODO: Em produção, usar DLQ para mensagens falhadas
      this.canal?.ack(msg);

    } catch (err: any) {
      console.error('[RabbitMQ] Erro ao processar payload:', err.message);
      this.canal?.ack(msg);
    }
  }

  /** Fecha conexão graciosamente */
  async desconectar(): Promise<void> {
    try {
      await this.canal?.close();
      await this.conexao?.close();
      console.log('[RabbitMQ] Conexão encerrada.');
    } catch (err: any) {
      console.error('[RabbitMQ] Erro ao fechar conexão:', err.message);
    }
  }
}
