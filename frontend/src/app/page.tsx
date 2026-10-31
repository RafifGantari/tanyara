import React from "react";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  Share2,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Bot,
  Zap,
  Building2,
  HelpCircle,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-blue-50/50 via-white to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Platform AI Chatbot Multi-Tenant untuk Bisnis & UMKM Indonesia</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Ubah Dokumen Menjadi{" "}
                <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">
                  Asisten AI
                </span>{" "}
                untuk Bisnis Anda.
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed">
                Unggah dokumen SOP, daftar menu, atau katalog produk. Dapatkan chatbot pintar dengan tautan publik khusus dalam hitungan menit—tanpa perlu kemampuan pemrograman.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full">
                    Mulai Buat Chatbot Sekarang
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/chat/kedai-kopi-nusantara" target="_blank" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full">
                    <Bot className="w-4 h-4 mr-1 text-blue-600" />
                    Coba Demo Publik Tamu
                  </Button>
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Isolasi Data Aman Antar Bisnis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pelanggan Tidak Perlu Login</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Dukungan Dokumen PDF & Teks</span>
                </div>
              </div>
            </div>

            {/* Visual Preview */}
            <div className="mt-16 max-w-4xl mx-auto rounded-2xl border border-slate-200/80 bg-slate-900/5 p-3 shadow-xl backdrop-blur-sm">
              <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-mono text-slate-500">tanyara.id/chat/kedai-kopi-nusantara</span>
                  </div>
                  <Badge variant="success">Chatbot Aktif</Badge>
                </div>
                <div className="p-6 bg-slate-50/50 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 text-xs font-bold">
                      AI
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-800 shadow-sm max-w-md">
                      Selamat datang di Kedai Kopi Nusantara! Ada yang bisa kami bantu seputar menu biji kopi pilihan atau reservasi hari ini?
                    </div>
                  </div>
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm p-4 text-sm shadow-sm max-w-md">
                      Apakah ada pilihan kopi manual brew dengan biji kopi Aceh Gayo?
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 text-xs font-bold">
                      AI
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-800 shadow-sm max-w-md">
                      Tentu! Menurut menu kami, tersedia <strong>Single Origin Aceh Gayo</strong> dengan metode V60 atau Aeropress seharga Rp28.000, dengan profil rasa citrus dan earthy yang seimbang.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="fitur" className="py-20 bg-slate-50 border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Fitur Utama</h2>
              <p className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                Solusi Cerdas untuk Meningkatkan Pelayanan Bisnis
              </p>
              <p className="mt-4 text-base text-slate-600">
                Semua yang dibutuhkan pelaku usaha untuk memberikan layanan tanya jawab otomatis yang akurat.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-5">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Unggah Dokumen Bisnis</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Mendukung dokumen PDF panduan produk, daftar harga, SOP layanan, dan FAQ. AI mempelajari informasi bisnis Anda secara otomatis.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
                    <Share2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Tautan Publik Khusus</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Setiap bot memiliki tautan web publik tersendiri (misal: <code>/chat/nama-toko</code>). Bagikan ke media sosial atau bio Instagram dengan mudah.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 mb-5">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Keamanan Multi-Tenant</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Didukung Row-Level Security (RLS) PostgreSQL. Dokumen dan data pelanggan bisnis Anda terisolasi aman dari organisasi lain.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="cara-kerja" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">3 Langkah Mudah</h2>
              <p className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                Cara Kerja Tanyara
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-4xl font-extrabold text-blue-600/30">01</span>
                <h4 className="text-lg font-bold text-slate-900 mt-2 mb-2">Daftar & Buat Profil Bot</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Tentukan nama chatbot dan pesan sambutan yang mencerminkan keramahan bisnis Anda.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-4xl font-extrabold text-blue-600/30">02</span>
                <h4 className="text-lg font-bold text-slate-900 mt-2 mb-2">Unggah Pengetahuan Bisnis</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Masukkan dokumen menu, katalog, atau aturan toko yang ingin dijawab oleh asisten.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-4xl font-extrabold text-blue-600/30">03</span>
                <h4 className="text-lg font-bold text-slate-900 mt-2 mb-2">Bagikan Tautan ke Pelanggan</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Pelanggan langsung bisa bertanya melalui browser ponsel tanpa perlu mengunduh aplikasi atau membuat akun.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Siap Menghadirkan Layanan 24 Jam untuk Bisnis Anda?
            </h2>
            <p className="text-blue-100 text-base sm:text-lg">
              Bergabunglah dengan pelaku usaha Indonesia lainnya dan manfaatkan kecerdasan buatan sekarang.
            </p>
            <div>
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-md">
                  Mulai Sekarang Gratis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
