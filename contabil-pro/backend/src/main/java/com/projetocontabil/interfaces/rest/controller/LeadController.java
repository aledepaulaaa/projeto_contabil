package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.*;
import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.crm.vo.Email;
import com.projetocontabil.core.domain.crm.vo.Telefone;
import com.projetocontabil.core.domain.rotinas.model.RegimeTributario;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.ContratoRepository;
import com.projetocontabil.core.ports.driven.HistoricoVidaLeadRepository;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.core.ports.driven.AtendimentoRepository;
import com.projetocontabil.core.domain.atendimento.model.Atendimento;
import com.projetocontabil.core.usecases.crm.FinalizarOnboardingUseCase;
import com.projetocontabil.core.usecases.crm.HistoricoExportService;
import com.projetocontabil.core.usecases.crm.ImportarLeadsUseCase;
import com.projetocontabil.core.usecases.onboarding.IniciarOnboardingUseCase;
import com.projetocontabil.core.ports.driven.AuditoriaRepository;
import com.projetocontabil.core.domain.shared.AuditoriaAtividade;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import com.projetocontabil.interfaces.rest.dto.CriarLeadRequest;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;
import com.projetocontabil.core.ports.driven.DepartamentoRepository;
import com.projetocontabil.core.ports.driven.UsuarioRepository;
import com.projetocontabil.core.domain.usuario.model.Usuario;

import java.io.IOException;
import java.net.URI;
import java.util.*;

@RestController
@RequestMapping("/api/leads")
@lombok.extern.slf4j.Slf4j
public class LeadController {

    private final LeadRepository leadRepository;
    private final AtendimentoRepository atendimentoRepository;
    private final ContratoRepository contratoRepository;
    private final HistoricoVidaLeadRepository historicoRepository;
    private final FinalizarOnboardingUseCase finalizarOnboardingUseCase;
    private final ImportarLeadsUseCase importarLeadsUseCase;
    private final HistoricoExportService exportService;
    private final AuditoriaRepository auditoriaRepository;
    private final com.projetocontabil.infra.messaging.ContratoProducer contratoProducer;
    private final com.projetocontabil.infra.integrations.whatsapp.WhatsAppIntegrationService whatsAppService;
    private final com.projetocontabil.infra.integrations.email.EmailIntegrationService emailService;
    private final com.projetocontabil.infra.messaging.NotificationService notificationService;
    private final org.springframework.web.client.RestTemplate restTemplate;
    private final com.projetocontabil.core.ports.driven.DepartamentoRepository departamentoRepository;
    private final com.projetocontabil.core.ports.driven.UsuarioRepository usuarioRepository;
    private final IniciarOnboardingUseCase iniciarOnboardingUseCase;

    public LeadController(LeadRepository leadRepository,
                         AtendimentoRepository atendimentoRepository,
                         ContratoRepository contratoRepository,
                         HistoricoVidaLeadRepository historicoRepository,
                         FinalizarOnboardingUseCase finalizarOnboardingUseCase,
                         ImportarLeadsUseCase importarLeadsUseCase,
                         HistoricoExportService exportService,
                         AuditoriaRepository auditoriaRepository,
                         com.projetocontabil.infra.messaging.ContratoProducer contratoProducer,
                         com.projetocontabil.infra.integrations.whatsapp.WhatsAppIntegrationService whatsAppService,
                         com.projetocontabil.infra.integrations.email.EmailIntegrationService emailService,
                         com.projetocontabil.infra.messaging.NotificationService notificationService,
                         org.springframework.web.client.RestTemplate restTemplate,
                         com.projetocontabil.core.ports.driven.DepartamentoRepository departamentoRepository,
                         com.projetocontabil.core.ports.driven.UsuarioRepository usuarioRepository,
                         IniciarOnboardingUseCase iniciarOnboardingUseCase) {
        this.leadRepository = leadRepository;
        this.atendimentoRepository = atendimentoRepository;
        this.contratoRepository = contratoRepository;
        this.historicoRepository = historicoRepository;
        this.finalizarOnboardingUseCase = finalizarOnboardingUseCase;
        this.importarLeadsUseCase = importarLeadsUseCase;
        this.exportService = exportService;
        this.auditoriaRepository = auditoriaRepository;
        this.contratoProducer = contratoProducer;
        this.whatsAppService = whatsAppService;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.restTemplate = restTemplate;
        this.departamentoRepository = departamentoRepository;
        this.usuarioRepository = usuarioRepository;
        this.iniciarOnboardingUseCase = iniciarOnboardingUseCase;
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
        log.info("INTERCEPTOR: Recebendo requisição para cadastrar lead. Telefone: [{}]", request.telefone());
        var empresaId = EmpresaLocatariaId.of(EmpresaLocatariaContext.getEmpresaLocatariaId());

        if (leadRepository.existsByIdentificacaoAndEmpresaLocatariaId(new Identificacao(request.cnpj()), empresaId)) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Lead já cadastrado"));
        }

        OrigemLead origem = parseOrigem(request.origem());
        TipoServico tipoServico = parseTipoServico(request.tipoServico());

        var lead = Lead.criar(empresaId, request.nomeContato(), new Email(request.email()),
                request.telefone() != null ? new Telefone(request.telefone()) : null,
                new Identificacao(request.cnpj()), request.nomeEmpresa(), origem, tipoServico);
        
        departamentoRepository.findByNomeAndEmpresaLocatariaId("Comercial", empresaId.value())
                .ifPresent(depto -> lead.setDepartamentoId(depto.getId()));

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

    @PostMapping("/{id}/atendimento/aceitar")
    @Transactional
    public ResponseEntity<Void> aceitarAtendimento(@PathVariable UUID id,
                                                    HttpServletRequest request) {
        try {
            String empresaIdStr = EmpresaLocatariaContext.getEmpresaLocatariaId();
            if (empresaIdStr == null || empresaIdStr.isBlank()) {
                return ResponseEntity.status(401).build();
            }
            
            // Resolver o ID do atendente: header X-Usuario-Id (frontend) → SecurityContext (testes)
            String usuarioIdHeader = request.getHeader("X-Usuario-Id");
            UUID atendenteId = parseUUIDSafe(usuarioIdHeader);
            
            if (atendenteId == null) {
                var auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated()) {
                    atendenteId = parseUUIDSafe(auth.getName());
                }
            }
            
            if (atendenteId == null) {
                log.warn("[aceitarAtendimento] Não foi possível resolver o atendente. Header: {}", usuarioIdHeader);
                return ResponseEntity.status(401).build();
            }
            
            // Buscar Lead
            Lead lead = leadRepository.findById(id).orElseThrow();
            
            // Buscar Atendimento Pendente
            Atendimento atend = atendimentoRepository.findAtivoPorLead(id)
                    .orElseThrow(() -> new IllegalStateException("Nenhum atendimento pendente para este lead."));
            
            // Iniciar atendimento (mover da fila para chat)
            atend.puxar(atendenteId);
            atendimentoRepository.save(atend);
            
            log.info("[Metrics] Atendimento iniciado para lead {} por atendente {}", id, atendenteId);
            auditoriaRepository.salvar(AuditoriaAtividade.registrar(
                EmpresaLocatariaId.of(empresaIdStr), atendenteId.toString(), "ATENDIMENTO_INICIADO", 
                "Iniciou atendimento para lead " + lead.getNomeContato(), id.toString()
            ));
            
            // Notificar em tempo real para atualizar a sidebar
            notificationService.notifyReloadContacts(empresaIdStr);
        } catch (Exception e) {
            log.error("Erro ao aceitar atendimento", e);
            return ResponseEntity.status(500).build();
        }
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> mudarStatus(
            @PathVariable UUID id,
            @RequestParam String status,
            @RequestParam(required = false) String observacao,
            @RequestParam(required = false) UUID departamentoId) {
        var existente = leadRepository.findById(id);
        if (existente.isEmpty()) return ResponseEntity.notFound().build();

        var lead = existente.get();
        
        // Verificação de Isolamento Multi-tenant (Upgrade 3.1 Security)
        String empresaLogada = EmpresaLocatariaContext.getEmpresaLocatariaId();
        if (!lead.getEmpresaLocatariaId().value().equals(empresaLogada)) {
            log.warn("⚠️ [SECURITY] Tentativa de acesso não autorizado ao Lead {} pela empresa {}", id, empresaLogada);
            return ResponseEntity.notFound().build(); // Retornamos 404 por segurança (obscurity)
        }

        StatusLead novoStatus = StatusLead.valueOf(status.toUpperCase());
        String statusAntigo = lead.getStatus().name();

        // Atribuir departamento se fornecido
        if (departamentoId != null) {
            lead.setDepartamentoId(departamentoId);
        }

        // Fluxo especial: NAO_FECHOU requer observação
        if (novoStatus == StatusLead.NAO_FECHOU && observacao != null && !observacao.isBlank()) {
            lead.registrarNaoFechamento(observacao);
        } else {
            lead.mudarStatus(novoStatus);
        }
        
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

        // Fluxo especial: PROPOSTA dispara geração de contrato assíncrona via RabbitMQ (Upgrade 3.1)
        if (novoStatus == StatusLead.PROPOSTA) {
            var contratoOpt = contratoRepository.findByLeadId(id);
            boolean jaPossuiContratoValido = contratoOpt.isPresent() && 
                (contratoOpt.get().getStatus() == StatusContrato.GERANDO || 
                 contratoOpt.get().getStatus() == StatusContrato.AGUARDANDO_ASSINATURA ||
                 contratoOpt.get().getStatus() == StatusContrato.ATIVO);

            if (!jaPossuiContratoValido) {
                log.info("[CRM 3.1] Gatilho de contrato acionado para o lead {} em etapa PROPOSTA", lead.getNomeContato());
                contratoProducer.enviarParaGeracaoDeContrato(
                    id.toString(),
                    lead.getEmpresaLocatariaId().value(),
                    lead.getNomeContato(),
                    lead.getEmail() != null ? lead.getEmail().value() : ""
                );
            }
        }
        
        // Fluxo especial: FECHAMENTO dispara vinculação ao Onboarding (Upgrade 3.1)
        if (novoStatus == StatusLead.FECHAMENTO) {
             log.info("[CRM 3.1] Lead {} atingiu FECHAMENTO. Iniciando contexto de Onboarding.", lead.getNomeContato());
             iniciarOnboardingUseCase.executar(lead);
        }

        if (EnumSet.of(StatusLead.PROPOSTA, StatusLead.AGUARDANDO, StatusLead.FECHAMENTO).contains(novoStatus)) {
            // Requisito V3.1: Leads do CRM obrigatoriamente vinculados ao Comercial
            departamentoRepository.findByNomeAndEmpresaLocatariaId("Comercial", lead.getEmpresaLocatariaId().value())
                .ifPresent(depto -> {
                    lead.setDepartamentoId(depto.getId());
                    leadRepository.save(lead);
                    log.info("[Automation] Lead {} forçado ao setor Comercial (CRM Flow)", lead.getNomeContato());
                });

            atendimentoRepository.findAtivoPorLead(id).ifPresentOrElse(
                atend -> {
                    if (atend.getDepartamentoId() == null && lead.getDepartamentoId() != null) {
                        atend.transferir(lead.getDepartamentoId(), atend.getAtendenteId());
                    }
                    // REQUISITO: Resetar o tempo de espera para começar do zero (0 min) na fila (V3.1)
                    if (atend.getStatus() == com.projetocontabil.core.domain.atendimento.model.StatusAtendimento.AGUARDANDO) {
                        atend.reiniciarEspera();
                    }
                    // REQUISITO: Remover flag de transferência para leads originados do CRM
                    atend.setTransferido(false);
                    atendimentoRepository.save(atend);
                },
                () -> {
                    var novoAtendimento = Atendimento.criar(
                        lead.getEmpresaLocatariaId().value(),
                        id,
                        lead.getDepartamentoId()
                    );
                    atendimentoRepository.save(novoAtendimento);
                    log.info("[Automation] Atendimento criado automaticamente para lead {} em etapa {}", lead.getNomeContato(), novoStatus);
                    
                    // Notificar equipe do setor (Específica)
                    if (lead.getDepartamentoId() != null) {
                        notificationService.notifyTransferenciaSetorial(
                            lead.getEmpresaLocatariaId().value(), 
                            lead.getDepartamentoId().toString(), 
                            lead.getNomeContato(), 
                            novoStatus.name(), 
                            id.toString()
                        );
                    }
                    
                    // Notificar equipe global (Informativa)
                    notificationService.notifyTransferencia(
                        lead.getEmpresaLocatariaId().value(),
                        lead.getNomeContato(),
                        "Comercial",
                        id.toString()
                    );
                }
            );
        }

        // DISPARO AUTOMÁTICO WHATSAPP & E-MAIL (ETAPA 2)
        if (novoStatus != StatusLead.PROPOSTA) {
            log.info("Gatilhos de automação acionados para o lead {} movido para {}", lead.getNomeContato(), novoStatus);
            whatsAppService.enviarNotificacaoStatus(lead, novoStatus);
            emailService.enviarNotificacaoStatus(lead, novoStatus);
        } else {
            log.info("Disparo de automação para PROPOSTA adiado até a geração do contrato (GerarContratoUseCase).");
        }

        // SINCRONIZAÇÃO EM TEMPO REAL: Notificar Central de Atendimento
        notificationService.notifyReloadContacts(lead.getEmpresaLocatariaId().value());

        return ResponseEntity.ok(toResponse(lead));
    }
    @PostMapping("/{id}/gerar-contrato")
    public ResponseEntity<Map<String, Object>> forcarGeracaoContrato(@PathVariable UUID id) {
        var existente = leadRepository.findById(id);
        if (existente.isEmpty()) return ResponseEntity.notFound().build();

        var lead = existente.get();
        if (lead.getStatus() != StatusLead.FECHAMENTO) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Apenas leads na etapa de FECHAMENTO podem gerar contrato."));
        }

        contratoProducer.enviarParaGeracaoDeContrato(
            id.toString(),
            lead.getEmpresaLocatariaId().value(),
            lead.getNomeContato(),
            lead.getEmail() != null ? lead.getEmail().value() : ""
        );

        return ResponseEntity.ok(Map.of("mensagem", "Geração de contrato iniciada com sucesso."));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> atualizar(@PathVariable UUID id, @RequestBody @Valid CriarLeadRequest request) {
        log.info("INTERCEPTOR: Recebendo requisição para atualizar lead {}. Telefone: [{}]", id, request.telefone());
        var existente = leadRepository.findById(id);
        if (existente.isEmpty()) return ResponseEntity.notFound().build();

        var lead = existente.get();
        lead.atualizarDados(request.nomeContato(), new Email(request.email()), 
                           request.telefone() != null ? new Telefone(request.telefone()) : null,
                           request.nomeEmpresa(), new Identificacao(request.cnpj()), 
                           parseOrigem(request.origem()), parseTipoServico(request.tipoServico()));
        
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
        try {
            String empresaIdStr = EmpresaLocatariaContext.getEmpresaLocatariaId();
            if (empresaIdStr == null || empresaIdStr.isBlank()) {
                log.warn("Tentativa de listar leads sem contexto de empresa");
                return ResponseEntity.status(401).build();
            }
            var empresaId = EmpresaLocatariaId.of(empresaIdStr);
            var leads = leadRepository.findAllByEmpresaLocatariaId(empresaId);
            
            return ResponseEntity.ok(leads.stream()
                .map(this::toResponseSafe)
                .filter(Objects::nonNull)
                .toList());
        } catch (Exception e) {
            log.error("Erro interno ao listar leads: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
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

    @GetMapping("/contatos")
    public ResponseEntity<List<Map<String, Object>>> getContatosAtendimento(HttpServletRequest request) {
        try {
            String empresaIdStr = EmpresaLocatariaContext.getEmpresaLocatariaId();
            if (empresaIdStr == null || empresaIdStr.isBlank()) {
                return ResponseEntity.status(401).build();
            }

            // Tentar extrair usuarioId do header customizado X-Usuario-Id (frontend)
            // Se não encontrar, tentar extrair do SecurityContext (testes)
            String usuarioIdHeader = request.getHeader("X-Usuario-Id");
            UUID usuarioId = parseUUIDSafe(usuarioIdHeader);
            
            if (usuarioId == null) {
                // Fallback: tentar extrair do SecurityContext para compatibilidade com testes
                var auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated()) {
                    usuarioId = parseUUIDSafe(auth.getName());
                }
            }
            
            if (usuarioId == null) {
                log.warn("[LeadController] Acesso negado: usuarioId não fornecido ou inválido");
                return ResponseEntity.status(401).build();
            }
            
            // Para isolamento estrito, buscamos o usuário no banco para saber o departamento real dele
            var usuarioOpt = usuarioRepository.findById(usuarioId);
            UUID usuarioDeptoId = usuarioOpt.map(Usuario::getDepartamentoId).orElse(null);
            String papel = usuarioOpt.map(u -> u.getRole()).orElse("OPERADOR");
            
            // 1. Buscar todos os atendimentos ativos da empresa para mapear visibilidade e flags
            List<Atendimento> atendimentosAtivos = atendimentoRepository.findAllAtivosByEmpresa(empresaIdStr);
            Map<UUID, Atendimento> mapaAtendimentoPorLead = new HashMap<>();
            atendimentosAtivos.forEach(a -> mapaAtendimentoPorLead.put(a.getLeadId(), a));

            // 2. Buscar Leads do CRM
            List<Lead> leadsRaw = leadRepository.findAllByEmpresaLocatariaId(EmpresaLocatariaId.of(empresaIdStr));
            
            // 3. Aplicar Filtro de Isolamento Estrito
            // ADMIN/GESTOR vê tudo de todos os setores.
            // OPERADOR vê apenas leads do SEU setor.
            List<Lead> leadsFiltrados = leadsRaw.stream().filter(lead -> {
                Atendimento atend = mapaAtendimentoPorLead.get(lead.getId());
                boolean isAdmin = "ADMIN".equalsIgnoreCase(papel);
                
                // REGRA PRIVACIDADE: Se o atendimento é restrito ao Admin, apenas Admin vê
                if (atend != null && atend.isRestritoAdmin() && !isAdmin) {
                    return false;
                }

                // ADMIN/GESTOR vê tudo de todos os setores (exceto restritos via regra acima).
                boolean isGestao = papel == null || isAdmin || "GESTOR".equalsIgnoreCase(papel);
                if (isGestao) return true;
                
                // Se o usuário não tem departamento definido, regra conservadora
                if (usuarioDeptoId == null) return false;

                // Prioridade 1: Departamento do Atendimento Ativo
                if (atend != null && atend.getDepartamentoId() != null) {
                    return atend.getDepartamentoId().equals(usuarioDeptoId);
                }

                // Prioridade 2: Departamento fixo do Lead (conforme V5)
                if (lead.getDepartamentoId() != null) {
                    return lead.getDepartamentoId().equals(usuarioDeptoId);
                }
                
                // Se o lead não tem setor (é novo ou legado), operadores não veem por padrão
                return false; 
            }).toList();

            // 4. Resolução de nomes de departamentos
            var departamentos = departamentoRepository.findAllByEmpresaLocatariaId(EmpresaLocatariaId.of(empresaIdStr));
            Map<UUID, String> deptoNomes = new HashMap<>();
            departamentos.forEach(d -> deptoNomes.put(d.getId(), d.getNome()));

            List<Map<String, Object>> result = new ArrayList<>(
                leadsFiltrados.stream()
                    .map(lead -> toAtendimentoResponseEnriched(lead, mapaAtendimentoPorLead.get(lead.getId()), deptoNomes))
                    .filter(Objects::nonNull)
                    .toList()
            );

            // 4. Buscar Contatos "Soltos" do WhatsApp Whapi (Gateway Node)
            try {
                Map<String, Object> responseNode = restTemplate.getForObject("http://localhost:3001/api/whatsapp/contacts?limit=50", Map.class);
                if (responseNode != null && responseNode.containsKey("itens")) {
                    List<Map<String, Object>> itens = (List<Map<String, Object>>) responseNode.get("itens");
                    
                    for (Map<String, Object> item : itens) {
                        String waId = (String) item.get("id");
                        boolean jaExiste = result.stream().anyMatch(l -> waId.equals(l.get("whatsapp")));
                        
                        if (!jaExiste) {
                            Map<String, Object> contatoWa = new LinkedHashMap<>();
                            contatoWa.put("id", waId);
                            contatoWa.put("nome", item.getOrDefault("nome", item.getOrDefault("pushname", "Contato WhatsApp")));
                            contatoWa.put("empresa", "WhatsApp");
                            contatoWa.put("whatsapp", waId);
                            contatoWa.put("tabType", "contatos");
                            contatoWa.put("status", "WHATSAPP_RAW");
                            result.add(contatoWa);
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Falha ao integrar contatos reais do WhatsApp Gateway: {}", e.getMessage());
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erro ao listar contatos de atendimento: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    private Map<String, Object> toAtendimentoResponseSafe(Lead lead) {
        try {
            Atendimento atend = atendimentoRepository.findAtivoPorLead(lead.getId()).orElse(null);
            var departamentos = departamentoRepository.findAllByEmpresaLocatariaId(lead.getEmpresaLocatariaId());
            Map<UUID, String> deptoNomes = new HashMap<>();
            departamentos.forEach(d -> deptoNomes.put(d.getId(), d.getNome()));
            
            return toAtendimentoResponseEnriched(lead, atend, deptoNomes);
        } catch (Exception e) {
            log.error("Falha ao processar lead {} para atendimento: {}", lead.getId(), e.getMessage());
            return null;
        }
    }

    private Map<String, Object> toAtendimentoResponseEnriched(Lead lead, Atendimento atendimento, Map<UUID, String> deptoNomes) {
        var map = new LinkedHashMap<String, Object>();
        map.put("id", lead.getId().toString());
        map.put("nome", lead.getNomeContato());
        map.put("empresa", lead.getNomeEmpresa());
        map.put("whatsapp", lead.getTelefone() != null ? lead.getTelefone().value() : (lead.getIdentificacao() != null ? lead.getIdentificacao().value() : "")); 
        map.put("espera", atendimento != null && atendimento.getCriadoEm() != null ? atendimento.getCriadoEm().toString() : null); 
        
        UUID deptoId = lead.getDepartamentoId();
        if (atendimento != null && atendimento.getDepartamentoId() != null) {
            deptoId = atendimento.getDepartamentoId();
        }
        
        map.put("departamentoId", deptoId != null ? deptoId.toString() : null);
        map.put("departamento", deptoNomes.getOrDefault(deptoId, "Comercial"));
        map.put("quantidadeMensagensNaoLidas", lead.getQuantidadeMensagensNaoLidas());
        
        // Dados do Atendimento e Departamento
        if (atendimento != null) {
            map.put("atendenteId", atendimento.getAtendenteId());
            // A flag transferido só é true se o atendimento atual foi originado de uma transferência
            map.put("transferido", atendimento.isTransferido());
            map.put("atendimentoStatus", atendimento.getStatus().name());
            map.put("restritoAdmin", atendimento.isRestritoAdmin());
        } else {
            map.put("atendenteId", null);
            map.put("transferido", false);
            map.put("atendimentoStatus", null);
            map.put("restritoAdmin", false);
        }

        // Mapeamento de Status do Atendimento (V3.1)
        String tabType;
        if (atendimento != null) {
            if (atendimento.getStatus() == com.projetocontabil.core.domain.atendimento.model.StatusAtendimento.EM_ATENDIMENTO) {
                tabType = "chats";
            } else if (atendimento.getStatus() == com.projetocontabil.core.domain.atendimento.model.StatusAtendimento.AGUARDANDO) {
                tabType = "fila";
            } else {
                tabType = "contatos";
            }
        } else {
            tabType = "contatos";
        }

        map.put("tabType", tabType);
        map.put("status", lead.getStatus() != null ? lead.getStatus().name() : "LEAD");
        
        // Identificar se é lead do CRM (quente)
        boolean isLeadCrm = lead.getStatus() == StatusLead.PROPOSTA || 
                           lead.getStatus() == StatusLead.AGUARDANDO || 
                           lead.getStatus() == StatusLead.FECHAMENTO;
        map.put("isLeadCrm", isLeadCrm);
        
        return map;
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

    @GetMapping("/historico/export/csv")
    public ResponseEntity<byte[]> exportarHistoricoGeralCsv() throws IOException {
        var empresaId = EmpresaLocatariaId.of(EmpresaLocatariaContext.getEmpresaLocatariaId());
        var atividades = auditoriaRepository.buscarPorEmpresa(empresaId);
        byte[] csv = exportService.exportarGeralParaCsv(atividades);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=historico_geral.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/historico/export/pdf")
    public ResponseEntity<byte[]> exportarHistoricoGeralPdf() throws IOException {
        var empresaId = EmpresaLocatariaId.of(EmpresaLocatariaContext.getEmpresaLocatariaId());
        var atividades = auditoriaRepository.buscarPorEmpresa(empresaId);
        byte[] pdf = exportService.exportarGeralParaPdf(atividades);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=historico_geral.pdf")
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

    private Map<String, Object> toResponseSafe(Lead lead) {
        try {
            return toResponse(lead);
        } catch (Exception e) {
            log.error("Falha ao processar lead {} para resposta: {}", lead.getId(), e.getMessage());
            return null;
        }
    }

    private Map<String, Object> toResponse(Lead lead) {
        var response = new LinkedHashMap<String, Object>();
        response.put("id", lead.getId());
        response.put("nomeContato", lead.getNomeContato());
        response.put("email", lead.getEmail() != null ? lead.getEmail().value() : null);
        response.put("telefone", lead.getTelefone() != null ? lead.getTelefone().value() : null);
        response.put("nomeEmpresa", lead.getNomeEmpresa());
        response.put("status", lead.getStatus() != null ? lead.getStatus().name() : "LEAD");
        response.put("origemLead", lead.getOrigemLead() != null ? lead.getOrigemLead().name() : null);
        response.put("tipoServico", lead.getTipoServico() != null ? lead.getTipoServico().name() : null);
        response.put("observacaoNaoFechamento", lead.getObservacaoNaoFechamento());
        response.put("criadoEm", lead.getCriadoEm() != null ? lead.getCriadoEm().toString() : null);
        response.put("quantidadeMensagensNaoLidas", lead.getQuantidadeMensagensNaoLidas());
        
        try {
            contratoRepository.findByLeadId(lead.getId()).ifPresent(contrato -> {
                response.put("contratoId", contrato.getId());
                response.put("contratoStatus", contrato.getStatus() != null ? contrato.getStatus().name() : null);
                response.put("contratoUrl", contrato.getUrlDocumentoZapSign());
            });
        } catch (Exception e) {
            log.warn("Erro ao buscar contrato para lead {}: {}", lead.getId(), e.getMessage());
        }
        
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
    private UUID parseUUIDSafe(String raw) {
        if (raw == null || raw.isBlank() || "undefined".equalsIgnoreCase(raw) || "null".equalsIgnoreCase(raw)) {
            return null;
        }
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException e) {
            log.warn("[LeadController] Valor de UUID inválido ignorado: {}", raw);
            return null;
        }
    }
}
