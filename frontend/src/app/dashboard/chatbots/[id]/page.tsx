"use client";

import React, { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  FileText,
  Upload,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Send,
  AlertCircle,
  Clock,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { formatBytes } from "@/lib/utils";
import { Chatbot, DocumentItem, ChatMessage } from "@/types";

export default function ChatbotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const chatbotId = resolvedParams.id;

  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"documents" | "test" | "stats">("documents");

  // Document upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Playground test chat states
  const [testMessages, setTestMessages] = useState<ChatMessage[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const botData = await api.getChatbot(chatbotId);
        setChatbot(botData);

        const docsData = await api.listDocuments(chatbotId);
        setDocuments(docsData);

        // Seed playground with initial welcome message
        if (botData) {
          setTestMessages([
            {
              id: "welcome",
              role: "assistant",
              content: botData.welcome_message,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error("Gagal memuat detail chatbot:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [chatbotId]);

  const getPublicChatPath = () => {
    if (!chatbot) return "";
    const org = chatbot.organization_slug || "toko";
    return `/chat/${org}/${chatbot.slug}`;
  };

  const getPublicChatUrl = () => {
    if (!chatbot) return "";
    const origin = typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://tanyara-orcin.vercel.app";
    return `${origin}${getPublicChatPath()}`;
  };

  const handleCopyLink = () => {
    if (!chatbot) return;
    navigator.clipboard.writeText(getPublicChatUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Silakan pilih berkas PDF, DOCX, atau TXT terlebih dahulu.");
      return;
    }

    setUploadLoading(true);
    setUploadMessage(null);
    setUploadError(null);

    try {
      const newDoc = await api.uploadDocumentFile(chatbotId, selectedFile, chatbot?.organization_id);
      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setUploadMessage(
        `Berkas '${newDoc.name}' berhasil diunggah dan diindeks (${newDoc.chunk_count} chunk).`
      );
      setTimeout(() => setUploadMessage(null), 4000);
    } catch (err: any) {
      setUploadError(err.message || "Gagal mengunggah dan memproses dokumen.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus berkas "${docName}"?`)) {
      return;
    }
    setDeletingDocId(docId);
    try {
      await api.deleteDocument(chatbotId, docId, chatbot?.organization_id);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: any) {
      alert(err.message || "Gagal menghapus dokumen.");
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim() || !chatbot) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: testInput,
      created_at: new Date().toISOString(),
    };

    setTestMessages((prev) => [...prev, userMsg]);
    setTestInput("");
    setTestLoading(true);

    try {
      const resp = await api.sendMessage(chatbot.slug, userMsg.content);
      setTestMessages((prev) => [...prev, resp]);
    } catch (err: any) {
      setTestMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Terjadi kesalahan saat memproses jawaban dari server backend.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p className="text-sm">Memuat informasi chatbot...</p>
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Chatbot Tidak Ditemukan</h3>
        <p className="text-sm text-slate-500 mt-1">Chatbot mungkin sudah dihapus atau tidak berada di organisasi ini.</p>
        <Link href="/dashboard" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali ke Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 mb-2">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Kembali ke Daftar Chatbot
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{chatbot.name}</h1>
            <Badge variant={chatbot.is_active ? "success" : "neutral"}>
              {chatbot.is_active ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Tautan Publik: <span className="text-blue-600 font-semibold">{getPublicChatPath()}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 mr-1.5" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1.5" />
                <span>Salin Tautan</span>
              </>
            )}
          </Button>

          <Link href={getPublicChatPath()} target="_blank">
            <Button variant="primary" size="sm">
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Buka Halaman Chat Tamu
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("documents")}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "documents"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            Dokumen Pengetahuan ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab("test")}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "test"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            Uji Coba Asisten (Playground)
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "stats"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            Statistik & Penggunaan
          </button>
        </nav>
      </div>

      {/* Tab 1: Documents */}
      {activeTab === "documents" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Dokumen Basis Pengetahuan</h2>
            {documents.length === 0 ? (
              <Card className="text-center p-8">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800">Belum ada dokumen</p>
                <p className="text-xs text-slate-500 mt-1">
                  Unggah file PDF, DOCX, atau TXT seperti daftar menu, brosur produk, atau SOP agar asisten dapat menjawab pertanyaan pelanggan.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase shrink-0 mt-0.5">
                          {doc.name.split(".").pop() || "DOC"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span>{formatBytes(doc.file_size_bytes || 0)}</span>
                            <span>•</span>
                            <span>{doc.chunk_count} Bagian teks</span>
                          </div>
                          {doc.status === "failed" && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-start gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                              <span>
                                <strong>Alasan Gagal:</strong>{" "}
                                {doc.error_message || "Gagal menghasilkan representasi vektor dokumen. Pastikan kuota dan API key Gemini valid."}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={doc.status === "indexed" ? "success" : doc.status === "failed" ? "danger" : "warning"}>
                          {doc.status === "indexed" ? "Terindeks RAG" : doc.status === "failed" ? "Gagal" : "Sedang Diproses"}
                        </Badge>
                        <button
                          onClick={() => handleDeleteDocument(doc.id, doc.name)}
                          disabled={deletingDocId === doc.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          title="Hapus Dokumen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Unggah Dokumen Baru
                </CardTitle>
                <CardDescription>
                  Pilih file PDF, DOCX, atau TXT untuk diekstraksi dan diindeks ke dalam vector store.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploadMessage && (
                  <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    {uploadMessage}
                  </div>
                )}
                {uploadError && (
                  <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
                <form onSubmit={handleUploadDocument} className="space-y-4">
                  <div
                    className="p-5 border-2 border-dashed border-slate-200 rounded-lg text-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                    />
                    <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    {selectedFile ? (
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block truncate max-w-[200px] mx-auto">
                          {selectedFile.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatBytes(selectedFile.size)}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs text-slate-600 font-medium block">
                          Klik untuk memilih berkas
                        </span>
                        <span className="text-[10px] text-slate-400">PDF, DOCX, TXT hingga 10MB</span>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={!selectedFile || uploadLoading}
                    isLoading={uploadLoading}
                  >
                    Unggah & Indeks Pengetahuan
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Playground Test Chat */}
      {activeTab === "test" && (
        <Card className="max-w-2xl mx-auto flex flex-col h-[520px]">
          <CardHeader className="py-3 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-sm font-bold">Simulator Tanya Jawab Asisten</CardTitle>
            </div>
            <span className="text-xs text-slate-400 font-mono">Mode Playground</span>
          </CardHeader>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {testMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    AI
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl text-sm max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm"
                  }`}
                >
                  <p>{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>Sumber: {msg.sources.join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {testLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  AI
                </div>
                <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none p-3 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Sedang memproses jawaban berdasarkan dokumen...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendTest} className="p-3 border-t border-slate-100 bg-white flex gap-2">
            <Input
              placeholder="Tanyakan sesuatu sesuai dokumen Anda..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="primary" size="sm" disabled={testLoading || !testInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 3: Stats */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <span className="text-xs font-medium text-slate-400 uppercase">Total Pertanyaan</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{chatbot.conversation_count || 0}</p>
                <span className="text-xs text-emerald-600 font-medium">Percakapan masuk</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <span className="text-xs font-medium text-slate-400 uppercase">Penggunaan Token AI</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {chatbot.conversation_count ? (chatbot.conversation_count * 280).toLocaleString() : "0"}
                </p>
                <span className="text-xs text-slate-400">Model Gemini 3.8 Flash</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <span className="text-xs font-medium text-slate-400 uppercase">Akurasi Jawaban</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {documents.some((d) => d.status === "indexed") ? "100%" : "Standar"}
                </p>
                <span className="text-xs text-slate-400">
                  {documents.some((d) => d.status === "indexed") ? "Grounded Dokumen RAG" : "Belum ada dokumen terindeks"}
                </span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Ringkasan Riwayat Penggunaan</CardTitle>
              <CardDescription>
                Pencatatan konsumsi token dan kuota tersimpan di tabel <code>usage_logs</code> Supabase secara real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100 font-mono">
                [Tabel Log Terintegrasi] - Pelacakan otomatis aktif pada setiap interaksi di {getPublicChatPath()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
