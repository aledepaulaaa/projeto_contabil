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
    public void createDocumentForSignature(EmpresaLocatariaId tid, String title, String url, List<Signer> signers) {
        log.info("[MOCK] Criando documento para assinatura: '{}' para a empresa {}", title, tid.value());
    }

    // --- ErpSincronizadorGateway ---
    @Override
    public void syncSale(EmpresaLocatariaId id, String customerId, BigDecimal amount, String description) {
        log.info("[MOCK] Sincronizando venda no ERP: {} - {}", description, amount);
    }
}
