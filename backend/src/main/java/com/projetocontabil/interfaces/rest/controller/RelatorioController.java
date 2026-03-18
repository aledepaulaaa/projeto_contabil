package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.usecases.rotinas.GerarRelatorioMensalUseCase;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/relatorios")
public class RelatorioController {

    private final GerarRelatorioMensalUseCase gerarRelatorioMensalUseCase;

    public RelatorioController(GerarRelatorioMensalUseCase gerarRelatorioMensalUseCase) {
        this.gerarRelatorioMensalUseCase = gerarRelatorioMensalUseCase;
    }

    @GetMapping("/mensal")
    public ResponseEntity<byte[]> baixarRelatorio(@RequestParam int mesFinal, @RequestParam int anoFinal) {
        String empresaLocatariaId = EmpresaLocatariaContext.getCurrentTenant();
        byte[] pdf = gerarRelatorioMensalUseCase.executar(empresaLocatariaId, mesFinal, anoFinal);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-mensal.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
