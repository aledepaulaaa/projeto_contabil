require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const WWebJsProvider = require('./src/infra/wwebjs/WWebJsProvider');
const WhapiProvider = require('./src/infra/whapi/WhapiProvider');
const SendMessageUseCase = require('./src/use-cases/SendMessageUseCase');
const RabbitMQConsumer = require('./src/infra/messaging/RabbitMQConsumer');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Em produção, restringir ao domínio do frontend
        methods: ["GET", "POST"]
    }
});

// Injeção de Dependências - Pode ser configurado via ENV
const useWhapi = process.env.WHAPI_TOKEN ? true : false;
let provider;

if (useWhapi) {
    provider = new WhapiProvider(process.env.WHAPI_TOKEN);
    console.log('Utilizando Whapi Provider');
} else {
    provider = new WWebJsProvider();
    provider.initialize();
    console.log('Utilizando WWebJs Provider (Local)');
}

const sendMessageUseCase = new SendMessageUseCase(provider);

// Inicializar Consumidor RabbitMQ para automações
const rabbitConsumer = new RabbitMQConsumer(sendMessageUseCase);
rabbitConsumer.connect();
const axios = require('axios');

// Webhook para encaminhar mensagens recebidas para o Backend Java
const BACKEND_WEBHOOK_URL = process.env.BACKEND_WEBHOOK_URL;

// Eventos do Socket.io
io.on('connection', (socket) => {
    console.log('Cliente conectado via WebSocket:', socket.id);
    
    // Se já tivermos um QR code ativado, enviamos imediatamente
    const currentQr = provider.getQR ? provider.getQR() : null;
    if (currentQr) {
        socket.emit('whatsapp_qr', currentQr);
    }

    // Se já estiver pronto, avisamos
    if (provider.isReady && provider.isReady()) {
        socket.emit('whatsapp_ready');
    }

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// Encaminhar eventos do Provider para o Socket.io
provider.on('qr', (qr) => {
    io.emit('whatsapp_qr', qr);
});

provider.on('ready', () => {
    io.emit('whatsapp_ready');
});

provider.on('authenticated', () => {
    io.emit('whatsapp_authenticated');
});

provider.on('auth_failure', (msg) => {
    io.emit('whatsapp_auth_failure', msg);
});

provider.on('message_received', async (data) => {
    console.log(`Mensagem recebida de ${data.from}: ${data.body}`);
    try {
        await axios.post(BACKEND_WEBHOOK_URL, {
            from: data.from,
            message: data.body,
            timestamp: data.timestamp
        }, {
            headers: { 'X-Tenant-ID': 'test-tenant' } // TODO: Obter dinamicamente se necessário
        });
        console.log('Mensagem encaminhada ao Backend com sucesso.');
    } catch (error) {
        console.error('Erro ao encaminhar mensagem ao Backend:', error.message);
    }
});

// Endpoints da API
app.get('/api/whatsapp/status', (req, res) => {
    res.json({
        ready: useWhapi ? true : (provider.isReady ? provider.isReady() : false),
        provider: useWhapi ? 'whapi' : 'wwebjs'
    });
});

app.get('/api/whatsapp/qr', (req, res) => {
    if (useWhapi) return res.status(400).json({ message: 'Whapi não utiliza QR Code via esta API' });
    const qr = provider.getQR ? provider.getQR() : null;
    if (qr) {
        res.json({ qr });
    } else {
        res.status(404).json({ message: 'QR Code não disponível ou cliente já conectado' });
    }
});

app.post('/api/whatsapp/messages/send', async (req, res) => {
    try {
        const { to, message } = req.body;
        const result = await sendMessageUseCase.execute({ to, message });
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`WhatsApp Gateway Real-Time rodando na porta ${PORT}`);
});
