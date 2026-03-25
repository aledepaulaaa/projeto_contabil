package com.projetocontabil.core.domain.crm.model;

/**
 * Máquina de estados do Contrato conforme a Bíblia do Projeto:
 * AGUARDANDO_ASSINATURA → ATIVO (após confirmação ZapSign)
 * AGUARDANDO_ASSINATURA | ATIVO → CANCELADO (requer motivo)
 */
public enum StatusContrato {
    AGUARDANDO_ASSINATURA,
    ATIVO,
    CANCELADO
}
