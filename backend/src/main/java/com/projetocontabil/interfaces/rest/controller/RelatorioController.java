package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.crm.model.NotificacaoDownload;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/relatorios")
public class RelatorioController {

    // Simulação de banco de dados de notificações em memória para este exemplo
    private static final Map<String, List<NotificacaoDownload>> notificacoesPorEmpresa = new ConcurrentHashMap<>();

    @PostMapping("/gerar")
    public ResponseEntity<Map<String, String>> solicitarRelatorio(
            @RequestBody Map<String, String> request) {
        
        String formato = request.getOrDefault("formato", "PDF");
        String inicio = request.getOrDefault("inicio", "");
        String fim = request.getOrDefault("fim", "");
        
        // Simula o processamento em background
        new Thread(() -> {
            try {
                Thread.sleep(5000); // 5 segundos para gerar
                String nome = "Relatorio_Leads_" + System.currentTimeMillis();
                String url = "/api/relatorios/download/" + nome + "." + formato.toLowerCase();
                
                NotificacaoDownload notificacao = NotificacaoDownload.criar(nome, formato, url);
                
                // Em um cenário real, pegaríamos o empresaId do contexto
                String empresaId = "default"; 
                notificacoesPorEmpresa.computeIfAbsent(empresaId, k -> new ArrayList<>()).add(0, notificacao);
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();

        return ResponseEntity.ok(Map.of("message", "Relatório solicitado com sucesso. Você será notificado quando estiver pronto."));
    }

    @GetMapping("/notificacoes")
    public ResponseEntity<List<NotificacaoDownload>> listarNotificacoes() {
        String empresaId = "default";
        return ResponseEntity.ok(notificacoesPorEmpresa.getOrDefault(empresaId, new ArrayList<>()));
    }

    @PostMapping("/notificacoes/{id}/ler")
    public ResponseEntity<Void> marcarComoLido(@PathVariable UUID id) {
        String empresaId = "default";
        List<NotificacaoDownload> lista = notificacoesPorEmpresa.get(empresaId);
        if (lista != null) {
            lista.stream().filter(n -> n.getId().equals(id)).findFirst().ifPresent(NotificacaoDownload::marcarComoLido);
        }
        return ResponseEntity.ok().build();
    }
}
