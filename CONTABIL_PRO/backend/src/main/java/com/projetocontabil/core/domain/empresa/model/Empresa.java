package com.projetocontabil.core.domain.empresa.model;

import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.shared.AggregateRoot;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class Empresa extends AggregateRoot {
    private final EmpresaLocatariaId empresaLocatariaId;
    private String razaoSocial;
    private String nomeFantasia;
    private Identificacao identificacao;
    private RegimeTributario regimeTributario;
    private String identificadorInterno;
    private boolean ativa;
    private final LocalDateTime criadoEm;
    private final List<ContatoEmpresa> contatos;
    private final List<EnderecoEmpresa> enderecos;

    private Empresa(UUID id, EmpresaLocatariaId empresaLocatariaId, String razaoSocial,
            String nomeFantasia, Identificacao identificacao, RegimeTributario regimeTributario,
            String identificadorInterno, boolean ativa, LocalDateTime criadoEm) {
        super(id);
        this.empresaLocatariaId = empresaLocatariaId;
        this.razaoSocial = razaoSocial;
        this.nomeFantasia = nomeFantasia;
        this.identificacao = identificacao;
        this.regimeTributario = regimeTributario;
        this.identificadorInterno = identificadorInterno;
        this.ativa = ativa;
        this.criadoEm = criadoEm;
        this.contatos = new ArrayList<>();
        this.enderecos = new ArrayList<>();
    }

    public static Empresa criar(EmpresaLocatariaId locatariaId, String razaoSocial, String nomeFantasia,
            Identificacao identificacao, RegimeTributario regime, String idInterno) {
        if (razaoSocial == null || razaoSocial.isBlank()) {
            throw new IllegalArgumentException("Razão Social é obrigatória.");
        }
        return new Empresa(UUID.randomUUID(), locatariaId, razaoSocial, nomeFantasia,
                identificacao, regime, idInterno, true, LocalDateTime.now());
    }

    public static Empresa reconstituir(UUID id, EmpresaLocatariaId locatariaId, String razaoSocial,
            String nomeFantasia, Identificacao identificacao, RegimeTributario regime,
            String idInterno, boolean ativa, LocalDateTime criadoEm) {
        return new Empresa(id, locatariaId, razaoSocial, nomeFantasia, identificacao,
                regime, idInterno, ativa, criadoEm);
    }

    public void adicionarContato(ContatoEmpresa contato) {
        this.contatos.add(contato);
    }

    public void adicionarEndereco(EnderecoEmpresa endereco) {
        this.enderecos.add(endereco);
    }

    public void desativar() {
        this.ativa = false;
    }

    public void ativar() {
        this.ativa = true;
    }
}
