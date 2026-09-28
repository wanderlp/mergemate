import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import path from 'path';

let app: ElectronApplication;
let page: Page;
const pageErrors: string[] = [];

test.beforeAll(async () => {
  app = await electron.launch({
    args: [path.join(__dirname, '..', '..', 'out', 'main', 'index.js')],
    timeout: 30000,
  });
  page = await app.firstWindow();
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.waitForLoadState('domcontentloaded');
});

test.afterEach(() => {
  expect(pageErrors, `page errors: ${pageErrors.join('; ')}`).toEqual([]);
});

test.afterAll(async () => {
  // El diálogo "¿Cerrar comparación?" del renderer intercepta el evento
  // `close` y bloquea `app.close()` indefinidamente. Para evitar dejar la
  // app huérfana con un modal visible, destruimos las ventanas directamente
  // desde el main process sin disparar ese listener.
  try {
    await app.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows().forEach((win) => {
        win.removeAllListeners('close');
        win.destroy();
      });
    });
  } catch {
    // Las ventanas ya pueden estar cerradas (runs normales).
  }
});

test.describe('#13 Settings panel', () => {

  test('botón de engranaje en TitleBar navega a Settings', async () => {
    await page.getByRole('button', { name: /configuraci[oó]n|settings/i }).first().click();
    await page.waitForTimeout(500);
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('Settings tiene labels con htmlFor en los 6 controles', async () => {
    const ids = [
      'settings-theme',
      'settings-diff-algorithm',
      'settings-font-size',
      'settings-default-view-mode'
    ];
    for (const id of ids) {
      const control = page.locator(`#${id}`);
      const label = page.locator(`label[for="${id}"]`);
      await expect(control, `${id} control should exist`).toHaveCount(1);
      await expect(label, `${id} label should exist`).toHaveCount(1);
    }
    const toggleIds = ['settings-minimap', 'settings-ignore-whitespace'];
    for (const id of toggleIds) {
      const toggle = page.locator(`button#${id}`);
      const label = page.locator(`label[for="${id}"]`);
      await expect(toggle, `${id} toggle should exist`).toHaveCount(1);
      await expect(label, `${id} label should exist`).toHaveCount(1);
    }
  });

  test('botón Volver regresa a la vista principal', async () => {
    await page.getByRole('button', { name: /volver|back/i }).first().click();
    await page.waitForTimeout(500);
    const themeSelect = page.locator('#settings-theme');
    await expect(themeSelect).toHaveCount(0);
  });

  test('App no se desmonta al navegar a Settings y volver', async () => {
    const bodyBefore = await page.evaluate(() => document.body.innerHTML.length);
    await page.getByRole('button', { name: /configuraci[oó]n|settings/i }).first().click();
    await page.waitForTimeout(500);
    const bodyDuringSettings = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyDuringSettings).toBeGreaterThan(0);
    await page.getByRole('button', { name: /volver|back/i }).first().click();
    await page.waitForTimeout(500);
    const bodyAfterReturn = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyAfterReturn).toBeGreaterThan(0);
    expect(bodyAfterReturn).toBe(bodyBefore);
  });
});

test.describe('#14 Light theme', () => {
  test('toggle Sun/Moon cambia data-theme en <html>', async () => {
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await page.locator('button[aria-pressed]').first().click();
    await page.waitForTimeout(200);
    const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(newTheme).not.toBe(initialTheme);
  });
});
