package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.usuario.model.Papel;
import com.projetocontabil.core.domain.usuario.model.Permissao;
import com.projetocontabil.core.usecases.usuario.AlterarPermissoesUseCase;
import com.projetocontabil.core.usecases.usuario.ConvidarUsuarioUseCase;
import com.projetocontabil.core.usecases.usuario.ListarUsuariosUseCase;
import com.projetocontabil.interfaces.rest.dto.AlterarPermissoesRequest;
import com.projetocontabil.interfaces.rest.dto.ConvidarUsuarioRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.EnumSet;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioGestaoController {

    private static final Logger log = LoggerFactory.getLogger(UsuarioGestaoController.class);

    private final ConvidarUsuarioUseCase convidarUseCase;
    private final ListarUsuariosUseCase listarUseCase;
    private final AlterarPermissoesUseCase alterarPermissoesUseCase;

    public UsuarioGestaoController(ConvidarUsuarioUseCase convidarUseCase,
                                    ListarUsuariosUseCase listarUseCase,
                                    AlterarPermissoesUseCase alterarPermissoesUseCase) {
        this.convidarUseCase = convidarUseCase;
        this.listarUseCase = listarUseCase;
        this.alterarPermissoesUseCase = alterarPermissoesUseCase;
    }

    @GetMapping
    public ResponseEntity<?> listar(
            @RequestHeader("X-EmpresaLocataria-Id") String tenantId,
            @RequestParam(required = false) UUID departamentoId
    ) {
        var usuarios = listarUseCase.executar(tenantId, departamentoId);
        return ResponseEntity.ok(usuarios);
    }

    @PostMapping("/convidar")
    public ResponseEntity<?> convidar(
            @RequestHeader("X-EmpresaLocataria-Id") String tenantId,
            @RequestBody ConvidarUsuarioRequest request
    ) {
        // TODO: Extrair solicitanteId do JWT real. Por agora, buscar admin do tenant.
        UUID solicitanteId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

        var permissoes = request.permissoes() != null
                ? request.permissoes().stream()
                    .map(p -> { try { return Permissao.valueOf(p); } catch (Exception e) { return null; } })
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toCollection(() -> EnumSet.noneOf(Permissao.class)))
                : EnumSet.noneOf(Permissao.class);

        var comando = new ConvidarUsuarioUseCase.Comando(
                solicitanteId, tenantId, request.email(), request.nome(),
                Papel.valueOf(request.papel()), request.departamentoId(), permissoes
        );

        try {
            var resultado = convidarUseCase.executar(comando);
            return ResponseEntity.ok(resultado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("erro", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("erro", e.getMessage()));
        }
    }

    @PutMapping("/{id}/permissoes")
    public ResponseEntity<?> alterarPermissoes(
            @PathVariable UUID id,
            @RequestBody AlterarPermissoesRequest request
    ) {
        UUID solicitanteId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

        var permissoes = request.permissoes() != null
                ? request.permissoes().stream()
                    .map(p -> { try { return Permissao.valueOf(p); } catch (Exception e) { return null; } })
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toCollection(() -> EnumSet.noneOf(Permissao.class)))
                : EnumSet.noneOf(Permissao.class);

        try {
            var comando = new AlterarPermissoesUseCase.Comando(solicitanteId, id, permissoes, request.departamentoId());
            alterarPermissoesUseCase.executar(comando);
            return ResponseEntity.ok(Map.of("mensagem", "Permissões atualizadas"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("erro", e.getMessage()));
        }
    }
}
