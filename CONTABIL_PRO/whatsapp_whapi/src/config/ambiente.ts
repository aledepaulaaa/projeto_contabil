import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuração centralizada de variáveis de ambiente.
 * 
 * Valida a presença de variáveis obrigatórias ao iniciar o servidor.
 * Padrão: falha rápida (fail-fast) para evitar erros silenciosos.
 */
export const ambiente = {
  /** URL base da API Whapi */
  WHAPI_BASE_URL: process.env.WHAPI_BASE_URL || 'https://gate.whapi.cloud/',
  
  /** Token de autenticação Whapi (Bearer) */
  WHAPI_API_TOKEN: process.env.WHAPI_API_TOKEN || '',
  
  /** URL do webhook do Backend Java (para encaminhar mensagens recebidas) */
  BACKEND_WEBHOOK_URL: process.env.BACKEND_WEBHOOK_URL || 'http://localhost:8080/api/whatsapp/webhook',
  
  /** URL de conexão com RabbitMQ */
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  
  /** Porta do servidor Express */
  PORT: parseInt(process.env.PORT || '3001', 10),
};

/**
 * Valida que as variáveis críticas estão presentes.
 * Chamado no boot do servidor.
 */
export function validarAmbiente(): void {
  if (!ambiente.WHAPI_API_TOKEN) {
    console.warn('[Config] ⚠️ WHAPI_API_TOKEN não definido. O provedor Whapi não funcionará.');
  }
  
  console.log('[Config] ✅ Variáveis de ambiente carregadas:');
  console.log(`  - WHAPI_BASE_URL: ${ambiente.WHAPI_BASE_URL}`);
  console.log(`  - BACKEND_WEBHOOK_URL: ${ambiente.BACKEND_WEBHOOK_URL}`);
  console.log(`  - RABBITMQ_URL: ${ambiente.RABBITMQ_URL.replace(/\/\/.*@/, '//***@')}`);
  console.log(`  - PORT: ${ambiente.PORT}`);
}
