'use client';

import { ReactNode, useState, useEffect } from 'react';
import { use3DTilt } from '@/hooks/use3DTilt';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  glowColor?: 'cyan' | 'purple' | 'green' | 'red';
}

export function TiltCard({
  children,
  className = '',
  onClick,
  glowColor = 'cyan',
}: TiltCardProps) {
  // Two-phase initialization: SSR phase and client phase
  const [isMounted, setIsMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const { ref, handleMouseMove, handleMouseLeave, style } = use3DTilt(8, 1.02);

  const glowColors = {
    cyan: 'rgba(0, 242, 254, 0.4)',
    purple: 'rgba(79, 172, 254, 0.4)',
    green: 'rgba(0, 255, 135, 0.4)',
    red: 'rgba(255, 51, 102, 0.4)',
  };

  // Phase 1: SSR renders with no interactive styles
  // Phase 2: After hydration, enable 3D effects and touch detection
  useEffect(() => {
    setIsMounted(true);
    setIsTouchDevice(
      typeof navigator !== 'undefined' &&
      (navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0)
    );
  }, []);

  const handleMouseMoveWithGlow = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMounted) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    handleMouseMove(e);
  };

  // Safe style assignment: only apply 3D transforms after mount
  const safeStyle = isMounted && !isTouchDevice ? style : {};

  // Safe event handlers: only attach after mount
  const safeOnMouseMove = isMounted && !isTouchDevice ? handleMouseMoveWithGlow : undefined;
  const safeOnMouseLeave = isMounted && !isTouchDevice ? handleMouseLeave : undefined;

  // SSR Phase: Render completely static card without 3D transforms
  if (!isMounted) {
    return (
      <div
        className={`relative rounded-lg border border-white/5 bg-surface-secondary backdrop-blur-md ${className}`}
      >
        {/* Static inset glow during SSR */}
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            boxShadow: `inset 0 0 15px ${glowColors[glowColor]}`,
            opacity: 0.15,
          }}
        />

        {/* Content layer */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  // Client Phase: Full interactive 3D features
  return (
    <div
      ref={ref}
      onMouseMove={safeOnMouseMove}
      onMouseLeave={safeOnMouseLeave}
      onClick={onClick}
      style={safeStyle}
      className={`relative rounded-lg border border-white/5 bg-surface-secondary backdrop-blur-md transition-all duration-300 cursor-pointer will-change-transform ${className}`}
    >
      {/* Radial gradient spotlight - only render after hydration */}
      {!isTouchDevice && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, ${glowColors[glowColor]}, transparent 70%)`,
            pointerEvents: 'none',
            opacity: 0.6,
          }}
        />
      )}

      {/* Inset border glow - always render for consistent appearance */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          boxShadow: `inset 0 0 20px ${glowColors[glowColor]}`,
          opacity: 0.3,
        }}
      />

      {/* Content layer */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
