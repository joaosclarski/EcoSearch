'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

/**
 * Modal responsivo: bottom sheet (gaveta que sobe do rodapé) no mobile,
 * diálogo centralizado a partir de md.
 */
export default function Sheet({
  titulo,
  onClose,
  children,
  rodape,
  largura = 'md:max-w-lg',
}: {
  titulo?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  rodape?: ReactNode;
  largura?: string;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', esc);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center text-slate-900 md:items-center md:p-4 print:static print:block"
    >
      <div className="absolute inset-0 animate-fade bg-navy-900/60 backdrop-blur-sm print:hidden" onClick={onClose} />
      <div
        className={`fixed inset-x-0 bottom-0 flex max-h-[92dvh] animate-sheet flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl md:relative md:inset-auto md:max-h-[90vh] md:w-full md:animate-pop md:rounded-2xl ${largura} print:static print:max-h-none print:overflow-visible print:shadow-none`}
      >
        <div className="flex justify-center pt-2 md:hidden print:hidden">
          <span className="h-1.5 w-10 rounded-full bg-slate-300" />
        </div>
        {titulo !== undefined && (
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 py-1 pl-4 pr-1 sm:pl-5 md:py-2 md:pr-3 print:hidden">
            <h2 className="font-semibold text-navy-700">{titulo}</h2>
            <button
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:h-9 md:w-9"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain print:overflow-visible">{children}</div>
        {rodape && (
          <div className="border-t border-slate-200 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-5 md:pb-3 print:hidden">
            {rodape}
          </div>
        )}
      </div>
    </div>
  );
}
