package com.projetocontabil.infra.web;

import com.projetocontabil.infra.persistence.entity.DocumentoJpaEntity;
import com.projetocontabil.infra.persistence.repository.DocumentoJpaRepository;
import com.projetocontabil.infra.services.storage.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documentos")
public class DocumentoController {

    private final DocumentoJpaRepository repository;
    private final FileStorageService storageService;

    public DocumentoController(DocumentoJpaRepository repository, FileStorageService storageService) {
        this.repository = repository;
        this.storageService = storageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<DocumentoJpaEntity> upload(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-EmpresaLocataria-Id", required = false) String tenantIdHeader) {
        
        String empresaLocatariaId = (tenantIdHeader != null) ? tenantIdHeader : "EmpresaLocataria-dev-mode";

        try {
            String caminho = storageService.store(file.getOriginalFilename(), file.getInputStream(), empresaLocatariaId);

            DocumentoJpaEntity documento = new DocumentoJpaEntity(
                    UUID.randomUUID(),
                    empresaLocatariaId,
                    file.getOriginalFilename(),
                    caminho,
                    file.getContentType(),
                    file.getSize(),
                    LocalDateTime.now()
            );

            DocumentoJpaEntity salvo = repository.save(documento);
            return ResponseEntity.ok(salvo);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<DocumentoJpaEntity>> listar(
            @RequestHeader(value = "X-EmpresaLocataria-Id", required = false) String tenantIdHeader) {
        
        String empresaLocatariaId = (tenantIdHeader != null) ? tenantIdHeader : "EmpresaLocataria-dev-mode";
        List<DocumentoJpaEntity> documentos = repository.findAllByEmpresaLocatariaId(empresaLocatariaId);
        return ResponseEntity.ok(documentos);
    }
}
