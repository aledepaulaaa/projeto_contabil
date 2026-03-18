package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.alvaras.model.Alvara;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.AlvaraRepository;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/alvaras")
public class AlvaraController {

    private final AlvaraRepository repository;

    public AlvaraController(AlvaraRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<Alvara>> listar() {
        var id = EmpresaLocatariaId.of(EmpresaLocatariaContext.getCurrentTenant());
        return ResponseEntity.ok(repository.findAllAlvarasByEmpresaLocatariaId(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Alvara> buscar(@PathVariable UUID id) {
        return repository.findAlvaraById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
