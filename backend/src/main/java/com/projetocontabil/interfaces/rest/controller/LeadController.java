package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.crm.vo.Email;
import com.projetocontabil.core.domain.rotinas.model.RegimeTributario;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.core.usecases.crm.FinalizarOnboardingUseCase;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import com.projetocontabil.interfaces.rest.dto.CriarLeadRequest;
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
@RequestMapping("/api/leads")
public class LeadController {

    private final LeadRepository leadRepository;
    private final FinalizarOnboardingUseCase finalizarOnboardingUseCase;

    public LeadController(LeadRepository leadRepository,
                         FinalizarOnboardingUseCase finalizarOnboardingUseCase) {
        this.leadRepository = leadRepository;
        this.finalizarOnboardingUseCase = finalizarOnboardingUseCase;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> cadastrar(@RequestBody @Valid CriarLeadRequest request) {
        var id = EmpresaLocatariaId.of(EmpresaLocatariaContext.getCurrentTenant());

        if (leadRepository.existsByIdentificacaoAndEmpresaLocatariaId(new Identificacao(request.cnpj()), id)) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Lead já cadastrado"));
        }

        var lead = Lead.criar(id, request.nomeContato(), new Email(request.email()), new Identificacao(request.cnpj()), request.nomeEmpresa());
        var salvo = leadRepository.save(lead);
        return ResponseEntity.created(URI.create("/api/leads/" + salvo.getId())).body(toResponse(salvo));
    }

    @PostMapping("/{id}/converter")
    public ResponseEntity<Map<String, Object>> converter(@PathVariable UUID id, @RequestParam RegimeTributario regime) {
        Lead convertido = finalizarOnboardingUseCase.executar(id, regime);
        return ResponseEntity.ok(toResponse(convertido));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar() {
        var id = EmpresaLocatariaId.of(EmpresaLocatariaContext.getCurrentTenant());
        return ResponseEntity.ok(leadRepository.findAllByEmpresaLocatariaId(id).stream().map(this::toResponse).toList());
    }

    private Map<String, Object> toResponse(Lead lead) {
        return Map.of(
                "id", lead.getId(),
                "nomeContato", lead.getNomeContato(),
                "status", lead.getStatus().name()
        );
    }
}
