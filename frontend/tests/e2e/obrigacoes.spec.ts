import { test, expect } from '@playwright/test';
import { gerarCNPJ } from './utils';

test.describe('Fluxo de Obrigações Fiscais (Fase 6)', () => {

  test('Deve gerar obrigações automaticamente após conversão do Lead', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    const uniqueId = Date.now();
    const email = `contabil_${uniqueId}@test.com`;
    const cnpjValido = gerarCNPJ();

    await page.goto('/cadastro');
    await page.fill('input#nome', 'Empresa Teste SQL');
    await page.type('input#cnpj', cnpjValido);
    await page.fill('input#email', email);
    await page.fill('input#senha', 'pass1234');
    await page.click('button:has-text("Finalizar Cadastro Gratuito")');

    // 2. Espera redirecionamento para dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 20000 });
    await expect(page.locator('h1', { hasText: 'Painel Central' })).toBeVisible();
    
    // Pequena pausa para garantir carregamento da query e troca de tenant
    await page.waitForTimeout(3000);
    const tenantIdText = await page.locator('p:has-text("tenant:")').innerText();
    console.log('Dashboard Tenant ID:', tenantIdText);
    
    await expect(page.locator('text=Leads Recentes')).toBeVisible({ timeout: 15000 });

    // 3. Localiza o Lead recém criado na ListaLeads
    // Espera o nome da empresa aparecer na lista
    const leadRow = page.getByRole('row', { name: 'Empresa Teste SQL' }).first();
    await expect(leadRow).toBeVisible({ timeout: 20000 });

    const btnSync = leadRow.locator('button:has-text("Enviar p/ ERP")');
    await expect(btnSync).toBeVisible({ timeout: 10000 });
    
    // 4. Dispara sincronização e aguarda a resposta do backend
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/onboarding') && resp.status() === 200, { timeout: 30000 }),
      btnSync.click(),
    ]);

    // 5. Verifica se o status mudou para Conta Azul Sync
    await expect(leadRow.locator('text=Conta Azul Sync')).toBeVisible({ timeout: 15000 });

    // 5. Verifica se as obrigações (DAS e FGTS) apareceram na Agenda Tributária
    await expect(page.locator('text=Agenda Tributária')).toBeVisible();
    
    await expect(page.locator('text=DAS')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=FGTS')).toBeVisible({ timeout: 15000 });

    // Valida se os valores simulados no listener estão corretos
    await expect(page.locator('text=R$ 450,00')).toBeVisible();
    await expect(page.locator('text=R$ 120,00')).toBeVisible();
  });

  test('Deve exibir visualização simplificada em 320px (Mobile XS)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    
    await page.goto('/');
    await page.evaluate(() => {
       localStorage.setItem('token', 'fake-jwt-token');
       localStorage.setItem('tenantId', 'tenant-dev-mode');
    });
    
    await page.route('**/api/obrigacoes/pendentes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            tipo: 'DAS',
            regime: 'SIMPLES_NACIONAL',
            valor: 450.0,
            vencimento: '2026-04-20',
            status: 'PENDENTE',
            competencia: '03/2026'
          }
        ])
      });
    });

    await page.goto('/dashboard');
    
    await expect(page.locator('text=Exibindo apenas alertas críticos')).toBeVisible();
    
    await expect(page.locator('text=Vence em: 20/04/2026')).toBeVisible();
  });
});
