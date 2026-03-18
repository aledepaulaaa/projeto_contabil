package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.rotinas.model.Obrigacao;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ObrigacaoRepository {
    Obrigacao save(Obrigacao obrigacao);
    Optional<Obrigacao> findById(UUID id);
    List<Obrigacao> findPendentesByEmpresaLocatariaId(EmpresaLocatariaId id);
    List<Obrigacao> findAllByEmpresaLocatariaId(EmpresaLocatariaId id);
    long countByEmpresaLocatariaIdAndStatus(EmpresaLocatariaId id, Obrigacao.StatusObrigacao status);
    List<Obrigacao> findAllByEmpresaLocatariaIdAndCompetence(EmpresaLocatariaId id, int mes, int ano);
}
