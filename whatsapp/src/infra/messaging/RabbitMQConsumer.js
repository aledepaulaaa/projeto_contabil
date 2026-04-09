const amqp = require('amqplib');

/**
 * Consumidor RabbitMQ para o Gateway WhatsApp.
 * Atua como uma ponte entre o Backend Java e os Providers (WWebJS/Whapi).
 */
class RabbitMQConsumer {
    constructor(sendMessageUseCase) {
        this.sendMessageUseCase = sendMessageUseCase;
        this.queue = 'q.whatsapp.envio';
        this.rabbitUrl = process.env.RABBITMQ_URL;
        this.connection = null;
        this.channel = null;
    }

    async connect() {
        try {
            console.log(`[RabbitMQ] Conectando em ${this.rabbitUrl}...`);
            this.connection = await amqp.connect(this.rabbitUrl);
            this.channel = await this.connection.createChannel();

            await this.channel.assertQueue(this.queue, { durable: true });
            
            console.log(`[RabbitMQ] Aguardando mensagens na fila: ${this.queue}`);

            this.channel.consume(this.queue, async (msg) => {
                if (msg !== null) {
                    try {
                        const payload = JSON.parse(msg.content.toString());
                        console.log(`[RabbitMQ] Mensagem recebida para ${payload.numero}`);

                        const result = await this.sendMessageUseCase.execute({
                            to: payload.numero,
                            message: payload.mensagem
                        });

                        if (result.success) {
                            console.log(`[RabbitMQ] Mensagem enviada com sucesso para ${payload.numero}`);
                            this.channel.ack(msg);
                        } else {
                            console.error(`[RabbitMQ] Falha ao enviar mensagem para ${payload.numero}:`, result.error);
                            // Em caso de erro, podemos rejeitar e colocar no final da fila (requeue: true) 
                            // ou descartar se for erro de validação. Por enquanto, fazemos ack para evitar loop infinito
                            // mas em produção o ideal seria uma Dead Letter Queue (DLQ).
                            this.channel.ack(msg); 
                        }
                    } catch (err) {
                        console.error('[RabbitMQ] Erro ao processar payload:', err.message);
                        this.channel.ack(msg);
                    }
                }
            });

            this.connection.on('error', (err) => {
                console.error('[RabbitMQ] Erro na conexão:', err.message);
                setTimeout(() => this.connect(), 5000);
            });

            this.connection.on('close', () => {
                console.warn('[RabbitMQ] Conexão fechada. Tentando reconectar...');
                setTimeout(() => this.connect(), 5000);
            });

        } catch (error) {
            console.error('[RabbitMQ] Falha ao conectar. Retentando em 5s...', error.message);
            setTimeout(() => this.connect(), 5000);
        }
    }
}

module.exports = RabbitMQConsumer;
