"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setCheckingAuth(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setCheckingAuth(false);
      return;
    }

    async function checkSession() {
      try {
        const { data } = await supabase!.auth.getSession();
        if (!data.session) {
          router.push("/login");
        } else {
          setCheckingAuth(false);
        }
      } catch (err) {
        console.error("Session check error:", err);
        router.push("/login");
      }
    }

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Memverifikasi sesi login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {!isSupabaseConfigured && (
          <div className="bg-amber-500 text-amber-950 text-xs px-4 py-1.5 text-center font-medium border-b border-amber-600/20">
            Mode Pengembangan Offline: Kredensial Supabase belum dikonfigurasi di <code>.env.local</code>. Menampilkan data lokal.
          </div>
        )}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
