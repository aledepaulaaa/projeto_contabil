package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.AutomacaoTemplate;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.AutomacaoTemplateRepository;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/automacao/templates")
@RequiredArgsConstructor
@Slf4j
public class AutomacaoTemplateController {

    private final AutomacaoTemplateRepository templateRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listarTemplates() {
        String empresaIdStr = EmpresaLocatariaContext.getEmpresaLocatariaId();
        if (empresaIdStr == null) return ResponseEntity.status(401).build();

        var empresaId = EmpresaLocatariaId.of(empresaIdStr);
        List<AutomacaoTemplate> templates = templateRepository.findAllByEmpresaLocatariaId(empresaId);

        var response = templates.stream().map(t -> Map.<String, Object>of(
                "gatilho", t.getGatilho().name(),
                "texto", t.getTexto()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> salvarTemplate(@RequestBody Map<String, String> payload) {
        String empresaIdStr = EmpresaLocatariaContext.getEmpresaLocatariaId();
        if (empresaIdStr == null) return ResponseEntity.status(401).build();

        String gatilhoStr = payload.get("gatilho");
        String texto = payload.get("texto");

        if (gatilhoStr == null || texto == null) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Gatilho e texto são obrigatórios."));
        }

        StatusLead gatilho;
        try {
            gatilho = StatusLead.valueOf(gatilhoStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Gatilho inválido."));
        }

        var empresaId = EmpresaLocatariaId.of(empresaIdStr);
        var templateExistente = templateRepository.findByEmpresaAndGatilho(empresaId, gatilho);

        AutomacaoTemplate template;
        if (templateExistente.isPresent()) {
            template = templateExistente.get();
            template.atualizarTexto(texto);
        } else {
            template = AutomacaoTemplate.criar(empresaId, gatilho, texto);
        }

        templateRepository.save(template);
        log.info("Template atualizado para o gatilho {} na empresa {}", gatilho, empresaIdStr);

        return ResponseEntity.ok(Map.of("gatilho", template.getGatilho().name(), "texto", template.getTexto()));
    }
}
