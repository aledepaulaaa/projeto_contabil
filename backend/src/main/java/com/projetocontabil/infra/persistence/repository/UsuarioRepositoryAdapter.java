package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.usuario.model.Usuario;
import com.projetocontabil.core.ports.driven.UsuarioRepository;
import com.projetocontabil.infra.persistence.entity.UsuarioJpaEntity;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class UsuarioRepositoryAdapter implements UsuarioRepository {

    private final UsuarioJpaRepository jpaRepository;

    public UsuarioRepositoryAdapter(UsuarioJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<Usuario> findByEmail(String email) {
        return jpaRepository.findByEmail(email).map(this::toDomain);
    }

    @Override
    public Optional<Usuario> findByIdentificador(String identificador) {
        // Busca por e-mail ou nome (username)
        return jpaRepository.findByEmail(identificador)
                .or(() -> jpaRepository.findByNome(identificador))
                .map(this::toDomain);
    }

    private Usuario toDomain(UsuarioJpaEntity entity) {
        return Usuario.reconstituir(
                entity.getId(),
                entity.getEmpresaLocatariaId(),
                entity.getEmail(),
                entity.getSenhaHash(),
                entity.getNome(),
                entity.getRole(),
                entity.isAtivo()
        );
    }
}
