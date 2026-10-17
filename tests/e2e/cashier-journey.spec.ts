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
  const name = `Producto QA ${suffix}`;
  const sku = `QA-${suffix}`;
  await page.goto('/');
  await expect(page.getByLabel('Buscar producto por nombre o SKU')).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('pos-desktop.png'), fullPage: true });
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Inventario' }).click();
  await page.getByRole('button', { name: 'Nuevo producto', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nombre del producto').fill(name);
  await dialog.getByLabel('SKU / código de barras').fill(sku);
  await dialog.getByLabel('Categoría', { exact: true }).fill('Pruebas');
  await dialog.getByLabel('Precio de venta').fill('12500');
  await dialog.getByLabel('Existencias iniciales').fill('2');
  const creation = page.waitForResponse(response => response.url().endsWith('/api/admin/products') && response.request().method() === 'POST');
  await dialog.getByRole('button', { name: 'Crear producto' }).click();
  const created = await creation;
  expect(created.status()).toBe(201);
  const product = (await created.json()).data.product;
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Buscar inventario').fill(sku);
  await page.getByRole('button', { name: `Ajustar stock de ${name}`, exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Cantidad', { exact: true }).fill('3');
  await dialog.getByLabel('Motivo del ajuste').fill('Recepción de prueba QA');
  const adjustment = page.waitForResponse(response => response.url().endsWith('/api/admin/inventory') && response.request().method() === 'POST');
  await dialog.getByRole('button', { name: 'Confirmar ajuste' }).click();
  expect((await adjustment).status()).toBe(200);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('row').filter({ hasText: sku }).locator('.stock-number')).toHaveText('5');
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Punto de venta' }).click();
  await page.getByLabel('Buscar producto por nombre o SKU').fill(sku);
  await page.getByLabel('Buscar producto por nombre o SKU').press('Enter');
  await expect(page.getByRole('button', { name: 'Cobrar venta', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Cobrar venta', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Dinero recibido · PYG').fill('20000');
  await expect(dialog.locator('.change-due')).toContainText('7.500');
  const sale = page.waitForResponse(response => response.url().endsWith('/api/admin/orders') && response.request().method() === 'POST');
  await dialog.getByRole('button', { name: 'Confirmar cobro', exact: true }).click();
  const saved = await sale;
  expect(saved.status()).toBe(201);
  const order = (await saved.json()).data.order;
  expect(order.status).toBe('completed');
  expect(order.totalMinor).toBe(12500);
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Venta registrada' })).toBeVisible();
  await expect(page.getByRole('dialog').getByText('COMPROBANTE INTERNO · NO FISCAL')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('pos-receipt-desktop.png'), fullPage: true });
  await page.getByRole('dialog').getByRole('button', { name: 'Nueva venta', exact: true }).click();
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Ventas', exact: true }).click();
  await page.getByLabel('Buscar ventas por referencia o producto').fill(order.id.slice(-10));
  await page.getByRole('button', { name: `Ver venta ${order.id.slice(-10)}`, exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Detalle de la venta' })).toBeVisible();
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
  await expect(page.getByLabel('Buscar producto por nombre o SKU')).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('pos-mobile.png'), fullPage: true });
  await page.getByLabel('Buscar producto por nombre o SKU').fill('DES-001');
  await page.getByLabel('Buscar producto por nombre o SKU').press('Enter');
  await page.getByRole('button', { name: 'Cobrar venta', exact: true }).click();
  await expect(page.getByRole('dialog').getByLabel('Dinero recibido · PYG')).toBeVisible();
  await noHorizontalOverflow(page);
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Inventario' }).click();
  await expect(page.getByLabel('Buscar inventario')).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('pos-inventory-mobile.png'), fullPage: true });
  expect(errors).toEqual([]);
});
