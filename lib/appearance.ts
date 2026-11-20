/**
 * Aparência do relógio: "Sistema tradicional" (cores dos elementos) ou "Cores modernas"
 * (zodíaco na linha espectral da marca + estrela do logo no lugar dos dois pontos da hora).
 * A escolha é do admin e vale para todos (Firestore config/appearance).
 * Fica guardada no navegador para o relógio já abrir no estilo certo, sem piscar.
 */
import { useEffect, useState } from 'react';
import { getZodiacStyle, setZodiacStyleInFirestore, type ZodiacStyle } from './firebase';

export type { ZodiacStyle };

const KEY = 'cronografo:zodiacStyle';
let current: ZodiacStyle = (() => {
  try { return localStorage.getItem(KEY) === 'modern' ? 'modern' : 'traditional'; } catch { return 'traditional'; }
})();
const subs = new Set<(s: ZodiacStyle) => void>();
let loaded = false;

const apply = (s: ZodiacStyle) => {
  current = s;
  try { localStorage.setItem(KEY, s); } catch { /* sem armazenamento */ }
  subs.forEach(f => f(s));
};

export function useZodiacStyle(): ZodiacStyle {
  const [s, setS] = useState<ZodiacStyle>(current);
  useEffect(() => {
    subs.add(setS);
    if (!loaded) { loaded = true; getZodiacStyle().then(v => { if (v && v !== current) apply(v); }); }
    if (s !== current) setS(current);
    return () => { subs.delete(setS); };
  }, []);
  return s;
}

export async function saveZodiacStyle(s: ZodiacStyle): Promise<boolean> {
  const ok = await setZodiacStyleInFirestore(s);
  if (ok) apply(s);
  return ok;
}

// ── Cores modernas: ajustes aprovados no teste do anel espectral (20/11/2026) ──
export const MODERN_RING = {
  width: 70,          // largura da faixa (tradicional: 40)
  fill: 0.22,         // fundo da faixa
  edge: 0.65,         // contorno colorido
  sep: 0.4,           // divisórias brancas
  glyphScale: 42 / 46,// signos brancos, um pouco menores que o tamanho escolhido
  glyphGlow: 0.3,
  hourSize: 64,       // hora do centro (tradicional: 46)
  starSize: 14.5,     // estrela no lugar dos dois pontos
  starGlow: 0.35,
  starGap: 2,
};

/** Espectro completo, fechado (volta ao azul). Começa em Capricórnio e corre no sentido inverso dos signos. */
const PALETTE = ['#4870FF', '#22D3EE', '#4ADE80', '#FACC15', '#FB923C', '#EF4444', '#B0215A', '#6D28D9'];
const START_SIGN = 9, DIRECTION = -1;
const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const STOPS = [...PALETTE, PALETTE[0]].map(rgb);

/** Cor do espectro num grau da eclíptica (0 = início de Áries). */
export function spectralAt(lon: number): string {
  let t = DIRECTION * (lon / 360 - START_SIGN / 12);
  t = ((t % 1) + 1) % 1;
  const x = t * (STOPS.length - 1), i = Math.floor(x), f = x - i;
  const c = STOPS[i].map((v, k) => Math.round(v + (STOPS[i + 1][k] - v) * f));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

/** Estrela do logo (cintura 0.4, curva 0.55), em caixa de -10 a 10. */
export const STAR_PATH = 'M0,-10 C-0.4,-0.55 -0.4,-0.55 -10,0 C-0.4,0.55 -0.4,0.55 0,10 C0.4,0.55 0.4,0.55 10,0 C0.4,-0.55 0.4,-0.55 0,-10 Z';
