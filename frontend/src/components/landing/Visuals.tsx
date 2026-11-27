"use client";

import { useState } from "react";

const examples = [
  {
    label: "Jam buka",
    question: "Besok buka jam berapa?",
    answer: "Kedai buka pukul 08.00–21.00 setiap hari.",
    source: "hours",
  },
  {
    label: "Pilihan gula",
    question: "Kopi susu gulanya bisa dikurangi?",
    answer: "Bisa. Minta gula setengah atau tanpa gula saat memesan kopi susu.",
    source: "sugar",
  },
  {
    label: "Parkir",
    question: "Ada tempat parkir mobil?",
    answer: "Informasi parkir mobil belum ada di dokumen kedai. Silakan tanyakan langsung ke staf kedai.",
    source: null,
  },
] as const;

const notes = [
  { id: "hours", title: "Jam buka", text: "Setiap hari, pukul 08.00–21.00." },
  { id: "sugar", title: "Kopi susu", text: "Pilihan gula: normal, setengah, atau tanpa gula." },
  { id: "order", title: "Pemesanan", text: "Pesan langsung di kasir kedai." },
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

      <div className="lp-questions">
        <span id="demo-questions">Pilih pertanyaan</span>
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

      <div className="lp-demo__stage">
        <article className="lp-reply" aria-live="polite" aria-atomic="true">
          <div key={selected} className="lp-reply__content">
            <p className="lp-reply__question">{example.question}</p>
            <p className="lp-reply__answer">{example.answer}</p>
            <span className="lp-reply__source" data-match={Boolean(example.source)}>
              {example.source ? "Sumber: FAQ Kedai Sore.txt" : "Tidak ada kutipan yang cocok"}
            </span>
          </div>
        </article>

        <article className="lp-source" aria-label="Isi dokumen contoh">
          <div className="lp-source__heading">
            <span>Dokumen contoh</span>
            <h3>FAQ Kedai Sore.txt</h3>
          </div>
          <dl>
            {notes.map((note) => (
              <div key={note.id} className={example.source === note.id ? "lp-source__match" : undefined}>
                <dt>{note.title}</dt>
                <dd>{note.text}</dd>
              </div>
            ))}
          </dl>
        </article>

        <span
          key={selected}
          className="lp-demo__transfer"
          data-match={Boolean(example.source)}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
