package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;
import java.util.List;

public interface SignatureGateway {
    record Signer(String name, String email, String phone) {}
    void createDocumentForSignature(EmpresaLocatariaId tid, String title, String url, List<Signer> signers);
}
