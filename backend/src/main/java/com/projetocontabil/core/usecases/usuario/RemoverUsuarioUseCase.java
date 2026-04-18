package com.projetocontabil.core.usecases.usuario;

import com.projetocontabil.core.ports.driven.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Use Case — Remover um usuário ou cancelar convite.
 * Regras:
 *  - Apenas membros autorizados podem remover (Admin > Gestor > Convidado).
 *  - Usuário não pode remover a si mesmo por este fluxo.
 *  - Ambos devem pertencer ao mesmo tenant.
 */
@Slf4j
@Service
public class RemoverUsuarioUseCase {

    private final UsuarioRepository usuarioRepository;

    public RemoverUsuarioUseCase(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public record Comando(UUID solicitanteId, UUID alvoId, String empresaLocatariaId) {}

    @Transactional
    public void executar(Comando comando) {
        log.info("[RemoverUsuario] Solicitante {} tentando remover usuário {}", 
                comando.solicitanteId(), comando.alvoId());

        if (comando.solicitanteId().equals(comando.alvoId())) {
            throw new IllegalArgumentException("Você não pode remover a si mesmo da equipe por este menu.");
        }

        var solicitante = usuarioRepository.findById(comando.solicitanteId())
                .orElseThrow(() -> new IllegalArgumentException("Solicitante não encontrado"));

        var alvo = usuarioRepository.findById(comando.alvoId())
                .orElseThrow(() -> new IllegalArgumentException("Usuário a ser removido não encontrado"));

        // Validar Tenant
        if (!solicitante.getEmpresaLocatariaId().equals(comando.empresaLocatariaId()) ||
            !alvo.getEmpresaLocatariaId().equals(comando.empresaLocatariaId())) {
            throw new IllegalArgumentException("Operação inválida: isolamento de dados violado.");
        }

        // Validar Hierarquia
        if (!solicitante.podeGerenciar(alvo)) {
            log.warn("[RemoverUsuario] ❌ Tentativa de remoção sem permissão: {} tentando remover {}", 
                    solicitante.getPapel(), alvo.getPapel());
            throw new IllegalArgumentException("Você não tem permissão hierárquica para remover este usuário.");
        }

        usuarioRepository.deleteById(comando.alvoId());
        log.info("[RemoverUsuario] ✅ Usuário {} removido com sucesso por {}", comando.alvoId(), comando.solicitanteId());
    }
}
