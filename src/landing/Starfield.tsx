/**
 * Campo estelar da landing: um único <canvas> fixo atrás da página.
 * ~260 estrelas em 3 camadas, cintilação lenta (0,3 a 1), deriva muito lenta e parallax leve na rolagem.
 * Pausa com a aba oculta; estático com prefers-reduced-motion; menos estrelas no celular.
 * Desenha no máximo 30 quadros por segundo.
 */
import React, { useEffect, useRef } from 'react';

interface Star { x: number; y: number; r: number; layer: number; phase: number; speed: number }

export const Starfield: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.innerWidth < 768;
    const count = small ? 150 : 260;
    const stars: Star[] = Array.from({ length: count }, () => {
      const layer = Math.random() < 0.6 ? 0 : Math.random() < 0.75 ? 1 : 2;
      return {
        x: Math.random(),
        y: Math.random(),
        r: [0.5, 0.9, 1.4][layer] * (0.8 + Math.random() * 0.4),
        layer,
        phase: Math.random() * Math.PI * 2,
        speed: 0.25 + Math.random() * 0.5,
      };
    });

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = small ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) draw(0);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const scroll = window.scrollY || 0;
      for (const s of stars) {
        const drift = reduced ? 0 : (t / 1000) * 0.0008 * (s.layer + 1);
        const par = reduced ? 0 : scroll * (0.02 + s.layer * 0.03);
        const x = ((s.x + drift) % 1) * w;
        let y = (s.y * h - par) % h; if (y < 0) y += h;
        const a = reduced ? 0.7 : 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(s.phase + (t / 1000) * s.speed));
        ctx.globalAlpha = a;
        ctx.fillStyle = s.layer === 2 ? '#F4F1FF' : '#D9D4E4';
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0, last = 0, running = !document.hidden;
    const loop = (t: number) => {
      if (!running) return;
      if (t - last > 33) { last = t; draw(t); }
      raf = requestAnimationFrame(loop);
    };
    const onVis = () => {
      running = !document.hidden;
      if (running && !reduced) raf = requestAnimationFrame(loop); else cancelAnimationFrame(raf);
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVis);
    if (!reduced) raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
};
