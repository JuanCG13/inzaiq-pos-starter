import { expect, test, type Page } from '@playwright/test';

const switcher = (page: Page) => page.getByTestId('language-switcher');
async function telemetry(page: Page) {
  await page.evaluate(() => {
    const events: Record<string, unknown>[] = [];
    (window as unknown as { __events: typeof events }).__events = events;
    window.addEventListener('app:telemetry', event => events.push((event as CustomEvent).detail));
  });
  return () => page.evaluate(() => (window as unknown as { __events: Record<string, unknown>[] }).__events.filter(event => event['event.name'] === 'ui.language.changed'));
}

test('English and USD are the default and the interface switches to Spanish without a reload', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Ready to sell' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Add Ground coffee 1 lb, \$12\.50/ })).toBeVisible();
  await expect(switcher(page)).toHaveValue('en');
  await expect(switcher(page).locator('option')).toHaveText(['English', 'Español']);
  const language = await telemetry(page);

  // Switching language re-renders text only: it must not refetch business data or reset the session state.
  const apiCalls: string[] = [];
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiCalls.push(request.url()); });
  await page.getByLabel('Search products by name or SKU').fill('rice');
  await switcher(page).selectOption('es');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { name: 'Todo listo para vender' })).toBeVisible();
  await expect(page.getByLabel('Buscar producto por nombre o SKU')).toHaveValue('rice');
  expect(apiCalls).toEqual([]);
  await expect(page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Inventario' })).toBeVisible();
  // Catalog data belongs to the business and is not translated; prices follow the language's number format.
  await expect(page.getByRole('button', { name: /^Agregar Long-grain rice 2 lb, USD\s4\.25/ })).toBeVisible();
  expect((await context.cookies()).find(cookie => cookie.name === 'NEXT_LOCALE')).toMatchObject({ value: 'es', sameSite: 'Lax', httpOnly: false });
  expect(await language()).toHaveLength(1);

  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Inventario' }).click();
  await expect(page).toHaveTitle(/^Inventario · /);
  await expect(page.getByRole('heading', { name: 'Inventario' })).toBeVisible();
  await page.reload();
  await expect(switcher(page)).toHaveValue('es');
  await expect(page.getByLabel('Buscar inventario')).toBeVisible();

  await switcher(page).selectOption('en');
  await expect(page.getByLabel('Search inventory')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('first visit follows the browser language and a bad cookie falls back to the installation default', async ({ browser }) => {
  const spanish = await browser.newContext({ locale: 'es-PY' });
  const first = await spanish.newPage();
  await first.goto('/');
  await expect(first.locator('html')).toHaveAttribute('lang', 'es');
  await expect(first.getByRole('heading', { name: 'Todo listo para vender' })).toBeVisible();
  await spanish.close();

  const hostile = await browser.newContext({ locale: 'en-US' });
  await hostile.addCookies([{ name: 'NEXT_LOCALE', value: '../../etc/passwd', url: 'http://localhost:3001' }]);
  const page = await hostile.newPage();
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await hostile.close();
});

test('standalone and error screens use the chosen language', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en-US' });
  const page = await context.newPage();
  await page.goto('/sign-in');
  await expect(page.getByRole('heading', { name: 'Everything, in one place.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  await switcher(page).selectOption('es');
  await expect(page.getByRole('heading', { name: 'Todo, en un lugar.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  const missing = await page.goto('/this-page-does-not-exist');
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Esta página no está acá' })).toBeVisible();
  await context.clearCookies();
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { name: "This page isn't here" })).toBeVisible();
  await context.close();
});

test('the product form offers the installation currency first and every price is shown in it', async ({ page }) => {
  await page.goto('/inventory');
  await page.getByRole('button', { name: 'New product', exact: true }).click();
  const options = await page.getByRole('dialog').getByLabel('Currency').locator('option').allTextContents();
  expect(options[0]).toBe('USD');
  expect(options).toEqual(expect.arrayContaining(['EUR', 'PYG']));
  await expect(page.getByRole('dialog').getByLabel('Currency')).toHaveValue('USD');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'DES-001' })).toContainText('$12.50');
  await page.goto('/settings');
  await expect(page.getByText('Default currency')).toBeVisible();
  await expect(page.locator('dd', { hasText: /^USD$/ })).toBeVisible();
});
