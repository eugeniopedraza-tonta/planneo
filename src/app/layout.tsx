import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Planneo — La plataforma #1 para eventos en México",
  description:
    "Conectamos a los mejores músicos con quienes crean momentos inolvidables.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("h-full antialiased", inter.variable)}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
