package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.usuario.model.Usuario;
import java.util.Optional;

public interface UsuarioRepository {
    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByIdentificador(String identificador);
}
