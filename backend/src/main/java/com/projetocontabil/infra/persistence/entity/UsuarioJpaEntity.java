package com.projetocontabil.infra.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "usuarios")
@Audited
public class UsuarioJpaEntity {

    @Id
    private UUID id;

    @Column(name = "empresa_locataria_id")
    private String empresaLocatariaId;

    private String email;
    private String username;

    @Column(name = "password")
    private String senhaHash;

    private String nome;
    private String cargo;
    private String role;
    private boolean ativo;

    @Column(name = "papel", length = 20)
    private String papel;

    @Column(name = "departamento_id")
    private UUID departamentoId;

    @Column(name = "convidado_por")
    private UUID convidadoPor;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "usuario_permissoes", joinColumns = @JoinColumn(name = "usuario_id"))
    @Column(name = "permissao")
    @Audited
    private Set<String> permissoes = new HashSet<>();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmpresaLocatariaId() { return empresaLocatariaId; }
    public void setEmpresaLocatariaId(String empresaLocatariaId) { this.empresaLocatariaId = empresaLocatariaId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getSenhaHash() { return senhaHash; }
    public void setSenhaHash(String senhaHash) { this.senhaHash = senhaHash; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }

    public String getPapel() { return papel; }
    public void setPapel(String papel) { this.papel = papel; }

    public UUID getDepartamentoId() { return departamentoId; }
    public void setDepartamentoId(UUID departamentoId) { this.departamentoId = departamentoId; }

    public UUID getConvidadoPor() { return convidadoPor; }
    public void setConvidadoPor(UUID convidadoPor) { this.convidadoPor = convidadoPor; }

    public Set<String> getPermissoes() { return permissoes; }
    public void setPermissoes(Set<String> permissoes) { this.permissoes = permissoes; }
}
