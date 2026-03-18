package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.rotinas.model.Obrigacao;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.AlvaraRepository;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.core.ports.driven.ObrigacaoRepository;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final LeadRepository leadRepository;
    private final ObrigacaoRepository obrigacaoRepository;
    private final AlvaraRepository alvaraRepository;

    public DashboardController(LeadRepository leadRepository,
                               ObrigacaoRepository obrigacaoRepository,
                               AlvaraRepository alvaraRepository) {
        this.leadRepository = leadRepository;
        this.obrigacaoRepository = obrigacaoRepository;
        this.alvaraRepository = alvaraRepository;
    }

    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        var id = EmpresaLocatariaId.of(EmpresaLocatariaContext.getCurrentTenant());

        long leadsNovos = leadRepository.countByEmpresaLocatariaIdAndStatus(id, StatusLead.NOVO);
        long leadsConvertidos = leadRepository.countByEmpresaLocatariaIdAndStatus(id, StatusLead.CONVERTIDO);
        long obrigacoesPendentes = obrigacaoRepository.countByEmpresaLocatariaIdAndStatus(id, Obrigacao.StatusObrigacao.A_FAZER);
        long alvarasVencidos = alvaraRepository.countVencidosByEmpresaLocatariaId(id);

        return ResponseEntity.ok(Map.of(
                "totalLeads", leadsNovos + leadsConvertidos,
                "obrigacoesPendentes", obrigacoesPendentes,
                "alvarasVencidos", alvarasVencidos,
                "faturamentoPrevisto", new BigDecimal("15000.00")
        ));
    }
}
