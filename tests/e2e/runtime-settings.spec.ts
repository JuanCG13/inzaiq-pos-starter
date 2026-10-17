import { expect, test } from '@playwright/test';

let initialSettings: { version: number; acceptingOrders: boolean; notice: string } | undefined;
test.afterEach(async ({ request }) => {
  if (!initialSettings) return;
  const current = (await (await request.get('/api/admin/settings')).json()).data.settings;
  expect((await request.patch('/api/admin/settings', { data: { ...initialSettings, version: current.version } })).status()).toBe(200);
  initialSettings = undefined;
});

test('owner pause reaches an open register, prevents stock mutation and resumes live', async ({ page: owner, context, request }, testInfo) => {
  const errors: string[] = [];
  owner.on('pageerror', error => errors.push(error.message));
  const initial = (await (await request.get('/api/admin/settings')).json()).data.settings;
  initialSettings = initial;
  const product = (await (await request.get('/api/admin/products?search=DES-001')).json()).data.products.find((item: { sku: string }) => item.sku === 'DES-001');
  const cashier = await context.newPage();
  cashier.on('pageerror', error => errors.push(error.message));
  try {
    if (!initial.acceptingOrders) expect((await request.patch('/api/admin/settings', { data: { ...initial, acceptingOrders: true } })).status()).toBe(200);
    await owner.goto('/settings');
    const accepting = owner.getByRole('checkbox', { name: /Accept new transactions/ });
    await expect(accepting).toBeChecked();
    await cashier.goto('/');
    await expect(cashier.getByRole('button', { name: new RegExp(`^Add ${product.name},`) })).toBeEnabled();
    await cashier.getByLabel('Search products by name or SKU').fill(product.sku);
    await cashier.getByLabel('Search products by name or SKU').press('Enter');
    await expect(cashier.getByRole('button', { name: 'Charge sale', exact: true })).toBeEnabled();
    await accepting.uncheck();
    await owner.getByLabel('Business notice', { exact: true }).fill('Register paused QA');
    let saved = owner.waitForResponse(response => response.url().endsWith('/api/admin/settings') && response.request().method() === 'PATCH');
    await owner.getByRole('button', { name: 'Save settings', exact: true }).click();
    expect((await saved).status()).toBe(200);
    await cashier.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(cashier.getByText('Register paused QA', { exact: true })).toBeVisible();
    await cashier.getByRole('button', { name: 'Charge sale', exact: true }).click();
    let sale = cashier.waitForResponse(response => response.url().endsWith('/api/admin/orders') && response.request().method() === 'POST');
    await cashier.getByRole('dialog').getByRole('button', { name: 'Confirm payment', exact: true }).click();
    const denied = await sale;
    expect(denied.status()).toBe(409); expect((await denied.json()).error.code).toBe('ORDERS_PAUSED');
    await expect(cashier.getByRole('dialog').getByRole('alert')).toContainText('paused');
    expect((await (await request.get('/api/admin/products?search=DES-001')).json()).data.products.find((item: { id: string }) => item.id === product.id).stock).toBe(product.stock);
    await owner.screenshot({ path: testInfo.outputPath('pos-runtime-paused.png'), fullPage: true });
    await accepting.check();
    await owner.getByLabel('Business notice', { exact: true }).fill('Register resumed QA');
    saved = owner.waitForResponse(response => response.url().endsWith('/api/admin/settings') && response.request().method() === 'PATCH');
    await owner.getByRole('button', { name: 'Save settings', exact: true }).click();
    expect((await saved).status()).toBe(200);
    await cashier.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(cashier.getByText('Register resumed QA', { exact: true })).toBeVisible();
    await cashier.getByRole('dialog').getByRole('button', { name: 'Update products and review the total', exact: true }).click();
    await expect(cashier.getByRole('dialog')).toHaveCount(0);
    await cashier.getByRole('button', { name: 'Charge sale', exact: true }).click();
    sale = cashier.waitForResponse(response => response.url().endsWith('/api/admin/orders') && response.request().method() === 'POST');
    await cashier.getByRole('dialog').getByRole('button', { name: 'Confirm payment', exact: true }).click();
    expect((await sale).status()).toBe(201);
    await expect(cashier.getByRole('heading', { name: 'Sale recorded', exact: true })).toBeVisible();
    expect((await (await request.get('/api/admin/products?search=DES-001')).json()).data.products.find((item: { id: string }) => item.id === product.id).stock).toBe(product.stock - 1);
    expect(errors).toEqual([]);
  } finally {
    await cashier.close();
  }
});
