package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.crm.model.AutomacaoTemplate;
import com.projetocontabil.core.domain.crm.model.StatusLead;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;

import java.util.List;
import java.util.Optional;

public interface AutomacaoTemplateRepository {
    List<AutomacaoTemplate> findAllByEmpresaLocatariaId(EmpresaLocatariaId empresaId);
    Optional<AutomacaoTemplate> findByEmpresaAndGatilho(EmpresaLocatariaId empresaId, StatusLead gatilho);
    AutomacaoTemplate save(AutomacaoTemplate template);
}
