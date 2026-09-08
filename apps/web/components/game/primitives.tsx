'use client';

import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from 'react';
import { RARITY_TREATMENTS } from '@premium-rpg/ui-tokens';

type RarityName = string;

// ── BAR ─────────────────────────────────────────────────────────

type BarVariant = 'hp' | 'xp' | 'player' | 'energy' | 'resource';

const FILLS: Record<BarVariant, string> = {
  hp: 'bar-fill-hp',
  xp: 'bar-fill-xp',
  player: 'bar-fill-player',
  energy: 'bar-fill-ember',
  resource: 'bar-fill-neutral',
};

export function Bar({
  variant = 'resource',
  pct,
  height = 6,
  className = '',
  children,
}: {
  variant?: BarVariant;
  pct: number;
  height?: number;
  className?: string;
  children?: ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className={`bar ${className}`} style={{ height }}>
      <div className={`bar-fill ${FILLS[variant]}`} style={{ width: `${clamped}%` }} />
      {children}
    </div>
  );
}

export function BarLabel({
  left,
  right,
  className = '',
}: {
  left: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between text-[10px] text-stone ${className}`}>
      <span>{left}</span>
      {right != null && <span>{right}</span>}
    </div>
  );
}

// ── BUTTON ──────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'active';

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
  active: 'btn-is-active',
};

export function GameButton({
  variant = 'secondary',
  iconOnly = false,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; iconOnly?: boolean }) {
  return (
    <button type={type} className={`btn ${BUTTON_VARIANTS[variant]} ${iconOnly ? 'btn-icon' : ''} ${className}`} {...rest}>
      {children}
    </button>
  );
}

// ── STATS ───────────────────────────────────────────────────────

export interface StatItem {
  label: string;
  value: string | number;
  accent?: 'bone' | 'bronze' | 'ember' | 'danger' | 'verdant' | 'steel';
}

const VALUE_COLORS: Record<NonNullable<StatItem['accent']>, string> = {
  bone: 'text-bone',
  bronze: 'text-bronze',
  ember: 'text-ember',
  danger: 'text-danger',
  verdant: 'text-verdant',
  steel: 'text-steelBlue',
};

export function StatRow({ label, value, accent = 'bone' }: StatItem) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${VALUE_COLORS[accent]}`}>{value}</span>
    </div>
  );
}

export function StatGroup({ items, className = '' }: { items: StatItem[]; className?: string }) {
  return (
    <div className={`${className}`}>
      {items.map((s, i) => (
        <div key={s.label} className={i > 0 ? 'divider-row' : ''}>
          <StatRow {...s} />
        </div>
      ))}
    </div>
  );
}

export function StatGrid({ items, cols = 2 }: { items: StatItem[]; cols?: 2 | 3 }) {
  const gridCols = cols === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2';
  return (
    <div className={`grid ${gridCols} gap-x-4`}>
      {items.map((s) => (
        <StatRow key={s.label} {...s} />
      ))}
    </div>
  );
}

// ── SECTION HEADER ──────────────────────────────────────────────

export function SectionHeader({
  title,
  eyebrow,
  actions,
}: {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {eyebrow && <div className="section-label mb-1">{eyebrow}</div>}
          <h1 className="font-display text-[22px] font-semibold leading-tight text-bone">{title}</h1>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="divider mt-3" />
    </header>
  );
}

// ── ITEM SLOT ───────────────────────────────────────────────────

const SLOT_SIZES = { sm: 44, md: 60, lg: 84 } as const;

export function ItemSlot({
  rarity = 'common',
  children,
  qty,
  onClick,
  selected = false,
  size = 'md',
  title,
  className = '',
}: {
  rarity?: RarityName;
  children?: ReactNode;
  qty?: number;
  onClick?: () => void;
  selected?: boolean;
  size?: keyof typeof SLOT_SIZES;
  title?: string;
  className?: string;
}) {
  const t = RARITY_TREATMENTS[rarity] ?? RARITY_TREATMENTS.common;
  const dim = SLOT_SIZES[size];
  const isPulse = t.animation === 'pulse';
  const isSheen = t.animation === 'sheen';

  const style: CSSProperties = {
    width: dim,
    height: dim,
    borderColor: t.border,
    ...(selected ? { boxShadow: `0 0 0 2px ${t.bright}` } : {}),
    backgroundColor: t.stain ?? undefined,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={selected}
      className={`slot relative ${isPulse ? 'legendary-pulse' : ''} ${className}`}
      style={style}
    >
      {children}
      {isSheen && <span aria-hidden className="sheen absolute inset-0 rounded-[3px]" />}
      {qty != null && qty > 0 && (
        <span className="absolute top-0.5 right-1 text-[9px] font-mono text-stone">{qty}</span>
      )}
    </button>
  );
}

// ── EMPTY STATE ─────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  hint,
  action,
  className = '',
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`panel-inset flex flex-col items-center justify-center gap-1 px-6 py-10 text-center ${className}`}>
      {icon && <div className="mb-1 text-stone/60">{icon}</div>}
      <p className="text-sm text-mist">{title}</p>
      {hint && <p className="text-xs text-stone max-w-64">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

// ── PANEL ───────────────────────────────────────────────────────

export function Panel({
  header,
  children,
  className = '',
  bodyClassName = 'p-4',
}: {
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {header && <div className="panel-header">{header}</div>}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function PanelLabel({ children }: { children: ReactNode }) {
  return <div className="section-label">{children}</div>;
}