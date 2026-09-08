'use client';

import { useEffect, useState } from 'react';
import { CLR } from '../visual-palette';

interface BloodHitProps {
  active: boolean;
  x: number;
  y: number;
  direction?: 'left' | 'right';
  intensity?: 'light' | 'medium' | 'heavy';
  duration?: number;
  onComplete?: () => void;
}

const BLOOD_CONFIG = {
  light: { count: 4, size: 2, spread: 20 },
  medium: { count: 8, size: 3, spread: 35 },
  heavy: { count: 14, size: 4, spread: 50 },
};

export function BloodHit({ active, x, y, direction = 'right', intensity = 'medium', duration = 400, onComplete }: BloodHitProps) {
  const [opacity, setOpacity] = useState(0);
  const [drops, setDrops] = useState<Array<{ x: number; y: number; dx: number; dy: number; size: number; delay: number }>>([]);

  useEffect(() => {
    if (!active) {
      setOpacity(0);
      setDrops([]);
      return;
    }

    const config = BLOOD_CONFIG[intensity];
    const dir = direction === 'left' ? -1 : 1;

    const newDrops = Array.from({ length: config.count }, (_, i) => ({
      x: x + (Math.random() - 0.5) * config.spread * 0.5,
      y: y + (Math.random() - 0.5) * config.spread * 0.5,
      dx: (Math.random() * config.spread * 0.7 + config.spread * 0.3) * dir,
      dy: (Math.random() - 0.5) * config.spread,
      size: config.size * (0.5 + Math.random() * 0.8),
      delay: Math.random() * 50,
    }));

    setDrops(newDrops);
    setOpacity(1);

    const timer = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => {
        setDrops([]);
        onComplete?.();
      }, 100);
    }, duration);

    return () => clearTimeout(timer);
  }, [active, x, y, direction, intensity, duration, onComplete]);

  if (!active || drops.length === 0 || opacity <= 0) return null;

  return (
    <g opacity={opacity} filter="url(#blood-blur)">
      {drops.map((d, i) => (
        <ellipse
          key={i}
          cx={d.x}
          cy={d.y}
          rx={d.size}
          ry={d.size * 0.6}
          fill={CLR.blood}
          transform={`rotate(${direction === 'left' ? -45 : 45} ${d.x} ${d.y})`}
          style={{ pointerEvents: 'none' }}
        />
      ))}
    </g>
  );
}