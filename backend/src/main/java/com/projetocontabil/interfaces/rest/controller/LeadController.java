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
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import com.projetocontabil.interfaces.rest.dto.CriarLeadRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.projetocontabil.core.usecases.crm.ImportarLeadsUseCase;

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

    public LeadController(LeadRepository leadRepository,
                         ContratoRepository contratoRepository,
                         HistoricoVidaLeadRepository historicoRepository,
                         FinalizarOnboardingUseCase finalizarOnboardingUseCase,
                         ImportarLeadsUseCase importarLeadsUseCase) {
        this.leadRepository = leadRepository;
        this.contratoRepository = contratoRepository;
        this.historicoRepository = historicoRepository;
        this.finalizarOnboardingUseCase = finalizarOnboardingUseCase;
        this.importarLeadsUseCase = importarLeadsUseCase;
    }

    @PostMapping("/import")
    public ResponseEntity<List<Map<String, Object>>> importar(@RequestParam("file") MultipartFile file) {
        try {
            String tenantId = EmpresaLocatariaContext.getCurrentTenant();
            var leads = importarLeadsUseCase.executar(file.getInputStream(), tenantId);
            return ResponseEntity.ok(leads.stream().map(this::toResponse).toList());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> cadastrar(@RequestBody @Valid CriarLeadRequest request) {
        var tenantId = EmpresaLocatariaId.of(EmpresaLocatariaContext.getCurrentTenant());

        if (leadRepository.existsByIdentificacaoAndEmpresaLocatariaId(new Identificacao(request.cnpj()), tenantId)) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Lead já cadastrado"));
        }

        // Converte strings de origem e tipo de serviço para enums (com fallback)
        OrigemLead origem = parseOrigem(request.origem());
        TipoServico tipoServico = parseTipoServico(request.tipoServico());

        var lead = Lead.criar(tenantId, request.nomeContato(), new Email(request.email()),
                new Identificacao(request.cnpj()), request.nomeEmpresa(), origem, tipoServico);
        var salvo = leadRepository.save(lead);

        // Cria o histórico de vida do lead automaticamente
        var historico = HistoricoVidaLead.criar(salvo.getId(), tenantId);
        historicoRepository.save(historico);

        return ResponseEntity.created(URI.create("/api/leads/" + salvo.getId())).body(toResponse(salvo));
    }

    @PostMapping("/{id}/converter")
    public ResponseEntity<Map<String, Object>> converter(@PathVariable UUID id, @RequestParam RegimeTributario regime) {
        Lead convertido = finalizarOnboardingUseCase.executar(id, regime);
        return ResponseEntity.ok(toResponse(convertido));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar() {
        var tenantId = EmpresaLocatariaId.of(EmpresaLocatariaContext.getCurrentTenant());
        return ResponseEntity.ok(leadRepository.findAllByEmpresaLocatariaId(tenantId).stream().map(this::toResponse).toList());
    }

    /**
     * Endpoint para a Timeline Lateral: retorna o histórico de vida do Lead como JSON.
     */
    @GetMapping("/{id}/historico")
    public ResponseEntity<?> buscarHistorico(@PathVariable UUID id) {
        var historico = historicoRepository.findByLeadId(id);
        if (historico.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var h = historico.get();
        var eventosMap = h.getEventosOrdenados().stream().map(e -> Map.of(
                "id", e.getId().toString(),
                "tipo", e.getTipo(),
                "descricao", e.getDescricao(),
                "marcador", e.getMarcador().name(),
                "ocorridoEm", e.getOcorridoEm().toString()
        )).toList();

        return ResponseEntity.ok(Map.of(
                "leadId", h.getLeadId(),
                "eventos", eventosMap
        ));
    }

    /**
     * Endpoint para criar um contrato vinculado ao Lead.
     */
    @PostMapping("/{id}/contrato")
    public ResponseEntity<Map<String, Object>> criarContrato(@PathVariable UUID id) {
        var lead = leadRepository.findById(id);
        if (lead.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Verifica se já existe contrato para este lead
        var existente = contratoRepository.findByLeadId(id);
        if (existente.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Lead já possui contrato"));
        }

        var contrato = Contrato.criar(id, lead.get().getEmpresaLocatariaId());
        var salvo = contratoRepository.save(contrato);

        // Registra evento no histórico
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
