package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import java.math.BigDecimal;

public interface ErpSincronizadorGateway {
    void syncSale(EmpresaLocatariaId id, String customerId, BigDecimal amount, String description);
}
