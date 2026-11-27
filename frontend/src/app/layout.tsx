import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
      <body className={`${poppins.className} antialiased`}>{children}</body>
    </html>
  );
}
