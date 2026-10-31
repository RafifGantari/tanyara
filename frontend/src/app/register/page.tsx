"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquareText, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setTimeout(() => {
        setLoading(false);
        router.push("/dashboard");
      }, 500);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName,
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("rate limit")) {
          setErrorMsg(
            "Batas pengiriman email Supabase terlampaui (maksimal 3-4 email/jam pada layanan bawaan Supabase). Solusi: Nonaktifkan 'Confirm email' di Supabase Dashboard (Authentication > Providers > Email) agar akun langsung aktif untuk pengujian."
          );
        } else {
          setErrorMsg(error.message);
        }
      } else if (data?.user && !data?.session) {
        setSuccessMsg(
          "Akun berhasil didaftarkan! Supabase mengirimkan tautan konfirmasi ke email Anda. Silakan verifikasi email Anda atau nonaktifkan 'Confirm email' di dashboard Supabase untuk langsung masuk."
        );
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal membuat akun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <MessageSquareText className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">Tanyara</span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">Daftarkan Bisnis Anda</h2>
        <p className="mt-1 text-sm text-slate-600">
          Buat chatbot asisten cerdas pertama Anda dalam hitungan menit
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            {!isSupabaseConfigured && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Mode Simulasi Lokal:</strong> Supabase auth belum terhubung ke cloud. Pendaftaran akan langsung membuka dashboard demo.
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nama Bisnis / UMKM"
                type="text"
                required
                placeholder="Contoh: Kedai Kopi Nusantara"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />

              <Input
                label="Alamat Email Pemilik"
                type="email"
                required
                placeholder="pemilik@kedaikopi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Kata Sandi Baru"
                type="password"
                required
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button type="submit" size="md" className="w-full mt-2" isLoading={loading}>
                Buat Akun Bisnis
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
              Sudah memiliki akun?{" "}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Masuk ke sini
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
