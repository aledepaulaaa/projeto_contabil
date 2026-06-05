package com.projetocontabil.core.usecases.rotinas;

import org.springframework.stereotype.Service;

@Service
public class GerarRelatorioMensalUseCase {
    public byte[] executar(String empresaLocatariaId, int mes, int ano) {
        // Mock de geração de PDF para compilação
        return "PDF MOCK CONTENT".getBytes();
    }
}
