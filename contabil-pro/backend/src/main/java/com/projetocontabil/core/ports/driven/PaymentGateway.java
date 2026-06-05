package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import java.math.BigDecimal;
import java.time.LocalDate;

public interface PaymentGateway {
    String createCustomer(EmpresaLocatariaId tid, String name, String taxId, String email);
    void createCharge(EmpresaLocatariaId tid, String customerId, String desc, BigDecimal amount, LocalDate dueDate);
}
