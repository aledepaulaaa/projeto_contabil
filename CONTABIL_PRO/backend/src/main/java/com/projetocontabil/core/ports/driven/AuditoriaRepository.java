package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.shared.AuditoriaAtividade;

import java.util.List;

public interface AuditoriaRepository {
    void salvar(AuditoriaAtividade atividade);
    List<AuditoriaAtividade> buscarPorEmpresa(EmpresaLocatariaId empresaId);
    void limparPorEmpresa(EmpresaLocatariaId empresaId);
}
