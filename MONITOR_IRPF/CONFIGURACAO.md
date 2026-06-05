# Configuração do projeto — Carteira IRPF

Este documento junta o que foi acordado e implementado nas nossas interações: **o que aconteceu ao código**, **como o sistema fica organizado hoje**, **portas**, **proxy**, **base de dados** e **chaves em `app_kv`**.

---

## 1. Contexto (histórico da conversa)

- Parte do **código-fonte original** (sobretudo `.py` no backend e `src` no frontend) **deixou de existir** na pasta do projeto (OneDrive / disco), sem recuperação viável pela Lixeira, Versões anteriores do Windows, Git ou OneDrive na cloud.
- Foi feita uma **reconstrução**:
  - **Backend:** FastAPI novo, rotas em `/api/...`, usando o **SQLite existente** `backend/data/irpf_carteira.db`.
  - **Frontend:** novo `frontend/src/` (React + TypeScript + Vite + React Router + Recharts), com CSS alinhado ao tema anterior; o `npm run build` gera um `dist/` atualizado.
- O erro **`Unexpected token '<', "<!doctype"... is not valid JSON`** aparecia porque o frontend pedia **`/api`** ao servidor de preview **sem** API a correr: a resposta era **HTML** (ex.: `index.html`), não JSON. Com o **proxy do Vite** para a porta **8000** e o **Uvicorn** ativo, isso deixa de ocorrer para as rotas `/api`.

---

## 2. Portas e fluxo de rede

| Serviço | Porta | Comando típico |
|--------|-------|------------------|
| Backend (Uvicorn) | **8000** | `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000` (na pasta `backend`) |
| Frontend **dev** (Vite) | **5173** | `npm run dev` (na pasta `frontend`) |
| Frontend **preview** (build) | **4173** | `npm run preview` (na pasta `frontend`) |

O **`vite.config.ts`** define **proxy** de `/api` → `http://127.0.0.1:8000` tanto em `server` (dev) como em `preview`. O browser fala sempre com o host do Vite; o Vite encaminha `/api` para o FastAPI.

---

## 3. Variáveis de ambiente (backend)

Ficheiro modelo: **`backend/.env.example`**. Copia para **`backend/.env`** se precisares de sobrescrever o default.

| Variável | Função |
|----------|--------|
| `DATABASE_URL` | URL SQLAlchemy do SQLite principal (por omissão: ficheiro em `backend/data/irpf_carteira.db`). |
| `CORS_ORIGINS` | Lista separada por vírgulas dos origens permitidos no browser (incluir `http://localhost:5173` e/ou `http://localhost:4173`). |

---

## 4. Arranque rápido (dois terminais)

**Terminal 1 — API**

```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — Interface**

```powershell
cd frontend
npm install
npm run dev
```

Abre o URL que o Vite indicar (geralmente `http://localhost:5173`). Para testar só o build: `npm run build` e `npm run preview` (`http://localhost:4173`).

---

## 5. Base de dados SQLite

- Ficheiro: **`backend/data/irpf_carteira.db`** (continua a ser a fonte de verdade para declarações, utilizadores, cobranças, etc.).
- Tabelas relevantes: `declaracoes`, `usuarios`, `cobrancas`, `app_kv`.

---

## 6. Tabela `app_kv` — chaves úteis

Valores são texto (muitas vezes JSON). O backend reconstruído usa entre outras:

| Chave | Uso |
|--------|-----|
| `irpf_govbox_root` | Pasta IRPF / GovBox; exposta em `GET /api/monitor/status` como `irpf_root_path`. |
| `irpf_monitor_enabled` | `true` / `false` — monitor ligado. |
| `monitor_config_v1` | JSON gravado por `PUT /api/monitor/config`. |
| `monitor_last_scan_at_v1` | ISO datetime do último `POST /api/monitor/scan`. |
| `monitor_snapshot_v1` | JSON opcional servido por `GET /api/monitor/snapshot`. |
| `sqlite_auxiliar_path` | Caminho opcional para um **segundo** SQLite; `GET /api/sync/fonte-local` devolve `configured: false` se não existir (evita erro de “auxiliar” no arranque). |
| `asaas_config_v1` | JSON Asaas; o `GET` devolve `apiKey` mascarada. |
| `serpro_integra_contador_config_v1` | JSON Serpro Integra Contador. |
| `contador_config_v1` | JSON dados do contador (CRC, etc.). |
| `contador_cert_a1_b64` / `contador_cert_a1_meta` | Certificado A1 em Base64 e metadados. |

Chaves antigas que **ainda possam existir** na tua base mas não são lidas por todo o código novo: podes mantê-las; o UI novo pode ir sendo alinhado à medida que precisares.

---

## 7. Segurança e bons hábitos (do que conversámos)

- **Não commits** `.env` com API keys ou certificados.
- **Git + remoto** (ex.: GitHub privado) para não repetir perda total de código.
- **Backup** da pasta do projeto ou da base **fora** de “só na cloud sem cópia local”.
- Integrações **Asaas / Serpro / emissão de boleto / sync pasta IRPF** estão em grande parte como **stubs** ou simplificadas no backend reconstruído — completar quando tiveres requisitos fechados.

---

## 8. Ficheiros de apoio no repositório

- `backend/.env.example` — variáveis do backend.
- `frontend/.env.example` — opcional (hoje o cliente usa `/api` com proxy).
- `tools/extract_api_from_dist.py` — útil se voltares a extrair rotas de um bundle antigo (se tiveres cópia do `dist`).

---

## 9. Placeholders para “segredos” (tu colas os valores reais)

1. **`backend/config/app_kv.template.json`** — modelo com textos do tipo `COLE_AQUI_...`, GovBox de exemplo, Asaas sandbox, campos Serpro genéricos (ajusta os nomes se a tua API usar outros).
2. Copia para **`backend/config/app_kv.local.json`** (este nome está no **`.gitignore`**), edita à vontade com as tuas chaves e certificados.
3. Na pasta **`backend`**, pré-visualiza o que vai ser gravado:
   ```powershell
   python scripts/apply_kv_template.py
   ```
4. Quando estiveres correto, aplica na base **`data/irpf_carteira.db`**:
   ```powershell
   python scripts/apply_kv_template.py --apply
   ```
   (Se `app_kv.local.json` existir, usa esse ficheiro; senão usa o `.template.json`. Também podes passar um caminho: `python scripts/apply_kv_template.py C:\caminho\meu.json --apply`.)

**Atenção:** `--apply` **substitui** na tabela `app_kv` as chaves que existem no JSON — não corras o template preenchido com placeholders em cima de uma base já produtiva sem quereres apagar chaves reais.

---

*Última alinhamento com o estado do código na reconstrução (FastAPI + Vite + `src`).*
