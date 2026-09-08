'use client';

import { useEffect, useState } from 'react';
import { CLR } from '../visual-palette';

interface ImpactSparkProps {
  active: boolean;
  x: number;
  y: number;
  color?: string;
  count?: number;
  size?: number;
  duration?: number;
  onComplete?: () => void;
}

const SPARK_OFFSETS = [
  { dx: 0, dy: 0 },
  { dx: 12, dy: -8 },
  { dx: -10, dy: -14 },
  { dx: 16, dy: 4 },
  { dx: -14, dy: 6 },
  { dx: 8, dy: -18 },
  { dx: -6, dy: 12 },
  { dx: -18, dy: -4 },
];

export function ImpactSpark({ active, x, y, color = CLR.emberHi, count = 6, size = 2.5, duration = 300, onComplete }: ImpactSparkProps) {
  const [opacity, setOpacity] = useState(0);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; dx: number; dy: number; size: number }>>([]);

  useEffect(() => {
    if (!active) {
      setOpacity(0);
      setParticles([]);
      return;
    }

    const newParticles = SPARK_OFFSETS.slice(0, count).map((offset, i) => ({
      x: x + offset.dx + (Math.random() - 0.5) * 6,
      y: y + offset.dy + (Math.random() - 0.5) * 6,
      dx: (Math.random() - 0.5) * 40,
      dy: -Math.random() * 30 - 10,
      size: size * (0.7 + Math.random() * 0.6),
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
  }, [active, x, y, count, size, duration, onComplete]);

  if (!active || particles.length === 0 || opacity <= 0) return null;

  return (
    <g opacity={opacity} filter="url(#spark-glow)">
      {particles.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.size}
          fill={color}
          style={{ pointerEvents: 'none' }}
        />
      ))}
    </g>
  );
}