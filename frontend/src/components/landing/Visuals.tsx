"use client";

import { useState } from "react";

const examples = [
  {
    label: "Jam buka",
    question: "Besok buka jam berapa?",
    answer: "Kedai buka pukul 08.00–21.00 setiap hari.",
  },
  {
    label: "Pilihan gula",
    question: "Kopi susu gulanya bisa dikurangi?",
    answer: "Bisa. Minta gula setengah atau tanpa gula saat memesan kopi susu.",
  },
  {
    label: "Parkir",
    question: "Ada tempat parkir mobil?",
    answer: "Informasi parkir mobil belum tercantum di FAQ. Silakan tanyakan langsung ke staf kedai.",
  },
] as const;

export function ChatDemo() {
  const [selected, setSelected] = useState(0);
  const example = examples[selected];

  return (
    <section
      className="lp-demo hero__media"
      id="produk"
      aria-labelledby="demo-title"
      aria-describedby="demo-description"
    >
      <div className="lp-demo__frame">
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
            </div>
          </div>
        </div>

        <div className="lp-questions">
          <span id="demo-questions">Contoh pertanyaan</span>
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
      </div>
      <p id="demo-description" className="lp-demo__description">
        Di chat pelanggan, nama dokumen sumber muncul saat tersedia.
      </p>
    </section>
  );
}
