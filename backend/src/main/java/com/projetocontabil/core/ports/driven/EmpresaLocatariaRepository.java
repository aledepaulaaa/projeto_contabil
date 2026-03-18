package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.empresalocataria.model.EmpresaLocataria;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import java.util.Optional;

/**
 * Port DRIVEN — Repositório de Empresas Locatarias (Tenants).
 */
public interface EmpresaLocatariaRepository {
    Optional<EmpresaLocataria> findByEmpresaLocatariaId(EmpresaLocatariaId id);
    EmpresaLocataria save(EmpresaLocataria empresa);
}
