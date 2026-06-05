"""Extract API path fragments from frontend/dist (minified code uses string concat)."""
import pathlib
import re

root = pathlib.Path(__file__).resolve().parents[1] / "frontend" / "dist" / "assets"
main = root / "index-CtNBlEi-.js"
text = main.read_text(encoding="utf-8", errors="ignore")

# Literal "/something" after base /api
for m in re.findall(r"/api(/[a-zA-Z0-9_./-]+)", text):
    print("/api" + m)

# Concat style: oe+"monitor/foo" or oe+`/x`
for m in re.findall(r'\+[`"\']([/a-zA-Z0-9_-]+)[`"\']', text):
    if m.startswith("/") and "api" not in m.lower():
        pass  # noise

# Look for `oe+` patterns near monitor, declaracoes, etc.
keywords = [
    "monitor",
    "declar",
    "usuario",
    "user",
    "sync",
    "insight",
    "integr",
    "kv",
    "cobr",
    "client",
    "procur",
    "dashboard",
    "asaas",
    "serpro",
]
for kw in keywords:
    idx = 0
    while True:
        i = text.lower().find(kw, idx)
        if i < 0:
            break
        frag = text[max(0, i - 120) : i + len(kw) + 80]
        if "/api" in frag or "api/" in frag or "fetch" in frag or "oe+" in frag:
            print("---", kw, "---")
            print(frag.replace("\n", " ")[:400])
        idx = i + len(kw)
