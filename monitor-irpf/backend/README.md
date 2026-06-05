# 🐍 MONITOR_IRPF — Backend (Python 3.12 + FastAPI)

API REST do **MONITOR_IRPF**, responsável por toda a lógica de negócio, persistência e integração com APIs externas. Parte do [Projeto Contábil](../../README.md).

---

## 🎯 Propósito

Serve como cérebro da aplicação MONITOR_IRPF: armazena declarações, clientes e configurações; integra-se com a Receita Federal via InfoSimples; realiza consulta de renda SERPRO; e processa cobranças de honorários via Asaas.

---

## 🏛️ Estrutura

```
backend/
├── app/
│   ├── main.py               → Inicialização FastAPI, CORS, registro de routers
│   ├── database.py           → Engine SQLAlchemy + sessão + get_db()
│   ├── models/               → Modelos ORM (declarativo SQLAlchemy)
│   │   ├── cobranca.py
│   │   ├── declaracao.py
│   │   └── ...
│   ├── schemas/              → Pydantic schemas (validação de entrada/saída)
│   ├── repositories/
│   │   └── app_kv_repository.py  → Key-Value store (configurações, tokens, certs)
│   ├── routers/              → Endpoints REST (separados por domínio)
│   │   ├── integracoes.py    → /api/integracoes/* (SERPRO, Asaas, Conta Azul, RFB)
│   │   ├── declaracoes.py
│   │   ├── clientes.py
│   │   ├── malha.py
│   │   ├── restituicoes.py
│   │   ├── mensagens_ecac.py
│   │   ├── diagnostico_fiscal.py
│   │   ├── darf.py
│   │   ├── documentos.py
│   │   ├── precificacao.py
│   │   ├── insights.py
│   │   └── ...
│   └── services/             → Lógica de negócio e integrações externas
│       ├── serpro_integra_service.py   → mTLS SAPI + extração RSA de PFX
│       ├── infosimples_rfb_service.py  → Diagnóstico, Malha, Restituição, e-CAC
│       ├── conta_azul_service.py       → OAuth 2.0 + chamadas à API
│       ├── asaas_cobranca_cliente_service.py → Criação de cobranças
│       ├── cliente_service.py
│       ├── declaracao_service.py
│       └── ...
├── tests/
│   └── test_serpro.py        → Testes de unidade da integração SERPRO
├── requirements.txt
└── .env.example
```

---

## 🛠️ Stack

| Categoria | Tecnologia |
|---|---|
| Linguagem | Python 3.12 |
| Framework | FastAPI |
| ORM | SQLAlchemy 2.x |
| Banco de Dados | SQLite (dev/produção Render Disk) |
| Validação | Pydantic v2 |
| HTTP Client | httpx (async-ready) |
| Criptografia | cryptography (PKCS#12, RSA, mTLS) |
| PDF | reportlab / weasyprint |
| Testes | pytest / unittest |

---

## 📡 Principais Endpoints

### Declarações e Carteira
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/declaracoes` | Listar declarações com filtros |
| `POST` | `/api/declaracoes` | Criar declaração |
| `PATCH` | `/api/declaracoes/{id}` | Atualizar status |
| `GET` | `/api/clientes` | Listar carteira de clientes |
| `GET` | `/api/declaracoes/dashboard-resumo` | Métricas do dashboard |

### Integrações Receita Federal (InfoSimples)
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/integracoes/rfb/diagnostico` | Diagnóstico fiscal por CPF |
| `POST` | `/api/malha/atualizar` | Atualizar malha fiscal |
| `POST` | `/api/restituicoes/atualizar` | Atualizar status de restituições |
| `POST` | `/api/mensagens-ecac/{cpf}/consultar` | Consultar e-CAC por CPF |

### Integração SERPRO
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/integracoes/serpro/config` | Ler configurações SERPRO |
| `PUT` | `/api/integracoes/serpro/config` | Salvar configurações |
| `POST` | `/api/integracoes/serpro/extrair-chave` | Extrair RSA do certificado PFX |
| `POST` | `/api/integracoes/serpro/integra-contador/token` | Autenticar via SAPI (mTLS) |
| `POST` | `/api/integracoes/serpro/consulta-renda` | Consultar renda do contribuinte |

> **Mock de desenvolvimento**: Token `06aef429-a981-3ec5-a1f8-71d38d86481e` retorna dados simulados sem acionar a API de produção.

### Contador e Certificado
| Método | Rota | Descrição |
|---|---|---|
| `GET/PUT` | `/api/integracoes/contador/config` | Perfil do contador |
| `POST` | `/api/integracoes/contador/certificado/upload` | Upload do PFX/P12 |
| `GET` | `/api/integracoes/contador/certificado/info` | Metadados do certificado |
| `POST` | `/api/integracoes/contador/testar-certificado` | Validar senha/integridade |

### Financeiro
| Método | Rota | Descrição |
|---|---|---|
| `GET/PUT` | `/api/integracoes/asaas/config` | Config Asaas |
| `POST` | `/api/integracoes/asaas/cobranca-cliente` | Gerar cobrança de honorários |
| `GET/PUT` | `/api/integracoes/conta-azul/config` | Config Conta Azul |
| `POST` | `/api/integracoes/conta-azul/configurar-code` | Trocar code OAuth por tokens |
| `POST` | `/api/darf/{id}/gerar` | Emitir DARF em PDF |

---

## 🚀 Executar Localmente

```bash
# Criar ambiente virtual
python -m venv venv
.\venv\Scripts\activate     # Windows
# source venv/bin/activate  # Linux/Mac

# Instalar dependências
pip install -r requirements.txt

# Iniciar servidor
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Swagger interativo: http://localhost:8000/docs
# ReDoc:             http://localhost:8000/redoc
```

---

## 🧪 Testes

```bash
python -m pytest tests/          # Todos
python -m unittest tests/test_serpro.py  # SERPRO específico
```

---

## ☁️ Deploy (Render)

1. **Web Service**: Python runtime, comando `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
2. **Persistent Disk**: montado em `/app/data/` — o SQLite (`irpf.db`) é salvo aqui
3. **Variáveis de ambiente:**

```env
CORS_ORIGINS=https://seu-frontend.vercel.app
DATABASE_URL=sqlite:////app/data/irpf.db
```

---

## 🔐 Segurança e LGPD

- Certificados A1 (PFX/P12) armazenados como Base64 em Key-Value store SQLite — **nunca** em texto plano no sistema de arquivos
- Chaves privadas RSA extraídas em memória via `cryptography` — arquivos temporários removidos automaticamente após uso
- Token de compartilhamento SERPRO requer consentimento explícito do contribuinte no Portal e-CAC
- CORS restrito à origem do frontend configurado

---

*MONITOR_IRPF Backend — Advanced Agentic Coding Team 2026*
