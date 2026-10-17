import type { CreateProductInput } from '../core/contracts';
import { currencyDigits } from '../i18n/format';

/**
 * Sample catalogs for local demos and documentation screenshots. Pure data: no database or framework imports.
 * Names are provided in English and Spanish; any other language falls back to English, so adding a UI language
 * never forces a demo translation. Prices are written in major units and converted with the currency's own digits.
 */
export type DemoVariant = 'ecommerce' | 'pos';
type Text = { en: string; es: string };
interface DemoProduct { sku: string; name: Text; description: Text; category: Text; price: number; stock: number; imageUrl?: string }

const storefront: DemoProduct[] = [
  { sku: 'NOMA-TEE-01', name: { en: 'Essential tee', es: 'Camiseta esencial' }, description: { en: 'Soft cotton. An everyday piece.', es: 'Algodón suave. Una pieza para todos los días.' }, category: { en: 'Apparel', es: 'Ropa' }, price: 29, stock: 48, imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80' },
  { sku: 'NOMA-BAG-01', name: { en: 'Urban backpack', es: 'Mochila urbana' }, description: { en: 'Room for what matters.', es: 'Espacio para llevar lo que importa.' }, category: { en: 'Bags', es: 'Bolsos' }, price: 79, stock: 18, imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80' },
  { sku: 'NOMA-SHOE-01', name: { en: 'Everyday sneakers', es: 'Zapatillas de diario' }, description: { en: 'Simple lines. All-day comfort.', es: 'Líneas simples. Comodidad todo el día.' }, category: { en: 'Accessories', es: 'Accesorios' }, price: 89, stock: 24, imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80' },
  { sku: 'NOMA-LAMP-01', name: { en: 'Table lamp', es: 'Lámpara de mesa' }, description: { en: 'A touch of light for your space.', es: 'Un detalle de luz para tu espacio.' }, category: { en: 'Home', es: 'Hogar' }, price: 65, stock: 8, imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80' },
  { sku: 'NOMA-KNIT-01', name: { en: 'Knit sweater', es: 'Suéter de punto' }, description: { en: 'Warm texture, relaxed fit.', es: 'Textura cálida y silueta relajada.' }, category: { en: 'Apparel', es: 'Ropa' }, price: 59, stock: 4, imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80' },
  { sku: 'NOMA-CHAIR-01', name: { en: 'Design chair', es: 'Silla de diseño' }, description: { en: 'A comfortable pause, in any corner.', es: 'Una pausa cómoda, en cualquier rincón.' }, category: { en: 'Home', es: 'Hogar' }, price: 149, stock: 6, imageUrl: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80' },
];

/** The POS demo has no remote images, so it renders identically offline and in screenshots. */
const register: DemoProduct[] = [
  { sku: 'DES-001', name: { en: 'Ground coffee 1 lb', es: 'Café molido 500 g' }, description: { en: 'One-pound bag, medium roast.', es: 'Paquete de 500 g, tueste medio.' }, category: { en: 'Pantry', es: 'Despensa' }, price: 12.5, stock: 30 },
  { sku: 'DES-002', name: { en: 'Long-grain rice 2 lb', es: 'Arroz largo fino 1 kg' }, description: { en: 'Everyday long-grain rice.', es: 'Arroz largo fino de todos los días.' }, category: { en: 'Pantry', es: 'Despensa' }, price: 4.25, stock: 50 },
  { sku: 'BEB-001', name: { en: 'Sparkling water 500 ml', es: 'Agua mineral 500 ml' }, description: { en: 'Chilled single bottle.', es: 'Botella individual fría.' }, category: { en: 'Drinks', es: 'Bebidas' }, price: 1.5, stock: 48 },
  { sku: 'BEB-002', name: { en: 'Cold brew 330 ml', es: 'Café frío 330 ml' }, description: { en: 'Ready-to-drink, unsweetened.', es: 'Listo para tomar, sin azúcar.' }, category: { en: 'Drinks', es: 'Bebidas' }, price: 3.75, stock: 24 },
  { sku: 'ROP-001', name: { en: 'Essential tee', es: 'Camiseta esencial' }, description: { en: 'Soft cotton. An everyday piece.', es: 'Algodón suave. Una pieza para todos los días.' }, category: { en: 'Apparel', es: 'Ropa' }, price: 29, stock: 16 },
  { sku: 'ROP-002', name: { en: 'Knit sweater', es: 'Suéter de punto' }, description: { en: 'Warm texture, relaxed fit.', es: 'Textura cálida y silueta relajada.' }, category: { en: 'Apparel', es: 'Ropa' }, price: 59, stock: 4 },
  { sku: 'ACC-001', name: { en: 'Urban backpack', es: 'Mochila urbana' }, description: { en: 'Room for what matters.', es: 'Espacio para llevar lo que importa.' }, category: { en: 'Accessories', es: 'Accesorios' }, price: 79, stock: 4 },
  { sku: 'HOG-001', name: { en: 'Ceramic mug', es: 'Taza de cerámica' }, description: { en: 'Hand-glazed, 12 oz.', es: 'Esmaltada a mano, 350 ml.' }, category: { en: 'Home', es: 'Hogar' }, price: 14, stock: 22 },
  { sku: 'HOG-002', name: { en: 'Table lamp', es: 'Lámpara de mesa' }, description: { en: 'A touch of light for your space.', es: 'Un detalle de luz para tu espacio.' }, category: { en: 'Home', es: 'Hogar' }, price: 65, stock: 8 },
  { sku: 'LIM-001', name: { en: 'Dish soap 750 ml', es: 'Detergente 750 ml' }, description: { en: 'Concentrated, lemon scent.', es: 'Concentrado, aroma a limón.' }, category: { en: 'Cleaning', es: 'Limpieza' }, price: 3.99, stock: 20 },
];

export function demoCatalog(variant: DemoVariant, locale: string, currency: string): CreateProductInput[] {
  const language: keyof Text = locale.toLowerCase().startsWith('es') ? 'es' : 'en';
  const digits = currencyDigits(currency);
  return (variant === 'pos' ? register : storefront).map(({ sku, name, description, category, price, stock, imageUrl }) => ({
    sku, name: name[language], description: description[language], category: category[language],
    priceMinor: Math.round(price * 10 ** digits), currency, stock, ...(imageUrl ? { imageUrl } : {}),
  }));
}
