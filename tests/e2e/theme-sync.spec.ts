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
  // `close` y bloquea `app.close()` indefinidamente. Destruimos las ventanas
  // directamente desde el main process sin disparar ese listener.
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

test.describe('#27 Sincronización Monaco ↔ SettingsContext', () => {
  test('cambio de tema en Settings actualiza Monaco en un DiffViewer abierto sin recargar el tab', async () => {
    // Paso 1: click "Blank Comparison" en startupWindow → IPC que cierra
    // startupWindow y abre mainWindow con un tab Monaco vacío.
    await page
      .getByRole('button', {
        name: /comparaci[oó]n en blanco|editor libre|blank comparison|leerer vergleich|comparaison vierge|comparação em branco/i
      })
      .first()
      .click();

    // Paso 2: re-bind de `page` + listener de pageerror a la nueva ventana
    // (la startupWindow se cerró y se creó una nueva mainWindow).
    page = await app.firstWindow();
    page.on('pageerror', (e) => pageErrors.push(e.message));
    await page.waitForLoadState('domcontentloaded');

    // Paso 3: el theme de Monaco se refleja en la clase CSS del lado del
    // DiffEditor (termina en `vs` o `vs-dark`). `data-mode-id` es el
    // LENGUAJE del archivo y `.monaco-editor-background` siempre es blanco,
    // por lo que no son buenos indicadores.
    const editorOriginal = page.locator('.monaco-editor.original-in-monaco-diff-editor');
    await editorOriginal.waitFor({ state: 'visible', timeout: 15000 });

    // Paso 4: abrir Settings (cubre ES/EN/DE/FR/PT).
    await page
      .getByRole('button', {
        name: /configuraci[oó]n|settings|einstellungen|paramètres|configurações/i
      })
      .first()
      .click();
    const themeSelect = page.locator('#settings-theme');
    await themeSelect.waitFor({ state: 'visible' });

    // Paso 5: cambiar al theme OPUESTO al actual para no acoplarnos al valor
    // que `electron-store` tenga persistido de runs anteriores.
    const currentTheme = await themeSelect.evaluate((el) => (el as HTMLSelectElement).value);
    const targetTheme: 'light' | 'dark' = currentTheme === 'light' ? 'dark' : 'light';
    await themeSelect.selectOption(targetTheme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', targetTheme);

    // Paso 6: volver a la vista principal (cubre ES/EN/DE/FR/PT).
    await page
      .getByRole('button', { name: /volver|back|zur[uü]ck|retour|voltar/i })
      .first()
      .click();

    // Paso 7: Monaco refleja el nuevo theme sin recargar el tab.
    await expect(editorOriginal).toBeVisible();
    const classAfter = (await editorOriginal.getAttribute('class')) ?? '';
    const monacoThemeClass = classAfter.match(/\bvs-dark\b|\bvs\b/g)?.pop();
    expect(monacoThemeClass, `clase de Monaco: ${classAfter}`).toBe(
      targetTheme === 'light' ? 'vs' : 'vs-dark'
    );
  });
});