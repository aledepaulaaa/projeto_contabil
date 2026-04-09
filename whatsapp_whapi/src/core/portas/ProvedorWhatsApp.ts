/**
 * ProvedorWhatsApp — Interface/Porta abstrata (Core do domínio).
 * 
 * Define o contrato que qualquer implementação de provedor WhatsApp
 * deve cumprir (Whapi, WWebJS, etc). Segue o princípio de Inversão
 * de Dependência (DIP) — Use Cases dependem APENAS desta interface.
 */

/** Resultado padronizado de operações de envio */
export interface ResultadoEnvio {
  sucesso: boolean;
  idMensagem?: string;
  timestamp?: number;
  erro?: string;
}

/** Contato WhatsApp retornado pela API */
export interface ContatoWhatsApp {
  id: string;
  nome?: string;
  pushname?: string;
  ehNegocio?: boolean;
  fotoPerfil?: string;
  status?: string;
  salvo?: boolean;
}

/** Chat WhatsApp retornado pela API */
export interface ChatWhatsApp {
  id: string;
  nome?: string;
  tipo?: string;
  timestamp?: number;
  ultimaMensagem?: string;
  naoLidas?: number;
}

/** Mensagem WhatsApp retornada pela API */
export interface MensagemWhatsApp {
  id: string;
  tipo?: string;
  chatId: string;
  de?: string;
  deMim: boolean;
  nomeRemetente?: string;
  texto?: string;
  timestamp: number;
  status?: string;
}

/** Lista paginada genérica */
export interface ListaPaginada<T> {
  itens: T[];
  total?: number;
  contagem: number;
  offset: number;
}

/** Resultado de criação de grupo */
export interface ResultadoGrupo {
  sucesso: boolean;
  grupoId?: string;
  erro?: string;
}

/** Status de saúde do canal */
export interface StatusSaude {
  canalId?: string;
  iniciado?: number;
  uptime?: number;
  status: {
    codigo: number;
    texto: string;
  };
}

/**
 * Interface principal do provedor WhatsApp.
 * Cada método representa uma capacidade do gateway.
 */
export interface ProvedorWhatsApp {

  /** Envia uma mensagem de texto para o destinatário */
  enviarMensagem(para: string, mensagem: string): Promise<ResultadoEnvio>;

  /** Envia um documento/arquivo para o destinatário */
  enviarDocumento(para: string, urlArquivo: string, nomeArquivo: string): Promise<ResultadoEnvio>;

  /** Obtém lista de contatos com paginação */
  obterContatos(limite?: number, offset?: number): Promise<ListaPaginada<ContatoWhatsApp>>;

  /** Obtém um contato específico pelo ID */
  obterContatoPorId(contatoId: string): Promise<ContatoWhatsApp | null>;

  /** Obtém lista de chats com paginação */
  obterChats(limite?: number, offset?: number): Promise<ListaPaginada<ChatWhatsApp>>;

  /** Obtém um chat específico pelo ID */
  obterChatPorId(chatId: string): Promise<ChatWhatsApp | null>;

  /** Obtém mensagens gerais com paginação */
  obterMensagens(limite?: number, offset?: number): Promise<ListaPaginada<MensagemWhatsApp>>;

  /** Obtém mensagens de um chat específico */
  obterMensagensPorChatId(chatId: string, limite?: number): Promise<ListaPaginada<MensagemWhatsApp>>;

  /** Cria um novo grupo WhatsApp */
  criarGrupo(nome: string, participantes: string[]): Promise<ResultadoGrupo>;

  /** Adiciona participante a um grupo existente */
  adicionarParticipanteGrupo(grupoId: string, participanteId: string): Promise<ResultadoGrupo>;

  /** Lista todos os grupos */
  obterGrupos(): Promise<ListaPaginada<ChatWhatsApp>>;

  /**
   * Obtém o QR Code atual para conexão (formato rowdata).
   */
  obterQR(): Promise<string | null>;

  /**
   * Desconecta/Desloga a instância atual.
   */
  desconectar(): Promise<boolean>;

  /**
   * Verifica saúde do canal via GET /health
   */
  verificarSaude(): Promise<StatusSaude>;
}
