package com.projetocontabil.core.usecases.rotinas;

import com.projetocontabil.core.domain.empresalocataria.model.EmpresaLocataria;
import com.projetocontabil.core.domain.rotinas.model.Obrigacao;
import com.projetocontabil.core.domain.rotinas.model.RegimeTributario;
import com.projetocontabil.core.domain.rotinas.model.TipoObrigacao;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class GeradorObrigacaoStrategy {

    public List<Obrigacao> gerarIniciais(EmpresaLocataria empresa) {
        List<Obrigacao> iniciais = new ArrayList<>();
        RegimeTributario regime = empresa.getRegimeTributario();
        LocalDateTime agora = LocalDateTime.now();

        if (regime == RegimeTributario.MEI || regime == RegimeTributario.SIMPLES_NACIONAL) {
            iniciais.add(Obrigacao.reconstituir(
                    UUID.randomUUID(),
                    empresa.getEmpresaId(),
                    "Guia DAS - Documento de Arrecadação Simplificada",
                    TipoObrigacao.DAS,
                    agora.getMonthValue(),
                    agora.getYear(),
                    agora.withDayOfMonth(20).plusMonths(1),
                    Obrigacao.StatusObrigacao.A_FAZER,
                    agora
            ));
        }

        if (regime == RegimeTributario.SIMPLES_NACIONAL || regime == RegimeTributario.LUCRO_PRESUMIDO) {
            iniciais.add(Obrigacao.reconstituir(
                    UUID.randomUUID(),
                    empresa.getEmpresaId(),
                    "Guia ISS - Imposto Sobre Serviços",
                    TipoObrigacao.ISS,
                    agora.getMonthValue(),
                    agora.getYear(),
                    agora.withDayOfMonth(10).plusMonths(1),
                    Obrigacao.StatusObrigacao.A_FAZER,
                    agora
            ));
        }

        return iniciais;
    }
}
