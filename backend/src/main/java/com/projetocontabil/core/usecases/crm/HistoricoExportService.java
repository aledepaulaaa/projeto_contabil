package com.projetocontabil.core.usecases.crm;

import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Element;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.PageSize;
import com.lowagie.text.pdf.PdfWriter;
import com.opencsv.CSVWriter;
import com.projetocontabil.core.domain.crm.model.HistoricoVidaLead;
import com.projetocontabil.core.domain.shared.AuditoriaAtividade;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

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

    public byte[] exportarGeralParaCsv(List<AuditoriaAtividade> atividades) throws IOException {
        StringWriter sw = new StringWriter();
        try (CSVWriter writer = new CSVWriter(sw)) {
            // Header
            writer.writeNext(new String[]{"Data", "Usuário", "Tipo", "Descrição"});

            // Dados
            atividades.forEach(a -> {
                writer.writeNext(new String[]{
                        a.getCriadoEm().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                        a.getUsuario(),
                        a.getTipo(),
                        a.getDescricao()
                });
            });
        }
        return sw.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportarGeralParaPdf(List<AuditoriaAtividade> atividades) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Título
            Font fontTitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph titulo = new Paragraph("Histórico Geral de Operações", fontTitulo);
            titulo.setAlignment(Element.ALIGN_CENTER);
            titulo.setSpacingAfter(20);
            document.add(titulo);

            // Tabela/Lista
            Font fontNormal = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font fontBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);

            for (var a : atividades) {
                Paragraph p = new Paragraph();
                String data = a.getCriadoEm().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
                p.add(new Chunk(data + " - ", fontBold));
                p.add(new Chunk("[" + a.getUsuario() + "] ", fontBold));
                p.add(new Chunk("[" + a.getTipo() + "] ", fontBold));
                p.add(new Chunk(a.getDescricao(), fontNormal));
                p.setSpacingAfter(8);
                document.add(p);
            }

            document.close();
        } catch (DocumentException e) {
            throw new IOException("Erro ao gerar PDF", e);
        }
        return out.toByteArray();
    }
}
