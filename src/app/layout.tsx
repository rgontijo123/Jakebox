import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { Analytics } from "@/components/Analytics";
import { getLocale } from "@/lib/i18n/server";
import { pageMetadata, SITE_URL } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  // Site-wide defaults only; canonical/hreflang are set per page, so pages
  // without their own metadata never claim to be the home page.
  const home = await pageMetadata("home", "/", locale);
  return {
    ...home,
    alternates: undefined,
    openGraph: { ...home.openGraph, url: undefined },
    metadataBase: new URL(SITE_URL),
    title: { default: (home.title as { absolute: string }).absolute, template: "%s | Jakebox" },
    applicationName: "Jakebox",
    category: "music",
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    ...STATIC_METADATA,
  };
}

const STATIC_METADATA: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jakebox",
  },
  // Google Search Console domain ownership check -- needed to move the
  // OAuth consent screen's branding out of "Testing" mode.
  verification: {
    google: [
      "m1EqUdNX4_QClhrhq8SxH0eBN5PoFbvT63Yxr4ihwOg",
      // Search Console URL-prefix property https://jakeboxmusic.com/ (sitemap)
      "l-VqQ3bPjTIrOpTHqdHhrnBzpgH-x7LXeynyRiowsNg",
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale === "pt" ? "pt-BR" : "en"}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col text-zinc-50">
        <Providers locale={locale}>
          <Header />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
          <Analytics />
        </Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}