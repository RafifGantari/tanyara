"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Plus,
  FileText,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Activity,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { Chatbot } from "@/types";

export default function DashboardPage() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await api.listChatbots();
        setChatbots(list);
      } catch (err) {
        console.error("Gagal memuat daftar chatbot:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCopyLink = (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/chat/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Pemilik Bisnis
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola asisten virtual dan pantau dokumen pengetahuan bisnis Anda.
          </p>
        </div>
        <Link href="/dashboard/chatbots/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-1.5" />
            Buat Chatbot Baru
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Chatbot</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{chatbots.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dokumen Terindeks</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {chatbots.reduce((acc, curr) => acc + (curr.document_count || 0), 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Percakapan</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {chatbots.reduce((acc, curr) => acc + (curr.conversation_count || 0), 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status Backend</p>
              <p className="text-sm font-semibold text-emerald-600 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                API Berjalan
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chatbots List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Daftar Chatbot Anda</h2>
          <span className="text-xs text-slate-500">Isolasi Organisasi Aktif</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <p className="text-sm">Memuat daftar chatbot...</p>
          </div>
        ) : chatbots.length === 0 ? (
          <Card className="text-center p-12">
            <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">Belum ada chatbot</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Mulai buat asisten virtual pertama Anda untuk menjawab pertanyaan pelanggan secara otomatis.
            </p>
            <div className="mt-5">
              <Link href="/dashboard/chatbots/new">
                <Button variant="primary" size="sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Buat Chatbot Sekarang
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {chatbots.map((bot) => (
              <Card key={bot.id} className="flex flex-col justify-between hover:border-slate-300 transition-colors">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base leading-snug">{bot.name}</CardTitle>
                        <span className="text-xs text-slate-400 font-mono">/chat/{bot.slug}</span>
                      </div>
                    </div>
                    <Badge variant={bot.is_active ? "success" : "neutral"}>
                      {bot.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  {bot.description && (
                    <CardDescription className="line-clamp-2 mt-2">
                      {bot.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="py-2">
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block">Dokumen:</span>
                      <span className="font-semibold">{bot.document_count || 0} Terindeks</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Percakapan:</span>
                      <span className="font-semibold">{bot.conversation_count || 0} Tamu</span>
                    </div>
                  </div>
                </CardContent>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopyLink(bot.slug)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-medium py-1 px-2 rounded hover:bg-white transition-colors"
                    title="Salin Tautan Publik"
                  >
                    {copiedSlug === bot.slug ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Tautan</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/chat/${bot.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 py-1 px-2 rounded hover:bg-white"
                      title="Buka Halaman Chat Publik"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <Link href={`/dashboard/chatbots/${bot.id}`}>
                      <Button variant="outline" size="sm">
                        Kelola
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Feature roadmap note */}
      <div className="rounded-xl p-4 bg-blue-50/60 border border-blue-200/60 text-xs text-blue-800 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Catatan Tahap Pengembangan (MVP Foundation):</strong>
          <p className="mt-0.5 leading-relaxed">
            Fondasi multi-tenant, antarmuka dashboard, manajemen chatbot, dan chat publik telah aktif. Pipeline indexing pgvector embeddings dan integrasi model Gemini API siap diaktifkan melalui backend environment keys.
          </p>
        </div>
      </div>
    </div>
  );
}
