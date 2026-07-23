package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.ContatoEmpresaJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ContatoEmpresaJpaRepository extends JpaRepository<ContatoEmpresaJpaEntity, UUID> {
}
