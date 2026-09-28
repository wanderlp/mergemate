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
  // Bypass del diálogo "¿Cerrar comparación?" del renderer — destruimos las
  // ventanas desde el main process sin disparar el listener de `close`.
  try {
    await app.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows().forEach((win) => {
        win.removeAllListeners('close');
        win.destroy();
      });
    });
  } catch {
    // Las ventanas ya pueden estar cerradas.
  }
});

test.describe('#30 Navegacion Settings con origen', () => {
  test('Volver desde Settings (abierto desde StartupScreen) regresa a la lista de recientes, no al editor', async () => {
    // Paso 1: la app arranca en startupWindow con hash=#startup. Verificar.
    expect(await page.evaluate(() => window.location.hash)).toBe('#startup');

    // Paso 2: click en el engranaje de la TitleBar de StartupScreen. El
    // hash debe pasar a "settings?from=startup".
    await page
      .getByRole('button', { name: /configuraci[oó]n|settings|einstellungen|paramètres|configurações/i })
      .first()
      .click();
    await expect(page.locator('#settings-theme')).toBeVisible();
    expect(await page.evaluate(() => window.location.hash)).toBe('#settings?from=startup');

    // Paso 3: click en Volver. Debe navegar al origen guardado, no al editor.
    await page
      .getByRole('button', { name: /volver|back|zur[uü]ck|retour|voltar/i })
      .first()
      .click();
    await page.waitForTimeout(300);

    // Paso 4: verificar que volvimos a StartupScreen, NO a App.
    expect(await page.evaluate(() => window.location.hash)).toBe('#startup');
    // Senales unicas de StartupScreen (no estan en App.tsx):
    // - El boton "Blank Comparison" / "Comparacion en blanco" / etc.
    // - No hay ningun editor Monaco abierto (App mostraria DiffViewer si
    //   hubiera tabs, o el Welcome screen si no los hay; en cualquier caso
    //   Monaco solo se monta en el DiffViewer).
    const blankButton = page
      .getByRole('button', {
        name: /comparaci[oó]n en blanco|editor libre|blank comparison|leerer vergleich|comparaison vierge|comparação em branco/i
      })
      .first();
    await expect(blankButton).toBeVisible();
    expect(await page.locator('.monaco-editor').count()).toBe(0);
  });
});