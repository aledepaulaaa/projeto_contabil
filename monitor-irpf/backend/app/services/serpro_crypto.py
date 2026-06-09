import base64
import logging
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization

logger = logging.getLogger("serpro_crypto")

def decrypt_serpro_rsa(encrypted_base64: str, private_key_pem_base64: str) -> str:
    """
    Descriptografa uma string criptografada em Base64 usando a chave privada RSA fornecida (mimetiza o DecryptionUtil do contabil-pro).
    """
    if not encrypted_base64 or not encrypted_base64.strip():
        return ""
    
    # Se a chave não for fornecida ou for mockada, utiliza um fallback amigável em desenvolvimento
    if (not private_key_pem_base64 or 
        not private_key_pem_base64.strip() or 
        private_key_pem_base64 == "mock-private-key" or 
        "mock" in private_key_pem_base64.lower()):
        logger.warning("⚠️ Chave privada RSA não fornecida ou mockada. Usando fallback de decodificação Base64.")
        try:
            # Tenta decodificar de base64 como texto limpo se aplicável (caso venha de um mock amigável)
            decoded_bytes = base64.b64decode(encrypted_base64.strip())
            return decoded_bytes.decode("utf-8")
        except Exception:
            # Retorna um valor simulado para testes caso seja a cifra real mas sem chave
            return f"MockDecryptedValue: {encrypted_base64[:15]}..."

    try:
        # Limpeza de cabeçalhos PEM e quebras de linha caso a chave tenha sido colada de um arquivo .key/.pem
        cleaned_key = (
            private_key_pem_base64
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replace("-----BEGIN RSA PRIVATE KEY-----", "")
            .replace("-----END RSA PRIVATE KEY-----", "")
        )
        # Remove quaisquer espaços ou quebras de linha
        cleaned_key = "".join(cleaned_key.split())

        key_bytes = base64.b64decode(cleaned_key)
        
        # O backend salvou a chave extraída do PFX como PKCS#8 DER Base64 (extrair_chave_privada_pfx)
        # ou seja, DER codificado.
        try:
            private_key = serialization.load_der_private_key(key_bytes, password=None)
        except Exception:
            # Fallback para PEM se o usuário salvou uma chave PEM pura
            private_key = serialization.load_pem_private_key(key_bytes, password=None)

        encrypted_bytes = base64.b64decode(encrypted_base64.strip())
        decrypted_bytes = private_key.decrypt(
            encrypted_bytes,
            padding.PKCS1v15()  # Mapeamento do RSA/ECB/PKCS1Padding
        )
        return decrypted_bytes.decode("utf-8")
    except Exception as e:
        logger.error(f"❌ Erro crítico ao descriptografar dado via RSA/ECB/PKCS1Padding: {e}")
        return f"ErroDescriptografia ({type(e).__name__})"
