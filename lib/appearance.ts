/**
 * Aparência do relógio: "Tradicional" (cores dos elementos) ou "Modernas"
 * (zodíaco na linha espectral da marca + estrela do logo no lugar dos dois pontos da hora).
 * Opção visual de cada pessoa, na sidebar (Anéis › Graduação e Zodíaco). Fica guardada no navegador.
 */
import { useEffect, useState } from 'react';

export type ZodiacStyle = 'traditional' | 'modern';

const KEY = 'cronografo:zodiacStyle:v2'; // v2: todo mundo volta a abrir no Sistema tradicional (21/11)
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
  signSource: 'spectrum' | 'elements';  // no anel moderno: cada signo na cor do espectro ou do seu elemento
}

export const RING_DEFAULTS: RingColors = {
  start: 9, dir: -1, pal: 'full', mode: 'flow',
  width: 39, fill: 0.11, edge: 0.65, sep: 0.4,
  glyph: 'color', glyphScale: 0.87, glyphGlow: 0, glyphLight: 0.26,
  hourSize: 50, starSize: 12, starGlow: 0, starGap: 2, pulse: false,
  elements: { fire: '#F54E42', earth: '#4ADE80', air: '#D6F3FF', water: '#34D9EF' },
  signSource: 'spectrum',
};
/** Cores originais dos elementos no painel Astros (tema escuro). */
export const ELEMENT_DEFAULTS: Record<Element, string> = { fire: '#F87171', earth: '#4ADE80', air: '#38BDF8', water: '#818CF8' };

const RKEY = 'cronografo:ringColors:v2';
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

const SIGN_ELEMENT: Element[] = ['fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water'];
const isSpectrum = (style: ZodiacStyle, r: RingColors) => style === 'modern' && r.signSource !== 'elements';

/** Cor de fundo do anel num grau: espectro, ou a cor do elemento do signo quando "Elementos" estiver escolhido. */
export function bandColorAt(lon: number, r: RingColors = ring): string {
  if (r.signSource === 'elements') return (r.elements || ELEMENT_DEFAULTS)[SIGN_ELEMENT[Math.floor((((lon % 360) + 360) % 360) / 30)]];
  return spectralAt(lon, r);
}

/**
 * Cor do signo (índice 0 = Áries) usada no anel, Astros, Casas e linha do tempo.
 * Moderno + Espectro: cor do espectro no meio do signo, clareada pela "Clareza".
 * Moderno + Elementos: cor do elemento, também com a "Clareza". Tradicional: cor do elemento.
 */
export function zodiacSignColor(i: number, isLight = false, style: ZodiacStyle = current, r: RingColors = ring): string {
  const idx = ((i % 12) + 12) % 12;
  let c = isSpectrum(style, r) ? spectralAt(idx * 30 + 15, r) : (r.elements || ELEMENT_DEFAULTS)[SIGN_ELEMENT[idx]];
  if (isLight) return readableOnCream(c);
  if (style === 'modern') c = mixHex(c, '#ffffff', r.glyphLight);
  return c;
}

/** Cor do elemento (painel Status). */
export function elementHex(el: string, isLight = false, r: RingColors = ring): string {
  const c = (r.elements || ELEMENT_DEFAULTS)[el as Element] || '#888888';
  return isLight ? readableOnCream(c) : c;
}

/** Cores da faixa de um signo na linha do tempo: início, meio (signo) e fim. */
export function timelineSignColors(i: number, style: ZodiacStyle = current, r: RingColors = ring, isLight = false) {
  const mid = zodiacSignColor(i, isLight, style, r);
  const band = (c: string) => (isLight ? readableOnCream(c, 3) : c);
  if (!isSpectrum(style, r) || r.mode === 'solid') return { color: mid, start: band(mid), end: band(mid) };
  return { color: mid, start: band(spectralAt(i * 30 + 1, r)), end: band(spectralAt(i * 30 + 29, r)) };
}

// ── Contraste no tema claro ──
// Fundo creme dos painéis no tema claro. Cores claras (ex.: o azul quase branco do Ar)
// escurecem só o necessário para ler bem: 4.5:1 para texto e signos, 3:1 para faixas.
const CREAM = '#EFEBE2';
const lum = (h: string) => {
  const [r, g, b] = rgb(h).map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrastRatio = (a: string, b: string) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const toHsl = (h: string): [number, number, number] => {
  const [r, g, b] = rgb(h).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, sv = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const hv = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hv * 60, sv, l];
};
const fromHsl = (h: number, sv: number, l: number) => {
  const k = (n: number) => (n + h / 30) % 12, a = sv * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return hex([f(0), f(8), f(4)].map(v => v * 255));
};
const readCache = new Map<string, string>();
export function readableOnCream(c: string, min = 4.5): string {
  const k = c + min;
  const hit = readCache.get(k); if (hit) return hit;
  let out = c;
  if (contrastRatio(out, CREAM) < min) {
    // escurece mantendo o tom (matiz): baixa a luminosidade e garante saturação mínima,
    // para o Ar quase branco virar um azul legível, e não cinza
    const [hh, ss, ll] = toHsl(c);
    const sat = Math.max(ss, 0.45);
    for (let l = Math.min(ll, 0.6); l >= 0.05; l -= 0.02) { out = fromHsl(hh, sat, l); if (contrastRatio(out, CREAM) >= min) break; }
  }
  readCache.set(k, out);
  return out;
}

/** Cor de um elemento no painel Astros, ou null para manter a original. */
export function elementColor(el: string, isLight: boolean, r: RingColors = ring): string | null {
  const c = r.elements?.[el as Element];
  if (!c) return null;
  return isLight ? readableOnCream(c) : c;
}

/**
 * Leva as cores dos elementos para o anel tradicional (variáveis do index.css),
 * com uma versão legível para o tema claro (body.light-mode).
 */
function applyElementVars() {
  if (typeof document === 'undefined' || !document.head) return;
  let tag = document.getElementById('cronografo-element-vars') as HTMLStyleElement | null;
  if (!tag) { tag = document.createElement('style'); tag.id = 'cronografo-element-vars'; document.head.appendChild(tag); }
  const dark: string[] = [], light: string[] = [];
  (['fire', 'earth', 'air', 'water'] as Element[]).forEach(el => {
    const c = ring.elements?.[el];
    if (!c) return;
    dark.push(`--color-zodiac-${el}-1:${mixHex(c, '#000000', 0.8)}`, `--color-zodiac-${el}-2:${mixHex(c, '#000000', 0.55)}`, `--color-zodiac-${el}-3:${c}`,
      `--color-zodiac-icon-${el}-1:${mixHex(c, '#ffffff', 0.35)}`, `--color-zodiac-icon-${el}-2:${c}`, `--color-zodiac-icon-${el}-3:${mixHex(c, '#ffffff', 0.6)}`);
    const d = readableOnCream(c);
    light.push(`--color-zodiac-${el}-1:${mixHex(c, '#ffffff', 0.6)}`, `--color-zodiac-${el}-2:${mixHex(c, '#ffffff', 0.3)}`, `--color-zodiac-${el}-3:${readableOnCream(c, 3)}`,
      `--color-zodiac-icon-${el}-1:${d}`, `--color-zodiac-icon-${el}-2:${d}`, `--color-zodiac-icon-${el}-3:${mixHex(d, '#1a1210', 0.15)}`);
  });
  tag.textContent = dark.length ? `:root{${dark.join(';')}}body.light-mode{${light.join(';')}}` : '';
}
applyElementVars();

/** Estrela do logo (cintura 0.4, curva 0.55), em caixa de -10 a 10. */
export const STAR_PATH = 'M0,-10 C-0.4,-0.55 -0.4,-0.55 -10,0 C-0.4,0.55 -0.4,0.55 0,10 C0.4,0.55 0.4,0.55 10,0 C0.4,-0.55 0.4,-0.55 0,-10 Z';
