import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import GoogleAnalytics from "@/components/analytics/google-analytics";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";

const DEFAULT_TITLE = "Planneo — Proveedores para eventos en Monterrey";
const DEFAULT_DESCRIPTION =
  "Encuentra fotógrafos, DJ, salones, catering y más para tu boda, XV años o evento corporativo en Monterrey.";

export const metadata: Metadata = {
  title: {
    default: DEFAULT_TITLE,
    template: "%s | Planneo",
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  // Respaldo para rutas sin metadata propia; las públicas usan pageMetadata().
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "es_MX",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
