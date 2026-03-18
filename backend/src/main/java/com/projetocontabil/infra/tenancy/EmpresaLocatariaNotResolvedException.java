package com.projetocontabil.infra.tenancy;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exceção lançada quando a EmpresaLocataria não pode ser resolvida no contexto.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class EmpresaLocatariaNotResolvedException extends RuntimeException {
    public EmpresaLocatariaNotResolvedException(String message) {
        super(message);
    }
}
