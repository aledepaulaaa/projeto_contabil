package com.projetocontabil.infra.integrations.serpro;

import lombok.extern.slf4j.Slf4j;

import javax.crypto.Cipher;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;

/**
 * Utilitário de criptografia assimétrica RSA para decifrar os valores retornados pela API de Consulta Renda.
 */
@Slf4j
public class DecryptionUtil {

    /**
     * Descriptografa uma string criptografada em Base64 usando a chave privada RSA fornecida.
     */
    public static String decryptRsa(String encryptedBase64, String privateKeyPemBase64) {
        if (encryptedBase64 == null || encryptedBase64.isBlank()) {
            return "";
        }
        
        // Se a chave não for fornecida ou for mock-private-key, utiliza um fallback amigável em desenvolvimento
        if (privateKeyPemBase64 == null || privateKeyPemBase64.isBlank() || "mock-private-key".equals(privateKeyPemBase64)) {
            log.warn("⚠️ [DecryptionUtil] Chave privada RSA não fornecida ou mockada. Usando fallback de decodificação Base64.");
            try {
                // Tenta decodificar de base64 como texto limpo se aplicável (caso venha de um mock amigável)
                byte[] decodedBytes = Base64.getDecoder().decode(encryptedBase64.trim());
                return new String(decodedBytes);
            } catch (Exception e) {
                // Retorna um valor simulado para testes caso seja a cifra real mas sem chave
                return "MockDecryptedValue: " + (encryptedBase64.length() > 15 ? encryptedBase64.substring(0, 15) + "..." : encryptedBase64);
            }
        }

        try {
            // Limpeza de cabeçalhos PEM e quebras de linha caso a chave tenha sido colada diretamente de um arquivo .key/.pem
            String cleanedKey = privateKeyPemBase64
                    .replace("-----BEGIN PRIVATE KEY-----", "")
                    .replace("-----END PRIVATE KEY-----", "")
                    .replaceAll("\\s+", "");

            byte[] keyBytes = Base64.getDecoder().decode(cleanedKey);
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
            KeyFactory kf = KeyFactory.getInstance("RSA");
            PrivateKey privateKey = kf.generatePrivate(spec);

            Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
            cipher.init(Cipher.DECRYPT_MODE, privateKey);

            byte[] encryptedBytes = Base64.getDecoder().decode(encryptedBase64.trim());
            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);

            return new String(decryptedBytes);
        } catch (Exception e) {
            log.error("❌ [DecryptionUtil] Erro crítico ao descriptografar dado via RSA/ECB/PKCS1Padding: {}", e.getMessage());
            // Fallback em caso de erro para evitar quebras em runtime
            return "ErroDescriptografia (" + e.getClass().getSimpleName() + ")";
        }
    }
}
