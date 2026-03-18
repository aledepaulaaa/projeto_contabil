import { test, expect } from '@playwright/test';

test.describe('Fase 8: Relatórios Gerenciais & Exportação PDF', () => {

  test('Deve exportar relatório mensal em PDF com sucesso', async ({ page }) => {
    // 1. Setup - Mock de Autenticação
    await page.goto('/');
    await page.evaluate(() => {
       localStorage.setItem('token', 'fake-jwt-token');
       localStorage.setItem('tenantId', 'tenant-dev-mode');
    });
    
    await page.goto('/dashboard');
    await expect(page.locator('h1', { hasText: 'Painel Central' })).toBeVisible();

    // 2. Mock do Endpoint de Relatório (para evitar dependência de PDF real em teste de UI)
    await page.route('**/api/relatorios/mensal*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('PDF_DUMMY_CONTENT'),
        headers: {
          'Content-Disposition': 'attachment; filename=relatorio_03_2026.pdf'
        }
      });
    });

    // 3. Interação com AreaRelatorios
    await expect(page.getByText('Relatórios Mensais')).toBeVisible();

    // Seleciona Março (3) e 2026
    await page.locator('select').first().selectOption('3'); 
    await page.locator('select').last().selectOption('2026');

    // 4. Dispara Exportação e Aguarda Download
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
    
    const exportButton = page.getByRole('button', { name: /Exportar PDF/i });
    await expect(exportButton).toBeVisible();
    await exportButton.click();
    
    const download = await downloadPromise;

    // 5. Validações
    expect(download.suggestedFilename()).toBe('relatorio_03_2026.pdf');
    expect(download.url()).toContain('blob:'); // Valida que é um download via Blob (Axios)
  });

  test('Deve ser responsivo em 320px (Mobile XS)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    
    await page.goto('/');
    await page.evaluate(() => {
       localStorage.setItem('token', 'fake-jwt-token');
       localStorage.setItem('tenantId', 'tenant-dev-mode');
    });

    await page.goto('/dashboard');

    // Verifica se os seletores e o botão de exportar estão empilhados ou visíveis
    await expect(page.locator('text=Relatórios Mensais')).toBeVisible();
    
    const botoesExportar = page.locator('button:has-text("Exportar PDF")');
    await expect(botoesExportar).toBeVisible();
    
    // Verifica se os campos de select mantêm usabilidade (não quebram layout)
    const selects = page.locator('select');
    await expect(selects).toHaveCount(2);
  });
});
