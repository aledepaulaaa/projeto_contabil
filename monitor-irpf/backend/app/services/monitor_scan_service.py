import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.declaracao import Declaracao
from app.models.cliente_manual import ClienteManual
from app.repositories.app_kv_repository import AppKvRepository

_KV_GOVBOX = "irpf_govbox_root"
_KV_GOVBOX_LIST = "irpf_govbox_roots_v1"
_KV_LAST_SCAN = "monitor_last_scan_at_v1"


def _utc_iso() -> str:
    return datetime.now(timezone.utc).replace(tzinfo=None).isoformat()


def extract_taxpayer_name(file_path: Path, cpf: str) -> str | None:
    try:
        content = file_path.read_bytes()[:10000]
        text = content.decode("latin-1", errors="ignore")
        
        # Heurística 1: Nome após o CPF
        idx = text.find(cpf)
        if idx != -1:
            sub = text[idx + len(cpf) : idx + len(cpf) + 200]
            # Procura por palavras em maiúsculas (com acentuação em português)
            matches = re.findall(r"[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{10,60}", sub)
            for m in matches:
                name_candidate = m.strip()
                if " " in name_candidate and len(name_candidate) >= 8:
                    return name_candidate
                    
        # Heurística 2: Scan geral por palavras maiúsculas válidas
        matches = re.findall(r"\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{3,}(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,})+\b", text[:4000])
        for m in matches:
            m_clean = m.strip()
            # Ignorar palavras comuns do cabeçalho da Receita Federal
            if not any(x in m_clean for x in ["RECEITA", "FEDERAL", "MINISTERIO", "FAZENDA", "DECLARACAO", "IRPF", "ORIGINAL", "RETIFICADORA"]):
                return m_clean
    except Exception:
        pass
    return None


def extract_receipt_number(file_path: Path) -> str | None:
    try:
        content = file_path.read_bytes()[:10000]
        text = content.decode("latin-1", errors="ignore")
        match = re.search(r"(\d{12})", text)
        if match:
            return match.group(1)
        match_fmt = re.search(r"(\d{2}\.\d{2}\.\d{2}\.\d{2}\.\d{2}\.\d{2})", text)
        if match_fmt:
            return match_fmt.group(1).replace(".", "")
    except Exception:
        pass
    return None


class MonitorScanService:
    @staticmethod
    def sincronizar(db: Session) -> dict:
        kv = AppKvRepository(db)
        
        # 1. Carregar caminhos monitorados
        paths_to_scan = []
        raw_list = kv.get(_KV_GOVBOX_LIST)
        if raw_list:
            try:
                data = json.loads(raw_list)
                if isinstance(data, list):
                    paths_to_scan.extend([str(p).strip() for p in data if str(p).strip()])
            except json.JSONDecodeError:
                pass
        
        if not paths_to_scan:
            legacy = kv.get(_KV_GOVBOX)
            if legacy and legacy.strip():
                paths_to_scan.append(legacy.strip())
                
        if not paths_to_scan:
            return {
                "ok": False,
                "message": "Nenhuma pasta configurada para monitoramento. Aceda a Configurações."
            }

        # 2. Varredura de arquivos
        scanned_files = []
        for path_str in paths_to_scan:
            path = Path(path_str)
            if not path.exists() or not path.is_dir():
                continue
            
            # Buscar recursivamente todos os arquivos .dec e .rec
            for ext in ("*.dec", "*.rec"):
                for file_path in path.rglob(ext):
                    filename = file_path.name
                    # Regex para identificar CPF e anos
                    match = re.match(r"^(\d{11})", filename)
                    if match:
                        cpf = match.group(1)
                        is_rec = ext == "*.rec"
                        
                        # Extrair o ano do nome do arquivo (ex: IRPF-2026-2025)
                        # O ano-calendário é tipicamente o segundo ano na string
                        year_matches = re.findall(r"\b(20\d{2})\b", filename)
                        if len(year_matches) >= 2:
                            ano_calendario = int(year_matches[1])
                        elif len(year_matches) == 1:
                            ano_exercicio = int(year_matches[0])
                            ano_calendario = ano_exercicio - 1
                        else:
                            # Fallback para o ano anterior à modificação do arquivo
                            try:
                                mtime_year = datetime.fromtimestamp(file_path.stat().st_mtime).year
                                ano_calendario = mtime_year - 1
                            except Exception:
                                ano_calendario = datetime.now().year - 1
                                
                        try:
                            mtime = file_path.stat().st_mtime
                        except Exception:
                            mtime = 0.0
                            
                        scanned_files.append({
                            "cpf": cpf,
                            "ano_calendario": ano_calendario,
                            "is_rec": is_rec,
                            "file_path": file_path,
                            "mtime": mtime
                        })

        if not scanned_files:
            # Atualizar o último scan mesmo que nada tenha sido encontrado
            kv.upsert(_KV_LAST_SCAN, _utc_iso())
            db.commit()
            return {
                "ok": True,
                "message": "Varredura concluída nas pastas configuradas. Nenhum arquivo .dec/.rec válido foi encontrado.",
                "arquivos_escaneados": 0,
                "criados": 0,
                "atualizados": 0
            }

        # Ordenar por mtime para processar os mais antigos primeiro (os novos sobrescrevem)
        scanned_files.sort(key=lambda x: x["mtime"])

        criados = 0
        atualizados = 0

        # Mapear declarações existentes para cache
        # (CPF, Ano) -> Declaracao
        existing_decls = {}
        for d in db.scalars(select(Declaracao)).all():
            if d.titular_cpf:
                existing_decls[(d.titular_cpf, d.ano_calendario)] = d

        # 3. Processar arquivos
        for item in scanned_files:
            cpf = item["cpf"]
            ano = item["ano_calendario"]
            is_rec = item["is_rec"]
            file_path = item["file_path"]
            mtime = item["mtime"]
            
            decl = existing_decls.get((cpf, ano))
            
            if not decl:
                # Obter nome do cliente do banco ou fallback
                cliente = db.scalars(select(ClienteManual).where(ClienteManual.cpf == cpf)).first()
                if cliente:
                    nome = cliente.nome
                else:
                    nome = None
                    # Se for arquivo .dec, tenta extrair do binário
                    if not is_rec:
                        nome = extract_taxpayer_name(file_path, cpf)
                    if not nome:
                        nome = f"CPF {cpf}"

                decl = Declaracao(
                    ano_calendario=ano,
                    titular_nome=nome,
                    titular_cpf=cpf,
                    status="em_edicao",
                    resultado_fiscal="nao_informado",
                    valor_imposto_ou_restituicao=Decimal("0.00"),
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.add(decl)
                db.flush()
                existing_decls[(cpf, ano)] = decl
                criados += 1
            else:
                atualizados += 1

            # Atualizar caminhos específicos
            if is_rec:
                decl.caminho_arquivo_recibo = str(file_path.resolve())
                decl.status = "entregue"
                
                # Extrair número do recibo
                num_recibo = extract_receipt_number(file_path)
                if num_recibo:
                    decl.numero_recibo = num_recibo
                
                # Definir data de entrega
                try:
                    decl.data_entrega = datetime.fromtimestamp(mtime).date()
                except Exception:
                    decl.data_entrega = datetime.now().date()
            else:
                decl.caminho_arquivo_declaracao = str(file_path.resolve())
                
                # Se não temos o nome correto e o arquivo dec foi escaneado, tenta extrair
                if decl.titular_nome.startswith("CPF ") or not decl.titular_nome:
                    nome_extraido = extract_taxpayer_name(file_path, cpf)
                    if nome_extraido:
                        decl.titular_nome = nome_extraido

            decl.updated_at = datetime.now()

        # Atualizar a data do último scan
        kv.upsert(_KV_LAST_SCAN, _utc_iso())
        db.commit()

        return {
            "ok": True,
            "message": f"Sincronização concluída. Criadas: {criados}. Atualizadas: {atualizados}.",
            "arquivos_escaneados": len(scanned_files),
            "criados": criados,
            "atualizados": atualizados
        }
