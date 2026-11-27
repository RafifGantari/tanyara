"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { Logo } from "@/components/Brand";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      // In dev mode when Supabase credentials are not configured, simulate successful login
      setTimeout(() => {
        setLoading(false);
        router.push("/dashboard");
      }, 500);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk ke akun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center" aria-label="TanyaRa, beranda">
          <Logo className="h-auto w-40" />
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">Masuk ke Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">
          Kelola chatbot dan pengetahuan bisnis Anda
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            {!isSupabaseConfigured && (
              <div className="mb-4 p-3 rounded-lg bg-warning-soft border border-warning-border text-warning-ink text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning-ink shrink-0 mt-0.5" />
                <div>
                  <strong>Mode Simulasi Lokal:</strong> Kredensial Supabase belum diisi di <code>.env</code>. Anda dapat langsung mengklik Masuk untuk menjelajahi dashboard.
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-danger-soft border border-danger-border text-danger-ink text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Alamat Email"
                type="email"
                required
                placeholder="nama@bisnisanda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Kata Sandi"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button type="submit" size="md" className="w-full mt-2" isLoading={loading}>
                Masuk ke Akun
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
              Belum memiliki akun bisnis?{" "}
              <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                Daftar sekarang
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
