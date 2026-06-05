package com.projetocontabil.core.usecases.empresa;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.empresa.model.Empresa;
import com.projetocontabil.core.domain.empresa.model.RegimeTributario;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.EmpresaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportarEmpresasUseCase {

    private final EmpresaRepository repository;

    @Transactional
    public List<Empresa> executar(InputStream inputStream, EmpresaLocatariaId locatariaId) {
        List<Empresa> empresasImportadas = new ArrayList<>();

        try (CSVReader reader = new CSVReaderBuilder(new InputStreamReader(inputStream))
                .withCSVParser(new com.opencsv.CSVParserBuilder().withSeparator(',').build())
                .withSkipLines(1)
                .build()) {

            String[] line;
            int rowNumber = 1;
            while ((line = reader.readNext()) != null) {
                rowNumber++;
                try {
                    if (line.length < 3 || line[0].isBlank()) continue;

                    String razaoSocial = line[0].trim();
                    String nomeFantasia = line.length > 1 ? line[1].trim() : null;
                    String identificacao = line[2].trim();
                    String regimeStr = line.length > 3 ? line[3].trim().toUpperCase() : "SIMPLES";
                    String idInterno = line.length > 4 ? line[4].trim() : null;

                    RegimeTributario regime = parseRegime(regimeStr);
                    Identificacao ident = new Identificacao(identificacao);

                    // Evitar duplicidade na importação
                    if (repository.buscarPorIdentificacao(ident.value(), locatariaId).isPresent()) {
                        log.warn("Linha {}: Empresa com identificação {} já existe. Ignorando.", rowNumber, identificacao);
                        continue;
                    }

                    Empresa empresa = Empresa.criar(locatariaId, razaoSocial, nomeFantasia, ident, regime, idInterno);
                    repository.salvar(empresa);
                    empresasImportadas.add(empresa);

                } catch (Exception e) {
                    log.error("Erro na linha {}: {}", rowNumber, e.getMessage());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar CSV de empresas", e);
        }

        return empresasImportadas;
    }

    private RegimeTributario parseRegime(String value) {
        try {
            return RegimeTributario.valueOf(value);
        } catch (Exception e) {
            return RegimeTributario.SIMPLES;
        }
    }
}
