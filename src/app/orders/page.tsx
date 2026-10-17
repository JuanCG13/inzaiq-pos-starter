import { OrderHistory } from "@/components/order-history";
import { getI18n } from "@/i18n/server";
export async function generateMetadata() { const { t } = await getI18n(); return { title: t("nav.sales") }; }
export default function OrdersPage() { return <OrderHistory />; }
