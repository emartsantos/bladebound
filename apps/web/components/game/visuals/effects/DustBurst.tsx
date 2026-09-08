'use client';

import { useEffect, useState } from 'react';
import { CLR } from '../visual-palette';

interface DustBurstProps {
  active: boolean;
  x: number;
  y: number;
  color?: string;
  count?: number;
  duration?: number;
  onComplete?: () => void;
}

export function DustBurst({ active, x, y, color = CLR.line, count = 8, duration = 500, onComplete }: DustBurstProps) {
  const [opacity, setOpacity] = useState(0);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; dx: number; dy: number; size: number }>>([]);

  useEffect(() => {
    if (!active) {
      setOpacity(0);
      setParticles([]);
      return;
    }

    const newParticles = Array.from({ length: count }, (_, i) => ({
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 8,
      dx: (Math.random() - 0.5) * 60,
      dy: -Math.random() * 40 - 10,
      size: 2 + Math.random() * 3,
    }));

    setParticles(newParticles);
    setOpacity(1);

    const timer = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 100);
    }, duration);

    return () => clearTimeout(timer);
  }, [active, x, y, color, count, duration, onComplete]);

  if (!active || particles.length === 0 || opacity <= 0) return null;

  return (
    <g opacity={opacity} filter="url(#dust-blur)">
      {particles.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.size}
          fill={color}
          opacity={0.7 + Math.random() * 0.3}
          style={{ pointerEvents: 'none' }}
        />
      ))}
    </g>
  );
}