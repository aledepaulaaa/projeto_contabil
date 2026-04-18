package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.ports.driven.MensagemRepository;
import com.projetocontabil.infra.persistence.entity.MensagemChatJpaEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class MensagemRepositoryAdapter implements MensagemRepository {

    private final MensagemChatJpaRepository jpaRepository;

    @Override
    public void save(MensagemChatJpaEntity mensagem) {
        jpaRepository.save(mensagem);
    }

    @Override
    public List<MensagemChatJpaEntity> listarPorLeadId(UUID leadId) {
        return jpaRepository.findAllByLeadIdOrderByEnviadoEmAsc(leadId);
    }

    @Override
    public List<MensagemChatJpaEntity> listarVisiveisPorLeadId(UUID leadId) {
            return jpaRepository.findAllByLeadIdOrderByEnviadoEmAsc(leadId).stream()
                .filter(m -> Boolean.TRUE.equals(m.getVisivel()))
                .collect(Collectors.toList());
    }

    @Override
    public void atualizarVisibilidade(UUID mensagemId, boolean visivel) {
        jpaRepository.findById(mensagemId).ifPresent(m -> {
            m.setVisivel(visivel);
            jpaRepository.save(m);
        });
    }
}
