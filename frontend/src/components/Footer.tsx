import React from "react";
import Link from "next/link";
import { MessageSquareText } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <MessageSquareText className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">Tanyara</span>
            </div>
            <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
              Platform chatbot AI multi-tenant untuk bisnis, UMKM, dan organisasi di Indonesia.
              Ubah dokumen Anda menjadi asisten pintar yang melayani pelanggan 24/7.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Produk</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/dashboard" className="hover:text-slate-900">Dashboard Pemilik</Link></li>
              <li><Link href="/register" className="hover:text-slate-900">Pendaftaran Bisnis</Link></li>
              <li><span className="text-slate-400">Integrasi WhatsApp (Segera)</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Tautan</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/login" className="hover:text-slate-900">Masuk Akun</Link></li>
              <li><Link href="/register" className="hover:text-slate-900">Daftar Bisnis Baru</Link></li>
              <li><a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-slate-900">Dokumentasi API</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Tanyara. Dirancang untuk kemajuan UMKM dan Ekosistem Bisnis Indonesia.</p>
        </div>
      </div>
    </footer>
  );
}
