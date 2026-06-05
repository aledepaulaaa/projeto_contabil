import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import axios from 'axios';

// Configuração
import { ambiente, validarAmbiente } from './config/ambiente.js';
import { configurarSwagger } from './config/swagger.js';

// Core / Infra
import { WhapiProvedor } from './infra/whapi/WhapiProvedor.js';
import { ConsumidorRabbitMQ } from './infra/mensageria/ConsumidorRabbitMQ.js';

// Use Cases
import { EnviarMensagemUseCase } from './use-cases/EnviarMensagemUseCase.js';
import { EnviarDocumentoUseCase } from './use-cases/EnviarDocumentoUseCase.js';
import { ObterContatosUseCase } from './use-cases/ObterContatosUseCase.js';
import { ObterChatUseCase } from './use-cases/ObterChatUseCase.js';
import { ObterMensagensUseCase } from './use-cases/ObterMensagensUseCase.js';
import { GerenciarGrupoUseCase } from './use-cases/GerenciarGrupoUseCase.js';

// Controllers
import { criarStatusControlador } from './controllers/StatusControlador.js';
import { criarMensagemControlador } from './controllers/MensagemControlador.js';
import { criarContatoControlador } from './controllers/ContatoControlador.js';
import { criarChatControlador } from './controllers/ChatControlador.js';
import { criarGrupoControlador } from './controllers/GrupoControlador.js';

// ============================================================
// 1. BOOT — Validar ambiente
// ============================================================
validarAmbiente();

// ============================================================
// 2. INJEÇÃO DE DEPENDÊNCIAS
// ============================================================

/** Provedor Whapi Cloud — implementação concreta da interface ProvedorWhatsApp */
const provedor = new WhapiProvedor(ambiente.WHAPI_API_TOKEN, ambiente.WHAPI_BASE_URL);

/** Use Cases — orquestram regras de negócio */
const enviarMensagemUseCase = new EnviarMensagemUseCase(provedor);
const enviarDocumentoUseCase = new EnviarDocumentoUseCase(provedor);
const obterContatosUseCase = new ObterContatosUseCase(provedor);
const obterChatUseCase = new ObterChatUseCase(provedor);
const obterMensagensUseCase = new ObterMensagensUseCase(provedor);
const gerenciarGrupoUseCase = new GerenciarGrupoUseCase(provedor);

// ============================================================
// 3. CONFIGURAR EXPRESS + SOCKET.IO
// ============================================================

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Em produção, restringir ao domínio do frontend
    methods: ['GET', 'POST']
  }
});

// ============================================================
// 4. REGISTRAR ROTAS (Controllers)
// ============================================================

app.use('/api/whatsapp', criarStatusControlador(provedor));
app.use('/api/whatsapp', criarMensagemControlador(enviarMensagemUseCase, enviarDocumentoUseCase, obterMensagensUseCase));
app.use('/api/whatsapp', criarContatoControlador(obterContatosUseCase));
app.use('/api/whatsapp', criarChatControlador(obterChatUseCase));
app.use('/api/whatsapp', criarGrupoControlador(gerenciarGrupoUseCase));

// Documentação Swagger
configurarSwagger(app);

// ============================================================
// 5. EVENTOS DO PROVEDOR -> SOCKET.IO (Real-time)
// ============================================================

/** Encaminha eventos internos do provedor para o mundo externo via Socket.io */
provedor.on('qr', (qr) => {
  console.log('[Socket.IO] 📡 Emitindo novo QR Code');
  io.emit('whatsapp_qr', qr);
});

provedor.on('ready', () => {
  console.log('[Socket.IO] 📡 Emitindo status READY');
  io.emit('whatsapp_ready');
});

provedor.on('authenticated', () => {
  console.log('[Socket.IO] 📡 Emitindo status AUTHENTICATED');
  io.emit('whatsapp_authenticated');
});

// ============================================================
// 6. WEBSOCKET (Socket.IO) — Compatibilidade com frontend
// ============================================================

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Cliente conectado: ${socket.id}`);

  /**
   * Ao conectar, verifica o status do canal e emite evento compatível.
   */
  provedor.verificarSaude().then(async (saude) => {
    if (saude.status.texto === 'AUTH') {
      socket.emit('whatsapp_ready');
      socket.emit('whatsapp_authenticated');
    } else {
      console.log('[Socket.IO] Canal não autenticado. Tentando obter QR para o novo cliente...');
      const qr = await provedor.obterQR();
      if (qr) {
        console.log('[Socket.IO] 📡 Emitindo QR Code para o novo cliente');
        socket.emit('whatsapp_qr', qr);
      } else {
        console.warn('[Socket.IO] ⚠️ Nenhum QR Code disponível no momento para o novo cliente');
      }
    }
  }).catch(() => {
    // Silencioso
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`);
  });
});

// ============================================================
// 7. RABBIT MQ — Consumidor de mensagens automáticas
// ============================================================

const consumidorRabbit = new ConsumidorRabbitMQ(enviarMensagemUseCase, ambiente.RABBITMQ_URL);
consumidorRabbit.conectar();

// ============================================================
// 8. INICIAR SERVIDOR
// ============================================================

server.listen(ambiente.PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   🚀 WhatsApp Whapi Gateway — Projeto Contábil SaaS    ║');
  console.log(`║   📡 Servidor rodando na porta ${ambiente.PORT}                    ║`);
  console.log(`║   📚 Swagger: http://localhost:${ambiente.PORT}/api-docs              ║`);
  console.log('║   🔌 Provider: Whapi Cloud                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
});

// ============================================================
// 8. GRACEFUL SHUTDOWN
// ============================================================

process.on('SIGINT', async () => {
  console.log('\n[Shutdown] Encerrando gateway...');
  await consumidorRabbit.desconectar();
  server.close(() => {
    console.log('[Shutdown] ✅ Gateway encerrado com sucesso.');
    process.exit(0);
  });
});

export { app, server };
