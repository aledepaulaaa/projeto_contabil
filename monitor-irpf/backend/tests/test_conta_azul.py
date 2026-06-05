import unittest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configura banco em memória para testes
from app.database import Base
from app.models.app_kv import AppKv

# Importa o serviço que ainda será criado (Fase Red do TDD)
try:
    from app.services.conta_azul_service import (
        obter_configuracao_conta_azul,
        salvar_configuracao_conta_azul,
        is_token_expirado,
        trocar_code_por_tokens,
        renovar_tokens,
        obter_access_token_valido
    )
except ImportError:
    # Caso de erro esperado na Fase Red
    obter_configuracao_conta_azul = None
    salvar_configuracao_conta_azul = None
    is_token_expirado = None
    trocar_code_por_tokens = None
    renovar_tokens = None
    obter_access_token_valido = None

try:
    from app.routers.integracoes import (
        conta_azul_config_get,
        conta_azul_config_put,
        conta_azul_configurar_code,
        conta_azul_testar_conexao
    )
except ImportError:
    conta_azul_config_get = None
    conta_azul_config_put = None
    conta_azul_configurar_code = None
    conta_azul_testar_conexao = None


class TestContaAzulService(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=self.engine)
        Session = sessionmaker(bind=self.engine)
        self.db = Session()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_importacao_servico(self):
        """Verifica se o serviço foi importado corretamente (Fará falhar na Fase Red)."""
        self.assertIsNotNone(obter_configuracao_conta_azul, "Serviço obter_configuracao_conta_azul não implementado")
        self.assertIsNotNone(salvar_configuracao_conta_azul, "Serviço salvar_configuracao_conta_azul não implementado")
        self.assertIsNotNone(is_token_expirado, "Serviço is_token_expirado não implementado")
        self.assertIsNotNone(trocar_code_por_tokens, "Serviço trocar_code_por_tokens não implementado")
        self.assertIsNotNone(renovar_tokens, "Serviço renovar_tokens não implementado")
        self.assertIsNotNone(obter_access_token_valido, "Serviço obter_access_token_valido não implementado")

    def test_obter_configuracao_default(self):
        """Verifica se retorna configuração padrão quando não há nada no banco."""
        if obter_configuracao_conta_azul is None:
            self.skipTest("Fase Red: Serviços ainda não importados")
            
        config = obter_configuracao_conta_azul(self.db)
        self.assertFalse(config["enabled"])
        self.assertEqual(config["clientId"], "")
        self.assertEqual(config["clientSecret"], "")
        self.assertEqual(config["redirectUri"], "https://contaazul.com")
        self.assertEqual(config["accessToken"], "")

    def test_salvar_e_obter_configuracao(self):
        """Verifica se salva e recupera a configuração corretamente."""
        if salvar_configuracao_conta_azul is None or obter_configuracao_conta_azul is None:
            self.skipTest("Fase Red: Serviços ainda não importados")

        nova_config = {
            "enabled": True,
            "clientId": "test_client",
            "clientSecret": "test_secret",
            "redirectUri": "https://callback.com",
            "accessToken": "access_123",
            "refreshToken": "refresh_123",
            "expiresAt": "2026-06-05T15:00:00"
        }
        salvar_configuracao_conta_azul(self.db, nova_config)
        self.db.commit()

        config_recuperada = obter_configuracao_conta_azul(self.db)
        self.assertTrue(config_recuperada["enabled"])
        self.assertEqual(config_recuperada["clientId"], "test_client")
        self.assertEqual(config_recuperada["clientSecret"], "test_secret")
        self.assertEqual(config_recuperada["redirectUri"], "https://callback.com")
        self.assertEqual(config_recuperada["accessToken"], "access_123")
        self.assertEqual(config_recuperada["refreshToken"], "refresh_123")
        self.assertEqual(config_recuperada["expiresAt"], "2026-06-05T15:00:00")

    def test_verificar_token_expirado(self):
        """Verifica a lógica de expiração do token."""
        if is_token_expirado is None:
            self.skipTest("Fase Red: Serviços ainda não importados")

        # Sem token
        self.assertTrue(is_token_expirado(""))

        # Token com expiração futura
        futuro = (datetime.now() + timedelta(hours=1)).isoformat()
        self.assertFalse(is_token_expirado(futuro))

        # Token com expiração passada
        passado = (datetime.now() - timedelta(hours=1)).isoformat()
        self.assertTrue(is_token_expirado(passado))

        # Token prestes a expirar (limiar de 5 minutos, ex: expira em 2 minutos)
        prestes_a_expirar = (datetime.now() + timedelta(minutes=2)).isoformat()
        self.assertTrue(is_token_expirado(prestes_a_expirar))

    @patch('app.services.conta_azul_service.httpx.Client')
    def test_trocar_code_por_tokens_sucesso(self, mock_client_class):
        if trocar_code_por_tokens is None:
            self.skipTest("Fase Red: trocar_code_por_tokens não importado")
            
        mock_client = MagicMock()
        mock_client_class.return_value.__enter__.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "new_access",
            "refresh_token": "new_refresh",
            "expires_in": 3600
        }
        mock_client.post.return_value = mock_response
        
        # Primeiro salva config básica para ter clientId e clientSecret
        salvar_configuracao_conta_azul(self.db, {
            "enabled": False,
            "clientId": "client123",
            "clientSecret": "secret123",
            "redirectUri": "https://callback.com",
            "accessToken": "",
            "refreshToken": "",
            "expiresAt": ""
        })
        
        res = trocar_code_por_tokens(self.db, "auth_code_123")
        
        self.assertTrue(res["enabled"])
        self.assertEqual(res["accessToken"], "new_access")
        self.assertEqual(res["refreshToken"], "new_refresh")
        
    @patch('app.services.conta_azul_service.httpx.Client')
    def test_trocar_code_por_tokens_erro(self, mock_client_class):
        if trocar_code_por_tokens is None:
            self.skipTest("Fase Red: trocar_code_por_tokens não importado")
            
        mock_client = MagicMock()
        mock_client_class.return_value.__enter__.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Bad Request"
        mock_client.post.return_value = mock_response
        
        salvar_configuracao_conta_azul(self.db, {
            "enabled": False,
            "clientId": "client123",
            "clientSecret": "secret123",
            "redirectUri": "https://callback.com",
            "accessToken": "",
            "refreshToken": "",
            "expiresAt": ""
        })
        
        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as ctx:
            trocar_code_por_tokens(self.db, "auth_code_bad")
        self.assertEqual(ctx.exception.status_code, 400)

    @patch('app.services.conta_azul_service.httpx.Client')
    def test_renovar_tokens_sucesso(self, mock_client_class):
        if renovar_tokens is None:
            self.skipTest("Fase Red: renovar_tokens não importado")
            
        mock_client = MagicMock()
        mock_client_class.return_value.__enter__.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "renewed_access",
            "refresh_token": "renewed_refresh",
            "expires_in": 3600
        }
        mock_client.post.return_value = mock_response
        
        salvar_configuracao_conta_azul(self.db, {
            "enabled": True,
            "clientId": "client123",
            "clientSecret": "secret123",
            "redirectUri": "https://callback.com",
            "accessToken": "old_access",
            "refreshToken": "old_refresh",
            "expiresAt": (datetime.now() - timedelta(minutes=10)).isoformat()
        })
        
        res = renovar_tokens(self.db)
        self.assertEqual(res["accessToken"], "renewed_access")
        self.assertEqual(res["refreshToken"], "renewed_refresh")

    @patch('app.services.conta_azul_service.httpx.Client')
    def test_obter_access_token_valido_sem_refresh(self, mock_client_class):
        if obter_access_token_valido is None:
            self.skipTest("Fase Red: obter_access_token_valido não importado")
            
        # Token ainda válido por 1 hora
        futuro = (datetime.now() + timedelta(hours=1)).isoformat()
        salvar_configuracao_conta_azul(self.db, {
            "enabled": True,
            "clientId": "client123",
            "clientSecret": "secret123",
            "redirectUri": "https://callback.com",
            "accessToken": "valid_access",
            "refreshToken": "refresh_123",
            "expiresAt": futuro
        })
        
        token = obter_access_token_valido(self.db)
        self.assertEqual(token, "valid_access")
        
        # httpx.Client.post não deve ter sido chamado
        mock_client_class.assert_not_called()

    def test_router_import(self):
        """Verifica se as rotas do roteador da Conta Azul foram importadas."""
        self.assertIsNotNone(conta_azul_config_get, "Router conta_azul_config_get não implementado")
        self.assertIsNotNone(conta_azul_config_put, "Router conta_azul_config_put não implementado")
        self.assertIsNotNone(conta_azul_configurar_code, "Router conta_azul_configurar_code não implementado")
        self.assertIsNotNone(conta_azul_testar_conexao, "Router conta_azul_testar_conexao não implementado")

    def test_router_config_get_default(self):
        """Verifica se o router GET retorna valores default com campos sensíveis mascarados."""
        if conta_azul_config_get is None:
            self.skipTest("Router não importado")
        res = conta_azul_config_get(self.db)
        self.assertFalse(res["enabled"])
        self.assertEqual(res["clientSecret"], "")
        self.assertEqual(res["accessToken"], "")

    def test_router_config_put_e_get(self):
        """Verifica se o router PUT salva as configurações e mascara campos sensíveis."""
        if conta_azul_config_put is None or conta_azul_config_get is None:
            self.skipTest("Router não importado")
        payload = {
            "enabled": True,
            "clientId": "client_id_123",
            "clientSecret": "super_secret",
            "redirectUri": "https://callback.com",
            "accessToken": "some_access",
            "refreshToken": "some_refresh",
            "expiresAt": "2026-06-05T15:00:00"
        }
        res_put = conta_azul_config_put(payload, self.db)
        self.assertTrue(res_put["enabled"])
        self.assertEqual(res_put["clientId"], "client_id_123")
        self.assertEqual(res_put["clientSecret"], "***")
        self.assertEqual(res_put["accessToken"], "***")
        self.assertEqual(res_put["refreshToken"], "***")

        # Verifica GET subsequente
        res_get = conta_azul_config_get(self.db)
        self.assertEqual(res_get["clientSecret"], "***")

    @patch('app.routers.integracoes.trocar_code_por_tokens')
    def test_router_configurar_code(self, mock_trocar):
        if conta_azul_configurar_code is None:
            self.skipTest("Router não importado")
        mock_trocar.return_value = {"enabled": True}
        res = conta_azul_configurar_code({"code": "auth_code_123"}, self.db)
        mock_trocar.assert_called_once_with(self.db, "auth_code_123")
        self.assertEqual(res, {"ok": True, "message": "Autorização realizada com sucesso!"})

    @patch('app.routers.integracoes.obter_access_token_valido')
    @patch('app.routers.integracoes.httpx.Client')
    def test_router_testar_conexao_sucesso(self, mock_client_class, mock_obter_token):
        if conta_azul_testar_conexao is None:
            self.skipTest("Router não importado")
        
        mock_obter_token.return_value = "token_valido_123"
        
        mock_client = MagicMock()
        mock_client_class.return_value.__enter__.return_value = mock_client
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [{"name": "Empresa Teste"}]
        mock_client.get.return_value = mock_response

        res = conta_azul_testar_conexao(self.db)
        self.assertTrue(res["ok"])
        self.assertEqual(res["message"], "Conexão com a Conta Azul estabelecida com sucesso!")
        
        # Deve ter chamado a API de teste da Conta Azul com o token no cabeçalho
        mock_client.get.assert_called_once()
        headers = mock_client.get.call_args[1].get("headers")
        self.assertEqual(headers["Authorization"], "Bearer token_valido_123")


if __name__ == "__main__":
    unittest.main()

