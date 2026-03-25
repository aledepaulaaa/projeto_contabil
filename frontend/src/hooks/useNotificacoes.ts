import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace('/api', '') + '/ws';

export interface Notificacao {
  tipo: string;
  mensagem: string;
  data: number;
}

export const useNotificacoes = (tenantId: string | null) => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    if (!tenantId) return;

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
      
      client.subscribe(`/topic/leads/${tenantId}`, (message) => {
        const payload = JSON.parse(message.body) as Notificacao;
        setNotificacoes((prev) => [payload, ...prev]);
        
        // Alerta sonoro ou vibração opcional aqui
        if (Notification.permission === 'granted') {
           new Notification('Novo Lead no ContábilPro', { body: payload.mensagem });
        }
      });
    };

    client.onStompError = (frame) => {
      console.error('[STOMP] Erro: ' + frame.headers['message']);
      setConectado(false);
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [tenantId]);

  const limparNotificacoes = () => setNotificacoes([]);

  return { notificacoes, conectado, limparNotificacoes };
};
