/**
 * Aparência do relógio: "Tradicional" (cores dos elementos) ou "Modernas"
 * (zodíaco na linha espectral da marca + estrela do logo no lugar dos dois pontos da hora).
 * Opção visual de cada pessoa, na sidebar (Anéis › Graduação e Zodíaco). Fica guardada no navegador.
 */
import { useEffect, useState } from 'react';

export type ZodiacStyle = 'traditional' | 'modern';

const KEY = 'cronografo:zodiacStyle';
let current: ZodiacStyle = (() => {
  try { return localStorage.getItem(KEY) === 'modern' ? 'modern' : 'traditional'; } catch { return 'traditional'; }
})();
const subs = new Set<(s: ZodiacStyle) => void>();

export function setZodiacStyle(s: ZodiacStyle) {
  current = s;
  try { localStorage.setItem(KEY, s); } catch { /* sem armazenamento */ }
  subs.forEach(f => f(s));
}

export function useZodiacStyle(): ZodiacStyle {
  const [s, setS] = useState<ZodiacStyle>(current);
  useEffect(() => {
    subs.add(setS);
    if (s !== current) setS(current);
    return () => { subs.delete(setS); };
  }, []);
  return s;
}

// ── Ajustes de cores (editor em Anéis › Graduação e Zodíaco › Editar cores) ──
// Padrão = valores aprovados no teste do anel espectral (20/11/2026). Guardados no navegador.
export type Element = 'fire' | 'earth' | 'air' | 'water';
export interface RingColors {
  start: number;            // signo onde o azul começa (0 = Áries)
  dir: 1 | -1;              // 1 = sentido dos signos, -1 = invertido
  pal: 'lp' | 'full';       // linha da LP ou espectro com verde e violeta
  mode: 'flow' | 'solid';   // contínuo ou uma cor por signo
  width: number;            // largura da faixa (tradicional: 40)
  fill: number;             // fundo da faixa
  edge: number;             // contorno colorido
  sep: number;              // divisórias
  glyph: 'white' | 'color'; // signos brancos ou na cor do espectro
  glyphScale: number;       // tamanho dos signos (1 = tamanho escolhido nas opções)
  glyphGlow: number;
  glyphLight: number;       // clareia a cor dos signos coloridos
  hourSize: number;         // hora do centro (tradicional: 46)
  starSize: number;         // estrela no lugar dos dois pontos
  starGlow: number;
  starGap: number;
  pulse: boolean;           // estrela pulsa a cada segundo
  elements: Record<Element, string> | null; // cores dos elementos (null = originais)
}

export const RING_DEFAULTS: RingColors = {
  start: 9, dir: -1, pal: 'full', mode: 'flow',
  width: 70, fill: 0.22, edge: 0.65, sep: 0.4,
  glyph: 'white', glyphScale: 42 / 46, glyphGlow: 0.3, glyphLight: 0.24,
  hourSize: 64, starSize: 14.5, starGlow: 0.35, starGap: 2, pulse: false,
  elements: null,
};
/** Cores originais dos elementos no painel Astros (tema escuro). */
export const ELEMENT_DEFAULTS: Record<Element, string> = { fire: '#F87171', earth: '#4ADE80', air: '#38BDF8', water: '#818CF8' };

const RKEY = 'cronografo:ringColors';
let ring: RingColors = (() => {
  try { const v = JSON.parse(localStorage.getItem(RKEY) || 'null'); return v ? { ...RING_DEFAULTS, ...v } : { ...RING_DEFAULTS }; } catch { return { ...RING_DEFAULTS }; }
})();
const ringSubs = new Set<(r: RingColors) => void>();

export function updateRingColors(patch: Partial<RingColors>) {
  ring = { ...ring, ...patch };
  try { localStorage.setItem(RKEY, JSON.stringify(ring)); } catch { /* sem armazenamento */ }
  applyElementVars();
  ringSubs.forEach(f => f(ring));
}
export function resetRingColors() {
  ring = { ...RING_DEFAULTS };
  try { localStorage.removeItem(RKEY); } catch { /* sem armazenamento */ }
  applyElementVars();
  ringSubs.forEach(f => f(ring));
}
export function useRingColors(): RingColors {
  const [r, setR] = useState<RingColors>(ring);
  useEffect(() => { ringSubs.add(setR); if (r !== ring) setR(ring); return () => { ringSubs.delete(setR); }; }, []);
  return r;
}

// Abre e fecha o editor (montado uma vez no App)
let editorOpen = false;
const editorSubs = new Set<(o: boolean) => void>();
export function setColorEditorOpen(o: boolean) { editorOpen = o; editorSubs.forEach(f => f(o)); }
export function useColorEditorOpen(): boolean {
  const [o, setO] = useState(editorOpen);
  useEffect(() => { editorSubs.add(setO); return () => { editorSubs.delete(setO); }; }, []);
  return o;
}

// ── Cores ──
const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = (c: number[]) => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const mixHex = (a: string, b: string, t: number) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); };

const PALETTES = {
  lp: ['#4870FF', '#22D3EE', '#FACC15', '#FB923C', '#EF4444'],
  full: ['#4870FF', '#22D3EE', '#4ADE80', '#FACC15', '#FB923C', '#EF4444', '#B0215A', '#6D28D9'],
};
export const paletteStops = (r: RingColors = ring) => PALETTES[r.pal] || PALETTES.full;

/** Cor do espectro num grau da eclíptica (0 = início de Áries). No modo "uma cor por signo", vale a cor do meio do signo. */
export function spectralAt(lon: number, r: RingColors = ring): string {
  const l = r.mode === 'solid' ? Math.floor(((lon % 360) + 360) % 360 / 30) * 30 + 15 : lon;
  const stops = [...paletteStops(r), paletteStops(r)[0]].map(rgb);
  let t = r.dir * (l / 360 - r.start / 12);
  t = ((t % 1) + 1) % 1;
  const x = t * (stops.length - 1), i = Math.floor(x), f = x - i;
  return hex(stops[i].map((v, k) => v + (stops[i + 1][k] - v) * f));
}

/** Cor de um elemento no painel Astros, ou null para manter a original. */
export function elementColor(el: string, isLight: boolean, r: RingColors = ring): string | null {
  const c = r.elements?.[el as Element];
  if (!c) return null;
  return isLight ? mixHex(c, '#000000', 0.35) : c;
}

/** Leva as cores dos elementos para o anel tradicional (variáveis do index.css). */
function applyElementVars() {
  if (typeof document === 'undefined') return;
  const st = document.documentElement.style;
  (['fire', 'earth', 'air', 'water'] as Element[]).forEach(el => {
    const names = [1, 2, 3].flatMap(k => [`--color-zodiac-${el}-${k}`, `--color-zodiac-icon-${el}-${k}`]);
    const c = ring.elements?.[el];
    if (!c) { names.forEach(n => st.removeProperty(n)); return; }
    st.setProperty(`--color-zodiac-${el}-1`, mixHex(c, '#000000', 0.8));
    st.setProperty(`--color-zodiac-${el}-2`, mixHex(c, '#000000', 0.55));
    st.setProperty(`--color-zodiac-${el}-3`, c);
    st.setProperty(`--color-zodiac-icon-${el}-1`, mixHex(c, '#ffffff', 0.35));
    st.setProperty(`--color-zodiac-icon-${el}-2`, c);
    st.setProperty(`--color-zodiac-icon-${el}-3`, mixHex(c, '#ffffff', 0.6));
  });
}
applyElementVars();

/** Estrela do logo (cintura 0.4, curva 0.55), em caixa de -10 a 10. */
export const STAR_PATH = 'M0,-10 C-0.4,-0.55 -0.4,-0.55 -10,0 C-0.4,0.55 -0.4,0.55 0,10 C0.4,0.55 0.4,0.55 10,0 C0.4,-0.55 0.4,-0.55 0,-10 Z';
