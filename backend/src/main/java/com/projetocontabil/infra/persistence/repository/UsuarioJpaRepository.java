package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.infra.persistence.entity.UsuarioJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioJpaRepository extends JpaRepository<UsuarioJpaEntity, UUID> {
    Optional<UsuarioJpaEntity> findByEmail(String email);
    Optional<UsuarioJpaEntity> findByNome(String nome);
    List<UsuarioJpaEntity> findAllByEmpresaLocatariaId(String empresaLocatariaId);
    List<UsuarioJpaEntity> findAllByDepartamentoId(UUID departamentoId);
    boolean existsByEmailAndEmpresaLocatariaId(String email, String empresaLocatariaId);
}
