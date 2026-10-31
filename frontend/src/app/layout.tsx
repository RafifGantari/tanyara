import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tanyara - Ubah Dokumen Menjadi Asisten AI untuk Bisnis Anda",
  description:
    "Platform AI chatbot multi-tenant untuk bisnis, UMKM, dan organisasi di Indonesia. Buat chatbot pintar dari dokumen SOP, menu, atau katalog bisnis Anda.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
