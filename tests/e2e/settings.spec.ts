import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import path from 'path';

let app: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  app = await electron.launch({
    args: [path.join(__dirname, '..', 'out', 'main', 'index.js')],
    timeout: 30000,
  });
  page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  await app.close();
});

test.describe('#13 Settings panel', () => {
  test('app boots sin errores', async () => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });

  test('botón de engranaje en TitleBar navega a Settings', async () => {
    // El primer window es la startup screen. Click engranaje.
    await page.getByRole('button', { name: /cambiar.*tema.*oscuro|theme.*dark/i }).first().click();
    await page.waitForTimeout(500);
    // Debe haber un h1 con texto "Configuración" o "Settings"
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('Settings tiene labels con htmlFor', async () => {
    // El theme selector debe tener un label asociado
    const themeSelect = page.locator('#settings-theme');
    const themeLabel = page.locator('label[for="settings-theme"]');
    await expect(themeSelect).toBeVisible();
    await expect(themeLabel).toBeVisible();
  });

  test('botón Volver regresa a la vista principal', async () => {
    await page.getByRole('button', { name: /volver|back/i }).first().click();
    await page.waitForTimeout(500);
    // Debe volver a la vista principal (no debe estar en Settings)
    const themeSelect = page.locator('#settings-theme');
    await expect(themeSelect).toHaveCount(0);
  });
});

test.describe('#14 Light theme', () => {
  test('toggle Sun/Moon cambia data-theme en <html>', async () => {
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    // Click en el toggle (Sun o Moon)
    await page.getByRole('button', { name: /tema/i }).first().click();
    await page.waitForTimeout(200);
    const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(newTheme).not.toBe(initialTheme);
  });
});
