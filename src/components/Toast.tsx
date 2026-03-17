"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle, X, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";
type ToastItem = { id: string; message: string; type: ToastType; visible: boolean };

const ToastContext = createContext<{
  toast: (message: string, type?: ToastType) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type, visible: false }]);
    // Trigger enter animation on next tick
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, visible: true } : t));
    }, 10);
    // Auto-dismiss after 4s
    setTimeout(() => dismiss(id), 4000);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, visible: false } : t));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 350);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              transition: "opacity 0.3s ease, transform 0.3s ease",
              opacity: t.visible ? 1 : 0,
              transform: t.visible ? "translateY(0)" : "translateY(16px)",
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium pointer-events-auto max-w-sm ${
              t.type === "success"
                ? "bg-emerald-950/95 border-emerald-700/50 text-emerald-200"
                : t.type === "error"
                ? "bg-red-950/95 border-red-700/50 text-red-200"
                : "bg-zinc-900/95 border-zinc-700 text-zinc-200"
            }`}
          >
            {t.type === "success" && <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />}
            {t.type === "error" && <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />}
            {t.type === "info" && <Info className="w-4 h-4 shrink-0 text-blue-400" />}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-1 opacity-50 hover:opacity-100 transition-opacity shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
