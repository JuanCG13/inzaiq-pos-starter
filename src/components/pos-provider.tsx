"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { api, describeError } from "@/lib/api-client";
import { useI18n } from "@/i18n/provider";
import type { Dashboard, Order, Product, Role } from "@/core/contracts";
import { templateConfig } from "@/template.config";

export interface SessionInfo { user: { id: string; name: string }; tenant: { id: string; name: string }; role: Role; demo: boolean }
interface PosContextValue {
  products: Product[]; orders: Order[]; dashboard: Dashboard | null; session: SessionInfo | null;
  loading: boolean; refreshing: boolean; error: string | null;
  refresh: () => Promise<void>; notice: string | null; notify: (message: string) => void;
  productsHasMore: boolean; ordersHasMore: boolean; loadingMore: boolean;
  loadMoreProducts: () => Promise<void>; loadMoreOrders: () => Promise<void>;
}
const PosContext = createContext<PosContextValue | null>(null);

export function PosProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  // Kept as the raw failure so the text follows the language if the user switches while an error is showing.
  const error = useMemo(() => failure ? describeError(failure, t) : null, [failure, t]);
  const [notice, setNotice] = useState<string | null>(null);
  const [productsHasMore, setProductsHasMore] = useState(false);
  const [ordersHasMore, setOrdersHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const isAuth = ["/sign-in", "/onboarding", "/consent"].some((prefix) => pathname.startsWith(prefix));

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [sessionData, productData, orderData, dashboardData] = await Promise.all([
        api<SessionInfo>("/api/session"),
        templateConfig.modules.catalog ? api<{ products: Product[] }>("/api/admin/products?limit=100&offset=0") : Promise.resolve({ products: [] as Product[] }),
        templateConfig.modules.orders ? api<{ orders: Order[] }>("/api/admin/orders?limit=100&offset=0") : Promise.resolve({ orders: [] as Order[] }),
        api<Dashboard | { dashboard: Dashboard }>("/api/admin/dashboard"),
      ]);
      setSession(sessionData); setProducts(productData.products); setOrders(orderData.orders);
      setProductsHasMore(productData.products.length === 100); setOrdersHasMore(orderData.orders.length === 100);
      setDashboard("dashboard" in dashboardData ? dashboardData.dashboard : dashboardData);
      setFailure(null);
    } catch (problem) { setFailure(problem); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const loadMoreProducts = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await api<{ products: Product[] }>(`/api/admin/products?limit=100&offset=${products.length}`);
      setProducts((current) => [...new Map([...current, ...result.products].map((product) => [product.id, product])).values()]);
      setProductsHasMore(result.products.length === 100);
    } catch (problem) { setFailure(problem); }
    finally { setLoadingMore(false); }
  }, [loadingMore, products.length]);
  const loadMoreOrders = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await api<{ orders: Order[] }>(`/api/admin/orders?limit=100&offset=${orders.length}`);
      setOrders((current) => [...new Map([...current, ...result.orders].map((order) => [order.id, order])).values()]);
      setOrdersHasMore(result.orders.length === 100);
    } catch (problem) { setFailure(problem); }
    finally { setLoadingMore(false); }
  }, [loadingMore, orders.length]);

  useEffect(() => { if (!isAuth) void refresh(); }, [isAuth, refresh]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 5500);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  return <PosContext.Provider value={{ products, orders, dashboard, session, loading, refreshing, error, refresh, notice, notify: setNotice, productsHasMore, ordersHasMore, loadingMore, loadMoreProducts, loadMoreOrders }}>{children}</PosContext.Provider>;
}

export function usePos() {
  const context = useContext(PosContext);
  if (!context) throw new Error("usePos requires PosProvider");
  return context;
}
