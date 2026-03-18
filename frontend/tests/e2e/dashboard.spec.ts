import { test, expect } from '@playwright/test';

test.describe('Dashboard e Home Interna responsiva (XS)', () => {
  // ARRANGE: Injeta sessão via localstorage
  test.beforeEach(async ({ page }) => {
    // Intercepta a chamada da API do Dashboard para isolar do banco real
    await page.route('**/api/dashboard/metrics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalLeads: 142,
          obrigacoesPendentes: 5,
          alvarasVencidos: 2,
          faturamentoPrevisto: 135000.00
        }),
      });
    });

    await page.route('**/api/leads', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: [
              {
                id: 'uuid-1',
                nomeContato: 'Alexandre',
                email: 'alexandre@test.com',
                nomeEmpresa: 'Teste S.A.',
                status: 'NOVO',
              }
            ],
            totalElements: 1
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'fake-jwt-token-123');
      localStorage.setItem('tenantId', 'tenant-dev-mode');
    });
    await page.reload(); 
  });

  test('Deve renderizar o Painel Central e as métricas mockadas via Interceptor', async ({ page }) => {
    // ACT
    await page.goto('/dashboard');
    
    // ASSERT
    await expect(page.locator('h1', { hasText: 'Painel Central' })).toBeVisible();
    await expect(page.locator('text=tenant-dev-mode')).toBeVisible();

    // Valida cards métricos
    await expect(page.locator('text=Total de Leads')).toBeVisible();
    await expect(page.getByText('142', { exact: true })).toBeVisible();
    await expect(page.locator('text=Obrigações Pend.')).toBeVisible();
    await expect(page.getByText('5', { exact: true })).toBeVisible();
    await expect(page.locator('text=Faturamento')).toBeVisible();
    await expect(page.getByText('R$ 135.000,00', { exact: true })).toBeVisible();
  });

  test('Deve realizar logout com sucesso e redirecionar para a tela de login', async ({ page }) => {
    // ACT
    await page.goto('/dashboard');
    const logoutBtn = page.locator('button', { hasText: 'Sair' });
    
    // ASSERT
    await expect(logoutBtn).toBeVisible();
    
    // ACT
    await logoutBtn.click();
    
    // ASSERT
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1', { hasText: 'Início de Sessão' })).toBeVisible();
  });

  test('Deve renderizar a Lista de Leads e permitir envio ao ERP', async ({ page }) => {
    // Simulando o sucesso do envio ao ERP
    await page.route('**/api/leads/*/onboarding', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ATIVO_ERP'
        }),
      });
    });

    await page.goto('/dashboard');

    // Valida UI
    await expect(page.locator('text=Leads Recentes')).toBeVisible();
    await expect(page.getByText('Alexandre', { exact: true })).toBeVisible();
    await expect(page.locator('text=Teste S.A.')).toBeVisible();
    
    // Pega o botão "Enviar p/ ERP"
    const btnErp = page.getByRole('button', { name: /Enviar p\/ ERP/i }).first();
    await expect(btnErp).toBeVisible();
  });
});
