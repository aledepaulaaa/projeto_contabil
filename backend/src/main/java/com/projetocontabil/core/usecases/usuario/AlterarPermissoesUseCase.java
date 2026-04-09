package com.projetocontabil.core.usecases.usuario;

import com.projetocontabil.core.domain.usuario.model.Papel;
import com.projetocontabil.core.domain.usuario.model.Permissao;
import com.projetocontabil.core.domain.usuario.model.Usuario;
import com.projetocontabil.core.ports.driven.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;

/**
 * Use Case — Alterar permissões de um usuário.
 * Regras:
 *  - ADMIN pode alterar qualquer CONVIDADO ou GESTOR.
 *  - GESTOR pode alterar apenas CONVIDADO.
 *  - CONVIDADO não pode alterar ninguém.
 */
@Slf4j
@Service
public class AlterarPermissoesUseCase {

    private final UsuarioRepository usuarioRepository;

    public AlterarPermissoesUseCase(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public record Comando(UUID solicitanteId, UUID usuarioAlvoId, Set<Permissao> novasPermissoes, UUID departamentoId) {}

    public void executar(Comando comando) {
        log.info("[AlterarPermissoes] Solicitante {} alterando permissões de {}",
                comando.solicitanteId(), comando.usuarioAlvoId());

        var solicitante = usuarioRepository.findById(comando.solicitanteId())
                .orElseThrow(() -> new IllegalArgumentException("Solicitante não encontrado"));

        var alvo = usuarioRepository.findById(comando.usuarioAlvoId())
                .orElseThrow(() -> new IllegalArgumentException("Usuário alvo não encontrado"));

        // Validar hierarquia
        if (!solicitante.podeGerenciar(alvo)) {
            throw new IllegalArgumentException("Sem permissão para alterar este usuário");
        }

        // Reconstruir com novas permissões
        var atualizado = Usuario.reconstituirCompleto(
                alvo.getId(), alvo.getEmpresaLocatariaId(), alvo.getEmail(),
                alvo.getSenhaHash(), alvo.getNome(), alvo.getRole(), alvo.isAtivo(),
                alvo.getPapel(),
                comando.departamentoId() != null ? comando.departamentoId() : alvo.getDepartamentoId(),
                alvo.getConvidadoPor(), comando.novasPermissoes()
        );

        usuarioRepository.save(atualizado, null); // null = não altera senha

        log.info("[AlterarPermissoes] ✅ Permissões de {} atualizadas", alvo.getEmail());
    }
}
