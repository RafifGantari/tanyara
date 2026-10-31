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
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { ChatbotPublic, ChatMessage } from "@/types";

export default function StorePublicChatPage({
  params,
}: {
  params: Promise<{ orgSlug: string; chatbotSlug: string }>;
}) {
  const resolvedParams = use(params);
  const orgSlug = resolvedParams.orgSlug;
  const chatbotSlug = resolvedParams.chatbotSlug;

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
        const bot = await api.getPublicChatbot(chatbotSlug, orgSlug);
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
  }, [chatbotSlug, orgSlug]);

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
      const response = await api.sendMessage(chatbotSlug, userText, undefined, orgSlug);
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
          <p className="text-sm font-medium text-slate-600">Menghubungkan ke asisten AI toko...</p>
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
            Halaman asisten untuk toko ini mungkin belum dipublikasikan atau dinonaktifkan sementara oleh pemilik bisnis.
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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-base leading-tight">{chatbot.name}</h1>
                <Badge variant="success" className="text-[10px] py-0 px-1.5">
                  Online
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {chatbot.organization_name ? `${chatbot.organization_name} • ` : ""}
                {chatbot.description || "Asisten cerdas berbasis dokumen bisnis"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Didukung Dokumen Resmi</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages Body */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 space-y-4 overflow-y-auto">
        <div className="text-center py-4">
          <span className="text-[11px] text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
            Percakapan ini didukung AI Retrieval-Augmented Generation (RAG)
          </span>
        </div>

        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? "bg-slate-800 text-white"
                    : "bg-blue-600 text-white"
                }`}
              >
                {isUser ? "Anda" : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-2xs ${
                  isUser
                    ? "bg-blue-600 text-white rounded-tr-xs"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-400">
                    <span className="font-semibold text-slate-500 block mb-1">Sumber Referensi:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {msg.sources.map((src, i) => (
                        <li key={i} className="truncate">{src}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {sending && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 shadow-2xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-400 ml-1">Mencari informasi dokumen...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input Form Footer */}
      <footer className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-10">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2">
          <Input
            placeholder="Ketik pertanyaan seputar produk atau layanan toko..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            className="flex-1 text-sm bg-slate-50 focus:bg-white"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={sending || !input.trim()}
            className="px-5"
          >
            <Send className="w-4 h-4 mr-1.5" />
            Kirim
          </Button>
        </form>
        <div className="max-w-3xl mx-auto mt-2 text-center text-[11px] text-slate-400">
          Didukung oleh{" "}
          <Link href="/" className="font-semibold text-slate-600 hover:text-blue-600">
            Tanyara
          </Link>{" "}
          • AI Asisten Khusus Bisnis & UMKM Indonesia
        </div>
      </footer>
    </div>
  );
}
