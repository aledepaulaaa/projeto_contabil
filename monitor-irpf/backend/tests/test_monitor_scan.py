import unittest
import tempfile
import json
import os
from pathlib import Path
from decimal import Decimal
from datetime import date
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.app_kv import AppKv
from app.models.declaracao import Declaracao
from app.models.cliente_manual import ClienteManual
from app.repositories.app_kv_repository import AppKvRepository
from app.services.monitor_scan_service import MonitorScanService


class TestMonitorScan(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=self.engine)
        Session = sessionmaker(bind=self.engine)
        self.db = Session()
        self.kv = AppKvRepository(self.db)
        
        # Criar diretório temporário para simular pastas monitoradas
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = Path(self.temp_dir.name)

    def tearDown(self):
        self.temp_dir.cleanup()
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_scan_sem_configuracao(self):
        """Verifica se retorna erro quando não há pastas configuradas."""
        res = MonitorScanService.sincronizar(self.db)
        self.assertFalse(res["ok"])
        self.assertIn("Nenhuma pasta configurada", res["message"])

    def test_scan_pasta_inexistente(self):
        """Verifica se lida corretamente com pastas configuradas que não existem."""
        self.kv.upsert("irpf_govbox_roots_v1", json.dumps(["C:\\Diretorio\\Que\\Nao\\Existe\\123"]))
        self.db.commit()
        res = MonitorScanService.sincronizar(self.db)
        self.assertTrue(res["ok"])
        self.assertIn("Nenhum arquivo .dec/.rec", res["message"])

    def test_sincronizacao_completa(self):
        """Testa o escaneamento e importação completa de arquivos .dec e .rec."""
        # 1. Configurar a pasta temporária como raiz de scan
        self.kv.upsert("irpf_govbox_roots_v1", json.dumps([str(self.temp_path)]))
        
        # 2. Inserir ClienteManual no banco para testar resolução de nome via DB
        cliente_db = ClienteManual(
            ano_carteira=2025,
            nome="ARIANE SILVA ORIGINAL",
            cpf="12345678909",
            ativo=True,
            created_at=date.today(),
            updated_at=date.today()
        )
        self.db.add(cliente_db)
        self.db.commit()

        # 3. Criar arquivos mockados na pasta temporária
        # CPF 1: "12345678909" (Ariane Silva - Existe no banco)
        dec1_content = b"Cabe\x00\x00alho12345678909OutrosDadosNomeARIANE SILVAOutrosCampos"
        rec1_content = b"ReciboDeEntrega12345678909NumeroDoRecibo123456789012FimDoArquivo"
        
        dec1_path = self.temp_path / "12345678909-IRPF-2026-2025-original.dec"
        rec1_path = self.temp_path / "12345678909-IRPF-2026-2025-original.rec"
        
        dec1_path.write_bytes(dec1_content)
        rec1_path.write_bytes(rec1_content)

        # CPF 2: "98765432101" (José Souza - NÃO existe no banco, deve extrair do arquivo .dec)
        # O nome do titular JOSE SOUZA é colocado após o CPF no arquivo binário
        dec2_content = b"HeaderBinaryData98765432101\x00\x00JOSE SOUZA\x00\x00MaisDados"
        dec2_path = self.temp_path / "98765432101-IRPF-2026-2025-original.dec"
        dec2_path.write_bytes(dec2_content)

        # 4. Executar sincronização
        res = MonitorScanService.sincronizar(self.db)
        self.assertTrue(res["ok"])
        self.assertEqual(res["arquivos_escaneados"], 3)
        self.assertEqual(res["criados"], 2)

        # 5. Validar declarações importadas no DB
        decls = self.db.scalars(select(Declaracao).order_by(Declaracao.titular_cpf)).all()
        self.assertEqual(len(decls), 2)

        # Ariane Silva (CPF 12345678909)
        d1 = decls[0]
        self.assertEqual(d1.titular_cpf, "12345678909")
        self.assertEqual(d1.titular_nome, "ARIANE SILVA ORIGINAL")  # Nome resolvido pelo DB do ClienteManual
        self.assertEqual(d1.ano_calendario, 2025)
        self.assertEqual(d1.status, "entregue")  # Status alterado para entregue pois possui recibo
        self.assertEqual(d1.numero_recibo, "123456789012")  # Recibo de 12 dígitos extraído do arquivo .rec
        self.assertEqual(d1.caminho_arquivo_declaracao, str(dec1_path.resolve()))
        self.assertEqual(d1.caminho_arquivo_recibo, str(rec1_path.resolve()))

        # José Souza (CPF 98765432101)
        d2 = decls[1]
        self.assertEqual(d2.titular_cpf, "98765432101")
        self.assertEqual(d2.titular_nome, "JOSE SOUZA")
        self.assertEqual(d2.ano_calendario, 2025)
        self.assertEqual(d2.status, "em_edicao")
        self.assertEqual(d2.caminho_arquivo_declaracao, str(dec2_path.resolve()))
        self.assertIsNone(d2.caminho_arquivo_recibo)

    def test_scan_subpastas_gravadas_e_transmitidas(self):
        """Verifica se arquivos dentro de subpastas gravadas/ e transmitidas/ assumem o status correto."""
        self.kv.upsert("irpf_govbox_roots_v1", json.dumps([str(self.temp_path)]))
        
        dir_gravadas = self.temp_path / "gravadas"
        dir_transmitidas = self.temp_path / "transmitidas"
        dir_gravadas.mkdir()
        dir_transmitidas.mkdir()

        file_gravada = dir_gravadas / "11122233344-IRPF-2026-2025-original.dec"
        file_gravada.write_bytes(b"Header11122233344\x00\x00CARLOS SILVA\x00\x00")

        file_trans = dir_transmitidas / "55566677788-IRPF-2026-2025-original.dec"
        file_trans.write_bytes(b"Header55566677788\x00\x00MARIA OLIVEIRA\x00\x00")

        res = MonitorScanService.sincronizar(self.db)
        self.assertTrue(res["ok"])

        d_gravada = self.db.scalars(select(Declaracao).where(Declaracao.titular_cpf == "11122233344")).first()
        self.assertIsNotNone(d_gravada)
        self.assertEqual(d_gravada.status, "gravada")

        d_trans = self.db.scalars(select(Declaracao).where(Declaracao.titular_cpf == "55566677788")).first()
        self.assertIsNotNone(d_trans)
        self.assertEqual(d_trans.status, "entregue")


if __name__ == "__main__":
    unittest.main()
