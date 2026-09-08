'use client';

import { useEffect, useRef, useState } from 'react';
import { CLR } from '../visual-palette';

interface WeaponTrailProps {
  active: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color?: string;
  width?: number;
  duration?: number;
}

export function WeaponTrail({ active, startX, startY, endX, endY, color = CLR.emberHi, width = 3, duration = 150 }: WeaponTrailProps) {
  const [opacity, setOpacity] = useState(0);
  const [trailPath, setTrailPath] = useState('');
  const frameRef = useRef(0);
  const trailHistory = useRef<Array<{ x: number; y: number; t: number }>>([]);

  useEffect(() => {
    if (!active) {
      setOpacity(0);
      trailHistory.current = [];
      return;
    }

    const animate = () => {
      const now = performance.now();
      trailHistory.current.push({ x: endX, y: endY, t: now });

      const cutoff = now - duration;
      trailHistory.current = trailHistory.current.filter(p => p.t > cutoff);

      if (trailHistory.current.length < 2) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      const points = trailHistory.current.map(p => `${p.x},${p.y}`).join(' ');
      setTrailPath(points);

      const age = trailHistory.current[trailHistory.current.length - 1].t - trailHistory.current[0].t;
      setOpacity(Math.max(0, 1 - age / duration));

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [active, endX, endY, duration]);

  if (!active || trailPath === '' || opacity <= 0) return null;

  return (
    <polyline
      points={trailPath}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity * 0.85}
      filter="url(#trail-blur)"
      style={{ pointerEvents: 'none' }}
    />
  );
}