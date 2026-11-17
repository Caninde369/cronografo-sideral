/**
 * Campo estelar da tela inicial: um único <canvas> fixo atrás da página.
 * ~620 estrelas em 3 camadas (300 no celular), cintilação lenta, deriva muito lenta.
 * Estrelas cadentes raras: uma a cada 10 a 22 segundos, cruzando em diagonal.
 * Pausa com a aba oculta; estático e sem estrelas cadentes com prefers-reduced-motion.
 * Desenha no máximo 30 quadros por segundo.
 */
import React, { useEffect, useRef } from 'react';

interface Star { x: number; y: number; r: number; layer: number; phase: number; speed: number }
interface Meteor { x: number; y: number; vx: number; vy: number; born: number; life: number; len: number }

export const Starfield: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.innerWidth < 768;
    const count = small ? 300 : 620;
    const stars: Star[] = Array.from({ length: count }, () => {
      const layer = Math.random() < 0.62 ? 0 : Math.random() < 0.75 ? 1 : 2;
      return {
        x: Math.random(),
        y: Math.random(),
        r: [0.45, 0.85, 1.35][layer] * (0.8 + Math.random() * 0.4),
        layer,
        phase: Math.random() * Math.PI * 2,
        speed: 0.25 + Math.random() * 0.5,
      };
    });

    let w = 0, h = 0, dpr = 1;
    const meteors: Meteor[] = [];
    let nextMeteor = 0;
    const scheduleMeteor = (t: number) => { nextMeteor = t + 10000 + Math.random() * 12000; };

    const spawnMeteor = (t: number) => {
      // nasce no terço de cima, desce em diagonal (da direita para a esquerda ou o contrário)
      const dir = Math.random() < 0.5 ? -1 : 1;
      const speed = (small ? 0.55 : 0.8) + Math.random() * 0.35; // px por ms
      const ang = (20 + Math.random() * 18) * Math.PI / 180;
      meteors.push({
        x: dir > 0 ? Math.random() * w * 0.6 : w * 0.4 + Math.random() * w * 0.6,
        y: Math.random() * h * 0.35,
        vx: Math.cos(ang) * speed * dir,
        vy: Math.sin(ang) * speed,
        born: t,
        life: 900 + Math.random() * 500,
        len: (small ? 90 : 140) + Math.random() * 80,
      });
    };

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
        const a = reduced ? 0.7 : 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(s.phase + (t / 1000) * s.speed));
        ctx.globalAlpha = a;
        ctx.fillStyle = s.layer === 2 ? '#F4F1FF' : '#D9D4E4';
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (reduced) return;

      if (!nextMeteor) nextMeteor = t + 4000 + Math.random() * 5000; // a primeira vem mais cedo
      if (t >= nextMeteor) { spawnMeteor(t); scheduleMeteor(t); }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        const age = t - m.born;
        if (age > m.life) { meteors.splice(i, 1); continue; }
        const p = age / m.life;
        const hx = m.x + m.vx * age, hy = m.y + m.vy * age;
        const sp = Math.hypot(m.vx, m.vy);
        const tx = hx - (m.vx / sp) * m.len, ty = hy - (m.vy / sp) * m.len;
        const fade = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
        const g = ctx.createLinearGradient(tx, ty, hx, hy);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(1, `rgba(255,255,255,${0.85 * fade})`);
        ctx.strokeStyle = g; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.globalAlpha = fade;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(hx, hy, 1.4, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    let raf = 0, last = 0, running = !document.hidden;
    const loop = (t: number) => {
      if (!running) return;
      if (t - last > 33) { last = t; draw(t); }
      raf = requestAnimationFrame(loop);
    };
    const onVis = () => {
      running = !document.hidden;
      if (running && !reduced) { meteors.length = 0; nextMeteor = 0; raf = requestAnimationFrame(loop); }
      else cancelAnimationFrame(raf);
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
