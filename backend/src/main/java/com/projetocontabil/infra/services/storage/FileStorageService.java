package com.projetocontabil.infra.services.storage;

import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class FileStorageService {

    private final Path rootLocation = Paths.get("uploads");

    public FileStorageService() {
        try {
            Files.createDirectories(rootLocation);
        } catch (Exception e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    public String store(String filename, InputStream inputStream, String empresaLocatariaId) {
        try {
            Path tenantDir = rootLocation.resolve(empresaLocatariaId);
            Files.createDirectories(tenantDir);
            Path destinationFile = tenantDir.resolve(Paths.get(filename)).normalize().toAbsolutePath();
            
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            return destinationFile.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }
}
