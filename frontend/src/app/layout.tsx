import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tanyara — Chatbot dari dokumen bisnis Anda",
    template: "%s · Tanyara",
  },
  description:
    "Unggah PDF, DOCX, atau TXT. Tanyara membaca isinya dan membuat chatbot yang menjawab pelanggan dengan menyebut nama dokumen sumbernya.",
  openGraph: {
    title: "Tanyara — Chatbot dari dokumen bisnis Anda",
    description:
      "Unggah dokumen bisnis, uji jawabannya, lalu bagikan tautan chatbot. Setiap jawaban menyebut sumbernya.",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-type="software">
      <body className={`${instrumentSans.className} antialiased`}>{children}</body>
    </html>
  );
}
