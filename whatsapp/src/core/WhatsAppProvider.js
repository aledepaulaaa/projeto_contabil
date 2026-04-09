const EventEmitter = require('events');

/**
 * @interface WhatsAppProvider
 * Abstração para suportar múltiplos provedores (WWebJs, Whapi)
 */
class WhatsAppProvider extends EventEmitter {
    constructor() {
        super();
    }

    async sendMessage(to, message) {
        throw new Error('Método sendMessage não implementado');
    }

    async sendDocument(to, fileUrl, fileName) {
        throw new Error('Método sendDocument não implementado');
    }
}

module.exports = WhatsAppProvider;
