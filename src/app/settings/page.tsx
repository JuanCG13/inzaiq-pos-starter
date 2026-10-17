import { SettingsPanel } from "@/components/settings-panel";
import { getI18n } from "@/i18n/server";
export async function generateMetadata() { const { t } = await getI18n(); return { title: t("nav.settings") }; }
export default function SettingsPage() { return <SettingsPanel />; }
