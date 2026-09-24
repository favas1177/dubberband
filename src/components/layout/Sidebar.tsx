"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Languages,
  FolderOpen,
  Settings,
  Zap,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Video Translate",
    href: "/",
    icon: Languages,
    isActive: true,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderOpen,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  const [credits, setCredits] = useState(0);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", user.id)
          .single();
        if (profile) setCredits(profile.credits);
      }
    };
    fetchProfile();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 flex flex-col z-30 border-r border-white/5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/40">
          <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-white font-bold text-base tracking-tight">
            Dubberband
          </span>
          <p className="text-xs text-slate-500 leading-none mt-0.5">AI Video Translation</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">
          Main Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive || pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-gradient-to-r from-indigo-600/30 to-teal-500/20 text-white border border-indigo-500/30 shadow-inner"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-indigo-400 to-teal-400 rounded-r-full" />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-colors",
                  isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-indigo-400/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Credits */}
      <div className="px-3 pb-3">
        <div className="bg-white/5 rounded-xl p-4 border border-white/8">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300">
              Credits Remaining
            </span>
            <span className="text-xs font-bold text-indigo-400">{credits} / 500</span>
          </div>
          <Progress value={(credits / 500) * 100} className="h-1.5 bg-white/10" />
          <p className="text-[10px] text-slate-500 mt-2">
            {(500 - credits)} credits used this month
          </p>
        </div>
      </div>

      {/* User profile */}
      <div className="px-3 pb-4 border-t border-white/5 pt-3">
        <div className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl group">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-teal-400 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-md shadow-indigo-500/30">
            {email.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 text-left truncate min-w-0">
            <p className="text-sm font-semibold text-white leading-none truncate">{email || "User"}</p>
            <p className="text-xs text-slate-500 leading-none mt-1">Pro Plan</p>
          </div>
          <button onClick={handleSignOut} className="p-1 hover:bg-white/10 rounded-md transition-colors" title="Sign out">
            <LogOut className="h-4 w-4 text-slate-400 hover:text-red-400" />
          </button>
        </div>
      </div>
    </aside>
  );
}
