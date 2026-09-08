'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string;
  height?: string;
  lines?: number;
}

export function Skeleton({ className = '', variant = 'text', width, height, lines = 1 }: SkeletonProps) {
  const base = 'animate-pulse bg-iron/30 rounded';

  const variants = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'w-full h-20',
    card: 'w-full h-28 rounded-md',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`flex flex-col gap-2 ${className}`} style={{ width }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`${base} ${variants.text} ${i === lines - 1 ? 'w-3/4' : ''}`} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${base} ${variants[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}

export function StatSkeleton() {
  return (
    <div className="flex items-center justify-between py-2 border-b border-iron/20">
      <Skeleton variant="text" width="80px" />
      <Skeleton variant="text" width="40px" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-md bg-raised border border-iron p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width="32px" height="32px" />
        <div className="flex-1 space-y-1">
          <Skeleton variant="text" width="120px" />
          <Skeleton variant="text" width="80px" className="!h-3" />
        </div>
      </div>
      <Skeleton variant="text" lines={2} />
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton variant="circular" width="24px" height="24px" />
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" width={`${60 + (i % 4) * 10}%`} />
            <Skeleton variant="text" width="50%" className="!h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
