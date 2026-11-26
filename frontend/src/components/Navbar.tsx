import Link from "next/link";
import { Logo } from "./landing/Brand";

const links = [
  { href: "#produk", label: "Contoh chat" },
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#pertanyaan", label: "FAQ" },
];

export function Navbar() {
  return (
    <header className="nav lp-nav">
      <div className="wrap lp-wrap lp-nav__inner">
        <Link href="/" className="nav__logo lp-wordmark" aria-label="TanyaRa, beranda">
          <Logo />
        </Link>

        <nav className="lp-nav__links" aria-label="Navigasi utama">
          {links.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </nav>

        <div className="nav__actions lp-nav__actions">
          <Link href="/login" className="lp-nav__signin">Masuk</Link>
          <Link href="/register" className="lp-button lp-button--primary lp-button--small">
            Buat chatbot
          </Link>
        </div>
      </div>
    </header>
  );
}
