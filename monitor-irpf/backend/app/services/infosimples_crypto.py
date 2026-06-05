"""Cifra compatível com o gem Ruby «infosimples-data» (SymmetricEncryption).

AES-256-CBC, chave = SHA-256(UTF-8 dos 32 primeiros caracteres da string de configuração),
IV de 16 bytes zero, padding PKCS7, saída Base64 (sem quebras de linha).
Documentação de referência: https://github.com/infosimples/infosimples-data
"""

from __future__ import annotations

import base64
import hashlib

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes


def _base64_ruby_encode64(raw: bytes) -> str:
    """Igual ao Ruby «Base64.encode64»: linhas de 60 caracteres e newline final."""
    s = base64.b64encode(raw).decode("ascii")
    lines = [s[i : i + 60] for i in range(0, len(s), 60)]
    return "\n".join(lines) + "\n"


def _aes_key_from_material(material: str) -> bytes:
    if len(material) < 32:
        raise ValueError("O material de cifra InfoSimples deve ter pelo menos 32 caracteres.")
    key_material = material[:32].encode("utf-8")
    return hashlib.sha256(key_material).digest()


def encrypt_infosimples_aes_cbc(
    plaintext: str,
    chave_criptografia: str,
    *,
    base64_multiline: bool = True,
) -> str:
    aes_key = _aes_key_from_material(chave_criptografia)
    iv = b"\x00" * 16
    padder = padding.PKCS7(128).padder()
    data = plaintext.encode("utf-8")
    padded = padder.update(data) + padder.finalize()
    cipher = Cipher(algorithms.AES(aes_key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    ct = encryptor.update(padded) + encryptor.finalize()
    if base64_multiline:
        return _base64_ruby_encode64(ct)
    return base64.b64encode(ct).decode("ascii")


def decrypt_infosimples_aes_cbc(
    ciphertext_b64: str,
    chave_criptografia: str,
    *,
    base64_multiline: bool = True,
) -> str:
    """Inverso de encrypt (Base64 Ruby ou uma linha). Útil para testes de paridade com o gem infosimples-data."""
    aes_key = _aes_key_from_material(chave_criptografia)
    iv = b"\x00" * 16
    raw_b64 = ciphertext_b64.replace("\n", "").replace("\r", "") if base64_multiline else ciphertext_b64
    ct = base64.b64decode(raw_b64, validate=False)
    cipher = Cipher(algorithms.AES(aes_key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    padded = decryptor.update(ct) + decryptor.finalize()
    unpadder = padding.PKCS7(128).unpadder()
    data = unpadder.update(padded) + unpadder.finalize()
    return data.decode("utf-8")
