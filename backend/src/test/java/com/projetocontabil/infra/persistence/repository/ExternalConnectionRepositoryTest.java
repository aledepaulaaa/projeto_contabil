package com.projetocontabil.infra.persistence.repository;

import com.projetocontabil.core.domain.crm.model.enums.ConnectionProvider;
import com.projetocontabil.core.domain.crm.model.enums.ConnectionStatus;
import com.projetocontabil.infra.persistence.entity.ExternalConnectionJpaEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ExternalConnectionRepositoryTest {

    @Autowired
    private ExternalConnectionRepository repository;

    @Test
    @DisplayName("Deve persistir e recuperar uma conexão externa com refresh token longo (TEXT)")
    void devePersistirConexao() {
        ExternalConnectionJpaEntity entity = new ExternalConnectionJpaEntity();
        entity.setId(UUID.randomUUID());
        entity.setEmpresaLocatariaId("tenant-123");
        entity.setProvider(ConnectionProvider.GOOGLE_ADS);
        entity.setAccessToken("short-access-token");
        entity.setRefreshToken("a-very-long-refresh-token-that-should-be-stored-as-text-" + "a".repeat(500));
        entity.setExpiresAt(LocalDateTime.now().plusHours(1));
        entity.setGoogleCustomerId("123-456-7890");
        entity.setStatus(ConnectionStatus.ACTIVE);
        entity.setLastSync(LocalDateTime.now());

        ExternalConnectionJpaEntity saved = repository.save(entity);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getRefreshToken()).contains("very-long");
    }
}
