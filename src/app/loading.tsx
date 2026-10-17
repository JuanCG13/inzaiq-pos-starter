"use client";
import { useI18n } from "@/i18n/provider";
export default function Loading() { const { t } = useI18n(); return <div className="page-loading" role="status" aria-label={t("states.loadingPage")}><div className="skeleton skeleton-title" /><div className="skeleton-grid">{[1, 2, 3, 4, 5, 6].map((id) => <div key={id} className="skeleton" />)}</div><span className="sr-only">{t("common.loading")}</span></div>; }
