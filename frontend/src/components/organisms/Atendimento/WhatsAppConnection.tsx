import React, { useState, useEffect } from 'react';
import { Card } from '../../atoms/Card/Card';
import { Texto } from '../../atoms/Texto/Texto';
import { Botao } from '../../atoms/Botao/Botao';
import { CheckCircle, XCircle, QrCode, LogOut, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { QRCodeCanvas } from 'qrcode.react';

// URL do Gateway WhatsApp (pode ser movido para .env futuramente)
const WHATSAPP_GATEWAY_URL = 'http://localhost:3001';

export const WhatsAppConnection: React.FC = () => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Busca inicial de status
    fetch(`${WHATSAPP_GATEWAY_URL}/api/whatsapp/status`)
      .then(res => res.json())
      .then(data => {
        if (data.ready) setStatus('connected');
      })
      .catch(err => console.error('Erro ao buscar status inicial:', err));

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const handleGenerateQR = () => {
    setStatus('connecting');
    
    // Inicia conexão WebSocket para ouvir o QR
    const newSocket = io(WHATSAPP_GATEWAY_URL);
    
    newSocket.on('whatsapp_qr', (qr: string) => {
        console.log('[WHATSAPP-SOCKET] QR Code recebido');
        setQrCode(qr);
        setStatus('disconnected'); // Mostra o QR
    });

    newSocket.on('whatsapp_ready', () => {
        console.log('[WHATSAPP-SOCKET] Pronto');
        setStatus('connected');
        setQrCode(null);
    });

    newSocket.on('whatsapp_authenticated', () => {
        console.log('[WHATSAPP-SOCKET] Autenticado');
        setStatus('connected');
        setQrCode(null);
    });

    newSocket.on('connect_error', () => {
        console.error('[WHATSAPP-SOCKET] Erro de conexão');
        setStatus('disconnected');
    });

    setSocket(newSocket);
  };

  const handleDisconnect = () => {
    // Chamar API de logout para encerrar sessão na Whapi
    fetch(`${WHATSAPP_GATEWAY_URL}/api/whatsapp/logout`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('[WHATSAPP] Desconectado com sucesso');
        }
      })
      .catch(err => console.error('[WHATSAPP] Erro ao desconectar:', err));

    setStatus('disconnected');
    setQrCode(null);
    if (socket) socket.disconnect();
  };

  return (
    <Card className="p-6 relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl transition-all group-hover:scale-150" />
      
      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        {/* Lado Esquerdo: Status e Info */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${
              status === 'connected' ? 'bg-emerald-500/10 text-emerald-500' : 
              status === 'connecting' ? 'bg-amber-500/10 text-amber-500' :
              'bg-slate-500/10 text-slate-500'
            }`}>
              {status === 'connected' ? <CheckCircle size={28} /> : 
               status === 'connecting' ? <RefreshCw className="animate-spin" size={28} /> : 
               <XCircle size={28} />}
            </div>
            <div>
              <Texto variant="titulo" className="text-xl">Conexão WhatsApp</Texto>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                    status === 'connected' ? 'bg-emerald-500' : 
                    status === 'connecting' ? 'bg-amber-500' : 
                    'bg-slate-400'
                }`} />
                <Texto variant="detalhe" className="font-bold uppercase tracking-widest opacity-70">
                    {status === 'connected' ? 'Instância Ativa' : 
                     status === 'connecting' ? 'Sincronizando...' : 
                     'Aguardando Conexão'}
                </Texto>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Texto variant="corpo" className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Conecte o dispositivo do consultor para iniciar atendimentos automáticos e manuais via WhatsApp Business.
            </Texto>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <Botao 
                variant={status === 'connected' ? 'outline' : 'primary'}
                className={`!w-auto px-6 h-11 flex items-center gap-2 ${status === 'connected' ? 'text-rose-500 border-rose-500/20 hover:bg-rose-500/5' : ''}`}
                onClick={status === 'connected' ? handleDisconnect : handleGenerateQR}
              >
                {status === 'connected' ? (
                  <> <LogOut size={18} /> Desconectar </>
                ) : (
                  <> <QrCode size={18} /> Gerar QR Code </>
                )}
              </Botao>
              
              {status === 'connected' && (
                <Texto variant="detalhe" className="mt-auto mb-3 text-slate-400 italic">
                    Instância pronta para uso.
                </Texto>
              )}
            </div>
          </div>
        </div>

        {/* Lado Direito: QR Code Container */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {status !== 'connected' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-56 h-56 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-center relative overflow-hidden group/qr shadow-2xl"
              >
                {status === 'connecting' && !qrCode ? (
                   <div className="flex flex-col items-center gap-4">
                     <RefreshCw className="animate-spin text-blue-500" size={40} />
                     <Texto variant="detalhe" className="font-bold">Gerando...</Texto>
                   </div>
                ) : qrCode ? (
                    <div className="p-2 bg-white rounded-xl relative overflow-hidden flex items-center justify-center">
                       {qrCode.startsWith('data:') ? (
                         <img src={qrCode} alt="WhatsApp QR Code" className="w-[180px] h-[180px] object-contain" />
                       ) : (
                         <QRCodeCanvas value={qrCode} size={180} />
                       )}
                       
                       {/* Efeito de Scanner Animado */}
                       <motion.div 
                         className="absolute inset-x-0 h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6] z-10"
                         animate={{ top: ['0%', '100%', '0%'] }}
                         transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                       />
                    </div>
                ) : (
                  <>
                    <QrCode size={120} className="text-slate-300 dark:text-slate-700 opacity-50" />
                    <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[2px] opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center">
                       <Texto variant="detalhe" className="font-bold text-blue-500">Aguardando Ação</Texto>
                    </div>
                  </>
                )}
              </motion.div>
            )}
            
            {status === 'connected' && (
               <motion.div
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="w-56 h-56 bg-emerald-500/5 border-2 border-emerald-500/20 rounded-3xl p-4 flex flex-col items-center justify-center text-center space-y-4"
               >
                 <div className="bg-emerald-500 text-white p-3 rounded-full shadow-lg shadow-emerald-500/30">
                    <CheckCircle size={32} />
                 </div>
                 <Texto variant="detalhe" className="font-bold text-emerald-600 dark:text-emerald-400">DISPOSITIVO CONECTADO</Texto>
               </motion.div>
            )}
          </AnimatePresence>
          
          {/* Scanning Animation */}
          {status === 'disconnected' && qrCode && (
             <motion.div 
               animate={{ y: [0, 200, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
               className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)] z-20 pointer-events-none"
             />
          )}
        </div>
      </div>
    </Card>
  );
};
