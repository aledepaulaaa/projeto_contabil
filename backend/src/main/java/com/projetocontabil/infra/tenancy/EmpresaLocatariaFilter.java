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
        String empresaId = httpRequest.getHeader("X-EmpresaLocataria-Id");

        // Fallback para desenvolvimento
        if (empresaId == null) {
            empresaId = "tenant-dev-mode";
        }

        try {
            EmpresaLocatariaContext.setEmpresaLocatariaId(empresaId);
            chain.doFilter(request, response);
        } finally {
            EmpresaLocatariaContext.clear();
        }
    }
}
