package com.projetocontabil.infra.integrations.email;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.crm.model.EventoHistoricoLead;
import com.projetocontabil.core.domain.crm.model.HistoricoVidaLead;
import com.projetocontabil.core.domain.empresalocataria.model.EmpresaLocataria;
import com.projetocontabil.core.ports.driven.EmpresaLocatariaRepository;
import com.projetocontabil.core.ports.driven.HistoricoVidaLeadRepository;
import com.projetocontabil.infra.messaging.EmailProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Serviço de Integração para disparos de e-mail automáticos.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailIntegrationService {

    private final EmailProducer emailProducer;
    private final HistoricoVidaLeadRepository historicoRepository;
    private final EmpresaLocatariaRepository empresaRepository;

    /**
     * Envia notificação automática baseada na mudança de status do Lead.
     */
    @Async
    public void enviarNotificacaoStatus(Lead lead, StatusLead novoStatus) {
        // Verificar se Automação está Ativa para a Empresa
        EmpresaLocataria empresa = empresaRepository.findByEmpresaLocatariaId(lead.getEmpresaLocatariaId())
                .orElse(null);

        if (empresa != null && !empresa.isEmailAutomacaoAtivo()) {
            log.info("Automação de E-mail desativada para a empresa {}. Ignorando disparo.", empresa.getNome());
            return;
        }

        if (lead.getEmail() == null || lead.getEmail().value() == null) {
            log.warn("ABORTANDO: Lead {} (ID: {}) não possui e-mail cadastrado. Automação cancelada.", 
                     lead.getNomeContato(), lead.getId());
            registrarAlertaTimeline(lead, "E-mail ausente para automação do status " + novoStatus);
            return;
        }

        String assunto = "Novidades sobre sua proposta: " + lead.getNomeEmpresa();
        String corpo = gerarCorpoEmail(lead, novoStatus);

        if (corpo == null) return;

        try {
            log.info("Encaminhando e-mail de status [{}] para a fila. Lead: {}", novoStatus, lead.getNomeContato());
            
            emailProducer.enviarEmail(
                    lead.getEmail().value(),
                    assunto,
                    corpo,
                    lead.getEmpresaLocatariaId().value()
            );

        } catch (Exception e) {
            log.error("ERRO ao encaminhar e-mail para a fila: {}", e.getMessage());
        }
    }

    private String gerarCorpoEmail(Lead lead, StatusLead status) {
        String template = """
            <html>
                <body style="font-family: Arial, sans-serif; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                        <h2 style="color: #2563eb;">Olá %s!</h2>
                        <p style="font-size: 16px; line-height: 1.5;">%s</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #777;">Atenciosamente,<br />Equipe Projeto Contábil</p>
                    </div>
                </body>
            </html>
            """;

        String mensagem = switch (status) {
            case PROPOSTA -> String.format(
                "Acabamos de gerar sua proposta para a empresa <strong>%s</strong>. Verifique os detalhes em anexo (em breve disponível no portal) ou aguarde nosso contato.",
                lead.getNomeEmpresa());
            
            case AGUARDANDO -> String.format(
                "Sua solicitação para <strong>%s</strong> está em análise. Fique atento à sua caixa de entrada para os próximos passos.",
                lead.getNomeEmpresa());
                
            case FECHAMENTO -> String.format(
                "Parabéns! 🎉 Estamos finalizando o contrato da <strong>%s</strong>. Você receberá em breve o link para assinatura digital.",
                lead.getNomeEmpresa());
                
            default -> null;
        };

        return mensagem != null ? String.format(template, lead.getNomeContato(), mensagem) : null;
    }

    private void registrarAlertaTimeline(Lead lead, String descricao) {
        try {
            var historico = historicoRepository.findByLeadId(lead.getId())
                    .orElse(HistoricoVidaLead.criar(lead.getId(), lead.getEmpresaLocatariaId()));
            
            historico.registrarEvento("EMAIL_ABSENT", descricao, EventoHistoricoLead.MarcadorEvento.ATENCAO);
            historicoRepository.save(historico);
        } catch (Exception e) {
            log.error("Erro ao registrar alerta de e-mail ausente na timeline: {}", e.getMessage());
        }
    }
}
