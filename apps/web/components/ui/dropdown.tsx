'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, items, onSelect, align = 'left' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

  const alignment = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div ref={ref} className="relative inline-flex">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div className={`fade-in absolute top-full mt-1 ${alignment} z-dropdown min-w-[170px] rounded-md border border-iron bg-charcoal/98 py-1 shadow-overlay`}>
          {items.map((item) => (
            <button
              key={item.value}
              disabled={item.disabled}
              onClick={() => { if (!item.disabled) { onSelect(item.value); setOpen(false); } }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors ${
                item.disabled
                  ? 'text-stone cursor-not-allowed'
                  : 'text-bone hover:bg-ember/10 hover:text-emberLight'
              }`}
            >
              {item.icon && <span className="flex items-center text-stone">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
