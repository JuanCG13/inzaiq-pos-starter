import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { demoCatalog } from '../../src/db/demo-catalog';

/**
 * Regenerates every screenshot in docs/screenshots/en and the gallery page from a real, isolated instance
 * (scripts/capture-server.mjs): real sign-up, onboarding, catalog entered through the API, sales through the UI and
 * OAuth consent through Better Auth. Nothing is mocked. The run also fails on console errors and horizontal overflow,
 * so it doubles as a visual smoke test. Run it with `npm run docs:screenshots`.
 */
const docs = fileURLToPath(new URL('../../docs/screenshots', import.meta.url));
const output = join(docs, 'en');
const thumbnails = join(output, 'thumbs');
const THUMB_WIDTH = 480;

const groups = ['Getting started', 'Selling', 'Inventory', 'Sales history', 'Workspace', 'Agents (MCP)', 'Other', 'Mobile'] as const;
/** Single source for file names, gallery captions and grouping. Order here is the gallery order. */
const screens = {
  '01-sign-in': { group: 'Getting started', title: 'Sign in', caption: 'Email and password sign-in; the language selector is available before authentication.' },
  '02-create-account': { group: 'Getting started', title: 'Create account', caption: 'Owner sign-up with a 12-character minimum password.' },
  '03-onboarding': { group: 'Getting started', title: 'Create or choose a business', caption: 'Each business is a separate organization; an agent connection can only reach the one chosen here.' },
  '04-pos-empty': { group: 'Getting started', title: 'Empty catalog', caption: 'First run of a new business, with a direct path to adding products.' },
  '05-pos-catalog': { group: 'Selling', title: 'Point of sale', caption: 'Catalog with stock-aware cards, category filters, SKU/barcode entry and live totals.' },
  '06-pos-cart': { group: 'Selling', title: 'Cart', caption: 'Selected products with quantity controls; totals use server-side prices in the default currency (USD).' },
  '07-pos-checkout': { group: 'Selling', title: 'Cash checkout', caption: 'Cash received, quick amounts and change due before the sale is recorded.' },
  '08-pos-receipt': { group: 'Selling', title: 'Receipt', caption: 'Internal printable receipt; it is not a tax invoice.' },
  '09-inventory': { group: 'Inventory', title: 'Inventory', caption: 'Searchable catalog with stock levels, status and low-stock indicators.' },
  '10-inventory-new-product': { group: 'Inventory', title: 'New product', caption: 'Product form with a currency selector driven by the installation configuration.' },
  '11-inventory-adjust-stock': { group: 'Inventory', title: 'Adjust stock', caption: 'Audited stock movement with a mandatory reason.' },
  '12-sales': { group: 'Sales history', title: 'Sales', caption: 'Persisted sales history with revenue separated by currency.' },
  '13-sale-details': { group: 'Sales history', title: 'Sale details', caption: 'Any past sale can be reopened and reprinted.' },
  '14-settings': { group: 'Workspace', title: 'Settings', caption: 'Business details, default currency, enabled modules, MCP connection guide and runtime operations.' },
  '15-quick-help': { group: 'Workspace', title: 'Quick help', caption: 'In-app shortcuts for cashiers.' },
  '16-pos-paused': { group: 'Workspace', title: 'Paused register with notice', caption: 'An owner paused new sales and posted a notice; open registers update live.' },
  '17-oauth-consent': { group: 'Agents (MCP)', title: 'Agent consent', caption: 'OAuth consent for an MCP client with per-scope choices; write scopes start unchecked.' },
  '18-connected-agents': { group: 'Agents (MCP)', title: 'Connected agents', caption: 'Review and revoke authorized agents for the active business.' },
  '19-not-found': { group: 'Other', title: 'Not found', caption: 'Localized 404 inside the application shell.' },
  '20-mobile-pos': { group: 'Mobile', title: 'Point of sale on mobile', caption: 'Bottom navigation and a two-column catalog at 390 px.' },
  '21-mobile-checkout': { group: 'Mobile', title: 'Checkout on mobile', caption: 'Cash checkout sheet on a phone.' },
  '22-mobile-inventory': { group: 'Mobile', title: 'Inventory on mobile', caption: 'Inventory table with horizontal scrolling contained inside the table.' },
} satisfies Record<string, { group: (typeof groups)[number]; title: string; caption: string }>;
type ScreenId = keyof typeof screens;
const taken = new Map<ScreenId, Buffer>();

function imageMagick(): string | null {
  for (const command of process.platform === 'win32' ? ['magick'] : ['magick', 'convert']) {
    if (spawnSync(command, ['-version'], { stdio: 'ignore' }).status === 0) return command;
  }
  return null;
}
const magick = imageMagick();

async function shot(page: Page, id: ScreenId, options: { fit?: boolean } = {}) {
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.spin')).toHaveCount(0);
  const original = page.viewportSize()!;
  if (options.fit) await page.setViewportSize({ width: original.width, height: await page.evaluate(() => document.documentElement.scrollHeight) });
  // The app uses scroll-behavior: smooth; ask for an instant jump so the capture never lands mid-animation.
  else await page.evaluate(() => new Promise<void>(resolve => { window.scrollTo({ top: 0, behavior: 'instant' }); requestAnimationFrame(() => requestAnimationFrame(() => resolve())); }));
  const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, width: document.documentElement.scrollWidth }));
  expect(dimensions.width, `${id} overflows horizontally`).toBeLessThanOrEqual(dimensions.viewport + 1);
  const image = await page.screenshot({ animations: 'disabled', caret: 'hide' });
  if (options.fit) await page.setViewportSize(original);
  const file = join(output, `${id}.png`);
  writeFileSync(file, image);
  taken.set(id, image);
  // Palette PNG (256 colors) is ~70% smaller for flat UI and keeps text crisp. Skipped when ImageMagick is unavailable.
  if (magick) spawnSync(magick, [file, '-dither', 'None', '-colors', '256', '-strip', `PNG8:${file}`], { stdio: 'ignore' });
}
function observe(page: Page, problems: string[]) {
  page.on('pageerror', error => problems.push(`pageerror: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error' && !/Failed to load resource|ERR_/.test(message.text())) problems.push(`console: ${message.text()}`); });
}
function galleryMarkdown(): string {
  const sections = groups.map(group => {
    const rows = (Object.keys(screens) as ScreenId[]).filter(id => screens[id].group === group);
    const cells = rows.map(id => `<td width="33%" valign="top"><a href="en/${id}.png"><img src="en/thumbs/${id}.jpg" alt="${screens[id].title}" width="300"></a><br><strong>${screens[id].title}</strong><br><sub>${screens[id].caption}</sub></td>`);
    const lines: string[] = [];
    for (let index = 0; index < cells.length; index += 3) lines.push(`<tr>${cells.slice(index, index + 3).join('')}${'<td></td>'.repeat((3 - cells.slice(index, index + 3).length) % 3)}</tr>`);
    return `### ${group}\n\n<table>\n${lines.join('\n')}\n</table>`;
  });
  return `# Screens

Every screen of the reference interface (**Nexo POS**, English, default currency USD). Thumbnails link to the full-size image.

${sections.join('\n\n')}

## How these were captured

Generated by \`npm run docs:screenshots\` (\`tests/screenshots/capture.spec.ts\`) against a real, isolated instance: a fresh SQLite database, a real Better Auth sign-up and organization, the sample catalog from \`src/db/demo-catalog.ts\` entered through the HTTP API, sales completed through the interface and an OAuth consent flow served by Better Auth. Nothing is mocked and no real customer, payment or credential data is involved. The OAuth client is a locally registered example, not evidence of a ChatGPT or Claude connection.

- Desktop 1440 × 900 and mobile 390 × 844, device scale factor 1, English (\`en-US\`), UTC.
- The run fails on console errors, page errors or horizontal overflow.
- Full-size images are 256-color PNGs when ImageMagick is installed (raw PNG otherwise); thumbnails are ${THUMB_WIDTH}px JPEGs rendered from the original captures.
- Sample product images are not used, so the catalog renders the same offline and in CI.

Regenerate after any interface or copy change. The interface is also available in Spanish and can be extended with more languages: see [docs/i18n.md](../i18n.md).
`;
}

/** Compact thumbnail grid for the top-level READMEs, written between the screens:start/end markers. */
function readmeGrid(): string {
  const ids = Object.keys(screens) as ScreenId[];
  const rows: string[] = [];
  for (let index = 0; index < ids.length; index += 4) {
    const cells = ids.slice(index, index + 4).map(id => `<td width="25%" align="center" valign="top"><a href="docs/screenshots/en/${id}.png"><img src="docs/screenshots/en/thumbs/${id}.jpg" alt="${screens[id].title}" width="230"></a><br><sub>${screens[id].title}</sub></td>`);
    rows.push(`<tr>${cells.join('')}${'<td></td>'.repeat(4 - cells.length)}</tr>`);
  }
  return `<table>\n${rows.join('\n')}\n</table>`;
}
function updateMarkedBlock(file: string, content: string) {
  const path = join(docs, '../..', file);
  if (!existsSync(path)) return;
  const source = readFileSync(path, 'utf8');
  const pattern = /(<!-- screens:start -->)[\s\S]*?(<!-- screens:end -->)/;
  if (pattern.test(source)) writeFileSync(path, source.replace(pattern, `$1\n${content}\n$2`));
}

test('capture every screen of the product in English', async ({ browser, page, context }) => {
  rmSync(output, { recursive: true, force: true });
  mkdirSync(thumbnails, { recursive: true });
  const problems: string[] = [];
  observe(page, problems);

  await test.step('sign in and create account', async () => {
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { name: 'Everything, in one place.' })).toBeVisible();
    await shot(page, '01-sign-in');
    await page.getByRole('button', { name: 'Create an account' }).click();
    await expect(page.getByRole('heading', { name: 'Start with your business.' })).toBeVisible();
    await shot(page, '02-create-account');
    await page.getByLabel('Your name').fill('Alex Rivera');
    await page.getByLabel('Email').fill('alex@maple-street.example');
    await page.getByLabel('Password').fill('Sample-passphrase-2026');
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await page.waitForURL('**/onboarding**');
  });

  await test.step('create the business', async () => {
    await expect(page.getByRole('heading', { name: 'Where will you work?' })).toBeVisible();
    await page.getByLabel('Name', { exact: true }).fill('Maple Street Market');
    await page.getByLabel('Identifier').fill('maple-street-market');
    await shot(page, '03-onboarding');
    await page.getByRole('button', { name: 'Create and continue' }).click();
    await page.waitForURL(url => url.pathname === '/');
    await expect(page.getByRole('heading', { name: 'Your catalog starts here' })).toBeVisible();
    await shot(page, '04-pos-empty');
  });

  await test.step('enter the sample catalog through the API', async () => {
    for (const product of demoCatalog('pos', 'en', 'USD')) {
      const response = await page.request.post('/api/admin/products', { data: product });
      expect(response.status(), product.sku).toBe(201);
    }
    await page.reload();
    await expect(page.getByRole('button', { name: /^Add Essential tee,/ })).toBeVisible();
    await shot(page, '05-pos-catalog');
  });

  await test.step('cart, checkout and receipt', async () => {
    for (const name of ['Essential tee', 'Essential tee', 'Ceramic mug', 'Cold brew 330 ml']) await page.getByRole('button', { name: new RegExp(`^Add ${name},`) }).click();
    await expect(page.getByRole('button', { name: 'Charge sale', exact: true })).toBeEnabled();
    await shot(page, '06-pos-cart');
    await page.getByRole('button', { name: 'Charge sale', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Cash received · USD').fill('100');
    await expect(dialog.locator('.change-due')).toContainText('$24.25');
    await shot(page, '07-pos-checkout');
    await dialog.getByRole('button', { name: 'Confirm payment' }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Sale recorded' })).toBeVisible();
    await shot(page, '08-pos-receipt');
    await page.getByRole('dialog').getByRole('button', { name: 'New sale', exact: true }).click();
  });

  await test.step('more sales so the history is realistic', async () => {
    const { products } = (await (await page.request.get('/api/admin/products?limit=100')).json()).data as { products: { id: string; sku: string; priceMinor: number }[] };
    const bySku = new Map(products.map(product => [product.sku, product]));
    const baskets: [string, number][][] = [[['DES-001', 2], ['DES-002', 1]], [['BEB-001', 3]], [['ROP-002', 1], ['HOG-001', 1]], [['LIM-001', 2], ['BEB-002', 2]]];
    for (const basket of baskets) {
      const items = basket.map(([sku, quantity]) => ({ productId: bySku.get(sku)!.id, quantity }));
      const total = basket.reduce((sum, [sku, quantity]) => sum + bySku.get(sku)!.priceMinor * quantity, 0);
      const response = await page.request.post('/api/admin/orders', { data: { items, idempotencyKey: crypto.randomUUID(), paymentMethod: 'cash', expectedTotalMinor: total, expectedCurrency: 'USD' } });
      expect(response.status()).toBe(201);
    }
  });

  await test.step('inventory', async () => {
    await page.goto('/inventory');
    await expect(page.getByRole('row').filter({ hasText: 'ROP-002' })).toBeVisible();
    await shot(page, '09-inventory');
    await page.getByRole('button', { name: 'New product', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Product name').fill('Canvas tote bag');
    await dialog.getByLabel('SKU / barcode').fill('TOTE-001');
    await dialog.getByLabel('Category', { exact: true }).fill('Accessories');
    await dialog.getByLabel('Sale price').fill('18.00');
    await dialog.getByLabel('Initial stock').fill('30');
    await dialog.getByLabel('Description').fill('Heavyweight cotton canvas, reinforced handles.');
    await shot(page, '10-inventory-new-product');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Adjust stock for Knit sweater', exact: true }).click();
    const adjust = page.getByRole('dialog');
    await adjust.getByLabel('Quantity', { exact: true }).fill('12');
    await adjust.getByLabel('Reason for adjustment').fill('Spring delivery from supplier');
    await shot(page, '11-inventory-adjust-stock');
    await page.keyboard.press('Escape');
  });

  await test.step('sales history and receipt', async () => {
    await page.goto('/orders');
    await expect(page.getByRole('row')).toHaveCount(6);
    await shot(page, '12-sales');
    await page.getByRole('row').nth(1).getByRole('button').first().click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Sale details' })).toBeVisible();
    await shot(page, '13-sale-details');
    await page.keyboard.press('Escape');
  });

  await test.step('settings, help and live pause', async () => {
    await page.goto('/settings');
    const accepting = page.getByRole('checkbox', { name: /Accept new transactions/ });
    await expect(accepting).toBeVisible();
    await expect(page.getByText('Loading settings…')).toHaveCount(0);
    await shot(page, '14-settings', { fit: true });
    await page.getByRole('button', { name: 'Quick help' }).click();
    await shot(page, '15-quick-help');
    await page.keyboard.press('Escape');
    await accepting.uncheck();
    await page.getByLabel('Business notice', { exact: true }).fill('Closing early today: last sale at 5:30 PM.');
    await page.getByRole('button', { name: 'Save settings', exact: true }).click();
    await expect(page.getByText('Settings saved.')).toBeVisible();
    await page.goto('/');
    await expect(page.getByText('New transactions are paused.')).toBeVisible();
    await shot(page, '16-pos-paused');
    await page.goto('/settings');
    await page.getByRole('checkbox', { name: /Accept new transactions/ }).check();
    await page.getByLabel('Business notice', { exact: true }).fill('');
    await page.getByRole('button', { name: 'Save settings', exact: true }).click();
    await expect(page.getByText('Settings saved.')).toBeVisible();
  });

  await test.step('agent consent and connected agents', async () => {
    const origin = 'http://localhost:3002';
    const scope = 'openid offline_access products:read products:write stock:write orders:read dashboard:read';
    const registration = await page.request.post('/api/auth/oauth2/register', { headers: { origin }, data: {
      client_name: 'Example MCP Client', redirect_uris: ['http://localhost:3456/callback'], token_endpoint_auth_method: 'none',
      application_type: 'native', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], scope,
    } });
    expect(registration.status()).toBe(201);
    const { client_id: clientId } = await registration.json() as { client_id: string };
    const challenge = createHash('sha256').update('screenshot-verifier-0123456789-0123456789-0123456789').digest('base64url');
    const query = new URLSearchParams({ client_id: clientId, redirect_uri: 'http://localhost:3456/callback', response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256', resource: `${origin}/api/mcp`, scope, state: 'screenshots' });
    await page.route('http://localhost:3456/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Connected</p>' }));
    await page.goto(`/api/auth/oauth2/authorize?${query}`);
    await page.waitForURL('**/consent**');
    await expect(page.getByRole('heading', { name: /Example MCP Client wants to access Maple Street Market/ })).toBeVisible();
    await page.getByLabel('Create and edit products').check();
    await shot(page, '17-oauth-consent');
    const granted = page.waitForResponse(response => response.url().endsWith('/api/auth/oauth2/consent') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Allow access' }).click();
    expect((await granted).status()).toBe(200);
    await page.waitForLoadState('load'); // the redirect to the client's (stubbed) callback URL
    await page.goto('/onboarding/connections');
    await expect(page.getByRole('heading', { name: 'Example MCP Client' })).toBeVisible();
    await shot(page, '18-connected-agents');
  });

  await test.step('not found', async () => {
    await page.goto('/this-page-does-not-exist');
    await expect(page.getByRole('heading', { name: "This page isn't here" })).toBeVisible();
    await shot(page, '19-not-found');
  });

  await test.step('mobile', async () => {
    const mobile: BrowserContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'en-US', timezoneId: 'UTC', storageState: await context.storageState() });
    const phone = await mobile.newPage();
    observe(phone, problems);
    await phone.goto('/');
    await expect(phone.getByRole('button', { name: /^Add Essential tee,/ })).toBeVisible();
    await shot(phone, '20-mobile-pos');
    await phone.getByRole('button', { name: /^Add Essential tee,/ }).click();
    await phone.getByRole('button', { name: 'Charge sale', exact: true }).click();
    await expect(phone.getByRole('dialog').getByLabel('Cash received · USD')).toBeVisible();
    await shot(phone, '21-mobile-checkout');
    await phone.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    await phone.goto('/inventory');
    await expect(phone.getByLabel('Search inventory')).toBeVisible();
    await shot(phone, '22-mobile-inventory');
    await mobile.close();
  });

  await test.step('thumbnails and gallery page', async () => {
    expect([...taken.keys()]).toEqual(Object.keys(screens));
    const thumb = await browser.newPage({ viewport: { width: THUMB_WIDTH, height: 400 }, deviceScaleFactor: 1 });
    for (const [id, image] of taken) {
      await thumb.setContent(`<body style="margin:0;background:#fff"><img id="i" style="display:block;width:${THUMB_WIDTH}px;max-width:none" src="data:image/png;base64,${image.toString('base64')}"></body>`);
      await thumb.locator('#i').evaluate(element => (element as HTMLImageElement).decode());
      writeFileSync(join(thumbnails, `${id}.jpg`), await thumb.locator('#i').screenshot({ type: 'jpeg', quality: 82 }));
    }
    await thumb.close();
    writeFileSync(join(docs, 'README.md'), galleryMarkdown());
    for (const readme of ['README.md', 'README.es.md']) updateMarkedBlock(readme, readmeGrid());
  });

  expect(problems).toEqual([]);
});
