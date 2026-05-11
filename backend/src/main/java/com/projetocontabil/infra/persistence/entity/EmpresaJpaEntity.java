package com.projetocontabil.infra.persistence.entity;

import com.projetocontabil.core.domain.empresa.model.RegimeTributario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "empresas")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmpresaJpaEntity {

    @Id
    private UUID id;

    @Column(name = "empresa_locataria_id")
    private String empresaLocatariaId;

    @Column(name = "razao_social")
    private String razaoSocial;

    @Column(name = "nome_fantasia")
    private String nomeFantasia;

    private String identificacao;

    @Enumerated(EnumType.STRING)
    @Column(name = "regime_tributario")
    private RegimeTributario regimeTributario;

    @Column(name = "identificador_interno")
    private String identificadorInterno;

    private boolean ativa;

    @Column(name = "criado_em")
    private LocalDateTime criadoEm;

    @OneToMany(mappedBy = "empresa", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ContatoEmpresaJpaEntity> contatos;

    @OneToMany(mappedBy = "empresa", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EnderecoEmpresaJpaEntity> enderecos;
}
