import { useRef, useState, useCallback } from 'react';

export interface Tilt {
  rotateX: number;
  rotateY: number;
  scale: number;
}

export const use3DTilt = (maxTilt: number = 15, scale: number = 1.02) => {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<Tilt>({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  });

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTilt({
      rotateX,
      rotateY,
      scale,
    });
  }, [maxTilt, scale]);

  const handleMouseLeave = useCallback(() => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      scale: 1,
    });
  }, []);

  return {
    ref,
    tilt,
    handleMouseMove,
    handleMouseLeave,
    style: {
      transform: `
        perspective(1000px)
        rotateX(${tilt.rotateX}deg)
        rotateY(${tilt.rotateY}deg)
        scale(${tilt.scale})
      `,
      transition: 'transform 0.1s ease-out',
    } as React.CSSProperties,
  };
};
