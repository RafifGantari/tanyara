"use client";

import React, { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import {
  MessageSquareText,
  Send,
  Bot,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { ChatbotPublic, ChatMessage } from "@/types";

export default function PublicChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [chatbot, setChatbot] = useState<ChatbotPublic | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadChatbot() {
      try {
        const bot = await api.getPublicChatbot(slug);
        setChatbot(bot);
        // Set initial welcome message
        setMessages([
          {
            id: "welcome-msg",
            role: "assistant",
            content: bot.welcome_message,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.error("Chatbot tidak ditemukan:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadChatbot();
  }, [slug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || !chatbot) return;

    const userText = input.trim();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userText,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const response = await api.sendMessage(slug, userText);
      setMessages((prev) => [...prev, response]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Mohon maaf, asisten sedang mengalami gangguan jaringan. Silakan coba kembali sesaat lagi.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Menghubungkan ke asisten AI...</p>
        </div>
      </div>
    );
  }

  if (notFound || !chatbot) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Chatbot Tidak Tersedia</h2>
          <p className="text-sm text-slate-500">
            Halaman asisten yang Anda tuju mungkin belum dipublikasikan atau dinonaktifkan sementara oleh pemilik bisnis.
          </p>
          <div className="pt-2">
            <Link href="/">
              <Button variant="outline" size="sm">
                Pelajari Layanan Tanyara
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 sm:py-6 sm:px-4">
      {/* Container - mobile full screen, desktop centered card */}
      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto bg-white sm:rounded-2xl sm:shadow-lg sm:border border-slate-200 overflow-hidden">
        {/* Header */}
        <header className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-base">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-base leading-tight">{chatbot.name}</h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
              </div>
              <p className="text-xs text-slate-500 leading-tight">
                {chatbot.description || "Asisten Pintar Resmi Bisnis"}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Didukung Tanyara AI</span>
          </div>
        </header>

        {/* Message Thread */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/70 min-h-[380px]">
          {/* Security Notice for Public Visitor */}
          <div className="text-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200/60 text-slate-600 text-[11px] font-medium">
              🔒 Percakapan langsung tanpa login. Jawaban dibuat berdasarkan dokumen resmi bisnis.
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mb-1">
                  AI
                </div>
              )}
              <div
                className={`p-3.5 rounded-2xl text-sm leading-relaxed max-w-[85%] sm:max-w-[75%] shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    <span>Sumber: {msg.sources.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex items-end gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mb-1">
                AI
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-none p-3.5 text-xs text-slate-500 shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span>Asisten sedang menganalisis dokumen dan mengetik balasan...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <footer className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Ketik pertanyaan Anda di sini..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-full px-4 py-2.5 text-sm bg-slate-50 border-slate-300 focus:bg-white"
              disabled={sending}
              autoFocus
            />
            <Button
              type="submit"
              variant="primary"
              className="rounded-full w-10 h-10 p-0 shrink-0"
              disabled={sending || !input.trim()}
              title="Kirim Pesan"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-2 text-center text-[10px] text-slate-400">
            Didukung oleh{" "}
            <Link href="/" target="_blank" className="font-semibold text-slate-500 hover:text-blue-600">
              Tanyara
            </Link>{" "}
            • Platform Chatbot AI UMKM Indonesia
          </div>
        </footer>
      </div>
    </div>
  );
}
