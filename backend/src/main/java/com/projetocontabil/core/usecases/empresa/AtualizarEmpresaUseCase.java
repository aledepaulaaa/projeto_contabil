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
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AtualizarEmpresaUseCase {

    private final EmpresaRepository repository;

    @Transactional
    public void executar(UUID id, Input input) {
        Empresa empresa = repository.buscarPorId(id, input.locatariaId)
                .orElseThrow(() -> new IllegalArgumentException("Empresa não encontrada."));

        empresa.setRazaoSocial(input.razaoSocial);
        empresa.setNomeFantasia(input.nomeFantasia);
        empresa.setIdentificacao(new Identificacao(input.identificacao));
        empresa.setRegimeTributario(input.regimeTributario);
        empresa.setIdentificadorInterno(input.identificadorInterno);
        empresa.setAtiva(input.ativa);

        // Atualizar Contatos (Simplificado: Limpar e Adicionar)
        empresa.getContatos().clear();
        if (input.contatos != null) {
            input.contatos.forEach(c -> empresa.adicionarContato(new ContatoEmpresa(
                    UUID.randomUUID(), c.nome(), c.cargo(), c.departamento(), c.celular(), c.email()
            )));
        }

        // Atualizar Endereços (Simplificado: Limpar e Adicionar)
        empresa.getEnderecos().clear();
        if (input.enderecos != null) {
            input.enderecos.forEach(e -> empresa.adicionarEndereco(new EnderecoEmpresa(
                    UUID.randomUUID(), e.logradouro(), e.numero(), e.complemento(), e.cep(),
                    e.bairro(), e.cidade(), e.uf(), e.inscricaoEstadual(),
                    e.inscricaoMunicipal(), e.isentoIcms()
            )));
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
        public boolean ativa;
        public List<ContatoInput> contatos;
        public List<EnderecoInput> enderecos;
    }

    public record ContatoInput(String nome, String cargo, String departamento, String celular, String email) {}
    public record EnderecoInput(String logradouro, String numero, String complemento, String cep, String bairro, String cidade, String uf, String inscricaoEstadual, String inscricaoMunicipal, boolean isentoIcms) {}
}
