package com.projetocontabil.interfaces.rest;

import com.projetocontabil.interfaces.rest.dto.ErroResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.UUID;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErroResponseDTO> handleIllegalArgument(IllegalArgumentException ex) {
        logger.warn("Erro de validação de negócio: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(
                new ErroResponseDTO(ex.getMessage(), "NEGOCIO", null)
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResponseDTO> handleValidation(MethodArgumentNotValidException ex) {
        String errorMsg = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .findFirst()
                .orElse("Dados de entrada inválidos");

        return ResponseEntity.badRequest().body(
                new ErroResponseDTO(errorMsg, "VALIDACAO", null)
        );
    }

    /**
     * Erros 500: gera UUID de protocolo interno, loga detalhes técnicos,
     * retorna mensagem amigável ao frontend com ID para suporte.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroResponseDTO> handleGeneric(Exception ex) {
        String protocolo = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        logger.error("[PROTOCOLO:{}] Erro inesperado no servidor: {}", protocolo, ex.getMessage(), ex);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ErroResponseDTO(
                        "Ocorreu um erro interno. Informe o protocolo ao suporte.",
                        "INTERNO",
                        protocolo
                )
        );
    }
}
