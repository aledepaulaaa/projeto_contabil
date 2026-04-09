package com.projetocontabil.core.domain.crm.model;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Contrato — Máquina de Estados e Regras de Negócio")
class ContratoTest {

    private final EmpresaLocatariaId empresaId = EmpresaLocatariaId.of("tenant-test");

    @Nested
    @DisplayName("Criação")
    class Criacao {

        @Test
        @DisplayName("Deve criar contrato no estado GERANDO com dados do lead")
        void deveCriarContratoNoEstadoGerando() {
            var contrato = Contrato.criarParaGeracao(
                    java.util.UUID.randomUUID(), empresaId, "João Silva", "joao@test.com");

            assertEquals(StatusContrato.GERANDO, contrato.getStatus());
            assertEquals("João Silva", contrato.getNomeContato());
            assertEquals("joao@test.com", contrato.getEmailContato());
            assertNotNull(contrato.getId());
            assertNotNull(contrato.getCriadoEm());
        }
    }

    @Nested
    @DisplayName("Transições de Estado")
    class TransicoesDeEstado {

        @Test
        @DisplayName("GERANDO → AGUARDANDO_ASSINATURA ao vincular documento ZapSign")
        void deveTransitarParaAguardandoAoVincularDocumento() {
            var contrato = Contrato.criarParaGeracao(
                    java.util.UUID.randomUUID(), empresaId, "Maria", "maria@test.com");

            contrato.vincularDocumentoZapSign("https://app.zapsign.com.br/doc/abc123");

            assertEquals(StatusContrato.AGUARDANDO_ASSINATURA, contrato.getStatus());
            assertEquals("https://app.zapsign.com.br/doc/abc123", contrato.getUrlDocumentoZapSign());
        }

        @Test
        @DisplayName("AGUARDANDO_ASSINATURA → ATIVO ao ativar")
        void deveAtivarContratoAguardandoAssinatura() {
            var contrato = Contrato.criarParaGeracao(
                    java.util.UUID.randomUUID(), empresaId, "Pedro", "pedro@test.com");
            contrato.vincularDocumentoZapSign("https://zapsign.com/doc/xyz");
            contrato.ativar();

            assertEquals(StatusContrato.ATIVO, contrato.getStatus());
        }

        @Test
        @DisplayName("Não pode ativar contrato que está GERANDO")
        void naoDeveAtivarContratoGerando() {
            var contrato = Contrato.criarParaGeracao(
                    java.util.UUID.randomUUID(), empresaId, "Ana", "ana@test.com");

            assertThrows(IllegalStateException.class, contrato::ativar);
        }

        @Test
        @DisplayName("Deve cancelar contrato com motivo obrigatório")
        void deveCancelarContratoComMotivo() {
            var contrato = Contrato.criar(java.util.UUID.randomUUID(), empresaId);
            contrato.cancelar("Cliente desistiu do serviço");

            assertEquals(StatusContrato.CANCELADO, contrato.getStatus());
            assertEquals("Cliente desistiu do serviço", contrato.getMotivoCancelamento());
        }

        @Test
        @DisplayName("Não pode cancelar contrato sem motivo")
        void naoDeveCancelarSemMotivo() {
            var contrato = Contrato.criar(java.util.UUID.randomUUID(), empresaId);

            assertThrows(IllegalArgumentException.class, () -> contrato.cancelar(null));
            assertThrows(IllegalArgumentException.class, () -> contrato.cancelar(""));
        }

        @Test
        @DisplayName("Não pode vincular documento a contrato que não está GERANDO")
        void naoDeveVincularDocumentoAContratoNaoGerando() {
            var contrato = Contrato.criar(java.util.UUID.randomUUID(), empresaId);

            assertThrows(IllegalStateException.class,
                    () -> contrato.vincularDocumentoZapSign("https://url.com"));
        }
    }
}
