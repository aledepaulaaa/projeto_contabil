package com.projetocontabil.core.domain.usuario.model;

/**
 * Permissões granulares atribuíveis a usuários CONVIDADO.
 * Admin e Gestor possuem todas as permissões por padrão.
 */
public enum Permissao {
    TRANSFERIR_ATENDIMENTO,
    CRIAR_DEPARTAMENTO,
    VER_MENSAGENS_WHATSAPP,
    ALOCAR_USUARIOS,
    MARCAR_FLAGS_MENSAGEM,
    ATRIBUIR_PERMISSOES,
    ENCERRAR_ATENDIMENTO,
    INICIAR_ATENDIMENTO,
    GERENCIAR_AUTOMACOES,
    VER_CONEXAO_WHATSAPP
}
