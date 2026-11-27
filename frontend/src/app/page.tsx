import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ChatDemo } from "@/components/landing/Visuals";
import "./landing.css";

export const metadata: Metadata = {
  title: { absolute: "TanyaRa | Chatbot dari dokumen bisnis" },
  description: "Buat chatbot untuk pelanggan dari menu, katalog, atau FAQ. Unggah dokumen, uji jawabannya, lalu bagikan tautan chat.",
  other: { "page-type": "software", "site-kind": "software" },
};

const steps = [
  {
    title: "Unggah dokumen",
    description: "Pakai menu, katalog, atau FAQ yang sudah Anda punya. TanyaRa menerima PDF, DOCX, dan TXT hingga 10 MB per berkas.",
  },
  {
    title: "Uji jawabannya",
    description: "Coba pertanyaan yang sering masuk. Baca jawabannya dan cocokkan nama berkas sumber di dashboard.",
  },
  {
    title: "Bagikan tautannya",
    description: "Aktifkan chatbot dan kirim tautannya. Pelanggan bisa bertanya langsung dari browser tanpa membuat akun.",
  },
];

const faqs = [
  {
    question: "Berkas apa yang bisa saya gunakan?",
    answer: "PDF, DOCX, dan TXT hingga 10 MB per berkas. Untuk PDF, gunakan dokumen yang teksnya bisa disalin.",
  },
  {
    question: "Bisakah saya mengubah pesan sambutan chatbot?",
    answer: "Bisa. Anda bisa mengatur nama chatbot, pesan sambutan, dan petunjuk tentang cara menjawab di dashboard.",
  },
  {
    question: "Apa yang terjadi kalau jawabannya belum ada?",
    answer: "Chatbot diarahkan untuk menyatakan bahwa informasi itu belum tercantum dan menyarankan pelanggan bertanya ke staf.",
  },
  {
    question: "Bisakah saya mengganti dokumen yang sudah diunggah?",
    answer: "Bisa. Unggah berkas baru, lalu hapus berkas lama dari chatbot. Uji kembali pertanyaan yang jawabannya berubah sebelum membagikan tautan.",
  },
  {
    id: "keamanan",
    question: "Dokumen mana yang dibaca chatbot?",
    answer: "TanyaRa mengambil informasi dari dokumen milik chatbot yang sedang ditanya. Pelanggan bisa melihat jawaban dan nama berkas sumber yang dipakai.",
  },
];

export default function LandingPage() {
  return (
    <div className="landing" id="top">
      <a className="lp-skip" href="#main">Lewati ke isi</a>
      <Navbar />

      <main id="main" tabIndex={-1}>
        <section className="hero lp-hero" aria-labelledby="hero-title">
          <div className="wrap lp-wrap grid lp-hero__grid">
            <div className="lp-hero__copy">
              <h1 id="hero-title">Chatbot dari dokumen usaha</h1>
              <p className="hero__lead lp-hero__lead">
                Unggah katalog, menu, atau FAQ, lalu bagikan chatbot lewat satu tautan. Pelanggan bisa tanya harga, stok, atau jam buka tanpa akun.
              </p>
              <div className="btn-row lp-hero__actions">
                <Link href="/register" className="lp-button primary-action">Buat chatbot</Link>
                <a href="#cara-kerja" className="lp-text-link">Lihat cara kerja <span aria-hidden="true">↓</span></a>
              </div>
            </div>

            <ChatDemo />
          </div>
        </section>

        <section className="lp-work" id="cara-kerja" aria-labelledby="work-title" data-screen="free">
          <div className="wrap lp-wrap grid lp-work__grid">
            <div className="lp-work__content">
              <h2 id="work-title">Dari berkas ke tautan pelanggan</h2>
              <ol>
                {steps.map((step, index) => (
                  <li key={step.title}>
                    <span className="lp-work__number" aria-hidden="true">{index + 1}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="lp-work__image">
              <Image
                src="/tanyara-kedai.webp"
                alt="Pemilik kedai meletakkan kopi susu di samping buku menu"
                fill
                sizes="(max-width: 760px) 90vw, (max-width: 1240px) 40vw, 520px"
              />
            </div>
          </div>
        </section>

        <section className="lp-faq" id="pertanyaan" aria-labelledby="faq-title" data-screen="free">
          <div className="wrap lp-wrap grid lp-faq__grid">
            <h2 id="faq-title">Sebelum Anda mulai</h2>
            <div>
              {faqs.map(({ id, question, answer }) => (
                <details id={id} key={question}>
                  <summary>{question}<span aria-hidden="true" /></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
