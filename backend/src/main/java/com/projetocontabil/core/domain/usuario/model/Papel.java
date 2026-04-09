package com.projetocontabil.core.domain.usuario.model;

/**
 * Papel do usuário no sistema RBAC.
 * Hierarquia: ADMIN > GESTOR > CONVIDADO
 */
public enum Papel {
    ADMIN,
    GESTOR,
    CONVIDADO
}
