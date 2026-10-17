import { test, expect, type Page } from '@playwright/test';

function observeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && (!message.location().url || message.location().url.startsWith('http://localhost:3001'))) errors.push(message.text());
  });
  return errors;
}
async function noHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth, width: document.documentElement.scrollWidth,
    overflowing: Array.from(document.querySelectorAll('body *')).filter(element => {
      const box = element.getBoundingClientRect();
      return box.width > window.innerWidth && !element.closest('.table-scroll');
    }).map(element => ({ element: element.tagName, className: element.className, width: element.getBoundingClientRect().width })).slice(0, 12),
  }));
  expect(dimensions.width, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test('create product, adjust inventory, sell by SKU and recover persisted receipt', async ({ page, request }, testInfo) => {
  const errors = observeErrors(page);
  const suffix = Date.now().toString(36);
  const name = `QA product ${suffix}`;
  const sku = `QA-${suffix}`;
  await page.goto('/');
  await expect(page.getByLabel('Search products by name or SKU')).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('pos-desktop.png'), fullPage: true });
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Inventory' }).click();
  await page.getByRole('button', { name: 'New product', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Product name').fill(name);
  await dialog.getByLabel('SKU / barcode').fill(sku);
  await dialog.getByLabel('Category', { exact: true }).fill('Testing');
  await dialog.getByLabel('Sale price').fill('125');
  await dialog.getByLabel('Initial stock').fill('2');
  const creation = page.waitForResponse(response => response.url().endsWith('/api/admin/products') && response.request().method() === 'POST');
  await dialog.getByRole('button', { name: 'Create product' }).click();
  const created = await creation;
  expect(created.status()).toBe(201);
  const product = (await created.json()).data.product;
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Search inventory').fill(sku);
  await page.getByRole('button', { name: `Adjust stock for ${name}`, exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Quantity', { exact: true }).fill('3');
  await dialog.getByLabel('Reason for adjustment').fill('QA test receipt');
  const adjustment = page.waitForResponse(response => response.url().endsWith('/api/admin/inventory') && response.request().method() === 'POST');
  await dialog.getByRole('button', { name: 'Confirm adjustment' }).click();
  expect((await adjustment).status()).toBe(200);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('row').filter({ hasText: sku }).locator('.stock-number')).toHaveText('5');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Point of sale' }).click();
  await page.getByLabel('Search products by name or SKU').fill(sku);
  await page.getByLabel('Search products by name or SKU').press('Enter');
  await expect(page.getByRole('button', { name: 'Charge sale', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Charge sale', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Cash received · USD').fill('200');
  await expect(dialog.locator('.change-due')).toContainText('$75.00');
  const sale = page.waitForResponse(response => response.url().endsWith('/api/admin/orders') && response.request().method() === 'POST');
  await dialog.getByRole('button', { name: 'Confirm payment', exact: true }).click();
  const saved = await sale;
  expect(saved.status()).toBe(201);
  const order = (await saved.json()).data.order;
  expect(order.status).toBe('completed');
  expect(order.totalMinor).toBe(12500);
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Sale recorded' })).toBeVisible();
  await expect(page.getByRole('dialog').getByText('INTERNAL RECEIPT · NOT A TAX INVOICE')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('pos-receipt-desktop.png'), fullPage: true });
  await page.getByRole('dialog').getByRole('button', { name: 'New sale', exact: true }).click();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Sales', exact: true }).click();
  await page.getByLabel('Search sales by reference or product').fill(order.id.slice(-10));
  await page.getByRole('button', { name: `View sale ${order.id.slice(-10)}`, exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Sale details' })).toBeVisible();
  await expect(page.getByRole('dialog').getByText(`1 × ${name}`, { exact: false })).toBeVisible();
  await page.reload();
  const current = await (await request.get(`/api/admin/products?search=${encodeURIComponent(sku)}`)).json();
  expect(current.data.products.find((item: { id: string }) => item.id === product.id).stock).toBe(4);
  const audit = await (await request.get('/api/admin/audit')).json();
  expect(audit.data.events.some((entry: { action: string; resourceId: string }) => entry.action === 'stock.adjusted' && entry.resourceId === product.id)).toBe(true);
  await noHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('mobile POS and inventory keep navigation and checkout controls reachable', async ({ page }, testInfo) => {
  const errors = observeErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByLabel('Search products by name or SKU')).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('pos-mobile.png'), fullPage: true });
  await page.getByLabel('Search products by name or SKU').fill('DES-001');
  await page.getByLabel('Search products by name or SKU').press('Enter');
  await page.getByRole('button', { name: 'Charge sale', exact: true }).click();
  await expect(page.getByRole('dialog').getByLabel('Cash received · USD')).toBeVisible();
  await noHorizontalOverflow(page);
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Inventory' }).click();
  await expect(page.getByLabel('Search inventory')).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('pos-inventory-mobile.png'), fullPage: true });
  expect(errors).toEqual([]);
});
