package com.projetocontabil.core.usecases.crm;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import com.opencsv.CSVWriter;
import com.projetocontabil.core.domain.crm.model.HistoricoVidaLead;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;

@Service
public class HistoricoExportService {

    public byte[] exportarParaCsv(HistoricoVidaLead historico) throws IOException {
        StringWriter sw = new StringWriter();
        try (CSVWriter writer = new CSVWriter(sw)) {
            // Header
            writer.writeNext(new String[]{"Data", "Tipo", "Descricao", "Marcador"});

            // Dados
            historico.getEventosOrdenados().forEach(e -> {
                writer.writeNext(new String[]{
                        e.getOcorridoEm().toString(),
                        e.getTipo(),
                        e.getDescricao(),
                        e.getMarcador().name()
                });
            });
        }
        return sw.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportarParaPdf(HistoricoVidaLead historico, String nomeLead) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Título
            Font fontTitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph titulo = new Paragraph("Histórico de Operações - Lead: " + nomeLead, fontTitulo);
            titulo.setAlignment(Element.ALIGN_CENTER);
            titulo.setSpacingAfter(20);
            document.add(titulo);

            // Tabela/Lista
            Font fontNormal = FontFactory.getFont(FontFactory.HELVETICA, 12);
            Font fontBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);

            for (var e : historico.getEventosOrdenados()) {
                Paragraph p = new Paragraph();
                p.add(new Chunk(e.getOcorridoEm().toString() + " - ", fontBold));
                p.add(new Chunk("[" + e.getTipo() + "] ", fontBold));
                p.add(new Chunk(e.getDescricao(), fontNormal));
                p.setSpacingAfter(10);
                document.add(p);
            }

            document.close();
        } catch (DocumentException e) {
            throw new IOException("Erro ao gerar PDF", e);
        }
        return out.toByteArray();
    }
}
