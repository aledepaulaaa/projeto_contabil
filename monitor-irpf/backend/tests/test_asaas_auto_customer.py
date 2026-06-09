"""Testes unitários para a lógica de auto-criação/busca de clientes Asaas."""

import unittest
from decimal import Decimal
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.cliente_manual import ClienteManual, ORIGEM_MANUAL
from app.schemas.asaas_cobranca_cliente import AsaasCobrancaClienteIn
from app.services.asaas_cobranca_cliente_service import criar_cobranca_para_cliente, _resolver_asaas_customer_id


class FakeSession:
    def __init__(self):
        self.flushed = False

    def flush(self):
        self.flushed = True


def _make_cliente(
    mid: int = 1,
    cpf: str = "123.456.789-09",
    nome: str = "João Silva",
    asaas_customer_id: str | None = None,
    email: str | None = "joao@mail.com",
    telefone: str | None = "11999990000",
    ano: int = 2025,
) -> ClienteManual:
    m = ClienteManual()
    m.id = mid
    m.ano_carteira = ano
    m.cpf = cpf
    m.nome = nome
    m.asaas_customer_id = asaas_customer_id
    m.email = email
    m.telefone = telefone
    m.tipo_precificacao = "padrao"
    m.valor_personalizado = None
    m.ativo = True
    m.origem_cadastro = ORIGEM_MANUAL
    m.observacoes = None
    m.created_at = datetime.now()
    m.updated_at = datetime.now()
    return m


class TestResolverAsaasCustomerId(unittest.IsolatedAsyncioTestCase):
    """Testa a função _resolver_asaas_customer_id isoladamente."""

    async def test_retorna_id_existente_sem_chamar_api(self):
        """Se o cliente já tem asaas_customer_id, retorna direto."""
        db = FakeSession()
        m = _make_cliente(asaas_customer_id="cus_abc123")

        cust, err = await _resolver_asaas_customer_id(db, m, "https://api.asaas.com/v3", "key123")

        self.assertEqual(cust, "cus_abc123")
        self.assertIsNone(err)
        self.assertFalse(db.flushed)

    async def test_erro_quando_cpf_vazio(self):
        """Se o cliente não tem CPF, retorna erro."""
        db = FakeSession()
        m = _make_cliente(cpf="", asaas_customer_id=None)

        cust, err = await _resolver_asaas_customer_id(db, m, "https://api.asaas.com/v3", "key123")

        self.assertIsNone(cust)
        self.assertIsNotNone(err)
        self.assertEqual(err["code"], "missing_cpf")

    @patch("app.services.asaas_cobranca_cliente_service.get_customer_by_cpf")
    async def test_encontra_cliente_existente_no_asaas(self, mock_get):
        """Se busca por CPF retorna resultado, usa o ID e persiste."""
        mock_get.return_value = {"id": "cus_found_xyz", "name": "João", "cpfCnpj": "12345678909"}
        db = FakeSession()
        m = _make_cliente(asaas_customer_id=None)

        cust, err = await _resolver_asaas_customer_id(db, m, "https://api.asaas.com/v3", "key123")

        self.assertEqual(cust, "cus_found_xyz")
        self.assertIsNone(err)
        self.assertEqual(m.asaas_customer_id, "cus_found_xyz")
        self.assertTrue(db.flushed)
        mock_get.assert_awaited_once()

    @patch("app.services.asaas_cobranca_cliente_service.create_customer")
    @patch("app.services.asaas_cobranca_cliente_service.get_customer_by_cpf")
    async def test_cria_cliente_quando_nao_encontra(self, mock_get, mock_create):
        """Se busca não encontra, cria o cliente e persiste o ID."""
        mock_get.return_value = None
        mock_create.return_value = (200, {"id": "cus_new_123", "name": "João"})
        db = FakeSession()
        m = _make_cliente(asaas_customer_id=None)

        cust, err = await _resolver_asaas_customer_id(db, m, "https://api.asaas.com/v3", "key123")

        self.assertEqual(cust, "cus_new_123")
        self.assertIsNone(err)
        self.assertEqual(m.asaas_customer_id, "cus_new_123")
        self.assertTrue(db.flushed)
        mock_create.assert_awaited_once()

    @patch("app.services.asaas_cobranca_cliente_service.create_customer")
    @patch("app.services.asaas_cobranca_cliente_service.get_customer_by_cpf")
    async def test_retorna_erro_quando_criacao_falha(self, mock_get, mock_create):
        """Se a criação falha, retorna erro sem persistir ID."""
        mock_get.return_value = None
        mock_create.return_value = (400, {"errors": [{"description": "CPF inválido"}]})
        db = FakeSession()
        m = _make_cliente(asaas_customer_id=None)

        cust, err = await _resolver_asaas_customer_id(db, m, "https://api.asaas.com/v3", "key123")

        self.assertIsNone(cust)
        self.assertIsNotNone(err)
        self.assertEqual(err["code"], "asaas_customer_create_failed")
        self.assertIn("CPF inválido", err["description"])
        self.assertIsNone(m.asaas_customer_id)


if __name__ == "__main__":
    unittest.main()
