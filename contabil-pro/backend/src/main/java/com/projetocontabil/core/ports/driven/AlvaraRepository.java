package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.alvaras.model.Alvara;
import com.projetocontabil.core.domain.alvaras.model.Processo;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AlvaraRepository {
    Alvara saveAlvara(Alvara alvara);
    Optional<Alvara> findAlvaraById(UUID id);
    List<Alvara> findVencidosByEmpresaLocatariaId(EmpresaLocatariaId id);
    List<Alvara> findAllAlvarasByEmpresaLocatariaId(EmpresaLocatariaId id);
    Processo saveProcesso(Processo processo);
    Optional<Processo> findProcessoById(UUID id);
    List<Processo> findProcessosByAlvaraId(UUID alvaraId);
    long countVencidosByEmpresaLocatariaId(EmpresaLocatariaId id);
}
