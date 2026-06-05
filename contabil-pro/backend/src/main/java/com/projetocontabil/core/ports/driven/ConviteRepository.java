package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.usuario.model.ConviteUsuario;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConviteRepository {
    ConviteUsuario save(ConviteUsuario convite);
    Optional<ConviteUsuario> findByToken(String token);
    List<ConviteUsuario> findAllByEmpresaLocatariaId(String empresaLocatariaId);
    void deleteByToken(String token);
    void deleteById(UUID id);
    boolean existsByEmailAndEmpresaLocatariaId(String email, String empresaLocatariaId);
}
