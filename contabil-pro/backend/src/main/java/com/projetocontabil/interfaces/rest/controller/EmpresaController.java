package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.empresa.model.Empresa;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.usecases.empresa.AtualizarEmpresaUseCase;
import com.projetocontabil.core.usecases.empresa.CriarEmpresaUseCase;
import com.projetocontabil.core.usecases.empresa.ImportarEmpresasUseCase;
import com.projetocontabil.core.usecases.empresa.ListarEmpresasUseCase;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import com.projetocontabil.interfaces.rest.dto.EmpresaRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/empresas")
@RequiredArgsConstructor
public class EmpresaController {

    private final CriarEmpresaUseCase criarEmpresaUseCase;
    private final AtualizarEmpresaUseCase atualizarEmpresaUseCase;
    private final ListarEmpresasUseCase listarEmpresasUseCase;
    private final ImportarEmpresasUseCase importarEmpresasUseCase;

    @PostMapping("/importar")
    public ResponseEntity<List<Map<String, Object>>> importar(@RequestParam("file") MultipartFile file)
            throws IOException {
        String locatariaId = EmpresaLocatariaContext.getEmpresaLocatariaId();
        List<Empresa> importadas = importarEmpresasUseCase.executar(file.getInputStream(),
                EmpresaLocatariaId.of(locatariaId));
        return ResponseEntity.ok(importadas.stream().map(this::toResponse).toList());
    }

    @PostMapping
    public ResponseEntity<Void> criar(@RequestBody @Valid EmpresaRequest request) {
        String locatariaId = EmpresaLocatariaContext.getEmpresaLocatariaId();

        criarEmpresaUseCase.executar(CriarEmpresaUseCase.Input.builder()
                .locatariaId(EmpresaLocatariaId.of(locatariaId))
                .razaoSocial(request.razaoSocial())
                .nomeFantasia(request.nomeFantasia())
                .identificacao(request.identificacao())
                .regimeTributario(request.regimeTributario())
                .identificadorInterno(request.identificadorInterno())
                .contatos(request.contatos() != null ? request.contatos().stream()
                        .map(c -> new CriarEmpresaUseCase.ContatoInput(c.nome(), c.cargo(), c.departamento(),
                                c.celular(), c.email()))
                        .toList() : null)
                .enderecos(request.enderecos() != null ? request.enderecos().stream()
                        .map(e -> new CriarEmpresaUseCase.EnderecoInput(e.logradouro(), e.numero(), e.complemento(),
                                e.cep(), e.bairro(), e.cidade(), e.uf(), e.inscricaoEstadual(), e.inscricaoMunicipal(),
                                e.isentoIcms()))
                        .toList() : null)
                .build());

        return ResponseEntity.status(201).build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> atualizar(@PathVariable UUID id, @RequestBody @Valid EmpresaRequest request) {
        String locatariaId = EmpresaLocatariaContext.getEmpresaLocatariaId();
        atualizarEmpresaUseCase.executar(id, AtualizarEmpresaUseCase.Input.builder()
                .locatariaId(EmpresaLocatariaId.of(locatariaId))
                .razaoSocial(request.razaoSocial())
                .nomeFantasia(request.nomeFantasia())
                .identificacao(request.identificacao())
                .regimeTributario(request.regimeTributario())
                .identificadorInterno(request.identificadorInterno())
                .ativa(true)
                .contatos(request.contatos() != null ? request.contatos().stream()
                        .map(c -> new AtualizarEmpresaUseCase.ContatoInput(c.nome(), c.cargo(), c.departamento(), c.celular(), c.email()))
                        .toList() : null)
                .enderecos(request.enderecos() != null ? request.enderecos().stream()
                        .map(e -> new AtualizarEmpresaUseCase.EnderecoInput(e.logradouro(), e.numero(), e.complemento(), e.cep(), e.bairro(), e.cidade(), e.uf(), e.inscricaoEstadual(), e.inscricaoMunicipal(), e.isentoIcms()))
                        .toList() : null)
                .build());

        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar() {
        String locatariaId = EmpresaLocatariaContext.getEmpresaLocatariaId();
        List<Empresa> empresas = listarEmpresasUseCase.executar(EmpresaLocatariaId.of(locatariaId));

        return ResponseEntity.ok(empresas.stream().map(this::toResponse).toList());
    }

    private Map<String, Object> toResponse(Empresa e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("razaoSocial", e.getRazaoSocial());
        map.put("nomeFantasia", e.getNomeFantasia());
        map.put("identificacao", e.getIdentificacao().value());
        map.put("regimeTributario", e.getRegimeTributario());
        map.put("identificadorInterno", e.getIdentificadorInterno());
        map.put("ativa", e.isAtiva());
        map.put("criadoEm", e.getCriadoEm());

        map.put("contatos", e.getContatos().stream().map(c -> {
            Map<String, Object> cm = new LinkedHashMap<>();
            cm.put("id", c.getId());
            cm.put("nome", c.getNome());
            cm.put("cargo", c.getCargo());
            cm.put("departamento", c.getDepartamento());
            cm.put("celular", c.getCelular());
            cm.put("email", c.getEmail());
            return cm;
        }).toList());

        map.put("enderecos", e.getEnderecos().stream().map(end -> {
            Map<String, Object> em = new LinkedHashMap<>();
            em.put("id", end.getId());
            em.put("logradouro", end.getLogradouro());
            em.put("numero", end.getNumero());
            em.put("complemento", end.getComplemento());
            em.put("cep", end.getCep());
            em.put("bairro", end.getBairro());
            em.put("cidade", end.getCidade());
            em.put("uf", end.getUf());
            em.put("inscricaoEstadual", end.getInscricaoEstadual());
            em.put("inscricaoMunicipal", end.getInscricaoMunicipal());
            em.put("isentoIcms", end.isIsentoIcms());
            return em;
        }).toList());

        return map;
    }
}
