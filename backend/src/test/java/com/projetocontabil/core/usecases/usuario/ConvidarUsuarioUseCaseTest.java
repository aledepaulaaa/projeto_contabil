package com.projetocontabil.core.usecases.usuario;

import com.projetocontabil.core.domain.usuario.model.Papel;
import com.projetocontabil.core.domain.usuario.model.Permissao;
import com.projetocontabil.core.domain.usuario.model.Usuario;
import com.projetocontabil.core.ports.driven.DepartamentoRepository;
import com.projetocontabil.core.ports.driven.EmailGateway;
import com.projetocontabil.core.ports.driven.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.EnumSet;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("ConvidarUsuarioUseCase")
class ConvidarUsuarioUseCaseTest {

    private UsuarioRepository usuarioRepository;
    private DepartamentoRepository departamentoRepository;
    private EmailGateway emailGateway;
    private ConvidarUsuarioUseCase useCase;

    private final String TENANT = "tenant-dev-mode";
    private final UUID ADMIN_ID = UUID.randomUUID();
    private final UUID DEPARTAMENTO_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        usuarioRepository = mock(UsuarioRepository.class);
        departamentoRepository = mock(DepartamentoRepository.class);
        emailGateway = mock(EmailGateway.class);
        useCase = new ConvidarUsuarioUseCase(usuarioRepository, departamentoRepository, emailGateway);
    }

    @Test
    @DisplayName("Admin deve poder convidar um novo Convidado com sucesso")
    void adminConvidaConvidadoComSucesso() {
        // Arrange
        var admin = criarAdmin();
        when(usuarioRepository.findById(ADMIN_ID)).thenReturn(Optional.of(admin));
        when(usuarioRepository.existsByEmailAndEmpresaLocatariaId("convidado@email.com", TENANT)).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class), anyString())).thenAnswer(inv -> inv.getArgument(0));

        var comando = new ConvidarUsuarioUseCase.Comando(
                ADMIN_ID, TENANT, "convidado@email.com", "Maria",
                Papel.CONVIDADO, DEPARTAMENTO_ID,
                EnumSet.of(Permissao.INICIAR_ATENDIMENTO, Permissao.ENCERRAR_ATENDIMENTO)
        );

        // Act
        var resultado = useCase.executar(comando);

        // Assert
        assertNotNull(resultado);
        assertEquals("convidado@email.com", resultado.email());
        assertEquals(Papel.CONVIDADO, resultado.papel());

        // Verifica que o e-mail foi enviado
        verify(emailGateway).enviarConvite(eq("convidado@email.com"), eq("Maria"), anyString(), anyString());

        // Verifica que o usuário foi salvo com senha hasheada
        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture(), anyString());
        assertEquals(Papel.CONVIDADO, captor.getValue().getPapel());
    }

    @Test
    @DisplayName("Gestor deve poder convidar Convidado, mas não Admin")
    void gestorNaoConvidaAdmin() {
        var gestor = criarGestor();
        when(usuarioRepository.findById(gestor.getId())).thenReturn(Optional.of(gestor));

        var comando = new ConvidarUsuarioUseCase.Comando(
                gestor.getId(), TENANT, "novo@email.com", "João",
                Papel.ADMIN, null, EnumSet.noneOf(Permissao.class)
        );

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> useCase.executar(comando));
    }

    @Test
    @DisplayName("Convidado não pode convidar ninguém")
    void convidadoNaoConvida() {
        var convidado = criarConvidado();
        when(usuarioRepository.findById(convidado.getId())).thenReturn(Optional.of(convidado));

        var comando = new ConvidarUsuarioUseCase.Comando(
                convidado.getId(), TENANT, "novo@email.com", "João",
                Papel.CONVIDADO, null, EnumSet.noneOf(Permissao.class)
        );

        assertThrows(IllegalArgumentException.class, () -> useCase.executar(comando));
    }

    @Test
    @DisplayName("Deve rejeitar convite para e-mail já existente no tenant")
    void emailDuplicadoNoTenant() {
        var admin = criarAdmin();
        when(usuarioRepository.findById(ADMIN_ID)).thenReturn(Optional.of(admin));
        when(usuarioRepository.existsByEmailAndEmpresaLocatariaId("existente@email.com", TENANT)).thenReturn(true);

        var comando = new ConvidarUsuarioUseCase.Comando(
                ADMIN_ID, TENANT, "existente@email.com", "Duplicado",
                Papel.CONVIDADO, null, EnumSet.noneOf(Permissao.class)
        );

        assertThrows(IllegalStateException.class, () -> useCase.executar(comando));
    }

    @Test
    @DisplayName("Multi-tenancy: e-mail pode existir em outro tenant sem conflito")
    void emailExisteEmOutroTenantSemConflito() {
        var admin = criarAdmin();
        when(usuarioRepository.findById(ADMIN_ID)).thenReturn(Optional.of(admin));
        when(usuarioRepository.existsByEmailAndEmpresaLocatariaId("user@email.com", TENANT)).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class), anyString())).thenAnswer(inv -> inv.getArgument(0));

        var comando = new ConvidarUsuarioUseCase.Comando(
                ADMIN_ID, TENANT, "user@email.com", "Cross-tenant",
                Papel.CONVIDADO, null, EnumSet.of(Permissao.INICIAR_ATENDIMENTO)
        );

        var resultado = useCase.executar(comando);
        assertNotNull(resultado);
    }

    // Helpers
    private Usuario criarAdmin() {
        return Usuario.reconstituirCompleto(ADMIN_ID, TENANT, "admin@empresa.com", "hash",
                "Admin", "ADMIN", null, true, Papel.ADMIN, null, null, EnumSet.allOf(Permissao.class));
    }

    private Usuario criarGestor() {
        return Usuario.reconstituirCompleto(UUID.randomUUID(), TENANT, "gestor@empresa.com", "hash",
                "Gestor", "GESTOR", null, true, Papel.GESTOR, null, null, EnumSet.allOf(Permissao.class));
    }

    private Usuario criarConvidado() {
        return Usuario.reconstituirCompleto(UUID.randomUUID(), TENANT, "convidado@empresa.com", "hash",
                "Convidado", "CONVIDADO", null, true, Papel.CONVIDADO, null, null, EnumSet.noneOf(Permissao.class));
    }
}
