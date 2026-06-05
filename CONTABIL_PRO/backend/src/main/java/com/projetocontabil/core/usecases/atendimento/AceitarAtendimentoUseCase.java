package com.projetocontabil.core.usecases.atendimento;

import com.projetocontabil.core.domain.atendimento.model.Atendimento;
import com.projetocontabil.core.ports.driven.AtendimentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AceitarAtendimentoUseCase {

    private final AtendimentoRepository atendimentoRepository;

    @Transactional
    public void executar(UUID leadId, UUID atendenteId, String empresaId) {
        Atendimento atendimento = atendimentoRepository.findAtivoPorLead(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Nenhum atendimento ativo em fila encontrado."));

        if (!atendimento.getEmpresaLocatariaId().equals(empresaId)) {
            throw new SecurityException("Acesso negado: Lead não pertence à sua empresa.");
        }

        atendimento.aceitar(atendenteId);
        atendimentoRepository.save(atendimento);
    }
}
