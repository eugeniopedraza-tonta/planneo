import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: {
    default: "Planneo — Proveedores para eventos en Monterrey",
    template: "%s | Planneo",
  },
  description:
    "Encuentra fotógrafos, DJ, salones, catering y más para tu boda, XV años o evento corporativo en Monterrey.",
  metadataBase: new URL("https://planneo.mx"),
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
      </body>
      {process.env.NEXT_PUBLIC_GA4_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA4_ID} />
      )}
    </html>
  );
}
