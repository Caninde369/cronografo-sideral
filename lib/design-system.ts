/**
 * Cronógrafo Sideral — Design System v2
 *
 * Fonte única de verdade para cor, tipografia, superfície, raio e profundidade.
 * É a união do DS v1.0 (que vivia como constante local dentro da LandingPage)
 * com o que já estava aprovado em uso (o card da Lua e seu popover).
 *
 * Regra de manutenção: nenhum valor visual novo entra em componente.
 * Se não está aqui, não existe.
 */

/* ══════════════════════════════════════════════════════════
   1. FUNDO — dois níveis, não um
   ══════════════════════════════════════════════════════════ */

export const GROUND = {
  /** O céu. Fundo do app, a camada mais profunda. */
  sky: '#040004',
  /** O instrumento. Superfície de todo painel, card e popover. */
  surface: '#080612',
  /** Superfície elevada: popover sobre painel, menu sobre popover. */
  surfaceRaised: '#0E0B1C',

  /* Modo claro */
  skyLight: '#F4F1EA',
  surfaceLight: '#F4F1EA',
  surfaceRaisedLight: '#FCFBF8',
} as const;

/**
 * Saíram do vocabulário: #000000 (LandingPage) e #050505 (--color-brand-dark).
 * Um painel #080612 sobre um céu #040004 flutua; sobre #050505 ele se dissolve.
 */

/* ══════════════════════════════════════════════════════════
   2. COR
   ══════════════════════════════════════════════════════════ */

export const COLOR = {
  /* — Texto — */
  cream: '#F5F2EB',        // título de painel, horas cardinais
  text: 'rgba(255,255,255,0.95)',
  textMuted: '#94A3B8',
  textFaint: '#5B6478',

  /* — Ouro: acento único do produto —
     Máximo DOIS ouros por tela fora do universo Fundador. */
  gold: '#D4AF37',
  goldDeep: '#B8962A',
  goldLight: '#F5D98A',

  /* — Ciano: dado vivo. Tempo real, contagem regressiva, valor que muda sozinho. */
  cyan: '#22D3EE',

  /* — Bordas — */
  line: 'rgba(255,255,255,0.12)',
  lineStrong: 'rgba(255,255,255,0.20)',
  lineLight: 'rgba(139,131,112,0.25)',
} as const;

/** Onde o ouro PODE aparecer. Fora desta lista, não. */
export const GOLD_USAGE = {
  clockAxes: true,        // horas 12 e 0 do anel — eixos MC e IC
  selectedItem: true,     // borda e valor do astro ou aspecto selecionado
  sectionLabel: true,     // rótulo de seção dentro de painel e popover
  founder: true,          // selo, cota, preço e CTA do universo Fundador
  activeControl: true,    // toggle ligado, ícone ativo na sidebar

  panelBorder: false,     // bordas de painel seguem COLOR.lineStrong
  panelTitle: false,      // título de painel é creme
  cardBackground: false,
  bodyIcons: false,       // ícone da sidebar em repouso é textMuted
  planetColors: false,    // cores de astro são semânticas, nunca decorativas
  liveData: false,        // dado em tempo real é ciano
} as const;

/* — Astros: cor é semântica, não escolha visual — */
export const PLANET_COLOR = {
  sun: '#FDE047',   moon: '#F1F5F9',   mercury: '#CBD5E1',
  venus: '#FDA4AF', mars: '#EF4444',   jupiter: '#FB923C',
  saturn: '#FACC15', uranus: '#22D3EE', neptune: '#4870FF',
  pluto: '#94A3B8', northNode: '#34D399', southNode: '#34D399',
  lilith: '#8B5CF6', chiron: '#34D399', ceres: '#FACC15',
  pallas: '#4870FF', juno: '#FDA4AF',  vesta: '#FB923C',
  partOfFortune: '#F59E0B',
} as const;

export const ASPECT_COLOR = {
  conjunction: '#4870FF', opposition: '#F87171', trine: '#4ADE80',
  square: '#FB923C',      sextile: '#60A5FA',
} as const;

export const ELEMENT_COLOR = {
  fire: '#FB923C', earth: '#34D399', air: '#FEF3C7', water: '#60A5FA',
} as const;

/* ══════════════════════════════════════════════════════════
   3. TIPOGRAFIA — quatro fontes, quatro trabalhos
   ══════════════════════════════════════════════════════════ */

export const FONT = {
  /** Gravar. Só onde é grande o suficiente para ler como ornamento. */
  display: "'Playfair Display', Georgia, serif",
  /** Nomear territórios. Mínimo 12px — não cabe em painel de 235px. */
  brand: "'Michroma', sans-serif",
  /** Operar a interface. */
  ui: "'DM Sans', system-ui, sans-serif",
  /** Carregar número. Sempre com tabular-nums. */
  mono: "'DM Mono', ui-monospace, monospace",
  /** Glifos de signo e aspecto — exige pilha com suporte a símbolo. */
  glyph: "'Segoe UI Symbol', 'Noto Sans Symbols2', 'Apple Symbols', serif",
} as const;

export const TYPE = {
  /** Título de painel. Creme, não dourado. Peso 600 porque as hastes
   *  finas da Playfair somem sobre #080612 em peso 500. */
  panelTitle: {
    fontFamily: FONT.display, fontWeight: 600, fontSize: '15px',
    color: COLOR.cream, letterSpacing: '.005em', lineHeight: 1,
  },
  /** Horas cardinais do anel de tempo. Peso 500: o fundo ali é o anel. */
  clockNumeral: {
    fontFamily: FONT.display, fontWeight: 500, fontSize: '16px',
  },
  /** Rótulo de seção dentro de painel e popover. Único ouro do bloco. */
  sectionLabel: {
    fontFamily: FONT.ui, fontWeight: 700, fontSize: '9.5px',
    letterSpacing: '.13em', textTransform: 'uppercase' as const,
    color: COLOR.gold, opacity: .9,
  },
  /** Nome de astro, casa, aspecto. */
  itemName: {
    fontFamily: FONT.ui, fontWeight: 700, fontSize: '11.5px', color: COLOR.text,
  },
  /** Rótulo de controle no popover. */
  controlLabel: {
    fontFamily: FONT.ui, fontWeight: 400, fontSize: '12px', color: COLOR.text,
  },
  /** Subordinada explicativa. Substitui tooltip: o que precisa ser lido fica escrito. */
  controlHelp: {
    fontFamily: FONT.ui, fontSize: '9.5px', color: COLOR.textFaint, lineHeight: 1.35,
  },
  /** Todo número. */
  numeric: {
    fontFamily: FONT.mono, fontSize: '10.5px',
    fontVariantNumeric: 'tabular-nums' as const, color: COLOR.textMuted,
  },
  /** Carimbo central. DM Mono, não Playfair: ele tica a cada segundo e a
   *  Playfair tem larguras desiguais que fariam o número tremer. */
  stampTime: {
    fontFamily: FONT.mono, fontWeight: 500, fontSize: '26px',
    color: COLOR.cream, letterSpacing: '1px',
  },
  stampDate: {
    fontFamily: FONT.mono, fontSize: '10px', color: COLOR.gold,
    opacity: .85, letterSpacing: '2.4px',
  },
  /** Nome do produto e títulos de território. */
  brandmark: {
    fontFamily: FONT.brand, fontSize: '12px',
    letterSpacing: '.05em', color: COLOR.cream,
  },
} as const;

/** Classes Tailwind legadas que devem ser removidas na varredura tipográfica:
 *  font-neue, font-martel, font-garamond, font-orbitron, font-inter,
 *  font-cabin-condensed, font-source-code-pro, font-outfit  (0 ou 1 uso cada)
 *  font-manrope (84 usos) → renomear para font-ui num commit isolado.
 *  Fontes a parar de carregar: Inter (@import no topo do index.css,
 *  bloqueia renderização), Cormorant Garamond, Syne. */

/* ══════════════════════════════════════════════════════════
   4. SUPERFÍCIE — extraída do card da Lua, já aprovado
   ══════════════════════════════════════════════════════════ */

export const RADIUS = {
  row: '10px',      // linha interna de painel
  control: '9px',   // stepper, segmentado, slider
  panel: '14px',    // painel, popover, modal
  chip: '12px',     // pílula, chip de tempo
  pill: '999px',    // toggle
} as const;

export const SURFACE = {
  /** Painel, popover, card. */
  panel: {
    background: 'rgba(8,6,18,0.95)',
    border: `1px solid ${COLOR.lineStrong}`,
    borderRadius: RADIUS.panel,
    backdropFilter: 'blur(16px)',
    boxShadow: '0 12px 32px rgba(0,0,0,.7), inset 0 1px 1px rgba(255,255,255,.22)',
  },
  /** Popover: mesma família, sombra mais profunda por estar acima do painel. */
  popover: {
    background: 'rgba(8,6,18,0.975)',
    border: `1px solid ${COLOR.lineStrong}`,
    borderRadius: RADIUS.panel,
    backdropFilter: 'blur(20px)',
    boxShadow: '0 20px 56px rgba(0,0,0,.85), inset 0 1px 1px rgba(255,255,255,.2)',
  },
  /** Linha interna: astro, casa, aspecto, controle. */
  row: {
    background: 'linear-gradient(to bottom, rgba(255,255,255,.055), rgba(255,255,255,.018))',
    border: '1px solid rgba(255,255,255,.10)',
    borderRadius: RADIUS.row,
  },
  /** Linha selecionada. */
  rowSelected: {
    background: 'linear-gradient(to bottom, rgba(212,175,55,.10), rgba(212,175,55,.03))',
    border: '1px solid rgba(212,175,55,.50)',
    borderRadius: RADIUS.row,
  },
  /** Pílula e chip de tempo. */
  chip: {
    background: 'rgba(8,6,18,0.92)',
    border: `1px solid ${COLOR.line}`,
    borderRadius: RADIUS.chip,
    boxShadow: '0 4px 16px rgba(0,0,0,.6), inset 0 1px 1px rgba(255,255,255,.14)',
  },
  /* Modo claro */
  panelLight: {
    background: 'rgba(244,241,234,0.95)',
    border: `1px solid ${COLOR.lineLight}`,
    borderRadius: RADIUS.panel,
    backdropFilter: 'blur(16px)',
    boxShadow: '0 12px 32px rgba(110,98,75,.18)',
  },
} as const;

/** A primitiva .liquid-glass do index.css é usada 8 vezes, contra 102 de
 *  bg-white/10 ad-hoc. SURFACE substitui as duas. */

/* ══════════════════════════════════════════════════════════
   5. ESFERAS DE ASTRO — substituem o glifo do planeta
   ══════════════════════════════════════════════════════════ */

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const mix = (c: number[], t: number[], f: number) =>
  c.map((v, i) => Math.round(v + (t[i] - v) * f));
const toRgb = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;

/**
 * Gradiente radial de esfera para um astro.
 * Realce especular a 30%/24%, terminador a 78%, borda escura a 100%.
 * O glifo do SIGNO permanece na linha — ele é informação.
 * O que sai é o glifo do PLANETA, que competia com o do signo.
 */
export const planetSphere = (hex: string) => {
  const base = hexToRgb(hex);
  return `radial-gradient(circle at 30% 24%, ${toRgb(mix(base, [255, 255, 255], .45))} 0%, ${hex} 40%, ${toRgb(mix(base, [0, 0, 0], .62))} 78%, ${toRgb(mix(base, [0, 0, 0], .80))} 100%)`;
};

export const planetSphereShadow = (hex: string) =>
  `inset -1.5px -2px 4px rgba(0,0,0,.55), 0 0 7px ${hex}40`;

/* ══════════════════════════════════════════════════════════
   6. ANEL DE TEMPO
   ══════════════════════════════════════════════════════════ */

export const TIME_RING = {
  /** Só estas oito recebem número, em Playfair, sempre na horizontal. */
  cardinals: [0, 3, 6, 9, 12, 15, 18, 21] as const,
  /** 12 (MC) e 0 (IC) em ouro; as outras seis em creme. */
  axes: [0, 12] as const,
  tick: { cardinal: 13, even: 8, odd: 4 },
  tickOpacity: { cardinal: .68, axis: .95, even: .42, odd: .20 },
  numeralOffset: 27,
} as const;

/* ══════════════════════════════════════════════════════════
   7. PROFUNDIDADE — seis níveis, nada de z-[9999]
   ══════════════════════════════════════════════════════════ */

export const Z = {
  base: 0,
  chart: 10,
  panel: 20,
  dock: 30,
  rail: 40,
  popover: 60,
  modal: 80,
  toast: 100,
} as const;

/** Substitui os ~22 valores arbitrários em uso, que iam até 999999. */

/* ══════════════════════════════════════════════════════════
   8. LAYOUT
   ══════════════════════════════════════════════════════════ */

export const LAYOUT = {
  railWidth: 54,
  dockLeftWidth: 238,
  dockRightWidth: 248,
  popoverWidth: 322,   // 322 e não 280: cabe segmentado de 4 opções sem truncar
  panelHeaderHeight: 30,
  controlMinHeight: 32,
  /** Lado da sidebar é preferência por usuário, não decisão global. */
  railSide: 'left' as 'left' | 'right',
} as const;

/* ══════════════════════════════════════════════════════════
   9. REGRAS DOS POPOVERS DE OPÇÕES
   ══════════════════════════════════════════════════════════ */

export const POPOVER_RULES = {
  /** Nenhum controle esconde seu valor atual. O estado do mapa
   *  é auditável sem tocar em nada. */
  alwaysShowValue: true,
  /** Rótulo à esquerda, controle à direita, uma coluna só. */
  singleColumn: true,
  /** Quatro tipos de controle, e só. Cada decisão tem uma forma. */
  controls: ['toggle', 'stepper', 'slider', 'segmented'] as const,
  /** Explicação é subordinada escrita, nunca tooltip. */
  helpAsSubtext: true,
  /** Grupos de 3 a 4 linhas, rótulo em ouro com filete. */
  groupSize: [3, 4] as const,
} as const;

export default {
  GROUND, COLOR, GOLD_USAGE, PLANET_COLOR, ASPECT_COLOR, ELEMENT_COLOR,
  FONT, TYPE, RADIUS, SURFACE, TIME_RING, Z, LAYOUT, POPOVER_RULES,
  planetSphere, planetSphereShadow,
};
