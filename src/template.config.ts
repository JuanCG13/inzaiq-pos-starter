export interface TemplateConfig { name:string; description:string; kind:"ecommerce"|"pos"; currency:string; locale:string; modules:{catalog:boolean; inventory:boolean; orders:boolean; mcp:boolean} }
export const templateConfig:TemplateConfig = {
  "name": "Nexo POS",
  "description": "Ventas e inventario, en un solo lugar.",
  "kind": "pos",
  "currency": "PYG",
  "locale": "es-PY",
  "modules": {
    "catalog": true,
    "inventory": true,
    "orders": true,
    "mcp": true
  }
};
