package com.projetocontabil.infra.tenancy;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import java.io.IOException;

/**
 * Filtro de Servlets para extrair o EmpresaLocatariaId do Token/Header.
 */
@Component
public class EmpresaLocatariaFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String tenantId = httpRequest.getHeader("X-EmpresaLocataria-Id");

        // Fallback para desenvolvimento
        if (tenantId == null) {
            tenantId = "EmpresaLocataria-dev-mode";
        }

        try {
            EmpresaLocatariaContext.setCurrentTenant(tenantId);
            chain.doFilter(request, response);
        } finally {
            EmpresaLocatariaContext.clear();
        }
    }
}
