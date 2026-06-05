import { EventEmitter } from 'node:events';
import axios, { AxiosInstance } from 'axios';
import {
  ProvedorWhatsApp,
  ResultadoEnvio,
  ContatoWhatsApp,
  ChatWhatsApp,
  MensagemWhatsApp,
  ListaPaginada,
  ResultadoGrupo,
  StatusSaude
} from '../../core/portas/ProvedorWhatsApp.js';

/**
 * WhapiProvedor — Implementação concreta da API Whapi Cloud.
 * 
 * Responsável por traduzir as chamadas do domínio em requisições
 * HTTP para a API gate.whapi.cloud. Segue o padrão Adapter.
 * 
 * Documentação: /documentacoes_externas/whapi/
 */
export class WhapiProvedor extends EventEmitter implements ProvedorWhatsApp {
  private readonly cliente: AxiosInstance;
  private statusAnterior: string = 'UNKNOWN';
  private monitorInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly token: string,
    private readonly urlBase: string = 'https://gate.whapi.cloud'
  ) {
    super();
    this.cliente = axios.create({
      baseURL: this.urlBase,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30s timeout padrão
    });

    // Inicia o monitoramento de status proativo
    this.iniciarMonitoramento();
  }

  /**
   * Monitora a saúde do canal e emite eventos quando o status muda.
   */
  private iniciarMonitoramento() {
    if (this.monitorInterval) return;

    this.monitorInterval = setInterval(async () => {
      const saude = await this.verificarSaude();
      const statusAtual = saude.status.texto;

      if (statusAtual !== this.statusAnterior) {
        console.log(`[WhapiProvedor] Status alterado: ${this.statusAnterior} -> ${statusAtual}`);
        
        if (statusAtual === 'AUTH') {
          this.emit('ready');
          this.emit('authenticated');
        } else if (statusAtual === 'INIT' || statusAtual === 'QR') {
          // Se estiver iniciando ou já tiver QR pronto na API, emite para o frontend
          console.log(`[WhapiProvedor] 📡 Status ${statusAtual} detectado. Solicitando QR...`);
          // Pequeno delay para garantir que a Whapi processou o estado
          setTimeout(() => this.obterEEmitirQR(), 1000);
        }

        this.statusAnterior = statusAtual;
      }
    }, 10000); // Checa a cada 10 segundos
  }

  /** Obtém e emite o QR se necessário */
  private async obterEEmitirQR() {
    const qr = await this.obterQR();
    if (qr) {
      this.emit('qr', qr);
    }
  }

  /**
   * Encerra o monitoramento
   */
  destruir() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  /**
   * Envia mensagem de texto via POST /messages/text
   * Formato: { to, body, typing_time }
   */
  async enviarMensagem(para: string, mensagem: string): Promise<ResultadoEnvio> {
    try {
      const waId = await this.verificarEObterWaId(para);

      const resposta = await this.cliente.post('/messages/text', {
        typing_time: 2,
        to: waId,
        body: mensagem
      });

      console.log(`[WhapiProvedor] ✅ Mensagem enviada para ${waId} — Status: sucesso`);

      return {
        sucesso: true,
        idMensagem: resposta.data?.message?.id || resposta.data?.id,
        timestamp: Date.now()
      };
    } catch (erro: any) {
      console.error(`[WhapiProvedor] ❌ Falha ao enviar mensagem para ${para}:`, erro.response?.data?.error?.message || erro.message);

      return {
        sucesso: false,
        erro: erro.response?.data?.error?.message || erro.message
      };
    }
  }

  /**
   * Envia documento via POST /messages/document
   * Formato: { to, media, caption }
   */
  async enviarDocumento(para: string, urlArquivo: string, nomeArquivo: string): Promise<ResultadoEnvio> {
    try {
      const waId = await this.verificarEObterWaId(para);

      const resposta = await this.cliente.post('/messages/document', {
        to: waId,
        media: urlArquivo,
        caption: nomeArquivo
      });

      console.log(`[WhapiProvedor] ✅ Documento "${nomeArquivo}" enviado para ${waId} — Status: sucesso`);

      return {
        sucesso: true,
        idMensagem: resposta.data?.message?.id || resposta.data?.id
      };
    } catch (erro: any) {
      console.error(`[WhapiProvedor] ❌ Falha ao enviar documento para ${para}:`, erro.response?.data?.error?.message || erro.message);

      return {
        sucesso: false,
        erro: erro.response?.data?.error?.message || erro.message
      };
    }
  }

  /**
   * Lista contatos via GET /contacts
   */
  async obterContatos(limite: number = 100, offset: number = 0): Promise<ListaPaginada<ContatoWhatsApp>> {
    try {
      const resposta = await this.cliente.get('/contacts', {
        params: { count: limite, offset }
      });

      const contatos: ContatoWhatsApp[] = (resposta.data?.contacts || []).map((c: any) => ({
        id: c.id,
        nome: c.name,
        pushname: c.pushname,
        ehNegocio: c.is_business,
        fotoPerfil: c.profile_pic,
        status: c.status,
        salvo: c.saved
      }));

      return { itens: contatos, total: resposta.data?.total, contagem: contatos.length, offset };
    } catch (erro: any) {
      console.error('[WhapiProvedor] Erro ao obter contatos:', erro.message);
      return { itens: [], contagem: 0, offset };
    }
  }

  /**
   * Obtém contato por ID via GET /contacts/{ContactID}
   */
  async obterContatoPorId(contatoId: string): Promise<ContatoWhatsApp | null> {
    try {
      const resposta = await this.cliente.get(`/contacts/${contatoId}`);
      const c = resposta.data;

      return {
        id: c.id,
        nome: c.name,
        pushname: c.pushname,
        ehNegocio: c.is_business,
        fotoPerfil: c.profile_pic,
        status: c.status,
        salvo: c.saved
      };
    } catch (erro: any) {
      console.error(`[WhapiProvedor] Erro ao obter contato ${contatoId}:`, erro.message);
      return null;
    }
  }

  /**
   * Lista chats via GET /chats
   */
  async obterChats(limite: number = 100, offset: number = 0): Promise<ListaPaginada<ChatWhatsApp>> {
    try {
      const resposta = await this.cliente.get('/chats', {
        params: { count: limite, offset }
      });

      const chats: ChatWhatsApp[] = (resposta.data?.chats || []).map((c: any) => ({
        id: c.id,
        nome: c.name,
        tipo: c.type,
        timestamp: c.timestamp,
        ultimaMensagem: c.last_message?.text?.body,
        naoLidas: c.unread_count
      }));

      return { itens: chats, total: resposta.data?.total, contagem: chats.length, offset };
    } catch (erro: any) {
      console.error('[WhapiProvedor] Erro ao obter chats:', erro.message);
      return { itens: [], contagem: 0, offset };
    }
  }

  /**
   * Obtém chat por ID via GET /chats/{ChatID}
   */
  async obterChatPorId(chatId: string): Promise<ChatWhatsApp | null> {
    try {
      const resposta = await this.cliente.get(`/chats/${chatId}`);
      const c = resposta.data;

      return {
        id: c.id,
        nome: c.name,
        tipo: c.type,
        timestamp: c.timestamp,
        ultimaMensagem: c.last_message?.text?.body,
        naoLidas: c.unread_count
      };
    } catch (erro: any) {
      console.error(`[WhapiProvedor] Erro ao obter chat ${chatId}:`, erro.message);
      return null;
    }
  }

  /**
   * Lista mensagens gerais via GET /messages/list
   */
  async obterMensagens(limite: number = 100, offset: number = 0): Promise<ListaPaginada<MensagemWhatsApp>> {
    try {
      const resposta = await this.cliente.get('/messages/list', {
        params: { count: limite, offset }
      });

      const mensagens = this.mapearMensagens(resposta.data?.messages || []);

      return { itens: mensagens, total: resposta.data?.total, contagem: mensagens.length, offset };
    } catch (erro: any) {
      console.error('[WhapiProvedor] Erro ao obter mensagens:', erro.message);
      return { itens: [], contagem: 0, offset };
    }
  }

  /**
   * Lista mensagens por chat via GET /messages/list/{ChatID}
   */
  async obterMensagensPorChatId(chatId: string, limite: number = 100): Promise<ListaPaginada<MensagemWhatsApp>> {
    try {
      const resposta = await this.cliente.get(`/messages/list/${chatId}`, {
        params: { count: limite }
      });

      const mensagens = this.mapearMensagens(resposta.data?.messages || []);

      return { itens: mensagens, total: resposta.data?.total, contagem: mensagens.length, offset: 0 };
    } catch (erro: any) {
      console.error(`[WhapiProvedor] Erro ao obter mensagens do chat ${chatId}:`, erro.message);
      return { itens: [], contagem: 0, offset: 0 };
    }
  }

  /**
   * Cria grupo via POST /groups
   * Formato: { subject, participants }
   */
  async criarGrupo(nome: string, participantes: string[]): Promise<ResultadoGrupo> {
    try {
      const participantesFormatados = participantes.map(p =>
        p.includes('@') ? p : `${p}@s.whatsapp.net`
      );

      const resposta = await this.cliente.post('/groups', {
        subject: nome,
        participants: participantesFormatados
      });

      console.log(`[WhapiProvedor] ✅ Grupo "${nome}" criado com sucesso`);

      return {
        sucesso: true,
        grupoId: resposta.data?.group_id || resposta.data?.id
      };
    } catch (erro: any) {
      console.error(`[WhapiProvedor] ❌ Falha ao criar grupo "${nome}":`, erro.response?.data?.error?.message || erro.message);
      return { sucesso: false, erro: erro.response?.data?.error?.message || erro.message };
    }
  }

  /**
   * Adiciona participante ao grupo via PUT /groups/{GroupID}/participants
   */
  async adicionarParticipanteGrupo(grupoId: string, participanteId: string): Promise<ResultadoGrupo> {
    try {
      const participante = participanteId.includes('@')
        ? participanteId
        : `${participanteId}@s.whatsapp.net`;

      await this.cliente.put(`/groups/${grupoId}/participants`, {
        participants: [participante]
      });

      console.log(`[WhapiProvedor] ✅ Participante adicionado ao grupo ${grupoId}`);

      return { sucesso: true };
    } catch (erro: any) {
      console.error(`[WhapiProvedor] ❌ Falha ao adicionar participante ao grupo ${grupoId}:`, erro.message);
      return { sucesso: false, erro: erro.response?.data?.error?.message || erro.message };
    }
  }

  /**
   * Lista grupos via GET /groups
   */
  async obterGrupos(): Promise<ListaPaginada<ChatWhatsApp>> {
    try {
      const resposta = await this.cliente.get('/groups');

      const grupos: ChatWhatsApp[] = (resposta.data?.groups || []).map((g: any) => ({
        id: g.id,
        nome: g.name || g.subject,
        tipo: 'group',
        timestamp: g.timestamp,
        naoLidas: g.unread_count
      }));

      return { itens: grupos, total: resposta.data?.total, contagem: grupos.length, offset: 0 };
    } catch (erro: any) {
      console.error('[WhapiProvedor] Erro ao obter grupos:', erro.message);
      return { itens: [], contagem: 0, offset: 0 };
    }
  }

  /**
   * Obtém o QR Code atual para conexão (formato rowdata).
   * Chama GET /users/login
   */
  async obterQR(): Promise<string | null> {
    try {
      const resposta = await this.cliente.get('/users/login');
      const data = resposta.data;

      console.log(`[WhapiProvedor] Resposta de login: status=${data.status}, tem_rowdata=${!!data.rowdata}`);

      // Aceita OK ou WAITING se tiver rowdata
      if ((data.status === 'OK' || data.status === 'WAITING') && data.rowdata) {
        console.log('[WhapiProvedor] ✅ QR Code (rowdata) obtido com sucesso');
        return data.rowdata;
      }

      if (data.status === 'OK' && data.base64) {
        console.log('[WhapiProvedor] ✅ QR Code (base64) obtido com sucesso');
        // Garante que o base64 venha com o prefixo para o componente de imagem
        const prefixo = 'data:image/png;base64,';
        return data.base64.startsWith('data:') ? data.base64 : `${prefixo}${data.base64}`;
      }

      console.warn('[WhapiProvedor] ⚠️ Resposta de login sem dados utilizáveis:', data);
      return null;
    } catch (erro: any) {
      // 409 significa que já está conectado
      if (erro.response?.status === 409) {
        return null;
      }
      console.error('[WhapiProvedor] ❌ Erro ao obter QR Code:', erro.response?.data?.error?.message || erro.message);
      return null;
    }
  }

  /**
   * Desconecta/Desloga a instância atual via POST /users/logout
   */
  async desconectar(): Promise<boolean> {
    try {
      await this.cliente.post('/users/logout');
      console.log('[WhapiProvedor] ✅ Instância desconectada com sucesso');
      return true;
    } catch (erro: any) {
      if (erro.response?.status === 409) {
        console.warn('[WhapiProvedor] Instância já estava desconectada');
        return true;
      }
      console.error('[WhapiProvedor] ❌ Erro ao desconectar:', erro.response?.data?.error?.message || erro.message);
      return false;
    }
  }

  /**
   * Verifica saúde do canal via GET /health
   */
  async verificarSaude(): Promise<StatusSaude> {
    try {
      const resposta = await this.cliente.get('/health');

      return {
        canalId: resposta.data?.channel_id,
        iniciado: resposta.data?.start_at,
        uptime: resposta.data?.uptime,
        status: {
          codigo: resposta.data?.status?.code ?? 0,
          texto: resposta.data?.status?.text ?? 'UNKNOWN'
        }
      };
    } catch (erro: any) {
      console.error('[WhapiProvedor] Erro ao verificar saúde:', erro.message);
      return {
        status: { codigo: -1, texto: 'ERROR' }
      };
    }
  }

  /** Mapeia array de mensagens da API para formato interno */
  private mapearMensagens(mensagens: any[]): MensagemWhatsApp[] {
    return mensagens.map((m: any) => ({
      id: m.id,
      tipo: m.type,
      chatId: m.chat_id,
      de: m.from,
      deMim: m.from_me,
      nomeRemetente: m.from_name,
      texto: m.text?.body || m.body,
      timestamp: m.timestamp,
      status: m.status
    }));
  }

  /**
   * Limpa o número removendo caracteres não numéricos e garante o DDI 55 se necessário.
   * Replicando lógica do gateway legado.
   */
  private sanitizarNumero(numero: string): string {
    let limpo = numero.replace(/\D/g, '');
    
    // Se não tiver o 55 (Brasil) e tiver tamanho de número nacional (10 ou 11 dígitos)
    if (!limpo.startsWith('55') && (limpo.length === 10 || limpo.length === 11)) {
      limpo = '55' + limpo;
    }
    
    return limpo;
  }

  /**
   * Verifica se o número existe no WhatsApp e obtém o wa_id correto.
   * Útil para lidar com variação do 9º dígito no Brasil.
   */
  private async verificarEObterWaId(numeroOriginal: string): Promise<string> {
    // Se já for um ID completo (contém @), retorna como está
    if (numeroOriginal.includes('@')) return numeroOriginal;

    const limpo = this.sanitizarNumero(numeroOriginal);

    try {
      // Chama API de verificação de contatos (Check Phones)
      const resposta = await this.cliente.post('/contacts', {
        blocking: 'wait',
        force_check: false,
        contacts: [limpo]
      });

      const contato = resposta.data?.contacts?.[0];

      if (contato?.status === 'valid' && contato.wa_id) {
        console.log(`[WhapiProvedor] 🔍 Número verificado: ${limpo} -> ${contato.wa_id}`);
        return contato.wa_id;
      }

      console.warn(`[WhapiProvedor] ⚠️ Número ${limpo} não validado pela Whapi. Usando formato padrão.`);
      return `${limpo}@s.whatsapp.net`;
    } catch (erro: any) {
      console.error(`[WhapiProvedor] ❌ Falha ao verificar número ${limpo}:`, erro.message);
      return `${limpo}@s.whatsapp.net`;
    }
  }
}
