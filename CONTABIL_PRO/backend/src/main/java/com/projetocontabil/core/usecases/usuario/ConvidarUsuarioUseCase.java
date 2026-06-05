package com.projetocontabil.core.usecases.usuario;

import com.projetocontabil.core.domain.usuario.model.Papel;
import com.projetocontabil.core.domain.usuario.model.Permissao;
import com.projetocontabil.core.domain.usuario.model.Usuario;
import com.projetocontabil.core.ports.driven.DepartamentoRepository;
import com.projetocontabil.core.ports.driven.EmailGateway;
import com.projetocontabil.core.ports.driven.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;

/**
 * Use Case — Convidar um novo usuário para a plataforma.
 * Regras:
 *  - Apenas ADMIN e GESTOR podem convidar.
 *  - GESTOR não pode convidar ADMIN.
 *  - E-mail deve ser único dentro do tenant.
 *  - Senha é autogerada e enviada por e-mail (Mailtrap).
 */
@Slf4j
@Service
public class ConvidarUsuarioUseCase {

    private final UsuarioRepository usuarioRepository;
    private final DepartamentoRepository departamentoRepository;
    private final EmailGateway emailGateway;

    public ConvidarUsuarioUseCase(UsuarioRepository usuarioRepository,
                                   DepartamentoRepository departamentoRepository,
                                   EmailGateway emailGateway) {
        this.usuarioRepository = usuarioRepository;
        this.departamentoRepository = departamentoRepository;
        this.emailGateway = emailGateway;
    }

    public record Comando(
            UUID solicitanteId,
            String empresaLocatariaId,
            String email,
            String nome,
            Papel papel,
            UUID departamentoId,
            Set<Permissao> permissoes
    ) {}

    public record Resultado(
            UUID id,
            String email,
            String nome,
            Papel papel
    ) {}

    public Resultado executar(Comando comando) {
        log.info("[ConvidarUsuario] Solicitante {} convidando {} como {}",
                comando.solicitanteId(), comando.email(), comando.papel());

        // 1. Validar solicitante
        var solicitante = usuarioRepository.findById(comando.solicitanteId())
                .orElseThrow(() -> new IllegalArgumentException("Solicitante não encontrado"));

        validarPermissaoConvite(solicitante, comando.papel());

        // 2. Verificar e-mail duplicado no tenant
        if (usuarioRepository.existsByEmailAndEmpresaLocatariaId(comando.email(), comando.empresaLocatariaId())) {
            throw new IllegalStateException("E-mail já cadastrado nesta empresa: " + comando.email());
        }

        // 3. Criar usuário com senha autogerada
        var resultado = Usuario.criarConvidado(
                comando.empresaLocatariaId(), comando.email(), comando.nome(),
                comando.papel(), comando.departamentoId(), comando.solicitanteId(),
                comando.permissoes()
        );

        var usuario = resultado.usuario();
        var senhaTextoPlano = resultado.senhaTextoPlano();

        // 4. Persistir (a senha será hasheada pelo adapter)
        usuarioRepository.save(usuario, senhaTextoPlano);

        // 5. Enviar e-mail de convite com a senha em texto plano
        try {
            emailGateway.enviarConvite(comando.email(), comando.nome(), senhaTextoPlano, "ContábilPro");
            log.info("[ConvidarUsuario] ✅ Convite enviado para {}", comando.email());
        } catch (Exception e) {
            log.error("[ConvidarUsuario] ⚠️ Falha ao enviar e-mail de convite para {}: {}", comando.email(), e.getMessage());
            // Não bloqueia o cadastro — o e-mail pode ser reenviado depois
        }

        return new Resultado(usuario.getId(), usuario.getEmail(), usuario.getNome(), usuario.getPapel());
    }

    private void validarPermissaoConvite(Usuario solicitante, Papel papelConvite) {
        if (solicitante.getPapel() == Papel.CONVIDADO) {
            throw new IllegalArgumentException("Convidados não podem convidar outros usuários");
        }
        if (solicitante.getPapel() == Papel.GESTOR && papelConvite == Papel.ADMIN) {
            throw new IllegalArgumentException("Gestores não podem convidar Administradores");
        }
    }
}
