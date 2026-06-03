package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.serpro.model.RendaContribuinte;
import com.projetocontabil.core.usecases.ConsultarRendaSerproUseCase;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller REST expondo os endpoints de consulta do SERPRO integrados ao Compartilha Receita.
 * Rigorosamente isolado por empresa locatária (Tenant ID).
 */
@Slf4j
@RestController
@RequestMapping("/api/serpro")
@RequiredArgsConstructor
public class SerproController {

    private final ConsultarRendaSerproUseCase consultarRendaSerproUseCase;

    /**
     * Consulta os dados de renda decifrados de um contribuinte a partir do token de compartilhamento.
     * Uso direto via POSTMAN para validação técnica de desenvolvimento.
     */
    @GetMapping("/consulta-renda/{token}")
    public ResponseEntity<?> consultarRenda(@PathVariable String token) {
        log.info("📥 [SerproController] Recebida solicitação de consulta de renda para token: {}", token);

        String tenantIdStr = EmpresaLocatariaContext.getEmpresaLocatariaId();
        if (tenantIdStr == null || tenantIdStr.isBlank()) {
            log.warn("⚠️ [SerproController] ID de Empresa Locatária ausente no contexto ThreadLocal.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("erro", "Cabeçalho X-EmpresaLocataria-Id é obrigatório para manter isolamento multi-tenant."));
        }

        try {
            var tenantId = EmpresaLocatariaId.of(tenantIdStr);
            RendaContribuinte renda = consultarRendaSerproUseCase.executar(token, tenantId);
            return ResponseEntity.ok(toResponse(renda));
        } catch (IllegalArgumentException e) {
            log.warn("⚠️ [SerproController] Registro não encontrado ou parâmetro inválido: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erro", e.getMessage()));
        } catch (IllegalStateException e) {
            log.error("❌ [SerproController] Credenciais inválidas ou acesso não autorizado no SERPRO: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erro", e.getMessage()));
        } catch (Exception e) {
            log.error("❌ [SerproController] Falha crítica de processamento: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erro", "Erro interno no servidor ao integrar com SERPRO: " + e.getMessage()));
        }
    }

    /**
     * Auxiliar de DTO mapping em conformidade com as respostas desejadas de visualização.
     */
    private Map<String, Object> toResponse(RendaContribuinte renda) {
        Map<String, Object> response = new HashMap<>();
        response.put("titular", renda.getTitular());
        response.put("destinatario", renda.getDestinatario());
        response.put("dataHoraRegistro", renda.getDataHoraRegistro() != null ? renda.getDataHoraRegistro().toString() : null);
        response.put("token", renda.getToken());
        response.put("avisoLegal", renda.getAvisoLegal());

        var dadosList = renda.getDados().stream().map(d -> {
            Map<String, String> item = new HashMap<>();
            item.put("codigo", d.codigo());
            item.put("texto", d.texto());
            item.put("valor", d.valor());
            return item;
        }).toList();

        response.put("dados", dadosList);
        return response;
    }
}
