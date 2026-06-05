package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.usuario.model.Usuario;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository {
    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByIdentificador(String identificador);
    Optional<Usuario> findById(UUID id);
    List<Usuario> findAllByEmpresaLocatariaId(String empresaLocatariaId);
    List<Usuario> findByDepartamentoId(UUID departamentoId);
    boolean existsByEmailAndEmpresaLocatariaId(String email, String empresaLocatariaId);
    Usuario save(Usuario usuario, String senhaHasheada);
    void deleteById(UUID id);
}
