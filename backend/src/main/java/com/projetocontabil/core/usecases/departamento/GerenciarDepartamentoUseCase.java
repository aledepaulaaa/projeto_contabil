package com.projetocontabil.core.usecases.departamento;

import com.projetocontabil.core.domain.departamento.model.Departamento;
import com.projetocontabil.core.ports.driven.DepartamentoRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Use Case — CRUD de Departamentos.
 * Seed: Comercial, Fiscal, Contábil.
 */
@Slf4j
@Service
public class GerenciarDepartamentoUseCase {

    private final DepartamentoRepository departamentoRepository;

    public GerenciarDepartamentoUseCase(DepartamentoRepository departamentoRepository) {
        this.departamentoRepository = departamentoRepository;
    }

    public record CriarComando(String empresaLocatariaId, String nome, String descricao) {}

    public Departamento criar(CriarComando comando) {
        log.info("[GerenciarDepartamento] Criando '{}' para tenant={}", comando.nome(), comando.empresaLocatariaId());

        if (departamentoRepository.existsByNomeAndEmpresaLocatariaId(comando.nome(), comando.empresaLocatariaId())) {
            throw new IllegalStateException("Departamento '" + comando.nome() + "' já existe nesta empresa");
        }

        var departamento = Departamento.criar(comando.empresaLocatariaId(), comando.nome(), comando.descricao());
        return departamentoRepository.save(departamento);
    }

    public List<Departamento> listar(String empresaLocatariaId) {
        return departamentoRepository.findAllByEmpresaLocatariaId(empresaLocatariaId);
    }

    public void excluir(UUID id) {
        log.info("[GerenciarDepartamento] Excluindo departamento {}", id);
        departamentoRepository.deleteById(id);
    }

    /**
     * Inicializa os departamentos padrão para um tenant (caso não existam).
     */
    public void inicializarPadrao(String empresaLocatariaId) {
        var padrao = List.of(
                new CriarComando(empresaLocatariaId, "Comercial", "Departamento de vendas e atendimento comercial"),
                new CriarComando(empresaLocatariaId, "Fiscal", "Departamento de rotinas fiscais e tributárias"),
                new CriarComando(empresaLocatariaId, "Contábil", "Departamento de contabilidade e demonstrações")
        );

        for (var cmd : padrao) {
            if (!departamentoRepository.existsByNomeAndEmpresaLocatariaId(cmd.nome(), empresaLocatariaId)) {
                criar(cmd);
            }
        }
        log.info("[GerenciarDepartamento] ✅ Departamentos padrão inicializados para tenant={}", empresaLocatariaId);
    }
}
