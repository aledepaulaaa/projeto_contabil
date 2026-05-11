package com.projetocontabil.infra.integrations.email;

import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.crm.model.EventoHistoricoLead;
import com.projetocontabil.core.domain.crm.model.HistoricoVidaLead;
import com.projetocontabil.core.domain.crm.model.AutomacaoTemplate;
import com.projetocontabil.core.domain.empresalocataria.model.EmpresaLocataria;
import com.projetocontabil.core.ports.driven.AutomacaoTemplateRepository;
import com.projetocontabil.core.ports.driven.ContratoRepository;
import com.projetocontabil.core.ports.driven.EmpresaLocatariaRepository;
import com.projetocontabil.core.ports.driven.HistoricoVidaLeadRepository;
import com.projetocontabil.infra.messaging.EmailProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Optional;

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
    private final AutomacaoTemplateRepository templateRepository;
    private final ContratoRepository contratoRepository;

    /**
     * Envia notificação automática baseada na mudança de status do Lead.
     */
    @Async
    public void enviarNotificacaoStatus(Lead lead, StatusLead novoStatus) {
        enviarNotificacaoStatus(lead, novoStatus, null);
    }

    @Async
    public void enviarNotificacaoStatus(Lead lead, StatusLead novoStatus, String customUrl) {
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
        String corpo = gerarCorpoEmail(lead, novoStatus, customUrl);

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

    private String gerarCorpoEmail(Lead lead, StatusLead status, String customUrl) {
        String templateBase = """
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

        String mensagem = obterMensagemDoTemplate(lead, status);
        if (mensagem == null) return null;

        // Substituir as variáveis dinâmicas
        mensagem = formatarVariaveis(mensagem, lead, customUrl);

        // Convertendo quebras de linha para HTML
        mensagem = mensagem.replace("\n", "<br/>");

        return String.format(templateBase, lead.getNomeContato(), mensagem);
    }

    private String obterMensagemDoTemplate(Lead lead, StatusLead status) {
        Optional<AutomacaoTemplate> templateOpt = templateRepository.findByEmpresaAndGatilho(lead.getEmpresaLocatariaId(), status);
        
        if (templateOpt.isPresent()) {
            return templateOpt.get().getTexto();
        }

        // Fallbacks caso não exista template configurado
        return switch (status) {
            case PROPOSTA -> "Acabamos de gerar o contrato de prestação de serviços para a empresa <strong>{empresa}</strong>. O link para assinatura digital via ZapSign é: <a href=\"{link_zapsign}\">{link_zapsign}</a>. Por favor, revise e realize a assinatura para darmos prosseguimento.";
            case AGUARDANDO -> "Estamos aguardando a assinatura do contrato da <strong>{empresa}</strong>. Caso tenha alguma dúvida sobre as cláusulas ou precise de suporte, responda a este e-mail.";
            case FECHAMENTO -> "Parabéns {nome}! 🎉 O contrato da <strong>{empresa}</strong> foi assinado com sucesso. Seja muito bem-vindo(a)! Você agora entra em nossa fase de Onboarding, onde nossa equipe de implantação cuidará de todos os detalhes da sua empresa.";
            default -> null;
        };
    }

    private String formatarVariaveis(String texto, Lead lead, String customUrl) {
        String urlZapsign = customUrl != null ? customUrl : "Link não disponível";
        
        if (customUrl == null) {
            try {
                var contratoOpt = contratoRepository.findByLeadId(lead.getId());
                if (contratoOpt.isPresent() && contratoOpt.get().getUrlDocumentoZapSign() != null) {
                    urlZapsign = contratoOpt.get().getUrlDocumentoZapSign();
                }
            } catch (Exception e) {
                log.warn("Falha ao buscar URL do contrato para formatação de e-mail do lead {}: {}", lead.getId(), e.getMessage());
            }
        }

        return texto
            .replace("{nome}", lead.getNomeContato() != null ? lead.getNomeContato() : "")
            .replace("{empresa}", lead.getNomeEmpresa() != null ? lead.getNomeEmpresa() : "")
            .replace("{link_documento}", urlZapsign) // Proposta e Assinatura podem compartilhar a mesma URL neste contexto
            .replace("{link_zapsign}", urlZapsign);
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
