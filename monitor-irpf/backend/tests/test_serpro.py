import unittest
from unittest.mock import patch, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.app_kv import AppKv

# Importações do TDD (Fará falhar na Fase Red)
try:
    from app.services.serpro_integra_service import extrair_chave_privada_pfx
except ImportError:
    extrair_chave_privada_pfx = None

try:
    from app.routers.integracoes import (
        serpro_config_get,
        serpro_config_put,
        serpro_extrair_chave,
        serpro_chamar_api
    )
except ImportError:
    serpro_config_get = None
    serpro_config_put = None
    serpro_extrair_chave = None
    serpro_chamar_api = None


class TestSerproService(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=self.engine)
        Session = sessionmaker(bind=self.engine)
        self.db = Session()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_importacao_servico(self):
        """Verifica se a função extrair_chave_privada_pfx foi importada (Fase Red)."""
        self.assertIsNotNone(extrair_chave_privada_pfx, "Função extrair_chave_privada_pfx não importada")
        self.assertIsNotNone(serpro_config_get, "Função serpro_config_get não importada")
        self.assertIsNotNone(serpro_config_put, "Função serpro_config_put não importada")
        self.assertIsNotNone(serpro_extrair_chave, "Função serpro_extrair_chave não importada")

    @patch('app.services.serpro_integra_service.pkcs12')
    def test_extrair_chave_sucesso(self, mock_pkcs12):
        if extrair_chave_privada_pfx is None:
            self.skipTest("Fase Red: Função não implementada")

        # Mock da chave privada e sua serialização
        mock_key = MagicMock()
        mock_key.private_bytes.return_value = b"bytes_da_chave_privada_der"
        
        # mock pkcs12.load_key_and_certificates retorno
        mock_pkcs12.load_key_and_certificates.return_value = (mock_key, MagicMock(), [])

        # Dummy base64 de certificado e senha
        dummy_pfx_b64 = "Y2VydGlmaWNhZG9fZHVtbXk=" # "certificado_dummy"
        dummy_pass = "senha123"

        res_b64 = extrair_chave_privada_pfx(dummy_pfx_b64, dummy_pass)
        
        # Deve retornar o base64 dos bytes do DER retornados
        import base64
        expected_b64 = base64.b64encode(b"bytes_da_chave_privada_der").decode('ascii')
        self.assertEqual(res_b64, expected_b64)
        
        # Verifica parâmetros passados para pkcs12
        mock_pkcs12.load_key_and_certificates.assert_called_once()
        args = mock_pkcs12.load_key_and_certificates.call_args[0]
        self.assertEqual(args[0], base64.b64decode(dummy_pfx_b64))
        self.assertEqual(args[1], b"senha123")

    @patch('app.services.serpro_integra_service.pkcs12')
    def test_extrair_chave_sem_chave_privada(self, mock_pkcs12):
        if extrair_chave_privada_pfx is None:
            self.skipTest("Fase Red: Função não implementada")

        # Sem chave privada retornada pelo PFX
        mock_pkcs12.load_key_and_certificates.return_value = (None, MagicMock(), [])

        with self.assertRaises(ValueError) as ctx:
            extrair_chave_privada_pfx("Y2VydGlmaWNhZG9fZHVtbXk=", "senha123")
        self.assertIn("não possui chave privada", str(ctx.exception))

    def test_router_serpro_config_get_default(self):
        if serpro_config_get is None:
            self.skipTest("Router não importado")
        res = serpro_config_get(self.db)
        self.assertFalse(res["enabled"])
        self.assertEqual(res["consumerSecret"], "")
        self.assertFalse(res["hasCert"])
        self.assertFalse(res["hasPrivateKey"])

    def test_router_serpro_config_put_masking(self):
        if serpro_config_put is None:
            self.skipTest("Router não importado")
        payload = {
            "enabled": True,
            "consumerKey": "key123",
            "consumerSecret": "secret123",
            "certPassword": "pass_cert_123"
        }
        res_put = serpro_config_put(payload, self.db)
        self.assertTrue(res_put["enabled"])
        self.assertEqual(res_put["consumerSecret"], "***")
        self.assertEqual(res_put["certPassword"], "***")

        # Verifica que salvou no _K_CERT_PASS também
        from app.repositories.app_kv_repository import AppKvRepository
        self.assertEqual(AppKvRepository(self.db).get("contador_cert_a1_pass"), "pass_cert_123")

    def test_sandbox_mode_default_and_routing(self):
        if serpro_config_get is None or serpro_config_put is None:
            self.skipTest("Router não importado")
        
        # 1. Verifica se os novos campos estão no get padrão
        res = serpro_config_get(self.db)
        self.assertIn("sandboxMode", res)
        self.assertTrue(res["sandboxMode"])
        self.assertEqual(res["baseUrl"], "https://gateway.apiserpro.serpro.gov.br/")
        self.assertTrue(res["apiRendaAtiva"])
        self.assertFalse(res["apiRestituicaoAtiva"])

        # 2. Salva com sandboxMode desativado e outra baseUrl
        payload = {
            "enabled": True,
            "consumerKey": "key123",
            "consumerSecret": "secret123",
            "baseUrl": "https://gateway.apiserpro.serpro.gov.br/",
            "sandboxMode": False,
            "apiRendaAtiva": True,
            "apiRestituicaoAtiva": True,
            "apiProcuracoesAtiva": True,
            "apiDarfAtiva": True,
            "apiMensagensEcacAtiva": True,
            "apiDebitosAtiva": True,
            "apiDiagnosticoFiscalAtiva": True,
        }
        res_put = serpro_config_put(payload, self.db)
        self.assertFalse(res_put["sandboxMode"])
        self.assertTrue(res_put["apiRestituicaoAtiva"])
        self.assertTrue(res_put["apiProcuracoesAtiva"])
        self.assertTrue(res_put["apiDarfAtiva"])
        self.assertTrue(res_put["apiMensagensEcacAtiva"])
        self.assertTrue(res_put["apiDebitosAtiva"])
        self.assertTrue(res_put["apiDiagnosticoFiscalAtiva"])

        # Verifica no banco se as flags persistem
        from app.repositories.app_kv_repository import AppKvRepository
        import json
        config_salva = json.loads(AppKvRepository(self.db).get("serpro_integra_contador_config_v1"))
        self.assertFalse(config_salva.get("sandboxMode"))
        self.assertEqual(config_salva.get("baseUrl"), "https://gateway.apiserpro.serpro.gov.br/")
        self.assertTrue(config_salva.get("apiRestituicaoAtiva"))
        self.assertTrue(config_salva.get("apiProcuracoesAtiva"))
        self.assertTrue(config_salva.get("apiDarfAtiva"))
        self.assertTrue(config_salva.get("apiMensagensEcacAtiva"))
        self.assertTrue(config_salva.get("apiDebitosAtiva"))
        self.assertTrue(config_salva.get("apiDiagnosticoFiscalAtiva"))

    def test_novos_campos_serpro_defaults(self):
        if serpro_config_get is None:
            self.skipTest("Router não importado")
        res = serpro_config_get(self.db)
        self.assertIn("apiProcuracoesAtiva", res)
        self.assertFalse(res["apiProcuracoesAtiva"])
        self.assertFalse(res["apiDarfAtiva"])
        self.assertFalse(res["apiMensagensEcacAtiva"])
        self.assertFalse(res["apiDebitosAtiva"])
        self.assertFalse(res["apiDiagnosticoFiscalAtiva"])

    def test_mock_chamar_api_integra_contador(self):
        if serpro_chamar_api is None:
            self.skipTest("Router não importado")
        
        # Simular chamada para PROCURACOES
        payload = {
            "endpoint": "/Consultar",
            "method": "POST",
            "body": {
                "pedidoDados": {
                    "idSistema": "PROCURACOES",
                    "idServico": "OBTERPROCURACAO41"
                }
            }
        }
        res = serpro_chamar_api(payload, self.db)
        self.assertTrue(res["ok"])
        self.assertEqual(res["statusCode"], 200)
        self.assertIn("procuracoes", res["data"])
        self.assertEqual(len(res["data"]["procuracoes"]), 2)

        # Simular chamada para SICALC
        payload["body"]["pedidoDados"] = {
            "idSistema": "SICALC",
            "idServico": "GERARDARFCODBARRA53"
        }
        res = serpro_chamar_api(payload, self.db)
        self.assertTrue(res["ok"])
        self.assertEqual(res["data"]["status"], "EMITIDO")
        self.assertEqual(res["data"]["codigoReceita"], "6106")


if __name__ == "__main__":
    unittest.main()
