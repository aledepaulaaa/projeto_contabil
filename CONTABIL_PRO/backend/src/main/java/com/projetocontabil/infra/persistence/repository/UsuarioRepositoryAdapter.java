package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.usuario.model.Papel;
import com.projetocontabil.core.domain.usuario.model.Permissao;
import com.projetocontabil.core.domain.usuario.model.Usuario;
import com.projetocontabil.core.ports.driven.UsuarioRepository;
import com.projetocontabil.infra.persistence.entity.UsuarioJpaEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class UsuarioRepositoryAdapter implements UsuarioRepository {

    private final UsuarioJpaRepository jpaRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioRepositoryAdapter(UsuarioJpaRepository jpaRepository, PasswordEncoder passwordEncoder) {
        this.jpaRepository = jpaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Optional<Usuario> findByEmail(String email) {
        return jpaRepository.findByEmail(email).map(this::toDomain);
    }

    @Override
    public Optional<Usuario> findByIdentificador(String identificador) {
        return jpaRepository.findByEmail(identificador)
                .or(() -> jpaRepository.findByNome(identificador))
                .map(this::toDomain);
    }

    @Override
    public Optional<Usuario> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Usuario> findAllByEmpresaLocatariaId(String empresaLocatariaId) {
        return jpaRepository.findAllByEmpresaLocatariaId(empresaLocatariaId)
                .stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<Usuario> findByDepartamentoId(UUID departamentoId) {
        return jpaRepository.findAllByDepartamentoId(departamentoId)
                .stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public boolean existsByEmailAndEmpresaLocatariaId(String email, String empresaLocatariaId) {
        return jpaRepository.existsByEmailAndEmpresaLocatariaId(email, empresaLocatariaId);
    }

    @Override
    public Usuario save(Usuario usuario, String senhaTextoPlano) {
        var entity = toEntity(usuario);

        // Se uma senha em texto plano for fornecida, hashear antes de salvar
        if (senhaTextoPlano != null) {
            entity.setSenhaHash(passwordEncoder.encode(senhaTextoPlano));
        }

        var saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    private Usuario toDomain(UsuarioJpaEntity entity) {
        Set<Permissao> permissoes = entity.getPermissoes() != null
                ? entity.getPermissoes().stream()
                    .map(p -> {
                        try { return Permissao.valueOf(p); }
                        catch (Exception e) { return null; }
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet())
                : EnumSet.noneOf(Permissao.class);

        Papel papel;
        try {
            papel = entity.getPapel() != null ? Papel.valueOf(entity.getPapel()) : Papel.ADMIN;
        } catch (Exception e) {
            papel = Papel.ADMIN;
        }

        return Usuario.reconstituirCompleto(
                entity.getId(),
                entity.getEmpresaLocatariaId(),
                entity.getEmail(),
                entity.getUsername(),
                entity.getSenhaHash(),
                entity.getNome(),
                entity.getRole(),
                entity.isAtivo(),
                papel,
                entity.getDepartamentoId(),
                entity.getConvidadoPor(),
                permissoes
        );
    }

    private UsuarioJpaEntity toEntity(Usuario domain) {
        var entity = new UsuarioJpaEntity();
        entity.setId(domain.getId());
        entity.setEmpresaLocatariaId(domain.getEmpresaLocatariaId());
        entity.setEmail(domain.getEmail());
        entity.setUsername(domain.getUsername());
        entity.setSenhaHash(domain.getSenhaHash()); // pode ser sobrescrita pelo save()
        entity.setNome(domain.getNome());
        entity.setRole(domain.getRole());
        entity.setAtivo(domain.isAtivo());
        entity.setPapel(domain.getPapel() != null ? domain.getPapel().name() : "ADMIN");
        entity.setDepartamentoId(domain.getDepartamentoId());
        entity.setConvidadoPor(domain.getConvidadoPor());

        if (domain.getPermissoes() != null) {
            entity.setPermissoes(domain.getPermissoes().stream()
                    .map(Enum::name).collect(Collectors.toSet()));
        }

        return entity;
    }
}
