package com.projetocontabil.interfaces.rest.dto;

import java.util.Set;
import java.util.UUID;

public record AlterarPermissoesRequest(Set<String> permissoes, UUID departamentoId) {}
