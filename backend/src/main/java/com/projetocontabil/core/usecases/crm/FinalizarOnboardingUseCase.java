package com.projetocontabil.core.usecases.crm;

import com.projetocontabil.core.domain.crm.model.Contrato;
import com.projetocontabil.core.domain.crm.model.EventoHistoricoLead;
import com.projetocontabil.core.domain.crm.model.HistoricoVidaLead;
import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.empresalocataria.model.EmpresaLocataria;
import com.projetocontabil.core.domain.rotinas.model.RegimeTributario;
import com.projetocontabil.core.domain.rotinas.model.Obrigacao;
import com.projetocontabil.core.ports.driven.*;
import com.projetocontabil.core.usecases.rotinas.GeradorObrigacaoStrategy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class FinalizarOnboardingUseCase {

    private final LeadRepository leadRepository;
    private final EmpresaLocatariaRepository empresaRepository;
    private final ObrigacaoRepository obrigacaoRepository;
    private final ContratoRepository contratoRepository;
    private final HistoricoVidaLeadRepository historicoRepository;
    private final GeradorObrigacaoStrategy geradorStrategy;
    private final EventPublisher eventPublisher;
    private final PaymentGateway paymentGateway;
    private final SignatureGateway signatureGateway;
    private final ErpSincronizadorGateway erpGateway;

    public FinalizarOnboardingUseCase(LeadRepository leadRepository,
                                      EmpresaLocatariaRepository empresaRepository,
                                      ObrigacaoRepository obrigacaoRepository,
                                      ContratoRepository contratoRepository,
                                      HistoricoVidaLeadRepository historicoRepository,
                                      GeradorObrigacaoStrategy geradorStrategy,
                                      EventPublisher eventPublisher,
                                      PaymentGateway paymentGateway,
                                      SignatureGateway signatureGateway,
                                      ErpSincronizadorGateway erpGateway) {
        this.leadRepository = leadRepository;
        this.empresaRepository = empresaRepository;
        this.obrigacaoRepository = obrigacaoRepository;
        this.contratoRepository = contratoRepository;
        this.historicoRepository = historicoRepository;
        this.geradorStrategy = geradorStrategy;
        this.eventPublisher = eventPublisher;
        this.paymentGateway = paymentGateway;
        this.signatureGateway = signatureGateway;
        this.erpGateway = erpGateway;
    }

    @Transactional
    public Lead executar(UUID leadId, RegimeTributario regime) {
        var lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead não encontrado: " + leadId));

        lead.qualificar();
        lead.converter();

        // Criar a EmpresaLocataria (Tenant) real no sistema
        var novaEmpresa = EmpresaLocataria.criar(lead.getEmpresaLocatariaId(), lead.getNomeEmpresa(), lead.getIdentificacao().value(), regime);
        empresaRepository.save(novaEmpresa);

        // Gerar Obrigações Iniciais baseadas no Regime
        List<Obrigacao> iniciais = geradorStrategy.gerarIniciais(novaEmpresa);
        iniciais.forEach(obrigacaoRepository::save);

        // Criar Contrato AGUARDANDO_ASSINATURA
        var contrato = Contrato.criar(leadId, lead.getEmpresaLocatariaId());
        contratoRepository.save(contrato);

        // Registrar eventos no histórico de vida do Lead
        var historico = historicoRepository.findByLeadId(leadId)
                .orElse(HistoricoVidaLead.criar(leadId, lead.getEmpresaLocatariaId()));
        historico.registrarEvento("LEAD_QUALIFICADO", "Lead qualificado e aprovado para conversão",
                EventoHistoricoLead.MarcadorEvento.SUCESSO);
        historico.registrarEvento("LEAD_CONVERTIDO", "Lead convertido para empresa ativa. Regime: " + regime.name(),
                EventoHistoricoLead.MarcadorEvento.SUCESSO);
        historico.registrarEvento("CONTRATO_GERADO", "Contrato de prestação de serviços gerado (Aguardando Assinatura)",
                EventoHistoricoLead.MarcadorEvento.ATENCAO);
        historico.registrarEvento("OBRIGACOES_GERADAS", "Obrigações fiscais iniciais geradas para regime " + regime.name(),
                EventoHistoricoLead.MarcadorEvento.NEUTRO);
        historicoRepository.save(historico);

        // Gateway calls...
        signatureGateway.createDocumentForSignature(lead.getEmpresaLocatariaId(), "Contrato de Prestação de Serviços Contábeis", "url", List.of());
        String customerId = paymentGateway.createCustomer(lead.getEmpresaLocatariaId(), lead.getNomeEmpresa(), lead.getIdentificacao().value(), lead.getEmail().value());
        paymentGateway.createCharge(lead.getEmpresaLocatariaId(), customerId, "Mensalidade SaaS - Plano Profissional", new BigDecimal("499.00"), LocalDate.now().plusDays(7));
        erpGateway.syncSale(lead.getEmpresaLocatariaId(), customerId, new BigDecimal("499.00"), "Mensalidade Onboarding");

        leadRepository.save(lead);
        eventPublisher.publishAll(lead.getDomainEvents());
        lead.clearDomainEvents();

        return lead;
    }
}
