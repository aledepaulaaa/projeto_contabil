package com.projetocontabil.core.usecases.usuario;

import com.projetocontabil.core.domain.usuario.model.Papel;
import com.projetocontabil.core.domain.usuario.model.Permissao;
import com.projetocontabil.core.domain.usuario.model.Usuario;
import com.projetocontabil.core.ports.driven.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.EnumSet;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@DisplayName("RemoverUsuarioUseCase")
class RemoverUsuarioUseCaseTest {

    private UsuarioRepository usuarioRepository;
    private RemoverUsuarioUseCase useCase;

    private final String TENANT = "tenant-dev-mode";
    private final UUID SOLICITANTE_ID = UUID.randomUUID();
    private final UUID ALVO_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        usuarioRepository = mock(UsuarioRepository.class);
        useCase = new RemoverUsuarioUseCase(usuarioRepository);
    }

    @Test
    @DisplayName("Admin deve poder remover qualquer usuário do mesmo tenant")
    void adminRemoveQualquerUm() {
        var admin = criarUsuario(SOLICITANTE_ID, Papel.ADMIN);
        var alvo = criarUsuario(ALVO_ID, Papel.GESTOR);

        when(usuarioRepository.findById(SOLICITANTE_ID)).thenReturn(Optional.of(admin));
        when(usuarioRepository.findById(ALVO_ID)).thenReturn(Optional.of(alvo));

        useCase.executar(new RemoverUsuarioUseCase.Comando(SOLICITANTE_ID, ALVO_ID, TENANT));

        verify(usuarioRepository).deleteById(ALVO_ID);
    }

    @Test
    @DisplayName("Gestor deve poder remover Convidado")
    void gestorRemoveConvidado() {
        var gestor = criarUsuario(SOLICITANTE_ID, Papel.GESTOR);
        var convidado = criarUsuario(ALVO_ID, Papel.CONVIDADO);

        when(usuarioRepository.findById(SOLICITANTE_ID)).thenReturn(Optional.of(gestor));
        when(usuarioRepository.findById(ALVO_ID)).thenReturn(Optional.of(convidado));

        useCase.executar(new RemoverUsuarioUseCase.Comando(SOLICITANTE_ID, ALVO_ID, TENANT));

        verify(usuarioRepository).deleteById(ALVO_ID);
    }

    @Test
    @DisplayName("Gestor não deve poder remover outro Gestor")
    void gestorNaoRemoveGestor() {
        var gestor1 = criarUsuario(SOLICITANTE_ID, Papel.GESTOR);
        var gestor2 = criarUsuario(ALVO_ID, Papel.GESTOR);

        when(usuarioRepository.findById(SOLICITANTE_ID)).thenReturn(Optional.of(gestor1));
        when(usuarioRepository.findById(ALVO_ID)).thenReturn(Optional.of(gestor2));

        assertThrows(IllegalArgumentException.class, () -> 
            useCase.executar(new RemoverUsuarioUseCase.Comando(SOLICITANTE_ID, ALVO_ID, TENANT)));
        
        verify(usuarioRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Deve impedir auto-exclusão pelo fluxo de gestão")
    void naoDeveRemoverSiMesmo() {
        assertThrows(IllegalArgumentException.class, () -> 
            useCase.executar(new RemoverUsuarioUseCase.Comando(SOLICITANTE_ID, SOLICITANTE_ID, TENANT)));
    }

    @Test
    @DisplayName("Deve validar isolamento Multi-tenant")
    void validaMultiTenant() {
        var admin = criarUsuario(SOLICITANTE_ID, Papel.ADMIN);
        // Alvo em outro tenant
        var alvo = Usuario.reconstituirCompleto(ALVO_ID, "OUTRO_TENANT", "alvo@email.com", "hash",
                "Alvo", "CONVIDADO", null, true, Papel.CONVIDADO, null, null, EnumSet.noneOf(Permissao.class));

        when(usuarioRepository.findById(SOLICITANTE_ID)).thenReturn(Optional.of(admin));
        when(usuarioRepository.findById(ALVO_ID)).thenReturn(Optional.of(alvo));

        assertThrows(IllegalArgumentException.class, () -> 
            useCase.executar(new RemoverUsuarioUseCase.Comando(SOLICITANTE_ID, ALVO_ID, TENANT)));
    }

    private Usuario criarUsuario(UUID id, Papel papel) {
        return Usuario.reconstituirCompleto(id, TENANT, "user@email.com", "hash",
                "User", papel.name(), null, true, papel, null, null, EnumSet.allOf(Permissao.class));
    }
}
