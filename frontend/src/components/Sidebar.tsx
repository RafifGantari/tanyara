"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  PlusCircle,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  MessageSquareText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export function Sidebar() {
  const pathname = usePathname();
  const [orgName, setOrgName] = useState<string>("Memuat...");

  useEffect(() => {
    let isMounted = true;
    async function loadOrg() {
      try {
        const orgs = await api.listOrganizations();
        if (isMounted && orgs && orgs.length > 0) {
          setOrgName(orgs[0].name);
        } else if (isMounted) {
          setOrgName("Bisnis Saya");
        }
      } catch {
        if (isMounted) setOrgName("Bisnis Saya");
      }
    }
    loadOrg();
    return () => {
      isMounted = false;
    };
  }, []);

  const navigation = [
    { name: "Ringkasan", href: "/dashboard", icon: LayoutDashboard },
    { name: "Buat Chatbot Baru", href: "/dashboard/chatbots/new", icon: PlusCircle },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-900 tracking-tight leading-tight">
              Tanyara
            </span>
            <span className="text-[10px] text-blue-600 font-semibold tracking-wider uppercase">
              Dashboard
            </span>
          </div>
        </Link>
      </div>

      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
        <span className="text-xs text-slate-500 font-medium block">Organisasi Anda:</span>
        <span className="text-sm font-semibold text-slate-800 truncate block">{orgName}</span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 py-2">
          Menu Utama
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-slate-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    </aside>
  );
}
