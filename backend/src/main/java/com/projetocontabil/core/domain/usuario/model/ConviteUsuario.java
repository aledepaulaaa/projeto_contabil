package com.projetocontabil.core.domain.usuario.model;

import com.projetocontabil.core.domain.shared.ValueObject;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/**
 * Value Object — Convite de Usuário pendente.
 */
public class ConviteUsuario implements ValueObject {
    private final UUID id;
    private final String empresaLocatariaId;
    private final String email;
    private final String nome;
    private final Papel papel;
    private final Set<Permissao> permissoes;
    private final UUID departamentoId;
    private final String token;
    private final LocalDateTime criadoEm;
    private final LocalDateTime expiraEm;
    private final UUID convidadoPor;

    public UUID getId() { return id; }
    public String getEmpresaLocatariaId() { return empresaLocatariaId; }
    public String getEmail() { return email; }
    public String getNome() { return nome; }
    public Papel getPapel() { return papel; }
    public Set<Permissao> getPermissoes() { return permissoes; }
    public UUID getDepartamentoId() { return departamentoId; }
    public String getToken() { return token; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public LocalDateTime getExpiraEm() { return expiraEm; }
    public UUID getConvidadoPor() { return convidadoPor; }

    public ConviteUsuario(UUID id, String empresaLocatariaId, String email, String nome,
                          Papel papel, Set<Permissao> permissoes, UUID departamentoId,
                          String token, LocalDateTime criadoEm, LocalDateTime expiraEm, UUID convidadoPor) {
        this.id = id;
        this.empresaLocatariaId = empresaLocatariaId;
        this.email = email;
        this.nome = nome;
        this.papel = papel;
        this.permissoes = permissoes;
        this.departamentoId = departamentoId;
        this.token = token;
        this.criadoEm = criadoEm;
        this.expiraEm = expiraEm;
        this.convidadoPor = convidadoPor;
    }

    public static ConviteUsuario criar(String empresaLocatariaId, String email, String nome,
                                        Papel papel, Set<Permissao> permissoes, UUID departamentoId,
                                        UUID convidadoPor) {
        return new ConviteUsuario(
                UUID.randomUUID(), empresaLocatariaId, email, nome, papel, permissoes,
                departamentoId, UUID.randomUUID().toString(), LocalDateTime.now(),
                LocalDateTime.now().plusDays(7), convidadoPor
        );
    }

    public boolean isExpirado() {
        return LocalDateTime.now().isAfter(this.expiraEm);
    }
}
