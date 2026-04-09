package com.projetocontabil.core.usecases.usuario;

import com.projetocontabil.core.domain.usuario.model.Papel;
import com.projetocontabil.core.domain.usuario.model.Permissao;
import com.projetocontabil.core.domain.usuario.model.Usuario;
import com.projetocontabil.core.ports.driven.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Use Case — Listar usuários do tenant com filtro opcional por departamento.
 */
@Slf4j
@Service
public class ListarUsuariosUseCase {

    private final UsuarioRepository usuarioRepository;

    public ListarUsuariosUseCase(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public record UsuarioResumo(
            UUID id, String email, String nome, Papel papel,
            UUID departamentoId, boolean ativo, List<Permissao> permissoes
    ) {}

    public List<UsuarioResumo> executar(String empresaLocatariaId, UUID departamentoId) {
        log.info("[ListarUsuarios] Listando para tenant={}, departamento={}", empresaLocatariaId, departamentoId);

        List<Usuario> usuarios;
        if (departamentoId != null) {
            usuarios = usuarioRepository.findByDepartamentoId(departamentoId);
        } else {
            usuarios = usuarioRepository.findAllByEmpresaLocatariaId(empresaLocatariaId);
        }

        return usuarios.stream()
                .map(u -> new UsuarioResumo(
                        u.getId(), u.getEmail(), u.getNome(), u.getPapel(),
                        u.getDepartamentoId(), u.isAtivo(),
                        u.getPermissoes() != null ? u.getPermissoes().stream().collect(Collectors.toList()) : List.of()
                ))
                .collect(Collectors.toList());
    }
}
