package com.projetocontabil.core.usecases.crm;

import com.projetocontabil.core.domain.crm.model.Contrato;
import com.projetocontabil.core.domain.crm.model.StatusContrato;
import com.projetocontabil.core.domain.crm.model.EventoHistoricoLead;
import com.projetocontabil.core.domain.crm.model.HistoricoVidaLead;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.ContratoRepository;
import com.projetocontabil.core.ports.driven.HistoricoVidaLeadRepository;
import com.projetocontabil.core.ports.driven.SignatureGateway;
import com.projetocontabil.infra.messaging.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Use Case responsável pela geração assíncrona de contratos via ZapSign.
 * Fluxo: Cria contrato GERANDO → Chama ZapSign → Transita para AGUARDANDO_ASSINATURA → Notifica via WebSocket.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GerarContratoUseCase {

    private final ContratoRepository contratoRepository;
    private final HistoricoVidaLeadRepository historicoRepository;
    private final SignatureGateway signatureGateway;
    private final NotificationService notificationService;
    private final ContratoTemplateService templateService;

    @Transactional
    public void executar(UUID leadId, String empresaLocatariaId, String nomeContato, String emailContato) {
        var empresaId = EmpresaLocatariaId.of(empresaLocatariaId);

        // 1. Verificar se já existe um contrato para este Lead; se não, criar no estado GERANDO
        var contratoOpt = contratoRepository.findByLeadId(leadId);
        
        if (contratoOpt.isPresent()) {
            var existente = contratoOpt.get();
            // Se já estiver aguardando assinatura ou ativo, nao faz nada (sucesso anterior)
            if (existente.getStatus() == StatusContrato.AGUARDANDO_ASSINATURA || existente.getStatus() == StatusContrato.ATIVO) {
                log.info("[CONTRATO] Ignorando geração automática: Lead '{}' já possui contrato válido.", nomeContato);
                return;
            }
            // Se já estiver gerando agora (concorrência), evita duplicidade
            if (existente.getStatus() == StatusContrato.GERANDO) {
                log.warn("[CONTRATO] Geração já em andamento para Lead '{}'. Ignorando tentativa duplicada.", nomeContato);
                return;
            }
            // Caso contrario (ex: ERRO), retenta
            existente.retentarGeracao();
            contratoRepository.save(existente);
        } else {
            var novo = Contrato.criarParaGeracao(leadId, empresaId, nomeContato, emailContato);
            contratoRepository.save(novo);
        }

        var contrato = contratoRepository.findByLeadId(leadId).orElseThrow();

        log.info("[CONTRATO] Gerando contrato para Lead '{}' (empresa: {})", nomeContato, empresaLocatariaId);

        try {
            // 2. Gerar PDF do Contrato (Simulado via Mock para o gateway, mas real no template)
            var dados = new java.util.HashMap<String, String>();
            dados.put("RAZAO_SOCIAL", nomeContato); // Simplificado: Lead Name como Razão Social para o Mock
            dados.put("NOME_CONTATO", nomeContato);
            dados.put("IDENTIFICACAO", "CPF/CNPJ: Gerado Automaticamente");
            dados.put("VALOR_MENSAL", "R$ 499,00");

            String htmlContrato = templateService.gerarHtmlContrato(dados);
            
            // Simular o Base64 do PDF (Em produção usaríamos OpenPDF para gerar o byte[])
            String base64Pdf = java.util.Base64.getEncoder().encodeToString(htmlContrato.getBytes());

            // 3. Chamar ZapSign OneClick
            String urlDocumento = signatureGateway.createDocumentOneClick(
                    contrato.getId(),
                    empresaId,
                    "Contrato de Prestação de Serviços Contábeis — " + nomeContato,
                    base64Pdf,
                    List.of(new SignatureGateway.Signer(nomeContato, emailContato, null))
            );

            // 4. Vincular documento — transitar para AGUARDANDO_ASSINATURA
            contrato.vincularDocumentoZapSign(urlDocumento);
            contratoRepository.save(contrato);

            // 5. Adicionar Notificação oficial para o Header (NotificationCenter)
            com.projetocontabil.interfaces.rest.controller.RelatorioController.adicionarNotificacao(
                empresaLocatariaId, 
                com.projetocontabil.core.domain.crm.model.NotificacaoDownload.criarContrato(nomeContato, urlDocumento)
            );

            // 6. Registrar histórico (Timeline)
            registrarHistorico(leadId, empresaId, nomeContato, urlDocumento);

            // 5. Notificar via WebSocket
            notificationService.notifyContratoDisponivel(empresaLocatariaId, nomeContato, contrato.getId().toString());

            log.info("[CONTRATO] Contrato gerado com sucesso para Lead '{}'. URL: {}", nomeContato, urlDocumento);

        } catch (Exception e) {
            log.error("[CONTRATO] Falha ao gerar contrato para Lead '{}': {}", nomeContato, e.getMessage(), e);
            // Transitar para ERRO para que o usuário possa tentar novamente
            contrato.marcarErro();
            contratoRepository.save(contrato);
            registrarHistoricoFalha(leadId, empresaId, nomeContato, e.getMessage());
        }
    }

    private void registrarHistorico(UUID leadId, EmpresaLocatariaId empresaId, String nomeContato, String url) {
        var historico = historicoRepository.findByLeadId(leadId)
                .orElse(HistoricoVidaLead.criar(leadId, empresaId));
        historico.registrarEvento("CONTRATO_ZAPSIGN_GERADO",
                "Contrato gerado via ZapSign para " + nomeContato + ". Documento disponível para assinatura.",
                EventoHistoricoLead.MarcadorEvento.SUCESSO);
        historicoRepository.save(historico);
    }

    private void registrarHistoricoFalha(UUID leadId, EmpresaLocatariaId empresaId, String nomeContato, String erro) {
        try {
            var historico = historicoRepository.findByLeadId(leadId)
                    .orElse(HistoricoVidaLead.criar(leadId, empresaId));
            historico.registrarEvento("CONTRATO_ZAPSIGN_FALHA",
                    "Falha ao gerar contrato para " + nomeContato + ": " + erro,
                    EventoHistoricoLead.MarcadorEvento.ATENCAO);
            historicoRepository.save(historico);
        } catch (Exception ex) {
            log.error("[CONTRATO] Falha ao registrar histórico de erro: {}", ex.getMessage());
        }
    }
}
