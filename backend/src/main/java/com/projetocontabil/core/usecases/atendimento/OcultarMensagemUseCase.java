package com.projetocontabil.core.usecases.atendimento;

import com.projetocontabil.core.ports.driven.MensagemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OcultarMensagemUseCase {

    private final MensagemRepository mensagemRepository;

    @Transactional
    public void executar(UUID mensagemId, boolean ocultar) {
        mensagemRepository.atualizarVisibilidade(mensagemId, !ocultar);
    }
}
