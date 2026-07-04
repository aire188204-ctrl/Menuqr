'use client';

import { useEffect } from 'react';
import { useToastStore } from '@/lib/store';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export function Toast() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'success'
            ? CheckCircle
            : toast.type === 'error'
              ? AlertCircle
              : toast.type === 'warning'
                ? AlertTriangle
                : Info;

        const bgColor =
          toast.type === 'success'
            ? 'bg-hyper-green-10 border-hyper-green-20'
            : toast.type === 'error'
              ? 'bg-neon-red-10 border-neon-red-20'
              : toast.type === 'warning'
                ? 'bg-yellow-900/20 border-yellow-700/30'
                : 'bg-electric-cyan-10 border-electric-cyan-20';

        const textColor =
          toast.type === 'success'
            ? 'text-hyper-green'
            : toast.type === 'error'
              ? 'text-neon-red'
              : toast.type === 'warning'
                ? 'text-yellow-400'
                : 'text-electric-cyan';

        return (
          <ToastItem
            key={toast.id}
            icon={Icon}
            bgColor={bgColor}
            textColor={textColor}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration || 4000}
          />
        );
      })}
    </div>
  );
}

function ToastItem({
  icon: Icon,
  bgColor,
  textColor,
  message,
  onClose,
  duration,
}: {
  icon: any;
  bgColor: string;
  textColor: string;
  message: string;
  onClose: () => void;
  duration: number;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Base glassmorphic styling
  const baseClasses = 'flex items-center gap-3 px-5 py-4 rounded-lg border slide-in';
  const glassEffect = 'glassmorphic-premium';
  
  return (
    <div
      className={`${baseClasses} ${glassEffect} ${bgColor}`}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${textColor}`} />
      <p className={`text-sm font-medium ${textColor}`}>{message}</p>
      <button
        onClick={onClose}
        className="ml-auto flex-shrink-0 hover:opacity-80 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X className={`w-4 h-4 ${textColor}`} />
      </button>
    </div>
  );
}
