package com.projetocontabil.core.usecases.empresa;

import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.empresa.model.ContatoEmpresa;
import com.projetocontabil.core.domain.empresa.model.Empresa;
import com.projetocontabil.core.domain.empresa.model.EnderecoEmpresa;
import com.projetocontabil.core.domain.empresa.model.RegimeTributario;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.EmpresaRepository;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CriarEmpresaUseCase {

    private final EmpresaRepository repository;

    public void executar(Input input) {
        Identificacao ident = new Identificacao(input.identificacao);

        repository.buscarPorIdentificacao(ident.value(), input.locatariaId)
                .ifPresent(e -> {
                    throw new IllegalArgumentException("Empresa já cadastrada com esta identificação.");
                });

        Empresa empresa = Empresa.criar(
                input.locatariaId,
                input.razaoSocial,
                input.nomeFantasia,
                ident,
                input.regimeTributario,
                input.identificadorInterno);

        if (input.contatos != null) {
            input.contatos.forEach(c -> empresa.adicionarContato(new ContatoEmpresa(
                    UUID.randomUUID(), c.nome(), c.cargo(), c.departamento(), c.celular(), c.email())));
        }

        if (input.enderecos != null) {
            input.enderecos.forEach(e -> empresa.adicionarEndereco(new EnderecoEmpresa(
                    UUID.randomUUID(), e.logradouro(), e.numero(), e.complemento(), e.cep(),
                    e.bairro(), e.cidade(), e.uf(), e.inscricaoEstadual(),
                    e.inscricaoMunicipal(), e.isentoIcms())));
        }

        repository.salvar(empresa);
    }

    @Builder
    public static class Input {
        public EmpresaLocatariaId locatariaId;
        public String razaoSocial;
        public String nomeFantasia;
        public String identificacao;
        public RegimeTributario regimeTributario;
        public String identificadorInterno;
        public List<ContatoInput> contatos;
        public List<EnderecoInput> enderecos;
    }

    public record ContatoInput(String nome, String cargo, String departamento, String celular, String email) {
    }

    public record EnderecoInput(String logradouro, String numero, String complemento, String cep, String bairro,
            String cidade, String uf, String inscricaoEstadual, String inscricaoMunicipal, boolean isentoIcms) {
    }
}
