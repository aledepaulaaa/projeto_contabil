package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.Contrato;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.ContratoRepository;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.infra.messaging.ContratoProducer;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Controller REST para o módulo de Contratos.
 * Endpoints de listagem, detalhes, ativação, cancelamento e retry.
 */
@RestController
@RequestMapping("/api/contratos")
@RequiredArgsConstructor
public class ContratoController {

    private final ContratoRepository contratoRepository;
    private final LeadRepository leadRepository;
    private final ContratoProducer contratoProducer;

    @GetMapping
    public ResponseEntity<?> listarContratos() {
        var empresaId = EmpresaLocatariaId.of(EmpresaLocatariaContext.getEmpresaLocatariaId());
        var contratos = contratoRepository.findAllByEmpresaLocatariaId(empresaId)
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(contratos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable UUID id) {
        return contratoRepository.findById(id)
                .map(contrato -> ResponseEntity.ok(toResponse(contrato)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/ativar")
    public ResponseEntity<?> ativarContrato(@PathVariable UUID id) {
        var contrato = contratoRepository.findById(id);
        if (contrato.isEmpty()) return ResponseEntity.notFound().build();

        try {
            var c = contrato.get();
            c.ativar();
            contratoRepository.save(c);
            return ResponseEntity.ok(toResponse(c));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelarContrato(@PathVariable UUID id, @RequestParam String motivo) {
        var contrato = contratoRepository.findById(id);
        if (contrato.isEmpty()) return ResponseEntity.notFound().build();

        try {
            var c = contrato.get();
            c.cancelar(motivo);
            contratoRepository.save(c);
            return ResponseEntity.ok(toResponse(c));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/retentar")
    public ResponseEntity<?> retentarGeracao(@PathVariable UUID id) {
        var contrato = contratoRepository.findById(id);
        if (contrato.isEmpty()) return ResponseEntity.notFound().build();

        try {
            var c = contrato.get();
            c.retentarGeracao();
            contratoRepository.save(c);

            // Re-enviar para fila RabbitMQ
            contratoProducer.enviarParaGeracaoDeContrato(
                c.getLeadId().toString(),
                c.getEmpresaLocatariaId().value(),
                c.getNomeContato(),
                c.getEmailContato()
            );

            return ResponseEntity.ok(toResponse(c));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/arquivar")
    public ResponseEntity<?> arquivarContrato(@PathVariable UUID id) {
        var contrato = contratoRepository.findById(id);
        if (contrato.isEmpty()) return ResponseEntity.notFound().build();

        try {
            var c = contrato.get();
            c.arquivar();
            contratoRepository.save(c);
            return ResponseEntity.ok(toResponse(c));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluirContrato(@PathVariable UUID id) {
        var contrato = contratoRepository.findById(id);
        if (contrato.isEmpty()) return ResponseEntity.notFound().build();
        
        contratoRepository.delete(contrato.get());
        return ResponseEntity.noContent().build();
    }

    /**
     * Gera uma visualização HTML do contrato (MOCK para desenvolvimento).
     */
    @GetMapping(value = "/{id}/documento", produces = org.springframework.http.MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> visualizarDocumento(@PathVariable UUID id) {
        var contratoOpt = contratoRepository.findById(id);
        if (contratoOpt.isEmpty()) return ResponseEntity.notFound().build();

        var contrato = contratoOpt.get();
        var lead = leadRepository.findById(contrato.getLeadId()).orElse(null);
        String nomeEmpresa = (lead != null && lead.getNomeEmpresa() != null) ? lead.getNomeEmpresa() : "CONTRATANTE EXPLOIT";

        String html = """
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Contrato de Prestação de Serviços Contábeis</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #334155; max-width: 800px; margin: 40px auto; padding: 40px; background: #f8fafc; }
                    .card { background: white; padding: 60px; border-radius: 12px; shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
                    h1 { color: #1e293b; text-align: center; margin-bottom: 40px; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
                    .partes { margin-bottom: 30px; }
                    .clausula { margin-bottom: 25px; }
                    .clausula h2 { font-size: 16px; color: #0f172a; margin-bottom: 8px; border-bottom: 2px solid #3b82f6; display: inline-block; }
                    .assinaturas { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; }
                    .linha-assinatura { border-top: 1px solid #94a3b8; padding-top: 10px; margin-top: 40px; }
                    .carimbo-zapsign { color: #3b82f6; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>Contrato de Prestação de Serviços Contábeis</h1>
                    
                    <div class="partes">
                        <p><strong>CONTRATADA:</strong> SUPREME CONTABILIDADE LTDA, com sede na Rua da Prosperidade, 1000, inscrita no CNPJ sob o nº 00.000.000/0001-00.</p>
                        <p><strong>CONTRATANTE:</strong> %s, representado por %s (E-mail: %s).</p>
                    </div>

                    <div class="clausula">
                        <h2>Cláusula 1ª - Do Objeto</h2>
                        <p>O presente contrato tem por objeto a prestação de serviços profissionais nas áreas contábil, fiscal e trabalhista para a CONTRATANTE.</p>
                    </div>

                    <div class="clausula">
                        <h2>Cláusula 2ª - Dos Honorários</h2>
                        <p>Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor mensal acordado conforme o plano selecionado no fechamento do CRM.</p>
                    </div>

                    <div class="clausula">
                        <h2>Cláusula 3ª - Do Prazo</h2>
                        <p>O presente instrumento tem validade indeterminada, podendo ser rescindido por qualquer das partes mediante aviso prévio de 30 dias.</p>
                    </div>

                    <div class="assinaturas">
                        <div>
                            <div class="linha-assinatura">SUPREME CONTABILIDADE</div>
                            <div class="carimbo-zapsign">✓ Assinado Digitalmente via ZapSign</div>
                        </div>
                        <div>
                            <div class="linha-assinatura">%s</div>
                            <div class="carimbo-zapsign">✓ Assinado Digitalmente via ZapSign</div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(nomeEmpresa, contrato.getNomeContato(), contrato.getEmailContato(), contrato.getNomeContato());

        return ResponseEntity.ok(html);
    }

    private Map<String, Object> toResponse(Contrato contrato) {
        var response = new LinkedHashMap<String, Object>();
        response.put("id", contrato.getId());
        response.put("leadId", contrato.getLeadId());
        response.put("status", contrato.getStatus().name());
        response.put("nomeContato", contrato.getNomeContato());
        response.put("emailContato", contrato.getEmailContato());
        response.put("urlDocumentoZapSign", contrato.getUrlDocumentoZapSign());
        response.put("motivoCancelamento", contrato.getMotivoCancelamento());
        response.put("criadoEm", contrato.getCriadoEm() != null ? contrato.getCriadoEm().toString() : null);
        response.put("atualizadoEm", contrato.getAtualizadoEm() != null ? contrato.getAtualizadoEm().toString() : null);

        // Enriquecer com dados do lead
        leadRepository.findById(contrato.getLeadId()).ifPresent(lead -> {
            response.put("nomeEmpresa", lead.getNomeEmpresa());
            response.put("leadStatus", lead.getStatus().name());
        });

        return response;
    }
}
