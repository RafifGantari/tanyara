"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { api } from "@/lib/api";

export default function NewChatbotPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("Halo! Ada yang bisa saya bantu hari ini?");
  const [systemPrompt, setSystemPrompt] = useState(
    "Anda adalah asisten AI yang ramah, profesional, dan membantu pelanggan dengan informasi akurat berdasarkan dokumen bisnis yang disediakan."
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    // Auto-generate slug from name if slug hasn't been manually heavily edited
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const newBot = await api.createChatbot({
        name,
        slug,
        description,
        welcome_message: welcomeMessage,
        system_prompt: systemPrompt,
        is_active: true,
      });

      router.push(`/dashboard/chatbots/${newBot.id}`);
    } catch (err: any) {
      setError(err.message || "Gagal membuat chatbot baru. Periksa kembali form input.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali ke Dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Buat Chatbot Asisten Baru</CardTitle>
              <CardDescription>
                Konfigurasikan profil awal asisten AI untuk bisnis Anda.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Nama Chatbot"
              required
              placeholder="Contoh: Asisten Toko Roti Manis"
              value={name}
              onChange={handleNameChange}
              helperText="Nama yang akan ditampilkan kepada pelanggan saat berinteraksi."
            />

            <Input
              label="Slug URL Publik"
              required
              placeholder="contoh: toko-roti-manis"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              helperText={`Tautan publik chatbot Anda nantinya adalah: /chat/${slug || "slug-anda"}`}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Deskripsi Singkat (Opsional)
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={2}
                placeholder="Penjelasan singkat tujuan chatbot ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Pesan Sambutan Awal (Welcome Message)
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={2}
                required
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">Pesan pertama yang langsung dilihat pengunjung web saat membuka halaman chat.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Instruksi Sistem (System Prompt)
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={3}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">Panduan gaya bicara dan kepribadian asisten AI Anda.</p>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <Link href="/dashboard">
              <Button variant="ghost" type="button">
                Batal
              </Button>
            </Link>
            <Button variant="primary" type="submit" isLoading={loading}>
              <Save className="w-4 h-4 mr-1.5" />
              Simpan & Lanjutkan
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
