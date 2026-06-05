package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.departamento.model.Departamento;
import com.projetocontabil.core.usecases.departamento.GerenciarDepartamentoUseCase;
import com.projetocontabil.interfaces.rest.dto.DepartamentoRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/departamentos")
public class DepartamentoController {

    private static final Logger log = LoggerFactory.getLogger(DepartamentoController.class);

    private final GerenciarDepartamentoUseCase gerenciarUseCase;

    public DepartamentoController(GerenciarDepartamentoUseCase gerenciarUseCase) {
        this.gerenciarUseCase = gerenciarUseCase;
    }

    @GetMapping
    public ResponseEntity<?> listar(@RequestHeader("X-EmpresaLocataria-Id") String tenantId) {
        var departamentos = gerenciarUseCase.listar(tenantId);
        return ResponseEntity.ok(departamentos.stream().map(this::toResponse).toList());
    }

    @PostMapping
    public ResponseEntity<?> criar(
            @RequestHeader("X-EmpresaLocataria-Id") String tenantId,
            @RequestBody DepartamentoRequest request
    ) {
        try {
            var comando = new GerenciarDepartamentoUseCase.CriarComando(tenantId, request.nome(), request.descricao());
            var departamento = gerenciarUseCase.criar(comando);
            return ResponseEntity.ok(toResponse(departamento));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("erro", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(@PathVariable UUID id) {
        gerenciarUseCase.excluir(id);
        return ResponseEntity.ok(Map.of("mensagem", "Departamento excluído"));
    }

    @PostMapping("/inicializar")
    public ResponseEntity<?> inicializarPadrao(@RequestHeader("X-EmpresaLocataria-Id") String tenantId) {
        gerenciarUseCase.inicializarPadrao(tenantId);
        return ResponseEntity.ok(Map.of("mensagem", "Departamentos padrão inicializados"));
    }

    private Map<String, Object> toResponse(Departamento d) {
        return Map.of(
                "id", d.getId(),
                "nome", d.getNome(),
                "descricao", d.getDescricao() != null ? d.getDescricao() : "",
                "criadoEm", d.getCriadoEm().toString()
        );
    }
}
