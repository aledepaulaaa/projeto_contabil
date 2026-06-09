import base64
import unittest
from datetime import datetime
from decimal import Decimal
from unittest.mock import patch, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.app_kv import AppKv
from app.models.cliente_manual import ClienteManual
from app.models.procuracao import Procuracao
from app.models.declaracao import Declaracao
from app.services.serpro_crypto import decrypt_serpro_rsa
from app.services.procuracao_service import ProcuracaoService
from app.services.restituicao_service import RestituicaoService


class TestSerproRestituicaoSync(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=self.engine)
        Session = sessionmaker(bind=self.engine)
        self.db = Session()

        # Seed minimal config
        self.db.add(AppKv(key="serpro_integra_contador_config_v1", value='{"enabled": true, "consumerKey": "mock_key", "consumerSecret": "mock_secret"}'))
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_decrypt_serpro_rsa_mock_fallback(self):
        # Se private_key for nula ou contiver "mock", decodifica Base64 pura
        msg = "Dados Descriptografados"
        msg_b64 = base64.b64encode(msg.encode("utf-8")).decode("ascii")
        
        # Teste com chave "mock-private-key"
        res = decrypt_serpro_rsa(msg_b64, "mock-private-key")
        self.assertEqual(res, msg)

        # Teste com chave vazia
        res_empty = decrypt_serpro_rsa(msg_b64, "")
        self.assertEqual(res_empty, msg)

        # Teste com valor inválido em base64 com chave mock
        res_invalid = decrypt_serpro_rsa("not_base64_!!", "mock-private-key")
        self.assertTrue(res_invalid.startswith("MockDecryptedValue:"))

    def test_procuracao_sync_mock(self):
        # Adicionar cliente manual
        cli = ClienteManual(
            ano_carteira=2024,
            origem_cadastro="manual",
            nome="GEOVANA RIBEIRO",
            cpf="12345678909",
            ativo=True,
            tipo_precificacao="padrao",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        self.db.add(cli)
        self.db.commit()

        svc = ProcuracaoService(self.db)
        res = svc.sincronizar(2024)
        
        self.assertTrue(res["ok"])
        self.assertEqual(res["sincronizados"], 1)

        # Verifica se a procuração foi adicionada
        proc = self.db.query(Procuracao).filter(Procuracao.titular_cpf == "12345678909").first()
        self.assertIsNotNone(proc)
        self.assertEqual(proc.token, "nchRml3PnHfUNC6hxowNnqYMfqMETs8WbYIaCfOKRgKm")
        self.assertEqual(proc.status, "ATIVA")

    def test_restituicao_consulta_mock(self):
        # Cria a procuração mockada no banco
        self.db.add(Procuracao(
            ano_calendario=2024,
            titular_cpf="12345678909",
            titular_nome="GEOVANA RIBEIRO",
            token="nchRml3PnHfUNC6hxowNnqYMfqMETs8WbYIaCfOKRgKm",
            status="ATIVA",
            created_at=datetime.now(),
            updated_at=datetime.now()
        ))
        
        # Cria a declaração
        decl = Declaracao(
            ano_calendario=2024,
            titular_cpf="123.456.789-09",
            titular_nome="GEOVANA RIBEIRO",
            status="entregue",
            resultado_fiscal="restituir",
            valor_imposto_ou_restituicao=Decimal("1500.00"),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        self.db.add(decl)
        self.db.commit()

        svc = RestituicaoService(self.db)
        res = svc.atualizar_declaracao(decl)

        self.assertTrue(res.ok)
        self.assertEqual(decl.restituicao_status, "restituido")
        self.assertTrue(decl.restituicao_paga)
        self.assertEqual(decl.restituicao_observacao, "Creditada / Paga")


if __name__ == "__main__":
    unittest.main()
