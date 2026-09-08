'use client';

import { useEffect, useState } from 'react';
import { CLR } from '../visual-palette';

interface ArmorSparkProps {
  active: boolean;
  x: number;
  y: number;
  angle?: number;
  count?: number;
  duration?: number;
  onComplete?: () => void;
}

export function ArmorSpark({ active, x, y, angle = 0, count = 5, duration = 250, onComplete }: ArmorSparkProps) {
  const [opacity, setOpacity] = useState(0);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; dx: number; dy: number; size: number; rotation: number }>>([]);

  useEffect(() => {
    if (!active) {
      setOpacity(0);
      setParticles([]);
      return;
    }

    const rad = (angle * Math.PI) / 180;
    const baseAngle = rad + Math.PI / 2;

    const newParticles = Array.from({ length: count }, (_, i) => {
      const spread = (Math.random() - 0.5) * Math.PI / 3;
      const speed = 30 + Math.random() * 50;
      return {
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        dx: Math.cos(baseAngle + spread) * speed,
        dy: Math.sin(baseAngle + spread) * speed,
        size: 1.5 + Math.random() * 2,
        rotation: Math.random() * 360,
      };
    });

    setParticles(newParticles);
    setOpacity(1);

    const timer = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 80);
    }, duration);

    return () => clearTimeout(timer);
  }, [active, x, y, angle, count, duration, onComplete]);

  if (!active || particles.length === 0 || opacity <= 0) return null;

  return (
    <g opacity={opacity} filter="url(#spark-glow)">
      {particles.map((p, i) => (
        <rect
          key={i}
          x={p.x - p.size / 2}
          y={p.y - p.size / 2}
          width={p.size}
          height={p.size * 0.4}
          fill={CLR.bone}
          transform={`rotate(${p.rotation} ${p.x} ${p.y})`}
          style={{ pointerEvents: 'none' }}
        />
      ))}
    </g>
  );
}