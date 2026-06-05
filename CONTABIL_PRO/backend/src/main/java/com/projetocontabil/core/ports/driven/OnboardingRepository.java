package com.projetocontabil.core.ports.driven;

import com.projetocontabil.core.domain.onboarding.model.Onboarding;
import com.projetocontabil.core.domain.empresalocataria.EmpresaLocatariaId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OnboardingRepository {
    Onboarding save(Onboarding onboarding);
    Optional<Onboarding> findById(UUID id);
    Optional<Onboarding> findByLeadId(UUID leadId);
    List<Onboarding> findAllByEmpresaLocatariaId(EmpresaLocatariaId empresaId);
    void deleteById(UUID id);
}
