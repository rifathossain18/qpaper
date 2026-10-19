import { createContext, useContext, useState, useCallback } from 'react';
import { Icon } from '../components/Icons';

const ToastContext = createContext(null);

const config = {
  success: { bg: 'bg-emerald-600', icon: 'check' },
  error:   { bg: 'bg-rose-600',    icon: 'x' },
  warning: { bg: 'bg-amber-500',   icon: 'chevron' },
  info:    { bg: 'bg-indigo-600',  icon: 'sparkles' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm">
        {toasts.map((t) => {
          const c = config[t.type] || config.info;
          return (
            <div
              key={t.id}
              className={`${c.bg} flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl shadow-slate-900/20 text-white text-sm animate-slide-up`}
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name={c.icon} className="w-3 h-3" strokeWidth={3} />
              </div>
              <span className="flex-1">{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);