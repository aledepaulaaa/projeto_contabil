import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Fase 7: Gestão de Documentos e Uploads', () => {

  test('Deve realizar o upload de um PDF e visualizá-lo na grade', async ({ page }) => {
    // 1. Setup - Mock de Autenticação e Navegação
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('tenantId', 'tenant-dev-mode');
    });

    await page.goto('/dashboard');
    await expect(page.locator('h1', { hasText: 'Painel Central' })).toBeVisible();

    // 2. Cria um arquivo PDF temporário para o teste
    const tempFilePath = path.join(__dirname, 'guia_teste.pdf');
    fs.writeFileSync(tempFilePath, 'Conteúdo fictício de um PDF de teste');

    try {
      // 3. Interage com o UploadArea
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.click('text=clique aqui');
      const fileChooser = await fileChooserPromise;

      // 4. Dispara o upload e aguarda a resposta em paralelo
      await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/documentos/upload') && resp.status() === 200, { timeout: 30000 }),
        fileChooser.setFiles(tempFilePath)
      ]);

      // 5. Verifica se o documento apareceu na GradeDocumentos
      // Usamos .first() pois o nome do arquivo aparece no preview e na grade
      const docRow = page.getByRole('row', { name: 'guia_teste.pdf' }).first();
      await expect(docRow).toBeVisible({ timeout: 15000 });
      await expect(docRow.getByText('pdf', { exact: false }).last()).toBeVisible();

    } finally {
      // Cleanup do arquivo temporário
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });

  test('Deve exibir lista compacta em 320px (Mobile XS)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('tenantId', 'tenant-dev-mode');
    });

    // Mock da lista de documentos
    await page.route('**/api/documentos', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'doc-123',
            nomeOriginal: 'documento_mobile.pdf',
            tipo: 'application/pdf',
            tamanho: 102400,
            criadoEm: new Date().toISOString()
          }
        ])
      });
    });

    await page.goto('/dashboard');

    // Verifica item na grade compacta
    await expect(page.locator('text=documento_mobile.pdf')).toBeVisible();

    // Em mobile, os textos dos botões "Visualizar/Baixar" são ocultos (apenas ícones)
    const buttons = page.locator('button > svg.lucide-eye, button > svg.lucide-download');
    await expect(buttons).toHaveCount(2);
  });
});
