package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.empresa.model.Empresa;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmpresaRepository {
    void salvar(Empresa empresa);
    Optional<Empresa> buscarPorId(UUID id, EmpresaLocatariaId locatariaId);
    List<Empresa> listarPorLocataria(EmpresaLocatariaId locatariaId);
    Optional<Empresa> buscarPorIdentificacao(String identificacao, EmpresaLocatariaId locatariaId);
}
