import { InventoryManager } from "@/components/inventory-manager";
import { getI18n } from "@/i18n/server";
export async function generateMetadata() { const { t } = await getI18n(); return { title: t("nav.inventory") }; }
export default function InventoryPage() { return <InventoryManager />; }
