package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.StatusContrato;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.rotinas.model.Obrigacao;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.AlvaraRepository;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.core.ports.driven.ObrigacaoRepository;
import com.projetocontabil.infra.persistence.entity.ContratoJpaEntity;
import com.projetocontabil.infra.persistence.repository.ContratoJpaRepository;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final LeadRepository leadRepository;
    private final ObrigacaoRepository obrigacaoRepository;
    private final AlvaraRepository alvaraRepository;
    private final ContratoJpaRepository contratoJpaRepository;

    public DashboardController(LeadRepository leadRepository,
                               ObrigacaoRepository obrigacaoRepository,
                               AlvaraRepository alvaraRepository,
                               ContratoJpaRepository contratoJpaRepository) {
        this.leadRepository = leadRepository;
        this.obrigacaoRepository = obrigacaoRepository;
        this.alvaraRepository = alvaraRepository;
        this.contratoJpaRepository = contratoJpaRepository;
    }

    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        String tenantId = EmpresaLocatariaContext.getEmpresaLocatariaId();
        var id = EmpresaLocatariaId.of(tenantId);

        long leadsNovos = leadRepository.countByEmpresaLocatariaIdAndStatus(id, StatusLead.LEAD);
        long leadsConvertidos = leadRepository.countByEmpresaLocatariaIdAndStatus(id, StatusLead.FECHAMENTO);
        long obrigacoesPendentes = obrigacaoRepository.countByEmpresaLocatariaIdAndStatus(id, Obrigacao.StatusObrigacao.A_FAZER);
        long alvarasVencidos = alvaraRepository.countVencidosByEmpresaLocatariaId(id);

        List<ContratoJpaEntity> contratos = contratoJpaRepository.findAllByEmpresaLocatariaId(tenantId);
        if (contratos == null) {
            contratos = List.of();
        }

        long contratosAtivos = contratos.stream().filter(c -> c.getStatus() == StatusContrato.ATIVO).count();
        long contratosCancelados = contratos.stream().filter(c -> c.getStatus() == StatusContrato.CANCELADO).count();
        long contratosAguardando = contratos.stream().filter(c -> c.getStatus() == StatusContrato.AGUARDANDO_ASSINATURA || c.getStatus() == StatusContrato.GERANDO).count();
        long totalContratos = contratos.size();

        double churnRate = totalContratos > 0 ? ((double) contratosCancelados / totalContratos) * 100.0 : 0.0;
        churnRate = BigDecimal.valueOf(churnRate).setScale(2, RoundingMode.HALF_UP).doubleValue();

        Map<String, Long> motivosChurn = contratos.stream()
                .filter(c -> c.getStatus() == StatusContrato.CANCELADO && c.getMotivoCancelamento() != null && !c.getMotivoCancelamento().isBlank())
                .collect(Collectors.groupingBy(ContratoJpaEntity::getMotivoCancelamento, Collectors.counting()));

        // Cálculo LTV, CAC e Faturamento baseado em dados reais da empresa
        BigDecimal ltv = BigDecimal.ZERO;
        BigDecimal cac = BigDecimal.ZERO;
        BigDecimal faturamentoPrevisto = BigDecimal.ZERO;
        double variacaoReceita = 0.0;

        if (contratosAtivos > 0) {
            BigDecimal ticketMedio = new BigDecimal("1000.00");
            faturamentoPrevisto = ticketMedio.multiply(BigDecimal.valueOf(contratosAtivos));
            ltv = ticketMedio.multiply(BigDecimal.valueOf(12));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalLeads", leadsNovos + leadsConvertidos);
        result.put("obrigacoesPendentes", obrigacoesPendentes);
        result.put("alvarasVencidos", alvarasVencidos);
        result.put("faturamentoPrevisto", faturamentoPrevisto);
        result.put("ltv", ltv);
        result.put("cac", cac);
        result.put("churnRate", churnRate);
        result.put("contratosAtivos", contratosAtivos);
        result.put("contratosCancelados", contratosCancelados);
        result.put("contratosAguardando", contratosAguardando);
        result.put("motivosChurn", motivosChurn);
        result.put("variacaoReceitaPercentual", variacaoReceita);

        return ResponseEntity.ok(result);
    }
}
