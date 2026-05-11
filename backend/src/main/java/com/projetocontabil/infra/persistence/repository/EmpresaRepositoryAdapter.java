package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.empresa.model.ContatoEmpresa;
import com.projetocontabil.core.domain.empresa.model.Empresa;
import com.projetocontabil.core.domain.empresa.model.EnderecoEmpresa;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.EmpresaRepository;
import com.projetocontabil.infra.persistence.entity.ContatoEmpresaJpaEntity;
import com.projetocontabil.infra.persistence.entity.EmpresaJpaEntity;
import com.projetocontabil.infra.persistence.entity.EnderecoEmpresaJpaEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class EmpresaRepositoryAdapter implements EmpresaRepository {

    private final EmpresaJpaRepository jpaRepository;

    @Override
    @Transactional
    public void salvar(Empresa empresa) {
        jpaRepository.save(toEntity(empresa));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Empresa> buscarPorId(UUID id, EmpresaLocatariaId locatariaId) {
        return jpaRepository.findByIdAndEmpresaLocatariaId(id, locatariaId.value())
                .map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Empresa> listarPorLocataria(EmpresaLocatariaId locatariaId) {
        return jpaRepository.findByEmpresaLocatariaId(locatariaId.value())
                .stream().map(this::toDomain).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Empresa> buscarPorIdentificacao(String identificacao, EmpresaLocatariaId locatariaId) {
        return jpaRepository.findByIdentificacaoAndEmpresaLocatariaId(identificacao, locatariaId.value())
                .map(this::toDomain);
    }

    private Empresa toDomain(EmpresaJpaEntity entity) {
        Empresa empresa = Empresa.reconstituir(
                entity.getId(),
                EmpresaLocatariaId.of(entity.getEmpresaLocatariaId()),
                entity.getRazaoSocial(),
                entity.getNomeFantasia(),
                new Identificacao(entity.getIdentificacao()),
                entity.getRegimeTributario(),
                entity.getIdentificadorInterno(),
                entity.isAtiva(),
                entity.getCriadoEm());

        entity.getContatos().forEach(c -> empresa.adicionarContato(new ContatoEmpresa(
                c.getId(), c.getNome(), c.getCargo(), c.getDepartamento(), c.getCelular(), c.getEmail())));

        entity.getEnderecos().forEach(e -> empresa.adicionarEndereco(new EnderecoEmpresa(
                e.getId(), e.getLogradouro(), e.getNumero(), e.getComplemento(), e.getCep(),
                e.getBairro(), e.getCidade(), e.getUf(), e.getInscricaoEstadual(),
                e.getInscricaoMunicipal(), e.isIsentoIcms())));

        return empresa;
    }

    private EmpresaJpaEntity toEntity(Empresa empresa) {
        EmpresaJpaEntity entity = new EmpresaJpaEntity();
        entity.setId(empresa.getId());
        entity.setEmpresaLocatariaId(empresa.getEmpresaLocatariaId().value());
        entity.setRazaoSocial(empresa.getRazaoSocial());
        entity.setNomeFantasia(empresa.getNomeFantasia());
        entity.setIdentificacao(empresa.getIdentificacao().value());
        entity.setRegimeTributario(empresa.getRegimeTributario());
        entity.setIdentificadorInterno(empresa.getIdentificadorInterno());
        entity.setAtiva(empresa.isAtiva());
        entity.setCriadoEm(empresa.getCriadoEm());

        entity.setContatos(empresa.getContatos().stream().map(c -> {
            ContatoEmpresaJpaEntity ce = new ContatoEmpresaJpaEntity();
            ce.setId(c.getId());
            ce.setEmpresa(entity);
            ce.setNome(c.getNome());
            ce.setCargo(c.getCargo());
            ce.setDepartamento(c.getDepartamento());
            ce.setCelular(c.getCelular());
            ce.setEmail(c.getEmail());
            return ce;
        }).collect(Collectors.toList()));

        entity.setEnderecos(empresa.getEnderecos().stream().map(e -> {
            EnderecoEmpresaJpaEntity ee = new EnderecoEmpresaJpaEntity();
            ee.setId(e.getId());
            ee.setEmpresa(entity);
            ee.setLogradouro(e.getLogradouro());
            ee.setNumero(e.getNumero());
            ee.setComplemento(e.getComplemento());
            ee.setCep(e.getCep());
            ee.setBairro(e.getBairro());
            ee.setCidade(e.getCidade());
            ee.setUf(e.getUf());
            ee.setInscricaoEstadual(e.getInscricaoEstadual());
            ee.setInscricaoMunicipal(e.getInscricaoMunicipal());
            ee.setIsentoIcms(e.isIsentoIcms());
            return ee;
        }).collect(Collectors.toList()));

        return entity;
    }
}
