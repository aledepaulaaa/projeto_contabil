package com.projetocontabil.interfaces.rest.controller;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import com.projetocontabil.core.domain.onboarding.model.Onboarding;
import com.projetocontabil.core.domain.onboarding.model.TarefaOnboarding;
import com.projetocontabil.core.ports.driven.OnboardingRepository;
import com.projetocontabil.infra.tenancy.EmpresaLocatariaContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
@Slf4j
public class OnboardingController {

    private final OnboardingRepository repository;
    private final com.projetocontabil.core.usecases.onboarding.MoverTarefaUseCase moverTarefaUseCase;

    @GetMapping
    public ResponseEntity<List<Onboarding>> listarTodos() {
        String empresaId = EmpresaLocatariaContext.getEmpresaLocatariaId();
        return ResponseEntity.ok(repository.findAllByEmpresaLocatariaId(EmpresaLocatariaId.of(empresaId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Onboarding> buscarPorId(@PathVariable UUID id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/resumo")
    public ResponseEntity<Onboarding> atualizarResumo(@PathVariable UUID id, @RequestBody MapResumoDTO dto) {
        var onboarding = repository.findById(id).orElseThrow();
        onboarding.atualizarResumo(dto.resumo());
        return ResponseEntity.ok(repository.save(onboarding));
    }

    @PostMapping("/{id}/tarefas")
    public ResponseEntity<Onboarding> adicionarTarefa(@PathVariable UUID id, @RequestBody TarefaOnboardingDTO dto) {
        var onboarding = repository.findById(id).orElseThrow();
        
        List<TarefaOnboarding.ItemChecklist> checklist = dto.checklist() != null ? 
            dto.checklist().stream()
                .map(item -> new TarefaOnboarding.ItemChecklist(item.id() != null ? item.id() : UUID.randomUUID(), item.texto(), item.concluido()))
                .collect(Collectors.toList()) : new java.util.ArrayList<>();

        var tarefa = new TarefaOnboarding(
            null, id, dto.titulo(), dto.descricao(), 
            TarefaOnboarding.StatusTarefa.A_FAZER, 
            dto.prioridade() != null ? dto.prioridade() : TarefaOnboarding.PrioridadeTarefa.MEDIA,
            checklist,
            dto.dataInicio(), dto.dataFim()
        );
        
        onboarding.adicionarTarefa(tarefa);
        return ResponseEntity.ok(repository.save(onboarding));
    }

    @PatchMapping("/tarefas/{tarefaId}/status")
    public ResponseEntity<Void> atualizarStatusTarefa(@PathVariable UUID tarefaId, @RequestParam TarefaOnboarding.StatusTarefa status) {
        String empresaId = EmpresaLocatariaContext.getEmpresaLocatariaId();
        var todos = repository.findAllByEmpresaLocatariaId(EmpresaLocatariaId.of(empresaId));
        
        for (var onboarding : todos) {
            var tarefaOpt = onboarding.getTarefas().stream().filter(t -> t.getId().equals(tarefaId)).findFirst();
            if (tarefaOpt.isPresent()) {
                moverTarefaUseCase.executar(onboarding, tarefaId, status);
                return ResponseEntity.ok().build();
            }
        }
        return ResponseEntity.notFound().build();
    }

    @PatchMapping("/tarefas/{tarefaId}")
    public ResponseEntity<Void> editarTarefa(@PathVariable UUID tarefaId, @RequestBody TarefaOnboardingDTO dto) {
        String empresaId = EmpresaLocatariaContext.getEmpresaLocatariaId();
        var todos = repository.findAllByEmpresaLocatariaId(EmpresaLocatariaId.of(empresaId));
        
        for (var onboarding : todos) {
            var tarefaOpt = onboarding.getTarefas().stream().filter(t -> t.getId().equals(tarefaId)).findFirst();
            if (tarefaOpt.isPresent()) {
                var t = tarefaOpt.get();
                
                List<TarefaOnboarding.ItemChecklist> checklist = dto.checklist() != null ? 
                    dto.checklist().stream()
                        .map(item -> new TarefaOnboarding.ItemChecklist(item.id() != null ? item.id() : UUID.randomUUID(), item.texto(), item.concluido()))
                        .collect(Collectors.toList()) : new java.util.ArrayList<>();

                t.atualizarDados(dto.titulo(), dto.descricao(), dto.dataInicio(), dto.dataFim());
                t.atualizarPrioridade(dto.prioridade());
                t.atualizarChecklist(checklist);
                
                repository.save(onboarding);
                return ResponseEntity.ok().build();
            }
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/tarefas/{tarefaId}")
    public ResponseEntity<Void> excluirTarefa(@PathVariable UUID tarefaId) {
        String empresaId = EmpresaLocatariaContext.getEmpresaLocatariaId();
        var todos = repository.findAllByEmpresaLocatariaId(EmpresaLocatariaId.of(empresaId));
        
        for (var onboarding : todos) {
            boolean hasTask = onboarding.getTarefas().stream().anyMatch(t -> t.getId().equals(tarefaId));
            if (hasTask) {
                onboarding.removerTarefa(tarefaId);
                repository.save(onboarding);
                return ResponseEntity.noContent().build();
            }
        }
        return ResponseEntity.notFound().build();
    }

    public record MapResumoDTO(String resumo) {}
    public record TarefaOnboardingDTO(
        String titulo, 
        String descricao, 
        LocalDateTime dataInicio, 
        LocalDateTime dataFim,
        TarefaOnboarding.PrioridadeTarefa prioridade,
        List<ItemChecklistDTO> checklist
    ) {}
    
    public record ItemChecklistDTO(UUID id, String texto, boolean concluido) {}
}
