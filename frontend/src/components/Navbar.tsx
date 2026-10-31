import React from "react";
import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { Button } from "./ui/Button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-900 tracking-tight leading-tight">
              Tanyara
            </span>
            <span className="text-[10px] text-blue-600 font-semibold tracking-wider uppercase">
              Asisten AI Bisnis
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="#fitur" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Fitur
          </Link>
          <Link href="#cara-kerja" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Cara Kerja
          </Link>
          <Link href="#keamanan" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Keamanan
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Masuk
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm">
              Mulai Gratis
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
