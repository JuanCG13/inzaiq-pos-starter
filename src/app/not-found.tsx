import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { getI18n } from "@/i18n/server";
export default async function NotFound() { const { t } = await getI18n(); return <div className="empty-state page-error"><div className="empty-icon"><Compass size={30} /></div><span className="section-kicker">404</span><h1>{t("states.notFoundTitle")}</h1><p>{t("states.notFoundBody")}</p><Link href="/" className="button button-primary"><ArrowLeft size={16} />{t("states.notFoundCta")}</Link></div>; }
