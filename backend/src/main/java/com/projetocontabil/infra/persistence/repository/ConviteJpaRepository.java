package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.ConviteJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConviteJpaRepository extends JpaRepository<ConviteJpaEntity, UUID> {
    Optional<ConviteJpaEntity> findByToken(String token);
    List<ConviteJpaEntity> findAllByEmpresaLocatariaId(String empresaLocatariaId);
    void deleteByToken(String token);
    boolean existsByEmailAndEmpresaLocatariaId(String email, String empresaLocatariaId);
}
