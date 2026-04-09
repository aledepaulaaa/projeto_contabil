const axios = require('axios');
const WhatsAppProvider = require('../../core/WhatsAppProvider');

class WhapiProvider extends WhatsAppProvider {
    constructor(token) {
        super();
        this.token = token;
        this.baseUrl = 'https://gate.whapi.cloud';
    }

    async sendMessage(to, message) {
        const url = `${this.baseUrl}/messages/text`;
        const payload = {
            typing_time: 2,
            to: to.includes('@') ? to : `${to}@s.whatsapp.net`,
            body: message
        };

        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            return {
                success: true,
                messageId: response.data.message.id,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Error sending message via Whapi:', error.response?.data || error.message);
            return { success: false, error: error.message };
        }
    }

    async sendDocument(to, fileUrl, fileName) {
        const url = `${this.baseUrl}/messages/document`;
        const payload = {
            to: to.includes('@') ? to : `${to}@s.whatsapp.net`,
            media: fileUrl,
            caption: fileName
        };

        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            return { success: true, messageId: response.data.message.id };
        } catch (error) {
            console.error('Error sending document via Whapi:', error.response?.data || error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = WhapiProvider;
