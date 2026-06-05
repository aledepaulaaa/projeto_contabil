package com.projetocontabil.infra.services.atendimento;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.projetocontabil.infra.persistence.entity.AtendimentoJpaEntity;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class AtendimentoMetricsExportService {

    public byte[] exportarDashboardPdf(Map<String, Object> metrics, List<AtendimentoJpaEntity> atendimentos) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate()); // Horizontal para estilo dashboard
        
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Fontes
            Font fontTitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Color.DARK_GRAY);
            Font fontSubtitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.GRAY);
            Font fontHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            Font fontCell = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);

            // Título Principal
            Paragraph titulo = new Paragraph("Dashboard de Performance Operacional", fontTitulo);
            titulo.setAlignment(Element.ALIGN_CENTER);
            titulo.setSpacingAfter(20);
            document.add(titulo);

            // --- Seção de Cards (Insights Rápidos) ---
            PdfPTable cardsTable = new PdfPTable(4);
            cardsTable.setWidthPercentage(100);
            cardsTable.setSpacingAfter(30);

            addMetricCard(cardsTable, "Total de Atendimentos", String.valueOf(metrics.getOrDefault("totalAtendimentos", 0)), new Color(59, 130, 246));
            addMetricCard(cardsTable, "Aguardando", String.valueOf(metrics.getOrDefault("totalAguardando", 0)), new Color(245, 158, 11));
            addMetricCard(cardsTable, "Em Atendimento", String.valueOf(metrics.getOrDefault("totalEmAtendimento", 0)), new Color(16, 185, 129));
            addMetricCard(cardsTable, "Tempo Médio (Min)", String.valueOf(metrics.getOrDefault("tempoMedioRespostaMinutos", 0)), new Color(99, 102, 241));
            
            String perf = (String) metrics.getOrDefault("performance", "NEUTRA");
            Color perfColor = "POSITIVA".equals(perf) ? new Color(34, 197, 94) : ("NEGATIVA".equals(perf) ? new Color(239, 68, 68) : new Color(156, 163, 175));
            addMetricCard(cardsTable, "Performance", perf, perfColor);

            document.add(cardsTable);

            // --- Tabela Detalhada ---
            Paragraph subtitulo = new Paragraph("Detalhamento dos Atendimentos Recentes", fontSubtitulo);
            subtitulo.setSpacingAfter(10);
            document.add(subtitulo);

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3f, 2f, 2f, 2f, 2f, 1.5f});

            String[] headers = {"Lead / Empresa", "Status", "Criado em", "Puxado em", "Encerrado em", "Duração"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, fontHeader));
                cell.setBackgroundColor(new Color(71, 85, 105)); // Slate 600
                cell.setPadding(8);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

            for (AtendimentoJpaEntity a : atendimentos) {
                String leadIdStr = a.getLeadId() != null ? a.getLeadId().toString() : "00000000";
                String label = leadIdStr.substring(0, Math.min(8, leadIdStr.length())) + "...";
                table.addCell(createCell(label, fontCell));
                table.addCell(createCell(a.getStatus().name(), fontCell));
                table.addCell(createCell(a.getCriadoEm().format(formatter), fontCell));
                table.addCell(createCell(a.getPuxadoEm() != null ? a.getPuxadoEm().format(formatter) : "-", fontCell));
                table.addCell(createCell(a.getEncerradoEm() != null ? a.getEncerradoEm().format(formatter) : "-", fontCell));
                table.addCell(createCell(calcularDuracao(a), fontCell));
            }

            document.add(table);

            // Rodapé
            Paragraph rodape = new Paragraph("\nRelatório gerado em: " + LocalDateTime.now().format(formatter), 
                FontFactory.getFont(FontFactory.HELVETICA, 8, Color.LIGHT_GRAY));
            rodape.setAlignment(Element.ALIGN_RIGHT);
            document.add(rodape);

            document.close();
        } catch (DocumentException e) {
            throw new IOException("Erro ao gerar PDF de métricas", e);
        }
        return out.toByteArray();
    }

    private void addMetricCard(PdfPTable table, String label, String value, Color color) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(15);
        cell.setBorder(Rectangle.NO_BORDER);
        
        PdfPTable innerTable = new PdfPTable(1);
        innerTable.setWidthPercentage(100);
        
        PdfPCell labelCell = new PdfPCell(new Phrase(label.toUpperCase(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, color)));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        innerTable.addCell(labelCell);
        
        PdfPCell valueCell = new PdfPCell(new Phrase(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, Color.BLACK)));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        innerTable.addCell(valueCell);
        
        cell.addElement(innerTable);
        cell.setBackgroundColor(new Color(248, 250, 252)); // Slate 50
        table.addCell(cell);
    }

    private PdfPCell createCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(6);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    private String calcularDuracao(AtendimentoJpaEntity a) {
        if (a.getEncerradoEm() == null || a.getPuxadoEm() == null) return "-";
        long minutos = java.time.Duration.between(a.getPuxadoEm(), a.getEncerradoEm()).toMinutes();
        return minutos + " min";
    }
}
