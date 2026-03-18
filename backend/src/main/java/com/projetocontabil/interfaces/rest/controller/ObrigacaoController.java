package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.rotinas.model.Obrigacao;
import com.projetocontabil.core.domain.rotinas.model.TipoObrigacao;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.ObrigacaoRepository;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/obrigacoes")
public class ObrigacaoController {

    private final ObrigacaoRepository repository;

    public ObrigacaoController(ObrigacaoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<Obrigacao>> listar(@PageableDefault(size = 10) Pageable pageable) {
        var id = EmpresaLocatariaId.of(EmpresaLocatariaContext.getCurrentTenant());
        return ResponseEntity.ok(repository.findAllByEmpresaLocatariaId(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Obrigacao> buscar(@PathVariable UUID id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
