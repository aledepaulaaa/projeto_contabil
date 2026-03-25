package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.crm.model.Contrato;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContratoRepository {
    Contrato save(Contrato contrato);
    Optional<Contrato> findById(UUID id);
    Optional<Contrato> findByLeadId(UUID leadId);
    List<Contrato> findAllByEmpresaLocatariaId(EmpresaLocatariaId id);
}
