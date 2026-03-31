package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.*;
import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.crm.vo.Email;
import com.projetocontabil.core.domain.rotinas.model.RegimeTributario;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.ContratoRepository;
import com.projetocontabil.core.ports.driven.HistoricoVidaLeadRepository;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.core.usecases.crm.FinalizarOnboardingUseCase;
import com.projetocontabil.core.usecases.crm.HistoricoExportService;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import com.projetocontabil.interfaces.rest.dto.CriarLeadRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.projetocontabil.core.usecases.crm.ImportarLeadsUseCase;
import com.projetocontabil.core.ports.driven.AuditoriaRepository;
import com.projetocontabil.core.domain.shared.AuditoriaAtividade;

import java.io.IOException;
import java.net.URI;
import java.util.*;

@RestController
@RequestMapping("/api/leads")
public class LeadController {

    private final LeadRepository leadRepository;
    private final ContratoRepository contratoRepository;
    private final HistoricoVidaLeadRepository historicoRepository;
    private final FinalizarOnboardingUseCase finalizarOnboardingUseCase;
    private final ImportarLeadsUseCase importarLeadsUseCase;
    private final HistoricoExportService exportService;
    private final AuditoriaRepository auditoriaRepository;

    public LeadController(LeadRepository leadRepository,
                         ContratoRepository contratoRepository,
                         HistoricoVidaLeadRepository historicoRepository,
                         FinalizarOnboardingUseCase finalizarOnboardingUseCase,
                         ImportarLeadsUseCase importarLeadsUseCase,
                         HistoricoExportService exportService,
                         AuditoriaRepository auditoriaRepository) {
        this.leadRepository = leadRepository;
        this.contratoRepository = contratoRepository;
        this.historicoRepository = historicoRepository;
        this.finalizarOnboardingUseCase = finalizarOnboardingUseCase;
        this.importarLeadsUseCase = importarLeadsUseCase;
        this.exportService = exportService;
        this.auditoriaRepository = auditoriaRepository;
    }

    @PostMapping("/import")
    public ResponseEntity<List<Map<String, Object>>> importar(@RequestParam("file") MultipartFile file) {
        try {
            String empresaIdStr = EmpresaLocatariaContext.getEmpresaLocatariaId();
            var leads = importarLeadsUseCase.executar(file.getInputStream(), empresaIdStr);
            
            auditoriaRepository.salvar(AuditoriaAtividade.registrar(EmpresaLocatariaId.of(empresaIdStr), "admin", "LEAD_IMPORT", 
                "Importação de " + leads.size() + " leads via arquivo CSV", null));

            return ResponseEntity.ok(leads.stream().map(this::toResponse).toList());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> cadastrar(@RequestBody @Valid CriarLeadRequest request) {
        var empresaId = EmpresaLocatariaId.of(EmpresaLocatariaContext.getEmpresaLocatariaId());

        if (leadRepository.existsByIdentificacaoAndEmpresaLocatariaId(new Identificacao(request.cnpj()), empresaId)) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Lead já cadastrado"));
        }

        OrigemLead origem = parseOrigem(request.origem());
        TipoServico tipoServico = parseTipoServico(request.tipoServico());

        var lead = Lead.criar(empresaId, request.nomeContato(), new Email(request.email()),
                new Identificacao(request.cnpj()), request.nomeEmpresa(), origem, tipoServico);
        var salvo = leadRepository.save(lead);

        var historico = HistoricoVidaLead.criar(salvo.getId(), empresaId);
        historicoRepository.save(historico);

        auditoriaRepository.salvar(AuditoriaAtividade.registrar(empresaId, "admin", "LEAD_CRIADO", 
            "Novo lead cadastrado: " + salvo.getNomeContato() + " (" + salvo.getNomeEmpresa() + ")", null));

        return ResponseEntity.created(URI.create("/api/leads/" + salvo.getId())).body(toResponse(salvo));
    }

    @PostMapping("/{id}/converter")
    public ResponseEntity<Map<String, Object>> converter(@PathVariable UUID id, @RequestParam RegimeTributario regime) {
        Lead convertido = finalizarOnboardingUseCase.executar(id, regime);
        
        auditoriaRepository.salvar(AuditoriaAtividade.registrar(convertido.getEmpresaLocatariaId(), "admin", "LEAD_CONVERTIDO", 
            "Lead " + convertido.getNomeContato() + " convertido para cliente (Onboarding Finalizado)", null));

        return ResponseEntity.ok(toResponse(convertido));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> mudarStatus(@PathVariable UUID id, @RequestParam String status) {
        var existente = leadRepository.findById(id);
        if (existente.isEmpty()) return ResponseEntity.notFound().build();

        var lead = existente.get();
        StatusLead novoStatus = StatusLead.valueOf(status.toUpperCase());
        String statusAntigo = lead.getStatus().name();
        lead.mudarStatus(novoStatus);
        
        leadRepository.save(lead);

        var historico = historicoRepository.findByLeadId(id).orElseGet(() -> {
            var newH = HistoricoVidaLead.criar(id, lead.getEmpresaLocatariaId());
            historicoRepository.save(newH);
            return newH;
        });

        historico.registrarEvento("MOVIMENTACAO_ETAPA", 
            "Lead movido de " + statusAntigo + " para " + novoStatus.name(), 
                EventoHistoricoLead.MarcadorEvento.NEUTRO);
        historicoRepository.save(historico);

        auditoriaRepository.salvar(AuditoriaAtividade.registrar(lead.getEmpresaLocatariaId(), "admin", "LEAD_MOVIDO", 
            "Lead " + lead.getNomeContato() + " movido para " + novoStatus.name(), null));

        return ResponseEntity.ok(toResponse(lead));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> atualizar(@PathVariable UUID id, @RequestBody @Valid CriarLeadRequest request) {
        var existente = leadRepository.findById(id);
        if (existente.isEmpty()) return ResponseEntity.notFound().build();

        var lead = existente.get();
        lead.atualizarDados(request.nomeContato(), new Email(request.email()), request.nomeEmpresa(), 
                           new Identificacao(request.cnpj()), parseOrigem(request.origem()), parseTipoServico(request.tipoServico()));
        
        var salvo = leadRepository.save(lead);

        var historico = historicoRepository.findByLeadId(id).orElseGet(() -> {
            var newH = HistoricoVidaLead.criar(id, lead.getEmpresaLocatariaId());
            historicoRepository.save(newH);
            return newH;
        });

        historico.registrarEvento("DADOS_ATUALIZADOS", "Dados cadastrais do lead foram atualizados", EventoHistoricoLead.MarcadorEvento.NEUTRO);
        historicoRepository.save(historico);

        auditoriaRepository.salvar(AuditoriaAtividade.registrar(lead.getEmpresaLocatariaId(), "admin", "LEAD_ATUALIZADO", 
            "Dados do lead " + lead.getNomeContato() + " atualizados", null));

        return ResponseEntity.ok(toResponse(salvo));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        var lead = leadRepository.findById(id);
        if (lead.isPresent()) {
            var l = lead.get();
            auditoriaRepository.salvar(AuditoriaAtividade.registrar(l.getEmpresaLocatariaId(), "admin", "LEAD_EXCLUIDO", 
                "Lead " + l.getNomeContato() + " foi removido do sistema", null));
            leadRepository.deleteById(id);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar() {
        var empresaId = EmpresaLocatariaId.of(EmpresaLocatariaContext.getEmpresaLocatariaId());
        return ResponseEntity.ok(leadRepository.findAllByEmpresaLocatariaId(empresaId).stream().map(this::toResponse).toList());
    }

    @GetMapping("/historico")
    public ResponseEntity<List<Map<String, Object>>> listarHistoricoGeral() {
        var empresaId = EmpresaLocatariaId.of(EmpresaLocatariaContext.getEmpresaLocatariaId());
        var atividades = auditoriaRepository.buscarPorEmpresa(empresaId);
        
        List<Map<String, Object>> result = atividades.stream().map(a -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", a.getId().toString());
            map.put("tipo", a.getTipo());
            map.put("descricao", a.getDescricao());
            map.put("ocorridoEm", a.getCriadoEm().toString());
            map.put("marcador", "NEUTRO");
            return map;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/historico")
    public ResponseEntity<?> buscarHistorico(@PathVariable UUID id) {
        var empresaId = EmpresaLocatariaId.of(EmpresaLocatariaContext.getEmpresaLocatariaId());
        var leadOpt = leadRepository.findById(id);
        
        if (leadOpt.isEmpty()) return ResponseEntity.notFound().build();

        var h = historicoRepository.findByLeadId(id).orElseGet(() -> {
            var newH = HistoricoVidaLead.criar(id, empresaId);
            historicoRepository.save(newH);
            return newH;
        });

        var eventosMap = h.getEventos() == null ? new ArrayList<>() : h.getEventosOrdenados().stream().map(e -> Map.of(
                "id", e.getId().toString(),
                "tipo", e.getTipo(),
                "descricao", e.getDescricao(),
                "marcador", e.getMarcador().name(),
                "ocorridoEm", e.getOcorridoEm().toString()
        )).toList();

        return ResponseEntity.ok(Map.of(
                "leadId", h.getLeadId(),
                "arquivado", h.isArquivado(),
                "eventos", eventosMap
        ));
    }

    @DeleteMapping("/{id}/historico")
    public ResponseEntity<Void> limparHistorico(@PathVariable UUID id) {
        historicoRepository.findByLeadId(id).ifPresent(h -> {
            h.limparHistorico();
            historicoRepository.save(h);
        });
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/historico")
    public ResponseEntity<Void> limparHistoricoGeral() {
        var empresaId = EmpresaLocatariaId.of(EmpresaLocatariaContext.getEmpresaLocatariaId());
        auditoriaRepository.limparPorEmpresa(empresaId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/historico/arquivar")
    public ResponseEntity<Void> arquivarHistorico(@PathVariable UUID id, @RequestParam boolean arquivar) {
        historicoRepository.findByLeadId(id).ifPresent(h -> {
            if (arquivar) h.arquivar();
            else h.desarquivar();
            historicoRepository.save(h);
        });
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/historico/export/csv")
    public ResponseEntity<byte[]> exportarHistoricoCsv(@PathVariable UUID id) throws IOException {
        var lead = leadRepository.findById(id).orElseThrow();
        var historico = historicoRepository.findByLeadId(id).orElseThrow();
        byte[] csv = exportService.exportarParaCsv(historico);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=historico_" + lead.getNomeContato() + ".csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/{id}/historico/export/pdf")
    public ResponseEntity<byte[]> exportarHistoricoPdf(@PathVariable UUID id) throws IOException {
        var lead = leadRepository.findById(id).orElseThrow();
        var historico = historicoRepository.findByLeadId(id).orElseThrow();
        byte[] pdf = exportService.exportarParaPdf(historico, lead.getNomeContato());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=historico_" + lead.getNomeContato() + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @PostMapping("/{id}/contrato")
    public ResponseEntity<Map<String, Object>> criarContrato(@PathVariable UUID id) {
        var lead = leadRepository.findById(id);
        if (lead.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var existente = contratoRepository.findByLeadId(id);
        if (existente.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Lead já possui contrato"));
        }

        var contrato = Contrato.criar(id, lead.get().getEmpresaLocatariaId());
        var salvo = contratoRepository.save(contrato);

        var historico = historicoRepository.findByLeadId(id).orElse(null);
        if (historico != null) {
            historico.registrarEvento("CONTRATO_GERADO",
                    "Contrato de prestação de serviços gerado (Aguardando Assinatura)",
                    EventoHistoricoLead.MarcadorEvento.ATENCAO);
            historicoRepository.save(historico);
        }

        return ResponseEntity.created(URI.create("/api/leads/" + id + "/contrato")).body(Map.of(
                "id", salvo.getId(),
                "leadId", salvo.getLeadId(),
                "status", salvo.getStatus().name(),
                "criadoEm", salvo.getCriadoEm().toString()
        ));
    }

    private Map<String, Object> toResponse(Lead lead) {
        var response = new LinkedHashMap<String, Object>();
        response.put("id", lead.getId());
        response.put("nomeContato", lead.getNomeContato());
        response.put("email", lead.getEmail() != null ? lead.getEmail().value() : null);
        response.put("nomeEmpresa", lead.getNomeEmpresa());
        response.put("status", lead.getStatus().name());
        response.put("origemLead", lead.getOrigemLead() != null ? lead.getOrigemLead().name() : null);
        response.put("tipoServico", lead.getTipoServico() != null ? lead.getTipoServico().name() : null);
        response.put("criadoEm", lead.getCriadoEm() != null ? lead.getCriadoEm().toString() : null);
        return response;
    }

    private OrigemLead parseOrigem(String valor) {
        if (valor == null || valor.isBlank()) return null;
        try { return OrigemLead.valueOf(valor.toUpperCase()); } catch (Exception e) { return null; }
    }

    private TipoServico parseTipoServico(String valor) {
        if (valor == null || valor.isBlank()) return null;
        try { return TipoServico.valueOf(valor.toUpperCase()); } catch (Exception e) { return null; }
    }
}
