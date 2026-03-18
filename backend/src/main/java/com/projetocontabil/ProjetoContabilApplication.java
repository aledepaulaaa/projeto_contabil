package com.projetocontabil;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ProjetoContabilApplication {

    public static void main(String[] args) {
        System.out.println(">>> Iniciando ProjetoContabilApplication - Carregando .env...");
        io.github.cdimascio.dotenv.Dotenv dotenv = io.github.cdimascio.dotenv.Dotenv.configure()
                .directory("./")
                .ignoreIfMissing()
                .load();

        dotenv.entries().forEach(entry -> {
            System.setProperty(entry.getKey(), entry.getValue());
            // Mapeamento explícito para propriedades do Spring
            if (entry.getKey().startsWith("SPRING_DATASOURCE_")) {
                String springProp = entry.getKey().toLowerCase().replace("_", ".");
                System.setProperty(springProp, entry.getValue());
                System.out.println("Mapeando " + entry.getKey() + " para " + springProp);
            }
        });

        if (System.getProperty("spring.profiles.active") == null) {
            System.setProperty("spring.profiles.active", "dev");
        }

        SpringApplication.run(ProjetoContabilApplication.class, args);
    }
}
