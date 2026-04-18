package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.atendimento.model.StatusAtendimento;
import com.projetocontabil.infra.persistence.entity.AtendimentoJpaEntity;
import com.projetocontabil.infra.persistence.repository.AtendimentoJpaRepository;
import com.projetocontabil.infra.persistence.repository.MensagemChatJpaRepository;
import com.projetocontabil.infra.services.atendimento.AtendimentoMetricsExportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/atendimento/metrics")
@RequiredArgsConstructor
@Slf4j
public class AtendimentoMetricsController {

    private final AtendimentoJpaRepository atendimentoRepository;
    private final MensagemChatJpaRepository mensagemRepository;
    private final AtendimentoMetricsExportService exportService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getMetrics(
            @RequestHeader("X-EmpresaLocataria-Id") String tenantId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) java.util.UUID departamentoId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) java.util.UUID atendenteId) {
        log.info("[Metrics] Coletando métricas reais para tenant: {}", tenantId);
        
        Map<String, Object> metrics = new HashMap<>();

        try {
            // Filtrar na memória para ganhar em flexibilidade dinâmica de data/setor
            List<AtendimentoJpaEntity> all = atendimentoRepository.findAllByEmpresaLocatariaId(tenantId);
            
            if (departamentoId != null) {
                all = all.stream().filter(a -> departamentoId.equals(a.getDepartamentoId())).toList();
            }
            if (atendenteId != null) {
                all = all.stream().filter(a -> atendenteId.equals(a.getAtendenteId())).toList();
            }

            long total = all.size();
            long aguardando = all.stream().filter(a -> a.getStatus() == StatusAtendimento.AGUARDANDO).count();
            long emAtendimento = all.stream().filter(a -> a.getStatus() == StatusAtendimento.EM_ATENDIMENTO).count();
            long encerrado = all.stream().filter(a -> a.getStatus() == StatusAtendimento.ENCERRADO).count();

            // Calcular tempo médio de espera na fila (dos que já foram puxados)
            var atendidos = all.stream().filter(a -> a.getPuxadoEm() != null && a.getCriadoEm() != null).toList();
            double mediaEsperaMinutos = atendidos.stream()
                .mapToLong(a -> java.time.Duration.between(a.getCriadoEm(), a.getPuxadoEm()).toMinutes())
                .average()
                .orElse(0.0);

            metrics.put("totalAtendimentos", total);
            metrics.put("totalAguardando", aguardando);
            metrics.put("totalEmAtendimento", emAtendimento);
            metrics.put("totalEncerrado", encerrado);
            metrics.put("tempoMedioRespostaMinutos", Math.round(mediaEsperaMinutos)); 
            
            long operadores = all.stream().map(AtendimentoJpaEntity::getAtendenteId)
                                .filter(java.util.Objects::nonNull).distinct().count();
            metrics.put("operadoresAtivos", operadores);
            
            // Adicionar flag de performance
            metrics.put("performance", mediaEsperaMinutos <= 5.0 ? "POSITIVA" : "NEGATIVA");

        } catch (Exception e) {
            log.error("[Metrics] Falha ao recuperar métricas. Retornando valores zerados: {}", e.getMessage());
            metrics.put("totalAtendimentos", 0L);
            metrics.put("totalAguardando", 0L);
            metrics.put("totalEmAtendimento", 0L);
            metrics.put("totalEncerrado", 0L);
            metrics.put("tempoMedioRespostaMinutos", 0);
            metrics.put("operadoresAtivos", 0);
            metrics.put("performance", "NEUTRA");
        }

        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportDashboard(
            @RequestHeader("X-EmpresaLocataria-Id") String tenantId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) java.util.UUID departamentoId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) java.util.UUID atendenteId) {
        log.info("[Metrics] Gerando exportação de PDF para tenant: {}", tenantId);
        
        try {
            // Coletar dados reais para o PDF
            Map<String, Object> metrics = getMetrics(tenantId, departamentoId, atendenteId).getBody();
            List<AtendimentoJpaEntity> atendimentos = atendimentoRepository.findAllByEmpresaLocatariaId(tenantId);
            
            if (departamentoId != null) {
                atendimentos = atendimentos.stream().filter(a -> departamentoId.equals(a.getDepartamentoId())).toList();
            }
            if (atendenteId != null) {
                atendimentos = atendimentos.stream().filter(a -> atendenteId.equals(a.getAtendenteId())).toList();
            }

            byte[] pdf = exportService.exportarDashboardPdf(metrics, atendimentos);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "dashboard-performance.pdf");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdf);
        } catch (Exception e) {
            log.error("[MetricsExport] Falha ao exportar PDF: {}", e.getMessage());
            // Retorna um status que não dispara o modal de suporte (204 No Content ou 404)
            return ResponseEntity.noContent().build();
        }
    }
}
