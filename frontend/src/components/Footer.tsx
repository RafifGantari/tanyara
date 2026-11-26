import Link from "next/link";
import { Logo } from "./landing/Brand";

export function Footer() {
  return (
    <footer className="lp-footer" id="footer">
      <div className="wrap lp-wrap">
        <div className="lp-close">
          <h2>Mulai dari satu dokumen</h2>
          <div>
            <p>Pilih katalog, menu, atau FAQ yang sudah Anda punya. Uji jawabannya sebelum tautannya dibagikan ke pelanggan.</p>
            <Link href="/register" className="lp-button lp-button--light">Buat chatbot</Link>
          </div>
        </div>
      </div>

      <div className="lp-footer__strip">
        <div className="wrap lp-wrap lp-footer__bottom">
          <Link href="/" className="lp-wordmark" aria-label="TanyaRa, beranda">
            <Logo />
          </Link>
          <nav aria-label="Navigasi footer">
            <a href="#produk">Contoh chat</a>
            <a href="#cara-kerja">Cara kerja</a>
            <a href="#pertanyaan">FAQ</a>
            <Link href="/login">Masuk</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
