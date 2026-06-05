package com.projetocontabil.core.usecases.atendimento;

import com.projetocontabil.core.domain.atendimento.model.Atendimento;
import com.projetocontabil.core.domain.crm.model.EventoHistoricoLead;
import com.projetocontabil.core.domain.crm.model.HistoricoVidaLead;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.AtendimentoRepository;
import com.projetocontabil.core.ports.driven.HistoricoVidaLeadRepository;
import com.projetocontabil.infra.messaging.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransferirAtendimentoUseCase {

    private final AtendimentoRepository atendimentoRepository;
    private final HistoricoVidaLeadRepository historicoRepository;
    private final NotificationService notificationService;
    private final com.projetocontabil.core.ports.driven.LeadRepository leadRepository;
    private final com.projetocontabil.core.ports.driven.DepartamentoRepository departamentoRepository;

    @Transactional
    public void executar(UUID leadId, UUID novoDeptoId, UUID novoAtendenteId, String empresaId) {
        log.info("[TransferirAtendimento] Lead: {} -> Novo Depto: {}", leadId, novoDeptoId);

        Atendimento atendimento = atendimentoRepository.findAtivoPorLead(leadId)
                .orElseGet(() -> Atendimento.criar(empresaId, leadId, novoDeptoId));

        if (!atendimento.getEmpresaLocatariaId().equals(empresaId)) {
            throw new SecurityException("Acesso negado: Lead não pertence à empresa locatária.");
        }

        atendimento.transferir(novoDeptoId, novoAtendenteId);
        atendimentoRepository.save(atendimento);

        // Buscar nome do lead para notificação
        String leadName = leadRepository.findById(leadId)
                .map(com.projetocontabil.core.domain.crm.model.Lead::getNomeContato)
                .orElse("Lead Desconhecido");
                
        // Buscar nome do departamento para notificação elegante
        String nomeDepto = "Geral";
        if (novoDeptoId != null) {
            nomeDepto = departamentoRepository.findById(novoDeptoId)
                    .map(com.projetocontabil.core.domain.departamento.model.Departamento::getNome)
                    .orElse("Depto " + novoDeptoId.toString().substring(0,8));
        }

        // Registrar na Timeline
        String detalhes = String.format("Transferido para %s / %s", 
            nomeDepto,
            novoAtendenteId != null ? "Atendente " + novoAtendenteId.toString().substring(0,8) : "Fila");
            
        registrarEventoTimeline(leadId, empresaId, "ATENDIMENTO_TRANSFERIDO", 
                "Atendimento transferido: " + detalhes);

        // Notificar equipe (Global e Chat)
        if (novoDeptoId != null) {
            notificationService.notifyTransferenciaSetorial(empresaId, novoDeptoId.toString(), leadName, nomeDepto, leadId.toString());
        } else {
            notificationService.notifyTransferencia(empresaId, leadName, nomeDepto, leadId.toString());
        }
        
        notificationService.notifyNewMessage(leadId.toString(), 
            "🔄 Atendimento transferido: " + detalhes, 
            "SISTEMA", 
            System.currentTimeMillis() / 1000);
    }

    private void registrarEventoTimeline(UUID leadId, String empresaId, String tipo, String descricao) {
        var historico = historicoRepository.findByLeadId(leadId)
                .orElse(HistoricoVidaLead.criar(leadId, new EmpresaLocatariaId(empresaId)));
        
        historico.registrarEvento(tipo, descricao, EventoHistoricoLead.MarcadorEvento.NEUTRO);
        historicoRepository.save(historico);
    }
}
