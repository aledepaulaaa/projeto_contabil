class SendMessageUseCase {
    constructor(whatsappProvider) {
        this.whatsappProvider = whatsappProvider;
    }

    async execute({ to, message }) {
        if (!this.whatsappProvider) {
            throw new Error('WhatsApp Provider não configurado');
        }

        if (!to || !message) {
            throw new Error('Número de destino e mensagem são necessários');
        }

        return await this.whatsappProvider.sendMessage(to, message);
    }
}

module.exports = SendMessageUseCase;
