package com.projetocontabil.infra.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "convites_usuario")
@Audited
public class ConviteJpaEntity {

    @Id
    private UUID id;

    @Column(name = "empresa_locataria_id", nullable = false)
    private String empresaLocatariaId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, length = 20)
    private String papel;

    @Column(name = "departamento_id")
    private UUID departamentoId;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @Column(name = "expira_em", nullable = false)
    private LocalDateTime expiraEm;

    @Column(name = "convidado_por", nullable = false)
    private UUID convidadoPor;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmpresaLocatariaId() { return empresaLocatariaId; }
    public void setEmpresaLocatariaId(String empresaLocatariaId) { this.empresaLocatariaId = empresaLocatariaId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getPapel() { return papel; }
    public void setPapel(String papel) { this.papel = papel; }

    public UUID getDepartamentoId() { return departamentoId; }
    public void setDepartamentoId(UUID departamentoId) { this.departamentoId = departamentoId; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }

    public LocalDateTime getExpiraEm() { return expiraEm; }
    public void setExpiraEm(LocalDateTime expiraEm) { this.expiraEm = expiraEm; }

    public UUID getConvidadoPor() { return convidadoPor; }
    public void setConvidadoPor(UUID convidadoPor) { this.convidadoPor = convidadoPor; }
}
