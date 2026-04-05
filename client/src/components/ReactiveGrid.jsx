import { useRef, useEffect, useCallback } from 'react';

/**
 * ReactiveGrid — Mouse-reactive canvas grid animation.
 * Draws a dim grid and smoothly lerps a cyan glow along the
 * grid lines nearest to the cursor. Zero dependencies beyond React.
 */
export default function ReactiveGrid({ cellSize = 64, glowRadius = 200, lerpSpeed = 0.08 }) {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -1000, y: -1000 });
  const rendered = useRef({ x: -1000, y: -1000 });
  const animRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const CELL = cellSize;

    // Smooth lerp toward real mouse position
    rendered.current.x += (mouse.current.x - rendered.current.x) * lerpSpeed;
    rendered.current.y += (mouse.current.y - rendered.current.y) * lerpSpeed;
    const { x: mx, y: my } = rendered.current;

    ctx.clearRect(0, 0, W, H);

    // Dim base grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += CELL) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += CELL) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    ctx.save();
    ctx.shadowBlur = 0;

    // Glowing vertical lines near cursor
    const startXi = Math.max(0, Math.floor((mx - glowRadius) / CELL));
    const endXi = Math.ceil((mx + glowRadius) / CELL);
    for (let xi = startXi; xi <= endXi; xi++) {
      const lx = xi * CELL;
      const dist = Math.abs(lx - mx);
      if (dist > glowRadius) continue;
      const alpha = (1 - dist / glowRadius) ** 2;
      const grad = ctx.createLinearGradient(0, my - glowRadius, 0, my + glowRadius);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, `rgba(34,211,238,${alpha * 0.85})`);
      grad.addColorStop(1, 'transparent');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
    }

    // Glowing horizontal lines near cursor
    const startYi = Math.max(0, Math.floor((my - glowRadius) / CELL));
    const endYi = Math.ceil((my + glowRadius) / CELL);
    for (let yi = startYi; yi <= endYi; yi++) {
      const ly = yi * CELL;
      const dist = Math.abs(ly - my);
      if (dist > glowRadius) continue;
      const alpha = (1 - dist / glowRadius) ** 2;
      const grad = ctx.createLinearGradient(mx - glowRadius, 0, mx + glowRadius, 0);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, `rgba(34,211,238,${alpha * 0.85})`);
      grad.addColorStop(1, 'transparent');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke();
    }

    // Glowing dot at nearest grid intersection
    const nearX = Math.round(mx / CELL) * CELL;
    const nearY = Math.round(my / CELL) * CELL;
    const nodeDist = Math.hypot(nearX - mx, nearY - my);
    if (nodeDist < glowRadius * 0.7) {
      const nodeAlpha = (1 - nodeDist / (glowRadius * 0.7)) ** 2;
      ctx.beginPath();
      ctx.arc(nearX, nearY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(34,211,238,${nodeAlpha * 0.9})`;
      ctx.shadowBlur = 14;
      ctx.shadowColor = 'rgba(34,211,238,0.9)';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
    animRef.current = requestAnimationFrame(draw);
  }, [cellSize, glowRadius, lerpSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    const onLeave = () => { mouse.current = { x: -1000, y: -1000 }; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [draw]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />;
}
