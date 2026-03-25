package com.projetocontabil.core.usecases.crm;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.OrigemLead;
import com.projetocontabil.core.domain.crm.model.TipoServico;
import com.projetocontabil.core.domain.crm.vo.Email;
import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.LeadRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

/**
 * Use Case para importação massiva de Leads via arquivo CSV.
 * O formato esperado é: nome_contato, email, cnpj, nome_empresa, origem, tipo_servico
 */
@Service
@Slf4j
public class ImportarLeadsUseCase {

    private final LeadRepository leadRepository;

    public ImportarLeadsUseCase(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    @Transactional
    public List<Lead> executar(InputStream inputStream, String tenantId) {
        List<Lead> leadsImportados = new ArrayList<>();
        EmpresaLocatariaId empresaId = new EmpresaLocatariaId(tenantId);

        try (CSVReader reader = new CSVReaderBuilder(new InputStreamReader(inputStream))
                .withSkipLines(1) // Pular o cabeçalho
                .build()) {

            String[] line;
            while ((line = reader.readNext()) != null) {
                try {
                    if (line.length < 2 || line[0].isBlank() || line[1].isBlank()) {
                        log.warn("Linha inválida ou incompleta no CSV: {}", (Object) line);
                        continue;
                    }

                    String nome = line[0].trim();
                    Email email = new Email(line[1].trim());
                    
                    // Tratamento de documento (remove tudo que não é dígito)
                    String docRaw = line.length > 2 ? line[2].replaceAll("[^0-9]", "") : "";
                    Identificacao ident = (!docRaw.isBlank() && (docRaw.length() == 11 || docRaw.length() == 14)) 
                            ? new Identificacao(docRaw) : null;

                    String empresaNome = (line.length > 3 && !line[3].isBlank()) ? line[3].trim() : nome;
                    
                    OrigemLead origem = parseOrigem(line.length > 4 ? line[4] : null);
                    TipoServico tipoServico = parseServico(line.length > 5 ? line[5] : null);

                    Lead lead = Lead.criar(empresaId, nome, email, ident, empresaNome, origem, tipoServico);
                    
                    // Opcional: Verificar duplicidade antes de salvar (por e-mail no mesmo tenant, por exemplo)
                    // Por simplicidade, seguiremos as regras do repositório
                    
                    leadRepository.save(lead);
                    leadsImportados.add(lead);
                    
                } catch (Exception e) {
                    log.error("Erro ao processar linha do CSV: {}. Erro: {}", line, e.getMessage());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Falha crítica ao processar arquivo de importação: " + e.getMessage(), e);
        }

        return leadsImportados;
    }

    private OrigemLead parseOrigem(String value) {
        if (value == null || value.isBlank()) return OrigemLead.PLANILHA;
        try {
            return OrigemLead.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return OrigemLead.PLANILHA;
        }
    }

    private TipoServico parseServico(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return TipoServico.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
