package com.projetocontabil.core.domain.empresa.model;

import com.projetocontabil.core.domain.crm.vo.Identificacao;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class EmpresaTest {

    @Test
    @DisplayName("Deve criar uma empresa com dados válidos")
    void deveCriarEmpresaValida() {
        EmpresaLocatariaId locatariaId = new EmpresaLocatariaId(UUID.randomUUID().toString());
        Identificacao cnpj = new Identificacao("12.345.678/0001-90");
        
        Empresa empresa = Empresa.criar(
            locatariaId,
            "Empresa de Teste LTDA",
            "Teste",
            cnpj,
            RegimeTributario.SIMPLES,
            "EMP-001"
        );

        assertNotNull(empresa.getId());
        assertEquals("Empresa de Teste LTDA", empresa.getRazaoSocial());
        assertTrue(empresa.isAtiva());
    }

    @Test
    @DisplayName("Deve adicionar contatos e endereços corretamente")
    void deveAdicionarContatosEEnderecos() {
        EmpresaLocatariaId locatariaId = new EmpresaLocatariaId(UUID.randomUUID().toString());
        Empresa empresa = Empresa.criar(locatariaId, "Razao", "Fantasia", new Identificacao("12345678901"), RegimeTributario.MEI, "ID");

        ContatoEmpresa contato = ContatoEmpresa.novo("João", "Sócio", "Diretoria", "11999999999", "joao@teste.com");
        empresa.adicionarContato(contato);

        EnderecoEmpresa endereco = EnderecoEmpresa.novo("Rua A", "123", "00000-000", "Bairro", "Cidade", "SP");
        empresa.adicionarEndereco(endereco);

        assertEquals(1, empresa.getContatos().size());
        assertEquals(1, empresa.getEnderecos().size());
        assertEquals("João", empresa.getContatos().get(0).getNome());
    }
}
