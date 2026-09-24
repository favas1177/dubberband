"use client";

import { Bell, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface TopHeaderProps {
  breadcrumbs: { label: string; href?: string }[];
  onNewTranslation?: () => void;
}

export function TopHeader({ breadcrumbs, onNewTranslation }: TopHeaderProps) {
  const { addToast } = useToast();

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 z-20 flex items-center px-6 gap-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 flex-1" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-1.5">
            {idx > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
            )}
            <span
              className={
                idx === breadcrumbs.length - 1
                  ? "text-sm font-semibold text-slate-800"
                  : "text-sm text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              }
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Search bar */}
      <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-56 group focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-200">
        <Search className="h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
        <input
          type="text"
          placeholder="Search projects..."
          className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none flex-1 w-full"
        />
      </div>

      {/* Notification bell */}
      <div className="relative">
        <button
          id="notification-bell"
          aria-label="Notifications"
          onClick={() => addToast("No unread notifications", "info")}
          className="relative h-9 w-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
        >
          <Bell className="h-4 w-4" />
          {/* Unread dot */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white" />
        </button>
      </div>

      {/* New Translation CTA */}
      <Button
        id="new-translation-btn"
        variant="default"
        size="default"
        className="gap-2"
        onClick={onNewTranslation}
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        New Translation
      </Button>
    </header>
  );
}
