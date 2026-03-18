package com.projetocontabil.infra.tenancy;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.EmpresaLocatariaRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
public class TrialCheckFilter extends OncePerRequestFilter {

    private final EmpresaLocatariaRepository repository;
    private static final Set<String> EXEMPT_PATHS = Set.of("/api/assinaturas", "/api/configuracoes", "/api/auth");

    public TrialCheckFilter(EmpresaLocatariaRepository repository) {
        this.repository = repository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        if (isExempt(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String tenantId = EmpresaLocatariaContext.getCurrentTenant();
        if (tenantId != null) {
            var empresa = repository.findByEmpresaLocatariaId(EmpresaLocatariaId.of(tenantId));
            if (empresa.isPresent() && empresa.get().isTrialVencido()) {
                response.setStatus(402); // Payment Required
                response.getWriter().write("{\"erro\": \"Trial expirado. Por favor, realize a assinatura.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isExempt(String path) {
        return EXEMPT_PATHS.stream().anyMatch(path::startsWith);
    }
}
