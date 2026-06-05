package com.projetocontabil.core.domain.atendimento.model;

import org.junit.jupiter.api.Test;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

public class AtendimentoTransferenciaTDDTest {

    @Test
    void deveIniciarAtendimentoComTransferidoFalso() {
        Atendimento atendimento = Atendimento.criar("tenant-1", UUID.randomUUID(), UUID.randomUUID());
        assertFalse(atendimento.isTransferido());
    }

    @Test
    void deveMarcarComoTransferidoAoMudarDeAtendente() {
        Atendimento atendimento = Atendimento.criar("tenant-1", UUID.randomUUID(), UUID.randomUUID());
        atendimento.aceitar(UUID.randomUUID());
        
        UUID novoAtendenteId = UUID.randomUUID();
        atendimento.transferir(atendimento.getDepartamentoId(), novoAtendenteId);
        
        assertTrue(atendimento.isTransferido());
    }
}
