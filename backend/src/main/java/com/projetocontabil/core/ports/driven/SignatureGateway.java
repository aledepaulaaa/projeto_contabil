package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import java.util.List;
import java.util.UUID;

public interface SignatureGateway {
    record Signer(String name, String email, String phone) {}

    /**
     * Cria um documento OneClick (Clickwrap) na plataforma de assinatura.
     */
    String createDocumentOneClick(UUID contratoId, EmpresaLocatariaId tid, String title, String base64Content, List<Signer> signers);

    /**
     * @deprecated Use createDocumentOneClick for modern flows.
     */
    @Deprecated
    String createDocumentForSignature(UUID contratoId, EmpresaLocatariaId tid, String title, String urlOrTemplate, List<Signer> signers);
}
