package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.MensagemChatJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MensagemChatJpaRepository extends JpaRepository<MensagemChatJpaEntity, UUID> {
    List<MensagemChatJpaEntity> findAllByLeadIdOrderByEnviadoEmAsc(UUID leadId);
}
