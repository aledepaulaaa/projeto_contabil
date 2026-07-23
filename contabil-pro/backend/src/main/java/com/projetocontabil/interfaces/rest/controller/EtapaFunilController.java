package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.infra.persistence.entity.EtapaFunilJpaEntity;
import com.projetocontabil.infra.persistence.repository.EtapaFunilJpaRepository;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/crm/etapas")
public class EtapaFunilController {

    private final EtapaFunilJpaRepository etapaFunilJpaRepository;

    public EtapaFunilController(EtapaFunilJpaRepository etapaFunilJpaRepository) {
        this.etapaFunilJpaRepository = etapaFunilJpaRepository;
    }

    @GetMapping
    public ResponseEntity<List<EtapaFunilJpaEntity>> listar() {
        String tenantId = EmpresaLocatariaContext.getEmpresaLocatariaId();
        List<EtapaFunilJpaEntity> etapas = etapaFunilJpaRepository.findAllByEmpresaLocatariaIdOrderByOrdemAsc(tenantId);

        if (etapas.isEmpty()) {
            etapas = inicializarEtapasPadrao(tenantId);
        }

        return ResponseEntity.ok(etapas);
    }

    @PostMapping
    public ResponseEntity<EtapaFunilJpaEntity> salvar(@RequestBody EtapaFunilJpaEntity payload) {
        String tenantId = EmpresaLocatariaContext.getEmpresaLocatariaId();
        if (payload.getId() == null) {
            payload.setId(UUID.randomUUID());
        }
        payload.setEmpresaLocatariaId(tenantId);
        if (payload.getChave() != null) {
            payload.setChave(payload.getChave().toUpperCase().replace(" ", "_"));
        }
        EtapaFunilJpaEntity salva = etapaFunilJpaRepository.save(payload);
        return ResponseEntity.ok(salva);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> remover(@PathVariable UUID id) {
        etapaFunilJpaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private List<EtapaFunilJpaEntity> inicializarEtapasPadrao(String tenantId) {
        List<EtapaFunilJpaEntity> padroes = new ArrayList<>();
        padroes.add(new EtapaFunilJpaEntity(UUID.randomUUID(), tenantId, "LEAD", "Lead", 1, "#3b82f6"));
        padroes.add(new EtapaFunilJpaEntity(UUID.randomUUID(), tenantId, "QUALIFICACAO", "Qualificação", 2, "#6366f1"));
        padroes.add(new EtapaFunilJpaEntity(UUID.randomUUID(), tenantId, "PROPOSTA", "Proposta", 3, "#8b5cf6"));
        padroes.add(new EtapaFunilJpaEntity(UUID.randomUUID(), tenantId, "AGUARDANDO_APROVACAO", "Aguardando Aprovação", 4, "#f59e0b"));
        padroes.add(new EtapaFunilJpaEntity(UUID.randomUUID(), tenantId, "FECHAMENTO", "Fechamento", 5, "#10b981"));
        padroes.add(new EtapaFunilJpaEntity(UUID.randomUUID(), tenantId, "NAO_FECHOU", "Não Fechou", 6, "#ef4444"));

        etapaFunilJpaRepository.saveAll(padroes);
        return padroes;
    }
}
