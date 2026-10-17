"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { ArrowDownLeft, ArrowRight, Banknote, Barcode, Check, CheckCircle2, ChevronRight, Minus, Package, Plus, Printer, Search, ShoppingBag, ShoppingCart, Trash2, Wallet, X } from "lucide-react";
import type { Order, Product } from "@/core/contracts";
import { api, ApiError } from "@/lib/api-client";
import { templateConfig } from "@/template.config";
import { errorMessage, usePos } from "./pos-provider";
import { currencyDigits, Dialog, EmptyState, ErrorAlert, formatDate, money, moneyInput, parseMoney, ProductArt, Spinner } from "./ui";

interface CartItem { product: Product; quantity: number }

export function PointOfSale() {
  const { products, dashboard, session, refresh, notify, error: connectionError, productsHasMore, loadMoreProducts, loadingMore } = usePos();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState("Todas");
  const [sort, setSort] = useState("name");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkout, setCheckout] = useState(false);
  const [received, setReceived] = useState("");
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ order: Order; receivedMinor: number } | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const orderKey = useRef<string | null>(null);
  const activeProducts = useMemo(() => products.filter((product) => product.active), [products]);
  const categories = useMemo(() => ["Todas", ...new Set(activeProducts.map((product) => product.category).filter(Boolean))], [activeProducts]);
  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return activeProducts.filter((product) => (category === "Todas" || product.category === category) && (!needle || `${product.name} ${product.sku}`.toLowerCase().includes(needle))).sort((a, b) => sort === "price" ? a.priceMinor - b.priceMinor : a.name.localeCompare(b.name, templateConfig.locale));
  }, [activeProducts, category, deferredQuery, sort]);
  const total = cart.reduce((sum, item) => sum + item.product.priceMinor * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const currency = cart[0]?.product.currency || templateConfig.currency;
  const receivedMinor = parseMoney(received, currency);
  const canSell = session?.role !== "viewer" && Boolean(session) && !connectionError && templateConfig.modules.orders;
  const revenue = dashboard?.revenueByCurrency.find((entry) => entry.currency === templateConfig.currency)?.totalMinor ?? 0;

  function addProduct(product: Product) {
    if (!canSell || pending || product.stock < 1) return;
    if (cart.length && currency !== product.currency) { setCartMessage("Cada venta debe contener productos de la misma moneda."); return; }
    const current = cart.find((item) => item.product.id === product.id)?.quantity ?? 0;
    if (current >= product.stock) { setCartMessage(`Ya agregaste todas las unidades disponibles de ${product.name}.`); return; }
    setCart((items) => items.some((item) => item.product.id === product.id) ? items.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { product, quantity: 1 }]);
    orderKey.current = null; setCartMessage(null);
  }
  function changeQuantity(id: string, delta: number) {
    setCart((items) => items.map((item) => item.product.id === id ? { ...item, quantity: Math.min(item.product.stock, item.quantity + delta) } : item).filter((item) => item.quantity > 0));
    orderKey.current = null; setCartMessage(null);
  }
  function openCheckout() {
    if (!cart.length) return;
    setReceived(moneyInput(total, currency)); setFailure(null); setConflict(false); setCheckout(true);
    orderKey.current ??= crypto.randomUUID();
  }
  async function completeSale() {
    if (pending || receivedMinor === null || receivedMinor < total || !canSell) return;
    setPending(true); setFailure(null);
    const payment = receivedMinor;
    orderKey.current ??= crypto.randomUUID();
    try {
      const result = await api<{ order: Order }>("/api/admin/orders", { method: "POST", body: JSON.stringify({ items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })), idempotencyKey: orderKey.current, paymentMethod: "cash", expectedTotalMinor: total, expectedCurrency: currency }) });
      setReceipt({ order: result.order, receivedMinor: payment }); setCart([]); setCheckout(false); orderKey.current = null;
      notify("Venta registrada. El inventario está actualizado.");
      await refresh();
    } catch (error) { setConflict(error instanceof ApiError && error.status === 409); setFailure(`${errorMessage(error)} Si reintentás sin cambiar el carrito, usamos la misma referencia para evitar duplicados.`); }
    finally { setPending(false); }
  }

  async function updateCart() {
    setPending(true);
    try {
      const currentProducts = await Promise.all(cart.map(async ({ product }) => {
        const data = await api<{ products: Product[] }>(`/api/admin/products?search=${encodeURIComponent(product.sku)}&limit=100`);
        return data.products.find((entry) => entry.id === product.id);
      }));
      const updated = cart.flatMap((item, index) => {
        const product = currentProducts[index];
        return product?.active && product.stock > 0 ? [{ product, quantity: Math.min(item.quantity, product.stock) }] : [];
      });
      setCart(updated); orderKey.current = null; setConflict(false); setReceived("");
      setFailure(null); setCheckout(false); setCartMessage("Actualizamos precios y cantidades con el inventario actual. Revisá el carrito antes de cobrar nuevamente.");
      await refresh();
    } catch (error) { setFailure(errorMessage(error)); }
    finally { setPending(false); }
  }

  return <>
    <div className="page-heading"><div><div className="section-kicker"><span className="tiny-line" />TU OPERACIÓN, EN UN SOLO LUGAR</div><h1>Todo listo para vender<span className="heading-dot">.</span></h1><p>Menos pasos. Más tiempo para tu negocio.</p></div><div className="heading-label"><span className="status-dot" />Caja en efectivo</div></div>
    <div className="metrics-row">
      <div className="metric-card"><span className="metric-icon"><Wallet size={19} /></span><div><span className="metric-label">Ingresos cobrados · {templateConfig.currency}</span><strong className="money">{money(revenue)}</strong><small>Ventas completadas{dashboard && dashboard.revenueByCurrency.length > 1 ? " · ver otras monedas en Ventas" : ""}</small></div><ArrowDownLeft size={18} className="metric-trend" /></div>
      <div className="metric-card"><span className="metric-icon"><ShoppingBag size={19} /></span><div><span className="metric-label">Ventas registradas</span><strong className="money">{dashboard?.orderCount ?? 0}</strong><small>Historial de tu empresa</small></div></div>
      <div className="metric-card"><span className="metric-icon"><Package size={19} /></span><div><span className="metric-label">Productos activos</span><strong className="money">{dashboard?.activeProductCount ?? activeProducts.length}</strong><small>{dashboard?.lowStockCount ?? 0} con stock bajo</small></div></div>
    </div>
    <div className="pos-layout">
      <section className="catalog-panel" aria-labelledby="catalog-title"><div className="panel-heading"><div><h2 id="catalog-title">Catálogo <span className="count-badge">{activeProducts.length}</span></h2><p>Seleccioná productos para una nueva venta.</p></div><label className="sort-control"><span className="sr-only">Ordenar productos</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Nombre A–Z</option><option value="price">Menor precio</option></select></label></div>
        <form className="search-field" onSubmit={(event) => { event.preventDefault(); const match = activeProducts.find((product) => product.sku.toLowerCase() === query.trim().toLowerCase()); if (match) { addProduct(match); setQuery(""); } else { setCartMessage("No encontramos ese SKU. Podés buscar por nombre y seleccionar un producto."); } }}><Search size={19} /><input aria-label="Buscar producto por nombre o SKU" placeholder="Buscar producto o escanear código…" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" />{query ? <button type="button" className="icon-button" aria-label="Borrar búsqueda" onClick={() => setQuery("")}><X size={16} /></button> : <span className="barcode-hint"><Barcode size={19} /><kbd>↵</kbd></span>}</form>
        <div className="category-tabs" aria-label="Filtrar por categoría">{categories.map((entry) => <button key={entry} className={`category-tab ${category === entry ? "selected" : ""}`} aria-pressed={category === entry} onClick={() => setCategory(entry)}>{entry}</button>)}</div>
        {filtered.length ? <div className="product-grid">{filtered.map((product) => {
          const selected = cart.find((item) => item.product.id === product.id)?.quantity ?? 0;
          return <button key={product.id} className={`product-card ${selected ? "product-selected" : ""}`} disabled={!canSell || product.stock < 1 || selected >= product.stock} onClick={() => addProduct(product)} aria-label={`Agregar ${product.name}, ${money(product.priceMinor, product.currency)}, ${product.stock} disponibles`}><div className="product-visual"><ProductArt product={product} /><span className={`stock-pill ${product.stock <= 5 ? "stock-low" : ""}`}>{product.stock === 0 ? "Agotado" : `${product.stock} disponibles`}</span>{selected ? <span className="product-selected-count">{selected} <Check size={11} /></span> : null}</div><div className="product-information"><span className="product-category">{product.category || "General"}</span><h3>{product.name}</h3><div className="product-bottom"><span className="money">{money(product.priceMinor, product.currency)}</span><span className="product-add"><Plus size={17} /></span></div></div></button>;
        })}</div> : <EmptyState icon={<Package size={30} />} title={activeProducts.length ? "Sin coincidencias" : "Tu catálogo empieza acá"} description={activeProducts.length ? "Probá otro nombre, SKU o categoría." : "Agregá tu primer producto desde Inventario para comenzar a vender."}>{activeProducts.length ? <button className="button button-secondary" onClick={() => { setQuery(""); setCategory("Todas"); }}>Limpiar filtros</button> : <a className="button button-primary" href="/inventory">Agregar productos <ArrowRight size={15} /></a>}</EmptyState>}
        {productsHasMore ? <div className="load-more-row"><span>Mostrando {products.length} productos. Cargá más para ampliar la búsqueda.</span><button className="button button-secondary button-small" disabled={loadingMore} onClick={() => void loadMoreProducts()}>{loadingMore ? <Spinner label="Cargando…" /> : "Cargar más productos"}</button></div> : null}<p className="catalog-footnote"><Barcode size={14} />Compatible con lectores de códigos que funcionan como teclado.</p>
      </section>
      <aside className="cart-panel" aria-labelledby="cart-title"><div className="cart-heading"><div><h2 id="cart-title">Nueva venta <span className="count-badge">{itemCount}</span></h2><p>Un buen día empieza con una venta.</p></div><button className="icon-button" title="Vaciar carrito" aria-label="Vaciar carrito" disabled={!cart.length || pending} onClick={() => setClearConfirm(true)}><Trash2 size={17} /></button></div>
        <ErrorAlert message={cartMessage} />
        {cart.length ? <div className="cart-items">{cart.map(({ product, quantity }) => <div className="cart-item" key={product.id}><ProductArt product={product} small /><div className="cart-item-info"><strong>{product.name}</strong><span className="muted money">{money(product.priceMinor, product.currency)}</span><div className="quantity-control"><button aria-label={`Quitar una unidad de ${product.name}`} onClick={() => changeQuantity(product.id, -1)} disabled={pending}><Minus size={12} /></button><span className="money">{quantity}</span><button aria-label={`Agregar una unidad de ${product.name}`} onClick={() => changeQuantity(product.id, 1)} disabled={pending || quantity >= product.stock}><Plus size={12} /></button></div></div><span className="cart-item-total money">{money(product.priceMinor * quantity, product.currency)}</span></div>)}</div> : <div className="cart-empty"><div className="cart-empty-art"><ShoppingCart size={38} strokeWidth={1.2} /><span><Plus size={13} /></span></div><h3>Tu próxima venta empieza acá</h3><p>Agregá productos del catálogo.<br />Nosotros hacemos las cuentas.</p></div>}
        <div className="cart-summary"><div className="summary-line"><span>Productos</span><span>{itemCount} {itemCount === 1 ? "unidad" : "unidades"}</span></div><div className="summary-line"><span>Forma de pago</span><span><Banknote size={15} /> Efectivo</span></div><div className="summary-total"><span>Total</span><strong className="money">{money(total, currency)}</strong></div><button className="button button-primary checkout-button" disabled={!cart.length || !canSell || pending} onClick={openCheckout}><span>Cobrar venta</span><ArrowRight size={19} /></button><p className="cart-secure"><CheckCircle2 size={12} />{session?.role === "viewer" ? "Tu cuenta tiene acceso de solo lectura" : "El stock se actualiza al confirmar la venta"}</p></div>
      </aside>
    </div>
    <Dialog open={checkout} onOpenChange={(open) => { if (!pending) setCheckout(open); }} title="Cobrar en efectivo" description="Confirmá el dinero recibido antes de registrar la venta."><form onSubmit={(event) => { event.preventDefault(); void completeSale(); }}><div className="checkout-total"><span>Total a cobrar</span><strong className="money">{money(total, currency)}</strong><small>{itemCount} {itemCount === 1 ? "unidad" : "unidades"}</small></div><label className="field-label" htmlFor="received">Dinero recibido · {currency}</label><input id="received" className="input amount-input money" inputMode="decimal" value={received} onChange={(event) => setReceived(event.target.value)} disabled={pending} autoFocus required /><div className="cash-presets"><button type="button" className="button button-secondary button-small" disabled={pending} onClick={() => setReceived(moneyInput(total, currency))}>Monto exacto</button>{[1.5, 2].map((multiplier) => { const unit = 10 ** currencyDigits(currency); const suggested = Math.ceil(total * multiplier / unit) * unit; return <button type="button" className="button button-secondary button-small money" key={multiplier} disabled={pending} onClick={() => setReceived(moneyInput(suggested, currency))}>{money(suggested, currency)}</button>; })}</div><div className="change-due"><span>Cambio a entregar</span><strong className="money">{receivedMinor !== null && receivedMinor >= total ? money(receivedMinor - total, currency) : "—"}</strong></div>{received && (receivedMinor === null || receivedMinor < total) ? <p className="field-error">Ingresá un monto válido igual o mayor al total.</p> : null}<ErrorAlert message={failure} />{conflict ? <button type="button" className="button button-secondary full-width" disabled={pending} onClick={() => void updateCart()}>Actualizar productos y revisar el total</button> : null}<p className="form-note">El cambio se calcula para esta operación. El ticket es un comprobante interno, no una factura fiscal.</p><button className="button button-primary full-width" type="submit" disabled={pending || receivedMinor === null || receivedMinor < total || !canSell || conflict}>{pending ? <Spinner label="Registrando venta…" /> : <>Confirmar cobro <Check size={16} /></>}</button></form></Dialog>
    <Dialog open={Boolean(receipt)} onOpenChange={(open) => { if (!open) setReceipt(null); }} title="Venta registrada" description="El cobro y las existencias ya están actualizados.">{receipt ? <><div className="receipt"><div className="receipt-brand"><CheckCircle2 size={30} /><h3>{session?.tenant.name || templateConfig.name}</h3><p>COMPROBANTE INTERNO · NO FISCAL</p></div><div className="receipt-meta"><span>Venta</span><strong>{receipt.order.id.slice(-12).toUpperCase()}</strong><span>Fecha</span><span>{formatDate(receipt.order.createdAt)}</span><span>Pago</span><span>Efectivo</span></div><div className="receipt-items">{receipt.order.items.map((item) => <div key={item.productId}><span>{item.quantity} × {item.name}</span><strong className="money">{money(item.totalMinor, receipt.order.currency)}</strong></div>)}</div><div className="summary-total"><span>Total</span><strong className="money">{money(receipt.order.totalMinor, receipt.order.currency)}</strong></div><div className="summary-line"><span>Recibido (registro local)</span><span className="money">{money(receipt.receivedMinor, receipt.order.currency)}</span></div><div className="summary-line"><span>Cambio</span><span className="money">{money(receipt.receivedMinor - receipt.order.totalMinor, receipt.order.currency)}</span></div></div><div className="dialog-actions"><button className="button button-secondary" onClick={() => window.print()}><Printer size={16} />Imprimir ticket</button><button className="button button-primary" onClick={() => setReceipt(null)}>Nueva venta <ChevronRight size={16} /></button></div></> : null}</Dialog>
    <Dialog open={clearConfirm} onOpenChange={setClearConfirm} title="¿Vaciar esta venta?" description="Los productos se quitarán del carrito. El inventario no cambia."><div className="dialog-actions"><button className="button button-secondary" onClick={() => setClearConfirm(false)}>Volver</button><button className="button button-danger" onClick={() => { setCart([]); orderKey.current = null; setClearConfirm(false); setCartMessage(null); }}>Vaciar carrito</button></div></Dialog>
  </>;
}
