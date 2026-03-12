/**
 * Implementação de Multi-tenancy.
 * TenantContext (ThreadLocal), TenantIdentifierResolver (Hibernate),
 * TenantFilter (Servlet — extrai tenant do header/JWT).
 */
package com.projetocontabil.infra.tenancy;
