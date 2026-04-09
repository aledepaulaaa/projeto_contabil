package com.projetocontabil.infra.integrations;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.ErpSincronizadorGateway;
import com.projetocontabil.core.ports.driven.PaymentGateway;
import com.projetocontabil.core.ports.driven.SignatureGateway;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
public class MockIntegrations implements PaymentGateway, SignatureGateway, ErpSincronizadorGateway {

    // --- PaymentGateway ---
    @Override
    public String createCustomer(EmpresaLocatariaId tid, String name, String taxId, String email) {
        log.info("[MOCK] Criando cliente no Gateway de Pagamento: {} (ID: {})", name, tid.value());
        return "cus_mock_" + tid.value();
    }

    @Override
    public void createCharge(EmpresaLocatariaId tid, String customerId, String desc, BigDecimal amount, LocalDate dueDate) {
        log.info("[MOCK] Criando cobrança de {} para cliente {}: {}", amount, customerId, desc);
    }

    // --- SignatureGateway ---
    @Override
    public String createDocumentOneClick(UUID contratoId, EmpresaLocatariaId tid, String title, String base64Content, List<Signer> signers) {
        String signerToken = UUID.randomUUID().toString();
        String oneClickUrl = "https://app.zapsign.com.br/verificar/oneclick/" + signerToken;
        log.info("[MOCK] Criando documento OneClick: '{}'. URL: {}", title, oneClickUrl);
        return oneClickUrl;
    }

    @Override
    @Deprecated
    public String createDocumentForSignature(UUID contratoId, EmpresaLocatariaId tid, String title, String url, List<Signer> signers) {
        String internalUrl = "http://localhost:8080/api/contratos/" + contratoId + "/documento";
        log.info("[MOCK] Criando documento clássico (Deprecated): '{}' → URL: {}", title, internalUrl);
        return internalUrl;
    }

    // --- ErpSincronizadorGateway ---
    @Override
    public void syncSale(EmpresaLocatariaId id, String customerId, BigDecimal amount, String description) {
        log.info("[MOCK] Sincronizando venda no ERP: {} - {}", description, amount);
    }
}
