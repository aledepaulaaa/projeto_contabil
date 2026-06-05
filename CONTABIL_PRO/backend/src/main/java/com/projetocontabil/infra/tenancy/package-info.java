/**
 * Implementação de Multi-tenancy.
 * EmpresaLocatariaContext (ThreadLocal), EmpresaLocatariaIdentifierResolver (Hibernate),
 * EmpresaLocatariaFilter (Servlet — extrai EmpresaLocataria do header/JWT).
 */
package com.projetocontabil.infra.tenancy;

