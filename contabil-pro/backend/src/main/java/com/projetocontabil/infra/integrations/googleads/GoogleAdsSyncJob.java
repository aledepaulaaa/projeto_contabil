package com.projetocontabil.infra.integrations.googleads;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class GoogleAdsSyncJob {

    private final GoogleAdsSyncService syncService;

    /**
     * Roda a cada 30 minutos (1800000ms)
     */
    @Scheduled(fixedRate = 1800000)
    public void executeSync() {
        log.info("Job de Sincronização Google Ads iniciado...");
        try {
            syncService.syncAll();
            log.info("Job de Sincronização Google Ads concluído com sucesso.");
        } catch (Exception e) {
            log.error("Erro crítico no Job de Sincronização Google Ads: {}", e.getMessage());
        }
    }
}
