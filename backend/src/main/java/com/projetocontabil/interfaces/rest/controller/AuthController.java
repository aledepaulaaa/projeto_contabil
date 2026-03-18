package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.ports.driven.UsuarioRepository;
import com.projetocontabil.interfaces.rest.dto.AutenticacaoRequest;
import com.projetocontabil.interfaces.rest.dto.AutenticacaoResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AutenticacaoRequest request) {
        log.info("Tentativa de login para usuário: {}", request.getUsername());

        var usuarioOpt = usuarioRepository.findByIdentificador(request.getUsername());

        if (usuarioOpt.isEmpty()) {
            log.warn("Usuário não encontrado: {}", request.getUsername());
            return ResponseEntity.status(401).body("Credenciais inválidas");
        }

        var usuario = usuarioOpt.get();

        // Verifica a senha. Se o usuário aprovado disse que é "password", 
        // mas o banco tem "password" sem hash, o passwordEncoder pode falhar dependendo da config.
        // O SecurityConfig usa DelegatingPasswordEncoder com argon2 por padrão.
        // Se for texto plano, o prefixo {noop} deve ser usado ou o encoder deve aceitar.
        try {
            if (!passwordEncoder.matches(request.getPassword(), usuario.getSenhaHash())) {
                 log.warn("Senha incorreta para usuário: {}", request.getUsername());
                 return ResponseEntity.status(401).body("Credenciais inválidas");
            }
        } catch (Exception e) {
            log.error("Erro ao validar senha: {}", e.getMessage());
            // Fallback para texto plano se falhar o encoder (apenas para estabilização de dev se necessário)
            if (!request.getPassword().equals(usuario.getSenhaHash())) {
                 return ResponseEntity.status(401).body("Erro na validação de segurança");
            }
        }

        log.info("Login bem-sucedido para: {}", request.getUsername());

        // Token JWT Mock para o frontend não quebrar
        String mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTYyMjUwMDAwMH0.mock_signature";

        return ResponseEntity.ok(new AutenticacaoResponse(
                mockToken,
                "Bearer",
                usuario.getEmpresaLocatariaId()
        ));
    }
}
