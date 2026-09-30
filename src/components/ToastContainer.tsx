import { useEffect, useState } from 'react';
import { ToastNotification } from '../types';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastNotification[];
  onRemove: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

const colorMap = {
  success: 'bg-emerald-50 border-emerald-400 text-emerald-800',
  warning: 'bg-amber-50 border-amber-400 text-amber-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  info: 'bg-blue-50 border-blue-400 text-blue-800',
};

const iconColorMap = {
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
  info: 'text-blue-500',
};

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastNotification; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = iconMap[toast.type];

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const timer = setTimeout(() => setIsVisible(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`
        ${colorMap[toast.type]}
        border-l-4 rounded-lg shadow-lg p-4 transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColorMap[toast.type]}`} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{toast.title}</p>
          <p className="text-xs mt-1 opacity-80">{toast.message}</p>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
