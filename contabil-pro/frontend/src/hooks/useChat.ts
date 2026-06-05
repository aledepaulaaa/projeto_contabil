import { useEffect, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';
import { LeadService } from '../services/LeadService';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace('/api', '') + '/ws';

export interface MensagemChat {
  id: string;
  autor: 'atendente' | 'cliente' | 'sistema';
  texto: string;
  horario: string;
  tipo: 'EXTERNA' | 'INTERNA';
  visivel: boolean;
  restritoAdmin: boolean;
}

export const useChat = (leadId: string | undefined) => {
  const queryClient = useQueryClient();
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarHistorico = useCallback(async () => {
    if (!leadId || leadId === 'undefined' || leadId === 'null') return;
    setLoading(true);
    try {
      const historico = await LeadService.getChatHistory(leadId);
      const formatadas: MensagemChat[] = historico.map((m: any) => ({
        id: m.id,
        autor: m.remetente === 'LEAD' ? 'cliente' : 'atendente',
        texto: m.conteudo,
        horario: new Date(m.enviadoEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tipo: m.tipo || 'EXTERNA',
        visivel: m.visivel !== false,
        restritoAdmin: m.restritoAdmin || false,
      }));
      setMensagens(formatadas);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (!leadId || leadId === 'undefined' || leadId === 'null') return;

    carregarHistorico();
    
    // Etapa 4: Marcar como lido ao abrir o chat
    const marcarLido = async () => {
      try {
        await LeadService.marcarMensagensLidas(leadId);
        // Invalida a query de leads para atualizar os badges na sidebar
        queryClient.invalidateQueries({ queryKey: ['leads'] }); 
      } catch (e) {
        console.error('Erro ao marcar mensagens como lidas:', e);
      }
    };
    marcarLido();

    const socket = new SockJS(SOCKET_URL);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log('[STOMP-CHAT] ' + str),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      console.log('[STOMP-CHAT] Conectado ao tópico do lead', leadId);
      client.subscribe(`/topic/chat/${leadId}`, (message) => {
        const payload = JSON.parse(message.body);
        if (payload.tipo === 'NOVA_MENSAGEM') {
          const novaMsg: MensagemChat = {
            id: payload.id || Date.now().toString(),
            autor: payload.remetente === 'LEAD' ? 'cliente' : 'atendente',
            texto: payload.mensagem,
            horario: new Date(payload.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            tipo: payload.tipoMensagem || 'EXTERNA',
            visivel: payload.visivel !== false,
            restritoAdmin: payload.restritoAdmin || false,
          };
          
          if (payload.remetente === 'LEAD') {
            marcarLido(); // Marcar como lido se chegar mensagem nova enquanto o chat está aberto
          }

          setMensagens((prev) => [...prev, novaMsg]);
        }
      });
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [leadId, carregarHistorico]);

  return { mensagens, loading, carregarHistorico };
};
