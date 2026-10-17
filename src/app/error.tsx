"use client";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useI18n } from "@/i18n/provider";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { const { t } = useI18n(); return <div className="empty-state page-error" role="alert"><div className="empty-icon"><AlertCircle size={30} /></div><h1>{t("states.errorTitle")}</h1><p>{t("states.errorBody")}</p>{error.digest ? <code>{t("states.errorReference", { reference: error.digest })}</code> : null}<button className="button button-primary" onClick={reset}><RefreshCw size={16} />{t("states.errorRetry")}</button></div>; }
