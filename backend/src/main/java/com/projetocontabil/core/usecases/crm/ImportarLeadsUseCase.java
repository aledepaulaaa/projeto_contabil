package com.projetocontabil.core.usecases.crm;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.projetocontabil.core.domain.crm.model.Lead;
import com.projetocontabil.core.domain.crm.model.OrigemLead;
import com.projetocontabil.core.domain.crm.model.TipoServico;
import com.projetocontabil.core.domain.crm.vo.Email;
import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.crm.vo.Telefone;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.LeadRepository;
import com.projetocontabil.core.ports.driven.HistoricoVidaLeadRepository;
import com.projetocontabil.core.domain.crm.model.HistoricoVidaLead;
import com.projetocontabil.core.domain.crm.model.EventoHistoricoLead;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

/**
 * Use Case para importação massiva de Leads via arquivo CSV.
 * O formato esperado é: nome_contato, email, cnpj, nome_empresa, origem, tipo_servico, telefone
 */
@Service
@Slf4j
public class ImportarLeadsUseCase {

    private final LeadRepository leadRepository;
    private final HistoricoVidaLeadRepository historicoRepository;

    public ImportarLeadsUseCase(LeadRepository leadRepository, HistoricoVidaLeadRepository historicoRepository) {
        this.leadRepository = leadRepository;
        this.historicoRepository = historicoRepository;
    }

    @Transactional
    public List<Lead> executar(InputStream inputStream, String empresaIdExterno) {
        List<Lead> leadsImportados = new ArrayList<>();
        EmpresaLocatariaId empresaId = new EmpresaLocatariaId(empresaIdExterno);

        try (CSVReader reader = new CSVReaderBuilder(new InputStreamReader(inputStream))
                .withCSVParser(new com.opencsv.CSVParserBuilder().withSeparator(',').build())
                .withSkipLines(1) // Pular o cabeçalho
                .build()) {

            String[] line;
            int rowNumber = 1;
            while ((line = reader.readNext()) != null) {
                rowNumber++;
                try {
                    log.debug("Processando linha {}: {}", rowNumber, (Object) line);
                    
                    if (line.length < 2 || line[0].isBlank()) {
                        log.warn("Linha {} ignorada: incompleta ou vazia.", rowNumber);
                        continue;
                    }

                    String nome = line[0].trim();
                    Email email = (line.length > 1 && !line[1].isBlank()) ? new Email(line[1].trim()) : null;
                    
                    // Tratamento de documento (resiliente)
                    String docRaw = (line.length > 2 && line[2] != null) ? line[2].replaceAll("\\D", "") : "";
                    Identificacao ident = null;
                    try {
                        if (!docRaw.isBlank()) ident = new Identificacao(docRaw);
                    } catch (Exception e) {
                        log.warn("Linha {}: Documento '{}' inválido, prosseguindo sem identificação.", rowNumber, docRaw);
                    }

                    String empresaNome = (line.length > 3 && !line[3].isBlank()) ? line[3].trim() : nome;
                    
                    OrigemLead origem = parseOrigem(line.length > 4 ? line[4] : null);
                    TipoServico tipoServico = parseServico(line.length > 5 ? line[5] : null);
                    
                    String telRaw = (line.length > 6 && line[6] != null) ? line[6].replaceAll("\\D", "") : "";
                    Telefone telefone = (!telRaw.isBlank() && telRaw.length() >= 10) ? new Telefone(telRaw) : null;

                    Lead lead = Lead.criar(empresaId, nome, email, telefone, ident, empresaNome, origem, tipoServico);
                    
                    leadRepository.save(lead);
                    
                    var historico = HistoricoVidaLead.criar(lead.getId(), empresaId);
                    historico.registrarEvento("IMPORTACAO", "Lead importado via arquivo CSV", EventoHistoricoLead.MarcadorEvento.NEUTRO);
                    
                    if (telefone == null) {
                        historico.registrarEvento("DADOS_AUSENTES", "Lead importado sem telefone. Automações de WhatsApp desativadas.", EventoHistoricoLead.MarcadorEvento.ATENCAO);
                    }

                    historicoRepository.save(historico);

                    leadsImportados.add(lead);
                    log.info("Linha {} importada com sucesso: {}", rowNumber, nome);
                    
                } catch (Exception e) {
                    log.error("Erro fatal na linha {}: {}. Erro: {}", rowNumber, line, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Falha crítica no processamento do CSV", e);
            throw new RuntimeException("Falha ao ler arquivo CSV: " + e.getMessage());
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
