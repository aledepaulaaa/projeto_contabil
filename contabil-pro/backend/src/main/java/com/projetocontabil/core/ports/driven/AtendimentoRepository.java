package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.atendimento.model.Atendimento;
import java.util.Optional;
import java.util.UUID;

public interface AtendimentoRepository {
    void save(Atendimento atendimento);
    Optional<Atendimento> findById(UUID id);
    Optional<Atendimento> findAtivoPorLead(UUID leadId);
    java.util.List<Atendimento> findAllAtivosByEmpresa(String empresaId);
    java.util.List<Atendimento> findAllByDepartamentoId(UUID departamentoId);

    void deleteAllByEmpresaLocatariaId(String empresaId);

}
