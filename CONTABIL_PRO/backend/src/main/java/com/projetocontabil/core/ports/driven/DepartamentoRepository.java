package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.departamento.model.Departamento;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DepartamentoRepository {
    Departamento save(Departamento departamento);
    Optional<Departamento> findById(UUID id);
    List<Departamento> findAllByEmpresaLocatariaId(EmpresaLocatariaId empresaId);
    void deleteById(UUID id);
    boolean existsByNomeAndEmpresaLocatariaId(String nome, String empresaLocatariaId);
    Optional<Departamento> findByNomeAndEmpresaLocatariaId(String nome, String empresaLocatariaId);
}
