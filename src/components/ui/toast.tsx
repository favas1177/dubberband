"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));
    // Auto-dismiss
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl",
        "border transition-all duration-300",
        "min-w-72 max-w-sm",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0",
        toast.type === "success"
          ? "bg-slate-900 border-teal-500/30 text-white"
          : "bg-slate-900 border-red-500/30 text-white"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0",
          toast.type === "success" ? "bg-teal-500/20" : "bg-red-500/20"
        )}
      >
        <CheckCircle2
          className={cn(
            "h-4 w-4",
            toast.type === "success" ? "text-teal-400" : "text-red-400"
          )}
        />
      </div>

      {/* Message */}
      <p className="text-sm font-medium flex-1">{toast.message}</p>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Hook ───────────────────────────────────────────────────────────────── */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastMessage["type"] = "success") => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, dismissToast };
}
