import type { Metadata } from "next";
import type { ReactNode } from "react";
import { templateConfig } from "@/template.config";
import { I18nProvider } from "@/i18n/provider";
import { getI18n } from "@/i18n/server";
import { PosProvider } from "@/components/pos-provider";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: { default: templateConfig.name, template: `%s · ${templateConfig.name}` }, description: templateConfig.description || t("meta.description"), robots: { index: false, follow: false } };
}
export default async function RootLayout({ children }: { children: ReactNode }) {
  const { locale, intlLocale, messages } = await getI18n();
  return <html lang={locale} data-scroll-behavior="smooth"><body><I18nProvider locale={locale} intlLocale={intlLocale} messages={messages}><PosProvider><AppShell>{children}</AppShell></PosProvider></I18nProvider></body></html>;
}
