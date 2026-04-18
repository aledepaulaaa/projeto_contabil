package com.projetocontabil.core.ports.driven;

import com.projetocontabil.infra.persistence.entity.MensagemChatJpaEntity;
import java.util.List;
import java.util.UUID;

public interface MensagemRepository {
    void save(MensagemChatJpaEntity mensagem);
    List<MensagemChatJpaEntity> listarPorLeadId(UUID leadId);
    List<MensagemChatJpaEntity> listarVisiveisPorLeadId(UUID leadId);
    void atualizarVisibilidade(UUID mensagemId, boolean visivel);
}
