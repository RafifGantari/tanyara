"use client";

import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";

const examples = [
  {
    label: "Jam buka",
    question: "Besok buka jam berapa?",
    answer: "Kedai buka pukul 08.00–21.00 setiap hari.",
    quote: "Setiap hari, pukul 08.00–21.00.",
  },
  {
    label: "Pilihan gula",
    question: "Kopi susu gulanya bisa dikurangi?",
    answer: "Bisa. Minta gula setengah atau tanpa gula saat memesan kopi susu.",
    quote: "Kopi susu tersedia dengan gula normal, setengah, atau tanpa gula.",
  },
  {
    label: "Parkir",
    question: "Ada tempat parkir mobil?",
    answer: "Untuk parkir mobil, silakan tanyakan langsung ke staf kedai.",
    quote: null,
  },
] as const;

export function ChatDemo() {
  const [selected, setSelected] = useState(0);
  const example = examples[selected];

  return (
    <section className="lp-demo hero__media" id="produk" aria-labelledby="demo-title">
      <header className="lp-demo__header">
        <h2 id="demo-title">Contoh chat pelanggan</h2>
        <span>Simulasi</span>
      </header>

      <div className="lp-conversation" aria-live="polite" aria-atomic="true">
        <div className="lp-conversation__messages" key={selected}>
          <p className="lp-conversation__question">
            <span className="sr-only">Pelanggan </span>
            {example.question}
          </p>
          <div className="lp-conversation__reply">
            <div className="lp-conversation__sender">Kedai Sore</div>
            <p>{example.answer}</p>
            {example.quote ? (
              <details className="lp-citation">
                <summary>
                  <FileText aria-hidden="true" size={15} />
                  <span><span className="sr-only">Lihat kutipan dari </span>FAQ Kedai Sore.txt</span>
                  <ChevronDown aria-hidden="true" size={15} className="lp-citation__chevron" />
                </summary>
                <blockquote>{example.quote}</blockquote>
              </details>
            ) : (
              <p className="lp-conversation__notice">Informasi parkir belum tercantum di FAQ</p>
            )}
          </div>
        </div>
      </div>

      <div className="lp-questions">
        <span id="demo-questions">Coba pertanyaan</span>
        <div role="group" aria-labelledby="demo-questions">
          {examples.map(({ label }, index) => (
            <button
              type="button"
              key={label}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
