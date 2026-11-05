/**
 * Conteúdo das tooltips do Cronógrafo (astros, aspectos, signos, termos, decanatos, casas).
 *
 * PADRÃO DE COPY (igual em todos os tipos):
 *   1ª frase — O QUE É, em palavras do dia a dia (uma criança de 7 anos entende).
 *   2ª frase — O QUE SIGNIFICA AGORA, para este caso.
 * Termos técnicos (dignidade, orbe, ordem caldeia…) só aparecem em "Ver mais".
 *
 * Os textos ficam todos neste arquivo para revisão rápida.
 */
import { ZODIAC_DATA } from '../../components/zodiac';
import { CELESTIAL_GLYPHS } from '../../components/icons';
import { Aspect, getAspectTiming } from './aspects';
import { getDecanRuler } from './dignities';
import { getSignTerms, getTermAt } from './terms';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export type TooltipKind = 'planet' | 'aspect' | 'sign' | 'term' | 'decan' | 'house';

export interface TooltipRow {
  label: string;
  value: string;
  /** números em fonte mono */
  mono?: boolean;
  tone?: 'good' | 'bad' | 'accent';
}

export interface TooltipSegment {
  label: string;
  /** largura relativa (graus) */
  size: number;
  active: boolean;
}

export interface TooltipModel {
  key: string;
  kind: TooltipKind;
  glyph: string;
  /** cor do glifo/selo */
  accent: string;
  /** para astros: id (desenha a esfera com o gradiente do planeta) */
  planetId?: string;
  title: string;
  text: string;
  rows: TooltipRow[];
  segments?: TooltipSegment[];
}

export interface TooltipContext {
  /** longitudes no zodíaco exibido (sideral ou tropical) */
  longitudes: Record<string, number>;
  retrograde: Record<string, boolean>;
  houses: Record<string, number>;
  /** cúspides no zodíaco exibido */
  houseCusps: number[];
  aspects: Aspect[];
  visible: Record<string, boolean>;
  moon?: { phaseName: string; illum: number; rise: string; set: string; cycleName?: string };
  now: Date;
  location?: { latitude: number; longitude: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// Nomes e copy
// ─────────────────────────────────────────────────────────────────────────────

export const BODY_NAMES: Record<string, string> = {
  sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte',
  jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno', pluto: 'Plutão',
  lilith: 'Lilith', northNode: 'Nodo Norte', southNode: 'Nodo Sul', chiron: 'Quíron',
  ceres: 'Ceres', pallas: 'Pallas', juno: 'Juno', vesta: 'Vesta', partOfFortune: 'Parte da Fortuna',
};

/** "do Sol", "da Lua", "de Marte"… */
const OF_BODY: Record<string, string> = {
  sun: 'do Sol', moon: 'da Lua', northNode: 'do Nodo Norte', southNode: 'do Nodo Sul',
  partOfFortune: 'da Parte da Fortuna',
};
const ofBody = (id: string) => OF_BODY[id] ?? `de ${BODY_NAMES[id] ?? id}`;
/** "o Sol", "a Lua", "Marte"… (nomes próprios de planeta vão sem artigo) */
const ARTICLE: Record<string, string> = {
  sun: 'o', moon: 'a', northNode: 'o', southNode: 'o', partOfFortune: 'a', lilith: 'a',
};
const withArticle = (id: string) => (ARTICLE[id] ? `${ARTICLE[id]} ` : '') + (BODY_NAMES[id] ?? id);

/** 1ª frase dos astros: o que é. */
const PLANET_WHAT: Record<string, string> = {
  sun: 'O Sol é a nossa luz: quem somos e o que nos dá energia.',
  moon: 'A Lua mostra as nossas emoções e o que nos faz sentir seguros.',
  mercury: 'Mercúrio é o nosso jeito de pensar, aprender e conversar.',
  venus: 'Vênus fala do amor, da beleza e do que nos dá prazer.',
  mars: 'Marte é a nossa energia para agir: coragem, vontade e iniciativa.',
  jupiter: 'Júpiter é o astro do crescimento, da sorte e da confiança.',
  saturn: 'Saturno ensina limites, paciência e responsabilidade.',
  uranus: 'Urano traz mudanças, surpresas e ideias novas.',
  neptune: 'Netuno fala dos sonhos, da intuição e da imaginação.',
  pluto: 'Plutão é a força das grandes transformações.',
  lilith: 'Lilith mostra a nossa força mais livre e instintiva, a que não aceita ser controlada.',
  northNode: 'O Nodo Norte aponta o caminho que a alma veio aprender.',
  southNode: 'O Nodo Sul mostra o que já sabemos fazer bem e precisamos soltar aos poucos.',
  chiron: 'Quíron mostra onde temos uma ferida e também o dom de curar.',
  ceres: 'Ceres fala de cuidar e de ser cuidado.',
  pallas: 'Pallas é a inteligência estratégica: ver o todo e achar soluções.',
  juno: 'Juno fala das parcerias e dos compromissos.',
  vesta: 'Vesta é a chama da dedicação: aquilo a que entregamos o coração.',
  partOfFortune: 'A Parte da Fortuna mostra onde a vida flui com mais facilidade e alegria.',
};

/** Tom de cada signo (2ª frase dos astros): "ganha o tom {…}". */
const SIGN_TONE = [
  'da coragem e da pressa', 'da calma e do conforto', 'da curiosidade e da conversa',
  'do cuidado e da proteção', 'do brilho e da criatividade', 'do detalhe e da organização',
  'do equilíbrio e da parceria', 'da intensidade e da profundidade', 'da aventura e da fé',
  'da disciplina e da ambição', 'da liberdade e do coletivo', 'da sensibilidade e da imaginação',
];

/** 1ª frase dos signos. */
const SIGN_WHAT = [
  'Áries é o signo da coragem e dos começos.',
  'Touro é o signo da calma, do conforto e das coisas que duram.',
  'Gêmeos é o signo da curiosidade, das ideias e da conversa.',
  'Câncer é o signo do cuidado: casa, família e sentimentos.',
  'Leão é o signo do brilho, da alegria e da criatividade.',
  'Virgem é o signo do cuidado com os detalhes e com a saúde.',
  'Libra é o signo do equilíbrio, da beleza e das parcerias.',
  'Escorpião é o signo da intensidade e das transformações.',
  'Sagitário é o signo das aventuras, das viagens e da fé.',
  'Capricórnio é o signo da disciplina e das metas.',
  'Aquário é o signo da liberdade, da amizade e do futuro.',
  'Peixes é o signo da imaginação, da intuição e da compaixão.',
];

/** Palavra-chave de cada corpo nos aspectos (sempre feminina: concorda com "fluem juntas"). */
const ASPECT_KEY: Record<string, string> = {
  sun: 'a identidade', moon: 'a emoção', mercury: 'a mente', venus: 'a afetividade',
  mars: 'a ação', jupiter: 'a expansão', saturn: 'a responsabilidade', uranus: 'a mudança',
  neptune: 'a intuição', pluto: 'a transformação', lilith: 'a liberdade instintiva',
  northNode: 'a direção da alma', southNode: 'a bagagem do passado', chiron: 'a cura',
  ceres: 'a nutrição', pallas: 'a estratégia', juno: 'a parceria', vesta: 'a dedicação',
  partOfFortune: 'a boa sorte',
};

const ASPECT_INFO: Record<string, { name: string; symbol: string; angle: number; color: string; what: string; verb: string; connector: string }> = {
  conjunction: { name: 'Conjunção', symbol: '☌', angle: 0, color: '#4870FF', connector: 'junto de',
    what: 'Uma conjunção é quando dois astros se encontram no mesmo ponto do céu.', verb: 'se misturam' },
  opposition: { name: 'Oposição', symbol: '☍', angle: 180, color: '#f87171', connector: 'oposto a',
    what: 'Uma oposição é quando dois astros ficam em lados opostos do céu.', verb: 'precisam encontrar equilíbrio' },
  square: { name: 'Quadratura', symbol: '□', angle: 90, color: '#FB923C', connector: 'em quadratura com',
    what: 'Uma quadratura é quando dois astros formam um ângulo reto e se desafiam.', verb: 'se desafiam e geram movimento' },
  trine: { name: 'Trígono', symbol: '△', angle: 120, color: '#4ade80', connector: 'em trígono com',
    what: 'Um trígono é quando dois astros se ajudam com facilidade.', verb: 'fluem juntas' },
  sextile: { name: 'Sextil', symbol: '✶', angle: 60, color: '#60a5fa', connector: 'em sextil com',
    what: 'Um sextil é quando dois astros abrem uma boa oportunidade entre si.', verb: 'se ajudam' },
};

/** 2ª frase dos termos: "Este trecho de {signo} é de {regente}: {…}." */
const TERM_TONE: Record<string, string> = {
  jupiter: 'traz generosidade e confiança',
  venus: 'traz harmonia e prazer',
  mercury: 'agita as ideias e as conversas',
  mars: 'traz coragem e pressa',
  saturn: 'pede calma e responsabilidade',
};

/** 2ª frase dos decanatos: "…: mais {…}." */
const DECAN_TONE: Record<string, string> = {
  sun: 'brilho e confiança', moon: 'sensibilidade e intuição', mercury: 'curiosidade e inteligência',
  venus: 'beleza e afeto', mars: 'ação e coragem', jupiter: 'expansão e fé', saturn: 'foco e maturidade',
};

const HOUSE_WHAT = [
  'A Casa 1 é a nossa identidade: como nos mostramos ao mundo.',
  'A Casa 2 fala de dinheiro, valores e do que temos.',
  'A Casa 3 fala de comunicação, estudos e irmãos.',
  'A Casa 4 é o lar, a família e as raízes.',
  'A Casa 5 fala de criatividade, diversão, romance e filhos.',
  'A Casa 6 é a rotina, o trabalho do dia a dia e a saúde.',
  'A Casa 7 fala das parcerias: casamento, sócios e acordos.',
  'A Casa 8 fala de transformações, intimidade e recursos compartilhados.',
  'A Casa 9 é a das viagens longas, dos estudos e da fé.',
  'A Casa 10 é a carreira, a reputação e os objetivos.',
  'A Casa 11 fala dos amigos, dos grupos e dos sonhos para o futuro.',
  'A Casa 12 é o mundo interior: descanso, espiritualidade e o que está escondido.',
];

const ELEMENT_PT: Record<string, string> = { fire: 'Fogo', earth: 'Terra', air: 'Ar', water: 'Água' };
const ELEMENT_COLOR: Record<string, string> = { fire: '#FB923C', earth: '#34D399', air: '#FEF3C7', water: '#60A5FA' };
const MODALITY_PT: Record<string, string> = { cardinal: 'Cardinal', fixed: 'Fixo', mutable: 'Mutável' };
const POLARITY_PT: Record<string, string> = { masculine: 'Masculino', feminine: 'Feminino' };

// Dignidades tradicionais (7 planetas clássicos)
const DOMICILE: Record<string, number[]> = {
  sun: [4], moon: [3], mercury: [2, 5], venus: [1, 6], mars: [0, 7], jupiter: [8, 11], saturn: [9, 10],
};
const EXALTATION: Record<string, number> = { sun: 0, moon: 1, mercury: 5, venus: 11, mars: 9, jupiter: 3, saturn: 6 };
const opposite = (s: number) => (s + 6) % 12;

type Dignity = 'Domicílio' | 'Exaltação' | 'Exílio' | 'Queda' | 'Peregrino';
const dignityOf = (planetId: string, signIndex: number): Dignity | null => {
  if (!(planetId in DOMICILE)) return null;
  if (DOMICILE[planetId].includes(signIndex)) return 'Domicílio';
  if (EXALTATION[planetId] === signIndex) return 'Exaltação';
  if (DOMICILE[planetId].map(opposite).includes(signIndex)) return 'Exílio';
  if (opposite(EXALTATION[planetId]) === signIndex) return 'Queda';
  return 'Peregrino';
};
const dignityTone = (d: Dignity): TooltipRow['tone'] =>
  d === 'Domicílio' || d === 'Exaltação' ? 'good' : d === 'Exílio' || d === 'Queda' ? 'bad' : undefined;

// ─────────────────────────────────────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────────────────────────────────────

const norm = (l: number) => ((l % 360) + 360) % 360;
const signOf = (lon: number) => Math.floor(norm(lon) / 30);
const SIGN = (i: number) => ZODIAC_DATA[((i % 12) + 12) % 12];

export const fmtDegree = (lon: number): string => {
  const l = norm(lon);
  const s = Math.floor(l / 30);
  const inSign = l - s * 30;
  let d = Math.floor(inSign);
  let m = Math.round((inSign - d) * 60);
  if (m === 60) { m = 0; d += 1; }
  return `${d}°${String(m).padStart(2, '0')}′ ${SIGN(s).symbol} ${SIGN(s).name}`;
};
const fmtOrb = (orb: number) => {
  const d = Math.floor(orb);
  const m = Math.round((orb - d) * 60);
  return m === 60 ? `${d + 1}°00′` : `${d}°${String(m).padStart(2, '0')}′`;
};
const fmtDay = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
const fmtDayYear = (d: Date, now: Date) => d.getFullYear() === now.getFullYear() ? fmtDay(d) : `${fmtDay(d)}/${d.getFullYear()}`;
const glyph = (id: string) => CELESTIAL_GLYPHS[id] ?? '•';
const listPt = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;

/** Astros visíveis com longitude dentro de [start, end) (graus absolutos, 0–360). */
const bodiesIn = (ctx: TooltipContext, start: number, end: number): string[] =>
  Object.keys(BODY_NAMES).filter(id => {
    if (!ctx.visible[id]) return false;
    const l = ctx.longitudes[id];
    if (typeof l !== 'number') return false;
    const x = norm(l);
    return x >= start && x < end;
  });
const bodiesValue = (ids: string[], ctx: TooltipContext) =>
  ids.length ? ids.map(id => `${glyph(id)} ${BODY_NAMES[id]} ${fmtDegree(ctx.longitudes[id]).split(' ')[0]}`).join('\n') : 'Nenhum agora';
const hereSentence = (ids: string[], where: string) =>
  ids.length === 0 ? `Agora, nenhum astro está ${where}.`
    : ids.length === 1 ? `Agora, ${withArticle(ids[0])} está ${where}.`
      : `Agora, ${listPt(ids.map(withArticle))} estão ${where}.`;

// ─────────────────────────────────────────────────────────────────────────────
// Construtores
// ─────────────────────────────────────────────────────────────────────────────

export const buildPlanetTooltip = (id: string, ctx: TooltipContext): TooltipModel | null => {
  const lon = ctx.longitudes[id];
  if (typeof lon !== 'number' || !BODY_NAMES[id]) return null;
  const s = signOf(lon);
  const name = BODY_NAMES[id];
  const retro = !!ctx.retrograde[id];

  let second: string;
  if (id === 'moon' && ctx.moon) {
    second = `Hoje ela está em ${ctx.moon.phaseName}, com ${ctx.moon.illum}% de luz, em ${SIGN(s).name}.`;
  } else if (retro) {
    second = `Agora está retrógrado em ${SIGN(s).name}: tempo de rever, com o tom ${SIGN_TONE[s]}.`;
  } else {
    second = `Agora, em ${SIGN(s).name}, ganha o tom ${SIGN_TONE[s]}.`;
  }

  const rows: TooltipRow[] = [{ label: 'Posição', value: fmtDegree(lon), mono: true }];
  if (id === 'moon' && ctx.moon) {
    rows.push({ label: 'Fase', value: `${ctx.moon.phaseName} · ${ctx.moon.illum}%` });
    rows.push({ label: 'Nasce · Põe', value: `${ctx.moon.rise} · ${ctx.moon.set}`, mono: true });
    if (ctx.moon.cycleName) rows.push({ label: 'Ciclo', value: ctx.moon.cycleName });
  } else if (!['northNode', 'southNode', 'partOfFortune', 'lilith'].includes(id)) {
    rows.push({ label: 'Movimento', value: retro ? 'Retrógrado' : 'Direto', tone: retro ? 'accent' : undefined });
  }
  const dig = dignityOf(id, s);
  if (dig) rows.push({ label: 'Dignidade', value: dig, tone: dignityTone(dig) });
  const term = getTermAt(lon);
  rows.push({ label: 'Termo', value: `${glyph(term.ruler)} ${BODY_NAMES[term.ruler]}` });
  const decanNum = Math.floor((norm(lon) % 30) / 10) + 1;
  const decanRuler = getDecanRuler(norm(lon));
  rows.push({ label: 'Decanato', value: `${decanNum}º · ${glyph(decanRuler)} ${BODY_NAMES[decanRuler]}` });
  const house = ctx.houses[id];
  if (house) rows.push({ label: 'Casa', value: `Casa ${house}`, mono: false });
  const asps = ctx.aspects
    .filter(a => !a.isNatal && (a.body1.id === id || a.body2.id === id))
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 4)
    .map(a => {
      const other = a.body1.id === id ? a.body2.id : a.body1.id;
      return `${ASPECT_INFO[a.type]?.symbol ?? ''} ${BODY_NAMES[other] ?? other} ${fmtOrb(a.orb)}`;
    });
  if (asps.length) rows.push({ label: 'Aspectos', value: asps.join('\n') });

  return {
    key: `planet-${id}`, kind: 'planet', glyph: glyph(id), accent: '#F5F2EB', planetId: id,
    title: name, text: `${PLANET_WHAT[id] ?? ''} ${second}`.trim(), rows,
  };
};

export const buildSignTooltip = (signIndexOrId: number | string, ctx: TooltipContext): TooltipModel | null => {
  const s = typeof signIndexOrId === 'number' ? signIndexOrId : ZODIAC_DATA.findIndex(z => z.id === signIndexOrId);
  if (s < 0) return null;
  const z = SIGN(s);
  const here = bodiesIn(ctx, s * 30, s * 30 + 30);
  const exalted = Object.keys(EXALTATION).filter(p => EXALTATION[p] === s);
  const exiled = Object.keys(DOMICILE).filter(p => DOMICILE[p].map(opposite).includes(s));
  const fallen = Object.keys(EXALTATION).filter(p => opposite(EXALTATION[p]) === s);
  const names = (ids: string[]) => ids.length ? ids.map(i => `${glyph(i)} ${BODY_NAMES[i]}`).join(', ') : '—';
  return {
    key: `sign-${s}`, kind: 'sign', glyph: z.symbol, accent: ELEMENT_COLOR[z.element] ?? '#F5F2EB',
    title: z.name,
    text: `${SIGN_WHAT[s]} ${hereSentence(here, 'aqui')}`,
    rows: [
      { label: 'Elemento', value: ELEMENT_PT[z.element] ?? z.element },
      { label: 'Modalidade', value: MODALITY_PT[z.modality] ?? z.modality },
      { label: 'Polaridade', value: POLARITY_PT[z.polarity] ?? z.polarity },
      { label: 'Regente', value: `${glyph(z.ruler)} ${BODY_NAMES[z.ruler] ?? z.ruler}` },
      { label: 'Exaltação', value: names(exalted) },
      { label: 'Exílio', value: names(exiled) },
      { label: 'Queda', value: names(fallen) },
      { label: 'Astros aqui', value: bodiesValue(here, ctx) },
    ],
  };
};

export const buildAspectTooltip = (aspect: Aspect, ctx: TooltipContext): TooltipModel | null => {
  const info = ASPECT_INFO[aspect.type];
  if (!info) return null;
  const a = aspect.body1.id, b = aspect.body2.id;
  const natal = aspect.isNatal ? ' natal' : '';
  const timing = (() => { try { return getAspectTiming(aspect, ctx.now, ctx.location); } catch { return null; } })();
  const rows: TooltipRow[] = [
    { label: 'Aspecto', value: `${info.symbol} ${info.name} · ${info.angle}°` },
    { label: 'Orbe', value: fmtOrb(aspect.orb), mono: true },
  ];
  if (timing) {
    rows.push({ label: 'Estado', value: timing.applying ? 'Se formando' : 'Se desfazendo', tone: timing.applying ? 'good' : undefined });
    rows.push({
      label: timing.applying ? 'Exato' : 'Foi exato',
      value: timing.exact ? fmtDayYear(timing.exact, ctx.now) : (timing.applying ? 'Não chega ao exato' : 'Não chegou ao exato'),
      mono: !!timing.exact,
    });
    rows.push({
      label: 'Vigência',
      value: `${timing.range.startOpen ? 'antes de ' : ''}${fmtDayYear(timing.range.start, ctx.now)} → ${timing.range.endOpen ? 'depois de ' : ''}${fmtDayYear(timing.range.end, ctx.now)}`,
      mono: true,
    });
  }
  return {
    key: `aspect-${aspect.id}`, kind: 'aspect', glyph: info.symbol, accent: info.color,
    title: `${BODY_NAMES[a] ?? a} ${info.connector} ${BODY_NAMES[b] ?? b}${natal}`,
    text: `${info.what} Aqui, ${ASPECT_KEY[a] ?? 'a energia'} e ${ASPECT_KEY[b] ?? 'a energia'} ${info.verb}.`,
    rows,
  };
};

export const buildTermTooltip = (signIndex: number, termIndex: number, ctx: TooltipContext): TooltipModel | null => {
  const terms = getSignTerms(signIndex);
  const t = terms[termIndex];
  if (!t) return null;
  const z = SIGN(signIndex);
  const here = bodiesIn(ctx, signIndex * 30 + t.start, signIndex * 30 + t.end);
  return {
    key: `term-${signIndex}-${termIndex}`, kind: 'term', glyph: glyph(t.ruler), accent: '#F5D98A',
    title: `Termo ${ofBody(t.ruler)}`,
    text: `Termo é um pedaço do signo que tem um astro responsável. Este trecho de ${z.name} é ${ofBody(t.ruler)}: ${TERM_TONE[t.ruler]}.`,
    rows: [
      { label: 'Signo', value: `${z.symbol} ${z.name}` },
      { label: 'Trecho', value: `${t.start}°–${t.end}°`, mono: true },
      { label: 'Sistema', value: `Egípcio · ${termIndex + 1}º de ${terms.length}` },
      { label: 'Astros aqui', value: bodiesValue(here, ctx) },
    ],
    segments: terms.map((x, i) => ({ label: `${glyph(x.ruler)} ${x.start}–${x.end}`, size: x.end - x.start, active: i === termIndex })),
  };
};

export const buildDecanTooltip = (decanIndex: number, ctx: TooltipContext): TooltipModel | null => {
  const s = Math.floor(decanIndex / 3);
  const n = decanIndex % 3;
  const ruler = getDecanRuler(decanIndex * 10);
  const z = SIGN(s);
  const ord = ['primeiro', 'segundo', 'último'][n];
  const here = bodiesIn(ctx, decanIndex * 10, decanIndex * 10 + 10);
  return {
    key: `decan-${decanIndex}`, kind: 'decan', glyph: glyph(ruler), accent: '#E2E8F0',
    title: `${n + 1}º decanato de ${z.name}`,
    text: `Decanato é cada terço de um signo. Este é o ${ord} terço de ${z.name}, ${ofBody(ruler)}: mais ${DECAN_TONE[ruler]}.`,
    rows: [
      { label: 'Signo', value: `${z.symbol} ${z.name}` },
      { label: 'Trecho', value: `${n * 10}°–${n * 10 + 10}°`, mono: true },
      { label: 'Regente', value: `${glyph(ruler)} ${BODY_NAMES[ruler]}` },
      { label: 'Sistema', value: `Caldeu (faces) · ${n + 1}º de 3` },
      { label: 'Astros aqui', value: bodiesValue(here, ctx) },
    ],
    segments: [0, 1, 2].map(i => {
      const r = getDecanRuler((s * 3 + i) * 10);
      return { label: `${i + 1}º · ${glyph(r)}`, size: 10, active: i === n };
    }),
  };
};

export const buildHouseTooltip = (house: number, ctx: TooltipContext, naturalRuler?: string): TooltipModel | null => {
  if (house < 1 || house > 12) return null;
  const here = Object.keys(BODY_NAMES).filter(id => ctx.visible[id] && ctx.houses[id] === house);
  const cusp = ctx.houseCusps[house - 1];
  const rows: TooltipRow[] = [];
  if (typeof cusp === 'number') rows.push({ label: 'Cúspide', value: fmtDegree(cusp), mono: true });
  if (naturalRuler) rows.push({ label: 'Regente', value: `${glyph(naturalRuler)} ${BODY_NAMES[naturalRuler] ?? naturalRuler}` });
  rows.push({ label: 'Astros aqui', value: bodiesValue(here, ctx) });
  return {
    key: `house-${house}`, kind: 'house', glyph: String(house), accent: '#2E9E8C',
    title: `Casa ${house}`,
    text: `${HOUSE_WHAT[house - 1]} ${hereSentence(here, 'nesta casa')}`,
    rows,
  };
};
