import type { Kysely } from 'kysely';
import type { Database } from './schema';
import { AppError, type Actor, createCommerceService } from '../core';
import { demoCatalog, type DemoVariant } from './demo-catalog';

/** Explicit development setup only. Never seeds on application boot or overwrites stock. */
export async function seedDemo(db: Kysely<Database>, actor: Actor, variant: DemoVariant = 'ecommerce', options: { locale?: string; currency?: string } = {}): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new AppError('DEMO_DISABLED', 'Demo seeding is disabled in production.', 403);
  if (actor.role !== 'owner') throw new AppError('FORBIDDEN', 'Demo setup requires an owner.', 403);
  const service = createCommerceService(db);
  for (const input of demoCatalog(variant, options.locale ?? 'en', options.currency ?? 'USD')) {
    const existing = await db.selectFrom('commerce_products').select('id').where('tenant_id', '=', actor.tenantId).where('sku', '=', input.sku).executeTakeFirst();
    if (!existing) await service.createProduct(actor, input);
  }
}
