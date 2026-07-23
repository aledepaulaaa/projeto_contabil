package com.projetocontabil.core.usecases.empresa;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.EmpresaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class DeletarEmpresaUseCaseTest {

    @Mock
    private EmpresaRepository repository;

    @InjectMocks
    private DeletarEmpresaUseCase deletarEmpresaUseCase;

    @Test
    void deveDeletarEmpresaComSucessoPreservandoMultiTenancy() {
        UUID id = UUID.randomUUID();
        EmpresaLocatariaId locatariaId = EmpresaLocatariaId.of("tenant-123");

        deletarEmpresaUseCase.executar(id, locatariaId);

        verify(repository).deletar(id, locatariaId);
    }
}
