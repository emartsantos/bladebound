'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { LuX } from 'react-icons/lu';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Dialog({ open, onClose, title, children, size = 'md' }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReady(false);
    const raf = requestAnimationFrame(() => setReady(true));
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const width = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }[size];

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-modalBackdrop flex items-center justify-center bg-black/65 p-4 transition-opacity duration-150 ${ready ? 'opacity-100' : 'opacity-0'}`}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={`w-full ${width} panel shadow-overlay ${ready ? 'fade-in' : ''}`}>
        {title && (
          <div className="flex items-center justify-between border-b border-iron/70 px-4 py-3">
            <h2 className="font-display text-sm font-semibold tracking-wide text-bone">{title}</h2>
            <button onClick={onClose} aria-label="close dialog" className="flex h-6 w-6 items-center justify-center rounded-sm text-mist transition-colors hover:text-bone">
              <LuX className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
