package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.core.usecases.atendimento.AceitarAtendimentoUseCase;
import com.projetocontabil.core.usecases.atendimento.OcultarMensagemUseCase;
import com.projetocontabil.core.usecases.atendimento.TransferirAtendimentoUseCase;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/atendimento")
@RequiredArgsConstructor
public class AtendimentoGestaoController {

    private final TransferirAtendimentoUseCase transferirUseCase;
    private final AceitarAtendimentoUseCase aceitarUseCase;
    private final OcultarMensagemUseCase ocultarUseCase;
    private final LeadRepository leadRepository;
    private final com.projetocontabil.core.ports.driven.AtendimentoRepository atendimentoRepository;

    @PatchMapping("/leads/{leadId}/privacidade")
    public ResponseEntity<Void> togglePrivacidade(@PathVariable UUID leadId, 
                                                 @RequestParam boolean privada) {
        // 1. Atualizar flag no Lead (CRM)
        leadRepository.findById(leadId).ifPresent(lead -> {
            lead.setConversaPrivada(privada);
            leadRepository.save(lead);
        });
        
        // 2. Atualizar flag no Atendimento Ativo (Chat)
        atendimentoRepository.findAtivoPorLead(leadId).ifPresent(atend -> {
            atend.setRestritoAdmin(privada);
            atendimentoRepository.save(atend);
        });
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/transferir")
    public ResponseEntity<Void> transferir(@RequestBody TransferRequest request, 
                                          @RequestHeader("X-EmpresaLocataria-Id") String tenantId) {
        try {
            UUID leadUuid = parseUUIDSafe(request.getLeadId());
            UUID deptoUuid = parseUUIDSafe(request.getNovoDeptoId());
            UUID atendenteUuid = parseUUIDSafe(request.getNovoAtendenteId());
            
            if (leadUuid == null) {
                return ResponseEntity.badRequest().build();
            }

            transferirUseCase.executar(leadUuid, deptoUuid, atendenteUuid, tenantId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    private UUID parseUUIDSafe(String raw) {
        if (raw == null || raw.isBlank() || raw.startsWith("ws-") || "undefined".equalsIgnoreCase(raw) || "null".equalsIgnoreCase(raw)) {
            return null;
        }
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @PostMapping("/aceitar/{leadId}")
    public ResponseEntity<Void> aceitar(@PathVariable String leadId, 
                                       @RequestParam UUID atendenteId,
                                       @RequestHeader("X-EmpresaLocataria-Id") String tenantId) {
        try {
            UUID uuid = UUID.fromString(leadId);
            aceitarUseCase.executar(uuid, atendenteId, tenantId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/mensagens/{mensagemId}/visibilidade")
    public ResponseEntity<Void> atualizarVisibilidade(@PathVariable UUID mensagemId, 
                                                     @RequestParam boolean visivel) {
        ocultarUseCase.executar(mensagemId, !visivel);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/encerrar/{leadId}")
    public ResponseEntity<Void> encerrar(@PathVariable String leadId,
                                        @RequestHeader("X-EmpresaLocataria-Id") String tenantId) {
        try {
            UUID uuid = UUID.fromString(leadId);
            // Lógica de encerramento pode ser adicionada aqui
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private final com.projetocontabil.infra.persistence.repository.AnotacaoContatoJpaRepository anotacaoContatoJpaRepository;
    private final com.projetocontabil.infra.persistence.repository.ContatoEmpresaJpaRepository contatoEmpresaJpaRepository;

    @GetMapping("/contatos/{contatoId}/anotacoes")
    public ResponseEntity<java.util.List<com.projetocontabil.infra.persistence.entity.AnotacaoContatoJpaEntity>> listarAnotacoes(@PathVariable UUID contatoId) {
        var anotacoes = anotacaoContatoJpaRepository.findAllByContatoIdOrderByCriadoEmDesc(contatoId);
        return ResponseEntity.ok(anotacoes);
    }

    @PostMapping("/contatos/{contatoId}/anotacoes")
    public ResponseEntity<com.projetocontabil.infra.persistence.entity.AnotacaoContatoJpaEntity> criarAnotacao(
            @PathVariable UUID contatoId,
            @RequestBody java.util.Map<String, String> payload,
            @RequestHeader(value = "X-EmpresaLocataria-Id", required = false) String tenantHeader) {

        String tenantId = (tenantHeader != null && !tenantHeader.isBlank()) ? tenantHeader : com.projetocontabil.infra.tenancy.EmpresaLocatariaContext.getEmpresaLocatariaId();
        String autor = payload.getOrDefault("autor", "Atendente");
        String setor = payload.getOrDefault("setor", "Atendimento");
        String conteudo = payload.getOrDefault("conteudo", "");

        var nova = new com.projetocontabil.infra.persistence.entity.AnotacaoContatoJpaEntity(
                UUID.randomUUID(),
                contatoId,
                tenantId,
                autor,
                setor,
                conteudo,
                java.time.LocalDateTime.now()
        );

        var salva = anotacaoContatoJpaRepository.save(nova);
        return ResponseEntity.ok(salva);
    }

    @PostMapping("/contatos/{contatoId}/atribuir-cliente")
    public ResponseEntity<java.util.Map<String, Object>> atribuirCliente(
            @PathVariable UUID contatoId,
            @RequestHeader(value = "X-EmpresaLocataria-Id", required = false) String tenantHeader) {

        contatoEmpresaJpaRepository.findById(contatoId).ifPresent(contato -> {
            contato.setCliente(true);
            contatoEmpresaJpaRepository.save(contato);
        });

        return ResponseEntity.ok(java.util.Map.of("ok", true, "mensagem", "Contato atribuído como cliente corporativo com sucesso."));
    }

    @Data
    public static class TransferRequest {
        private String leadId;
        private String novoDeptoId;
        private String novoAtendenteId;
    }

}
