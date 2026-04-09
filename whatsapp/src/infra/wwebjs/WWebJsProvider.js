const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const WhatsAppProvider = require('../../core/WhatsAppProvider');

class WWebJsProvider extends WhatsAppProvider {
    constructor() {
        super();
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: 'projeto-contabil'
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        this.initialized = false;
        this.qr = null;
    }

    async initialize() {
        this.client.on('qr', (qr) => {
            console.log('QR CODE RECEIVED (Scan in "Conexão"):', qr);
            this.qr = qr;
            this.emit('qr', qr); // Emite para o app.js
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            console.log('WhatsApp Web JS is READY!');
            this.initialized = true;
            this.qr = null;
            this.emit('ready'); // Emite para o app.js
        });

        this.client.on('authenticated', () => {
            console.log('WhatsApp Web JS is AUTHENTICATED!');
            this.emit('authenticated'); // Emite para o app.js
        });

        this.client.on('auth_failure', (msg) => {
            console.error('AUTHENTICATION FAILURE:', msg);
            this.emit('auth_failure', msg);
        });

        this.client.on('message', (msg) => {
            // Ignorar atualizações de status (Stories) e grupos
            if (msg.from === 'status@broadcast' || msg.from.includes('@g.us')) return;

            this.emit('message_received', {
                from: msg.from.replace('@c.us', ''),
                body: msg.body,
                timestamp: msg.timestamp
            });
        });

        return this.client.initialize();
    }

    async sendMessage(to, message) {
        if (!this.initialized) {
            throw new Error('Cliente WhatsApp não está pronto');
        }

        // WhatsApp Web JS requer o formato @c.us para números individuais
        // Sanitiza removendo caracteres não numéricos e garante o DDI (55)
        let sanitized = to.replace(/\D/g, '');
        if (!sanitized.startsWith('55') && (sanitized.length === 10 || sanitized.length === 11)) {
            sanitized = '55' + sanitized;
        }

        try {
            // Tenta obter o ID correto do servidor do WhatsApp (resolve problemas de 9º dígito no Brasil)
            const numberId = await this.client.getNumberId(sanitized);
            const chatId = numberId ? numberId._serialized : `${sanitized}@c.us`;

            console.log(`[WWebJS] Enviando mensagem para ID resolvido: ${chatId}`);
            const response = await this.client.sendMessage(chatId, message);
            return {
                success: true,
                messageId: response.id.id,
                timestamp: response.timestamp
            };
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            return { success: false, error: error.message };
        }
    }

    getQR() {
        return this.qr;
    }

    isReady() {
        return this.initialized;
    }
}

module.exports = WWebJsProvider;
