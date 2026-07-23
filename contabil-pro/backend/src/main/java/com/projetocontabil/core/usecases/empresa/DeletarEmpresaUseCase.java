package com.projetocontabil.core.usecases.empresa;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.EmpresaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeletarEmpresaUseCase {

    private final EmpresaRepository repository;

    public void executar(UUID id, EmpresaLocatariaId locatariaId) {
        repository.deletar(id, locatariaId);
    }
}
