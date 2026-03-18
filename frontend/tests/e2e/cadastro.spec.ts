import { test, expect } from '@playwright/test';

test.describe('Fluxo de Cadastro (Onboarding)', () => {

  test('Deve renderizar os campos de cadastro perfeitamente e permitir navegação de volta ao login', async ({ page }) => {
    await page.goto('/cadastro');
    
    await expect(page.locator('h1', { hasText: 'Criar Nova Conta' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Nome Completo / Empresa' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'CNPJ / CPF' })).toBeVisible();
    
    // Testa link de volta pro login
    await page.click('text=Faça login aqui');
    await expect(page).toHaveURL(/.*login/);
  });

  test('Deve realizar cadastro com sucesso e redirecionar para o Dashboard', async ({ page }) => {
    await page.goto('/cadastro');
    
    await page.fill('input#nome', 'Alexandre de Paula');
    // Utilizando um CNPJ válido para passar pela validação real do backend (Validador rigoroso do VO CNPJ)
    await page.type('input#cnpj', '33000167000101');
    await expect(page.locator('input#cnpj')).toHaveValue('33.000.167/0001-01');
    
    const uniqueEmail = `alexandre_${Date.now()}@test.com`;
    await page.fill('input#email', uniqueEmail);
    await page.fill('input#senha', 'password123');
    
    const responsePromise = page.waitForResponse('**/api/leads');
    await page.click('button:has-text("Finalizar Cadastro Gratuito")');
    const response = await responsePromise;
    console.log('Response status:', response.status());
    try {
      console.log('Response body:', await response.json());
    } catch (e) {
      console.log('Could not parse response JSON');
    }

    // Sucesso - redireciona e exibe Painel Central (fluxo real persistido no DB)
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1', { hasText: 'Painel Central' })).toBeVisible();
  });

  test('Deve exibir erro global se a API de leads falhar', async ({ page }) => {
    await page.route('**/api/leads', route => {
      route.fulfill({ status: 400 });
    });

    await page.goto('/cadastro');
    
    await page.fill('input#nome', 'Erro Teste');
    await page.fill('input#cnpj', '000');
    await page.fill('input#email', 'erro@test.com');
    await page.fill('input#senha', '123');
    
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Erro ao realizar cadastro')).toBeVisible();
  });
});
