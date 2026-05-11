package com.projetocontabil.core.usecases.empresa;

import com.projetocontabil.core.domain.empresa.model.Empresa;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.EmpresaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ListarEmpresasUseCase {

    private final EmpresaRepository repository;

    public List<Empresa> executar(EmpresaLocatariaId locatariaId) {
        return repository.listarPorLocataria(locatariaId);
    }
}
