import {z} from 'zod';
import {route,jsonBody,service,requireModule,storefrontWriteBudget} from '@/lib/http';
import {storeActor} from '@/lib/request-actor';
import {templateConfig} from '@/template.config';
import {AppError} from '@/core/contracts';
export const runtime='nodejs';
export function POST(request:Request){return route(request,'api.store.checkout','/api/store/orders',async()=>{requireModule('orders');if(templateConfig.kind!=='ecommerce')throw new AppError('MODULE_DISABLED','The public store is not enabled.',404);const actor=storeActor();const input=z.object({items:z.array(z.object({productId:z.string(),quantity:z.number().int().positive().max(1000)}).strict()).min(1).max(100),idempotencyKey:z.string().uuid(),expectedTotalMinor:z.number().int().nonnegative().safe(),expectedCurrency:z.string().regex(/^[A-Z]{3}$/),customer:z.object({name:z.string().trim().min(2).max(120),email:z.string().email().max(254),phone:z.string().max(40).optional(),address:z.string().max(500).optional()}).strict()}).strict().parse(await jsonBody(request));await storefrontWriteBudget(actor.tenantId);const order=await service().createOrder(actor,{...input,channel:'web',paymentMethod:'manual'});return {order};},201);}
