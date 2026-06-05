package com.projetocontabil.core.domain.usuario.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.security.SecureRandom;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

/**
 * Entidade de Domínio — Usuário do sistema com RBAC.
 * Multi-tenant via empresaLocatariaId.
 */
public class Usuario {
    private final UUID id;
    private final String empresaLocatariaId;
    private final String email;
    private final String username; // exigido pelo DB legacy
    private final String senhaHash;
    private final String nome;
    private final String role; // legado - manter compatibilidade
    private final boolean ativo;
    private final Papel papel;
    private final UUID departamentoId;
    private final UUID convidadoPor;
    private final Set<Permissao> permissoes;

    public Usuario(UUID id, String empresaLocatariaId, String email, String username, String senhaHash, String nome, String role, boolean ativo, Papel papel, UUID departamentoId, UUID convidadoPor, Set<Permissao> permissoes) {
        this.id = id;
        this.empresaLocatariaId = empresaLocatariaId;
        this.email = email;
        this.username = username != null ? username : email;
        this.senhaHash = senhaHash;
        this.nome = nome;
        this.role = role;
        this.ativo = ativo;
        this.papel = papel;
        this.departamentoId = departamentoId;
        this.convidadoPor = convidadoPor;
        this.permissoes = permissoes;
    }

    public UUID getId() { return id; }
    public String getEmpresaLocatariaId() { return empresaLocatariaId; }
    public String getEmail() { return email; }
    public String getUsername() { return username; }
    public String getSenhaHash() { return senhaHash; }
    public String getNome() { return nome; }
    public String getRole() { return role; }
    public boolean isAtivo() { return ativo; }
    public Papel getPapel() { return papel; }
    public UUID getDepartamentoId() { return departamentoId; }
    public UUID getConvidadoPor() { return convidadoPor; }
    public Set<Permissao> getPermissoes() { return permissoes; }

    private static final String CARACTERES_SENHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%";
    private static final int TAMANHO_SENHA = 12;

    /**
     * Reconstitui um usuário a partir do banco de dados.
     */
    public static Usuario reconstituir(UUID id, String empresaLocatariaId, String email, String username,
                                        String senhaHash, String nome, String role, boolean ativo) {
        return new Usuario(id, empresaLocatariaId, email, username, senhaHash, nome, role, ativo,
                Papel.valueOf(role != null ? role.toUpperCase() : "ADMIN"),
                null, null, EnumSet.allOf(Permissao.class));
    }

    /**
     * Reconstitui com campos completos do RBAC.
     */
    public static Usuario reconstituirCompleto(UUID id, String empresaLocatariaId, String email, String username,
                                                String senhaHash, String nome, String role, boolean ativo,
                                                Papel papel, UUID departamentoId, UUID convidadoPor,
                                                Set<Permissao> permissoes) {
        return new Usuario(id, empresaLocatariaId, email, username, senhaHash, nome, role, ativo,
                papel, departamentoId, convidadoPor, permissoes != null ? permissoes : EnumSet.noneOf(Permissao.class));
    }

    /**
     * Cria um novo convidado com senha autogerada.
     */
    public static UsuarioComSenha criarConvidado(String empresaLocatariaId, String email, String nome,
                                                  Papel papel, UUID departamentoId, UUID convidadoPor,
                                                  Set<Permissao> permissoes) {
        String senhaGerada = gerarSenha();
        Usuario usuario = new Usuario(
                UUID.randomUUID(), empresaLocatariaId, email, email, senhaGerada, nome,
                papel.name(), true, papel, departamentoId, convidadoPor,
                permissoes != null ? permissoes : EnumSet.noneOf(Permissao.class)
        );
        return new UsuarioComSenha(usuario, senhaGerada);
    }

    /**
     * Verifica se o usuário possui uma permissão específica.
     * Admin e Gestor possuem todas as permissões.
     */
    public boolean possuiPermissao(Permissao permissao) {
        if (papel == Papel.ADMIN || papel == Papel.GESTOR) {
            return true;
        }
        return permissoes != null && permissoes.contains(permissao);
    }

    /**
     * Verifica se pode gerenciar outro usuário baseado na hierarquia.
     */
    public boolean podeGerenciar(Usuario outro) {
        if (this.papel == Papel.ADMIN) return true;
        if (this.papel == Papel.GESTOR) return outro.getPapel() == Papel.CONVIDADO;
        return false;
    }

    /**
     * Gera uma senha aleatória segura.
     */
    private static String gerarSenha() {
        SecureRandom random = new SecureRandom();
        StringBuilder senha = new StringBuilder(TAMANHO_SENHA);
        for (int i = 0; i < TAMANHO_SENHA; i++) {
            senha.append(CARACTERES_SENHA.charAt(random.nextInt(CARACTERES_SENHA.length())));
        }
        return senha.toString();
    }

    /**
     * Record auxiliar para retornar o usuário criado junto com a senha em texto plano.
     */
    public record UsuarioComSenha(Usuario usuario, String senhaTextoPlano) {}
}
