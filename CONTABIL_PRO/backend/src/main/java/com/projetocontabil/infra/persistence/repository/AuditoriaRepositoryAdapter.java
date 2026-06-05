package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.shared.AuditoriaAtividade;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.ports.driven.AuditoriaRepository;
import com.projetocontabil.infra.persistence.entity.AuditoriaJpaEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AuditoriaRepositoryAdapter implements AuditoriaRepository {
    
    private final AuditoriaJpaRepository jpaRepository;

    public AuditoriaRepositoryAdapter(AuditoriaJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public void salvar(AuditoriaAtividade atividade) {
        var entity = new AuditoriaJpaEntity();
        entity.setId(atividade.getId());
        entity.setEmpresaLocatariaId(atividade.getEmpresaId().value());
        entity.setUsuario(atividade.getUsuario());
        entity.setTipo(atividade.getTipo());
        entity.setDescricao(atividade.getDescricao());
        entity.setMetadata(atividade.getMetadata());
        entity.setCriadoEm(atividade.getCriadoEm());
        jpaRepository.save(entity);
    }

    @Override
    public List<AuditoriaAtividade> buscarPorEmpresa(EmpresaLocatariaId empresaId) {
        return jpaRepository.findAllByEmpresaLocatariaIdOrderByCriadoEmDesc(empresaId.value())
                .stream()
                .map(entity -> new AuditoriaAtividade(
                        entity.getId(),
                        EmpresaLocatariaId.of(entity.getEmpresaLocatariaId()),
                        entity.getUsuario(),
                        entity.getTipo(),
                        entity.getDescricao(),
                        entity.getMetadata(),
                        entity.getCriadoEm()
                ))
                .toList();
    }

    @Override
    public void limparPorEmpresa(EmpresaLocatariaId empresaId) {
        jpaRepository.deleteAllByEmpresaLocatariaId(empresaId.value());
    }
}
