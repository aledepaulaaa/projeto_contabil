import { test, expect } from '@playwright/test';

test.describe('Fluxo de Login e Responsividade', () => {

  test('Deve exibir os elementos da tela de login perfeitamente', async ({ page }) => {
    await page.goto('/login');
    
    // Testa as presenças dos labels e campos Organisms
    await expect(page.locator('h1', { hasText: 'Início de Sessão' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Identificador de Acesso' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Sua Senha Mestra' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Acessar Gestão Inteligente' })).toBeVisible();
  });

  test('Deve tratar limite de taxa (429) via GlobalErrorStore', async ({ page }) => {
    // Intercepta a rota para forçar erro 429
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ message: "Too many requests" })
      });
    });

    await page.goto('/login');
    
    // Preenche
    await page.fill('input#identificador', 'usuario-teste');
    await page.fill('input#senha', 'senha123');
    
    // Submete
    await page.click('button:has-text("Acessar Gestão Inteligente")');

    // Valida toast
    await expect(page.locator('text=Muitas tentativas')).toBeVisible();
  });

  test('Deve realizar login com sucesso e ir para o Dashboard', async ({ page }) => {
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'jwt.token.mock', tenantId: 'tenant-teste' })
      });
    });

    await page.goto('/login');
    
    await page.fill('input#identificador', 'empresa');
    await page.fill('input#senha', '123456');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1', { hasText: 'Painel Central' })).toBeVisible();
  });
});
