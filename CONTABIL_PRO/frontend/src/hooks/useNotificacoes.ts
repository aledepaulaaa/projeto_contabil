import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace('/api', '') + '/ws';

export interface Notificacao {
  tipo: string;
  mensagem: string;
  leadId?: string;
  data: number;
}

export const useNotificacoes = (empresaIdOverride?: string | null) => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [conectado, setConectado] = useState(false);
  const empresaLocatariaId = empresaIdOverride || localStorage.getItem('empresaLocatariaId');
  const departamentoId = localStorage.getItem('departamentoId');

  useEffect(() => {
    if (!empresaLocatariaId) return;

    const socket = new SockJS(SOCKET_URL);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log('[STOMP] ' + str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setConectado(true);
      console.log('[STOMP] Conectado ao WebSocket');
      
      client.subscribe(`/topic/leads/${empresaLocatariaId}`, (message) => {
        const payload = JSON.parse(message.body) as Notificacao;
        
        // SINCRONIZAÇÃO EM TEMPO REAL: Sinal para recarregar contatos
        if (payload.tipo === 'RELOAD_CONTACTS') {
          console.log('[STOMP] Recebido sinal RELOAD_CONTACTS');
          window.dispatchEvent(new CustomEvent('reload-contacts'));
          return; // Não exibe notificação visual para este sinal técnico
        }

        setNotificacoes((prev) => [payload, ...prev]);
        if (Notification.permission === 'granted') {
          new Notification('Novo Lead', { body: payload.mensagem });
        }
      });

      client.subscribe(`/topic/contratos/${empresaLocatariaId}`, (message) => {
        const payload = JSON.parse(message.body) as Notificacao;
        setNotificacoes((prev) => [payload, ...prev]);
        if (Notification.permission === 'granted') {
          new Notification('Contrato Disponível', { body: payload.mensagem });
        }
      });

      client.subscribe(`/topic/whatsapp/${empresaLocatariaId}`, (message) => {
        const payload = JSON.parse(message.body) as Notificacao;
        setNotificacoes((prev) => [payload, ...prev]);
        if (Notification.permission === 'granted') {
          new Notification('WhatsApp Enviado', { body: payload.mensagem });
        }
      });

      // Subscrição SETORIAL (Notificações exclusivas do Departamento)
      if (departamentoId) {
        client.subscribe(`/topic/leads/${empresaLocatariaId}/${departamentoId}`, (message) => {
          const payload = JSON.parse(message.body) as Notificacao;
          setNotificacoes((prev) => [payload, ...prev]);
          if (Notification.permission === 'granted') {
            new Notification('Aviso do Setor', { body: payload.mensagem });
          }
        });
      }
    };

    client.onStompError = (frame) => {
      console.error('[STOMP] Erro: ' + frame.headers['message']);
      setConectado(false);
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [empresaLocatariaId]);

  const limparNotificacoes = () => setNotificacoes([]);

  return { notificacoes, conectado, limparNotificacoes };
};
