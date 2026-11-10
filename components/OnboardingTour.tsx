/**
 * OnboardingTour — tutorial guiado do Cronógrafo, em FASES com MISSÕES (roteiro aprovado pelo Rafa).
 *
 * Tipos de passo:
 *  • info     — só leitura; a tela fica bloqueada.
 *  • explore  — a área em foco fica livre para mexer; avança só em "Próximo".
 *  • mission  — objetivo claro ("Missão: …"); a área fica livre; ao cumprir, mostra
 *               ✓ "Missão cumprida" e passa sozinho para a próxima.
 *
 * Foco duplo: o controle (borda dourada girando + mãozinha) e o relógio (contorno fino)
 * ficam abertos ao mesmo tempo quando o controle mexe no relógio. O resto fica escuro
 * e bloqueado — só funcionam os controles da fase.
 *
 * Um tour único para todos. Na abertura, o Cronógrafo completo e a pergunta
 * "Você já conhece o mapa astral?" — "Ainda não" tira termos e decanatos (só visual).
 * Ao sair, o App devolve a tela como estava.
 *
 * Alvos: elementos com data-tour="…". Teclado: → avança, ← volta, Esc fecha.
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

/** Estados do app que o tutorial acompanha. `time` = currentTime em ms. */
export type TourState = {
  atmosphere?: boolean; houseSelected?: boolean; realTime?: boolean;
  zodiacLocked?: boolean; natal?: boolean; time?: number;
};
type BoolKey = 'atmosphere' | 'houseSelected' | 'realTime' | 'zodiacLocked' | 'natal';

/** Cenas que o App monta a pedido do tutorial. */
export type TourScene = 'full-show' | 'simplify' | 'story' | 'planets' | 'houses' | 'aspects' | 'restore' | 'close-overlays';

type Wait =
  | { state: BoolKey }
  | { dom: string }                       // elemento precisa surgir
  | { domGone: string }                   // elemento precisa sumir
  | { click: string }                     // clique dentro do seletor
  | { timeMoved: true }                   // o relógio saiu do horário em que estava (> 1 min)
  | { event: 'wheel' | 'dblclick'; within: string; count?: number };

type ChapterId = 'hora' | 'lua' | 'nascimento' | 'salvar' | 'agora' | 'mais';
type Kind = 'info' | 'explore' | 'mission';

interface TourStep {
  chapter: ChapterId | 'intro' | 'end';
  kind: Kind;
  title: string;
  text: string;
  icon: string;
  /** alvo principal (o primeiro visível) */
  targets?: string[];
  /** áreas que também ficam abertas (ex.: o relógio, para ver o efeito) */
  also?: string[];
  round?: boolean;
  pad?: number;
  needsSidebar?: boolean;
  media?: 'daycard' | 'menu' | 'knowledge';
  scene?: TourScene;
  wait?: Wait;
  /** o objetivo da missão / o convite para explorar */
  goal?: string;
  /** texto quando a missão já estava cumprida ao chegar */
  doneText?: string;
  pro?: string;
}

export const TOUR_CHAPTERS: { id: ChapterId; label: string; icon: string }[] = [
  { id: 'hora', label: 'Que horas são?', icon: 'ti-sun' },
  { id: 'lua', label: 'Em que dia estamos?', icon: 'ti-moon' },
  { id: 'nascimento', label: 'Como estava o céu quando nasci?', icon: 'ti-calendar-event' },
  { id: 'salvar', label: 'Como guardo meu mapa?', icon: 'ti-bookmark' },
  { id: 'agora', label: 'O que está acontecendo comigo agora?', icon: 'ti-sparkles' },
  { id: 'mais', label: 'Mais caminhos', icon: 'ti-compass' },
];
const chapterNumber = (id: string) => TOUR_CHAPTERS.findIndex(c => c.id === id) + 1;

// ─────────────────────────────────────────────────────────────────────────────
// Roteiro
// ─────────────────────────────────────────────────────────────────────────────
export const TOUR_STEPS: TourStep[] = [
  { chapter: 'intro', kind: 'info', title: 'O céu, agora', text: 'Um relógio que mostra onde está cada astro neste instante.', icon: 'ti-sparkles', media: 'menu', scene: 'restore' },

  // Fase 1 · Que horas são?
  { chapter: 'hora', kind: 'explore', title: 'Este é o Cronógrafo', text: 'O céu inteiro num relógio: astros, signos, casas, aspectos, termos e decanatos.', icon: 'ti-clock', targets: ['clock'], round: true, pad: 0, scene: 'full-show', goal: 'Olhe à vontade. Passe o mouse no que quiser.' },
  { chapter: 'hora', kind: 'info', title: 'Você já conhece o mapa astral?', text: 'Vamos montar o céu do zero, peça por peça.', icon: 'ti-help-circle', targets: ['clock'], round: true, pad: 0, media: 'knowledge' },
  { chapter: 'hora', kind: 'mission', title: 'Ligue o céu', text: 'A atmosfera mostra o dia, a noite e o horizonte.', icon: 'ti-cloud', targets: ['atmosphere'], also: ['clock'], pad: 6, needsSidebar: true, scene: 'story', wait: { state: 'atmosphere' }, goal: 'Clique em Atmosfera', doneText: 'O céu já está ligado.' },
  { chapter: 'hora', kind: 'explore', title: 'Que horas são?', text: 'Acima da linha, o céu visível. Abaixo, o céu sob a Terra. O anel mostra as 24 horas.', icon: 'ti-clock', targets: ['clock'], round: true, pad: 0, goal: 'Observe o céu de agora.' },
  { chapter: 'hora', kind: 'explore', title: 'O Sol marca o dia', text: 'No alto, meio-dia. Embaixo, meia-noite.', icon: 'ti-sun', targets: ['planet', 'clock'], round: true, pad: 16, goal: 'Pare o mouse no Sol, se quiser.' },
  { chapter: 'hora', kind: 'explore', title: 'A Lua marca o mês', text: 'Fase, luz e o humor dos dias.', icon: 'ti-moon', targets: ['planet-moon', 'clock'], round: true, pad: 16, goal: 'Pare o mouse na Lua, se quiser.' },
  { chapter: 'hora', kind: 'explore', title: 'Os planetas', text: 'Cada um, uma energia, no seu ritmo.', icon: 'ti-planet', targets: ['clock'], round: true, pad: 0, scene: 'planets', goal: 'Pare o mouse nos astros que quiser ler.' },
  { chapter: 'hora', kind: 'explore', title: 'Os signos', text: 'O caminho por onde todos passam.', icon: 'ti-zodiac-aries', targets: ['clock'], round: true, pad: 0, goal: 'Leia quantos signos quiser.' },
  { chapter: 'hora', kind: 'explore', title: 'Cores do zodíaco', text: 'Elementos, ritmos e polaridade. Passe o mouse nos cards: o relógio acende.', icon: 'ti-palette', targets: ['status'], also: ['clock'], pad: 4, goal: 'Passe o mouse nos cards e veja o relógio.' },
  { chapter: 'hora', kind: 'mission', title: 'As casas', text: '12 áreas da vida, contadas a partir do horizonte.', icon: 'ti-home', targets: ['clock'], round: true, pad: 0, scene: 'houses', wait: { state: 'houseSelected' }, goal: 'Clique numa casa', doneText: 'Você já tem uma casa destacada.' },
  { chapter: 'hora', kind: 'explore', title: 'Aspectos', text: 'A conversa entre dois astros. Pare o mouse numa linha e abra "Ver detalhes".', icon: 'ti-affiliate', targets: ['clock'], round: true, pad: 0, scene: 'aspects', goal: 'Explore as linhas que quiser.' },

  // Fase 2 · Em que dia estamos?
  { chapter: 'lua', kind: 'mission', title: 'O card da Lua', text: 'Fase, luz, nascer, pôr e o próximo eclipse.', icon: 'ti-moon', targets: ['lunar'], pad: 6, scene: 'restore', wait: { dom: '[data-tour="calendar-panel"]' }, goal: 'Clique no card da Lua' },
  { chapter: 'lua', kind: 'explore', title: 'Três leituras do tempo', text: 'Mensal, Anual e Ciclos. E também o Solar.', icon: 'ti-calendar', targets: ['calendar-panel', 'lunar'], pad: 4, goal: 'Troque de aba, se quiser.', pro: 'Anual e Ciclos: planos Mensal e Vitalício.' },
  { chapter: 'lua', kind: 'explore', title: 'Ciclos lunares', text: 'Cada ciclo nasce na Lua Nova. Cada linha é uma fase: Nova, Crescente, Cheia, Minguante.', icon: 'ti-moon-stars', targets: ['calendar-panel', 'lunar'], pad: 4, goal: 'Percorra os ciclos.', pro: 'Ciclos: planos Mensal e Vitalício.' },
  { chapter: 'lua', kind: 'mission', title: 'O card do dia', text: 'Topo: data e signo do Sol. Meio: fase da Lua. Base: o dia e seu planeta.', icon: 'ti-layout-cards', targets: ['calendar-panel', 'lunar'], also: ['clock'], pad: 4, media: 'daycard', wait: { timeMoved: true }, goal: 'Clique num dia e veja o relógio ir até ele' },

  // Fase 3 · Como estava o céu quando nasci?
  { chapter: 'nascimento', kind: 'mission', title: 'Viaje no tempo', text: 'Pelo calendário da data, ou clicando no centro do relógio.', icon: 'ti-calendar-event', targets: ['date', 'date-display'], pad: 6, scene: 'restore', wait: { dom: '[data-tour="date-input"]' }, goal: 'Clique no calendário da data' },
  { chapter: 'nascimento', kind: 'mission', title: 'Role ou digite', text: 'Dia, mês, ano e hora. Ex.: 21/03/1990 às 08:15.', icon: 'ti-keyboard', targets: ['date-input', 'calendar-panel'], pad: 6, wait: { timeMoved: true }, goal: 'Digite uma data e tecle Enter' },
  { chapter: 'nascimento', kind: 'mission', title: 'Arraste o tempo', text: 'A linha do tempo leva o céu para frente e para trás.', icon: 'ti-arrows-horizontal', targets: ['timeline', 'time-step'], also: ['clock'], pad: 6, scene: 'close-overlays', wait: { timeMoved: true }, goal: 'Arraste a linha do tempo' },
  { chapter: 'nascimento', kind: 'mission', title: 'Zoom no tempo', text: 'Horas, dias ou anos na mesma linha.', icon: 'ti-zoom-in', targets: ['timeline', 'time-step'], also: ['clock'], pad: 6, wait: { event: 'wheel', within: '[data-tour="timeline"]' }, goal: 'Role o mouse sobre a linha' },
  { chapter: 'nascimento', kind: 'mission', title: 'Loop A-B', text: 'Marque dois momentos e o trecho se repete.', icon: 'ti-repeat', targets: ['timeline', 'time-step'], also: ['clock'], pad: 6, wait: { event: 'dblclick', within: '[data-tour="timeline"]', count: 2 }, goal: 'Dê dois duplos cliques na linha (A e B)' },
  { chapter: 'nascimento', kind: 'mission', title: 'Avance e volte', text: 'Segure o botão e o tempo corre.', icon: 'ti-player-track-next', targets: ['time-step'], also: ['clock'], pad: 6, wait: { timeMoved: true }, goal: 'Segure o botão de avançar' },
  { chapter: 'nascimento', kind: 'mission', title: 'Trave o zodíaco', text: 'Com o zodíaco parado, você vê os astros andando.', icon: 'ti-lock', targets: ['zodiac-lock'], also: ['clock'], pad: 6, wait: { state: 'zodiacLocked' }, goal: 'Clique no cadeado', doneText: 'O zodíaco já está travado.' },
  { chapter: 'nascimento', kind: 'explore', title: 'Veja os astros caminhando', text: 'Avance o tempo: cada astro anda pelos signos no seu ritmo.', icon: 'ti-route', targets: ['time-step'], also: ['clock', 'timeline'], pad: 6, goal: 'Avance o tempo à vontade.' },

  // Fase 4 · Como guardo meu mapa?
  { chapter: 'salvar', kind: 'mission', title: 'Salve seu mapa', text: 'Ele fica guardado na sua conta.', icon: 'ti-bookmark', targets: ['save'], pad: 6, needsSidebar: true, scene: 'restore', wait: { dom: '[data-tour="save-modal"]' }, goal: 'Clique em Salvar' },
  { chapter: 'salvar', kind: 'mission', title: 'Dê um nome', text: 'Um nome para encontrar depois.', icon: 'ti-pencil', targets: ['save-modal', 'save'], pad: 6, wait: { domGone: '[data-tour="save-modal"]' }, goal: 'Nomeie e confirme' },
  { chapter: 'salvar', kind: 'info', title: 'Exporte em PDF', text: 'Pronto para enviar ou imprimir.', icon: 'ti-download', targets: ['export'], pad: 6, needsSidebar: true },

  // Fase 5 · O que está acontecendo comigo agora?
  { chapter: 'agora', kind: 'mission', title: 'Seu mapa por baixo', text: 'Adicione o seu mapa natal. O céu de hoje gira sobre ele.', icon: 'ti-circles', targets: ['natal'], pad: 6, needsSidebar: true, scene: 'restore', wait: { dom: '[data-tour="natal-popover"]' }, goal: 'Clique no +' },
  { chapter: 'agora', kind: 'mission', title: 'Quando você nasceu?', text: 'Dia, mês, ano, hora e cidade.', icon: 'ti-keyboard', targets: ['natal-popover', 'natal'], also: ['clock'], pad: 6, needsSidebar: true, wait: { state: 'natal' }, goal: 'Digite e aplique', doneText: 'Seu mapa natal já está no relógio.' },
  { chapter: 'agora', kind: 'mission', title: 'Volte para hoje', text: 'O céu de agora, sobre o seu mapa.', icon: 'ti-clock-bolt', targets: ['now'], also: ['clock'], pad: 6, wait: { state: 'realTime' }, goal: 'Clique em Agora', doneText: 'O relógio já está no agora.' },
  { chapter: 'agora', kind: 'explore', title: 'Os trânsitos', text: 'Cada linha é o céu de hoje tocando o seu mapa.', icon: 'ti-affiliate', targets: ['clock'], round: true, pad: 0, goal: 'Explore as linhas.' },
  { chapter: 'agora', kind: 'explore', title: 'Todos os aspectos', text: 'A lista do momento. Passe o mouse num item: ele acende no relógio.', icon: 'ti-list-details', targets: ['astros-panel'], also: ['clock'], pad: 4, goal: 'Passe o mouse na lista.' },
  { chapter: 'agora', kind: 'explore', title: 'Quando começa e termina', text: '"Ver detalhes" mostra o início, o exato e o fim de cada aspecto.', icon: 'ti-calendar-time', targets: ['clock'], round: true, pad: 0, goal: 'Pare numa linha e clique no cartão.' },

  // Fase 6 · Mais caminhos
  { chapter: 'mais', kind: 'info', title: 'Quando é o próximo eclipse?', text: 'Data, local e animação.', icon: 'ti-sun-low', targets: ['eclipses'], pad: 6, needsSidebar: true, scene: 'restore' },
  { chapter: 'mais', kind: 'info', title: 'Qual a energia do meu dia?', text: 'O arcano de cada dia.', icon: 'ti-cards', targets: ['arcane'], pad: 6, needsSidebar: true },
  { chapter: 'mais', kind: 'info', title: 'Tela cheia', text: 'Para aulas e atendimentos.', icon: 'ti-maximize', targets: ['present'], pad: 6 },
  { chapter: 'mais', kind: 'info', title: 'Do seu jeito', text: 'Planetas, casas, graus, anéis, céu e tamanho.', icon: 'ti-adjustments', targets: ['settings'], pad: 6, needsSidebar: true },

  { chapter: 'end', kind: 'info', title: 'Pronto', text: 'Volte aqui quando quiser, ou escolha outra pergunta.', icon: 'ti-help-circle', targets: ['help'], round: true, pad: 6, scene: 'restore' },
];

const END_INDEX = TOUR_STEPS.length - 1;
const firstIndexOf = (ch: ChapterId) => TOUR_STEPS.findIndex(s => s.chapter === ch);

// ─────────────────────────────────────────────────────────────────────────────
// Primeiro acesso (salvo no navegador, por conta)
// ─────────────────────────────────────────────────────────────────────────────
const doneKey = (uid?: string | null) => `cronografo_tour_done_v1:${uid || 'anon'}`;
export const isTourDone = (uid?: string | null): boolean => {
  try { return localStorage.getItem(doneKey(uid)) === '1'; } catch { return true; }
};
export const markTourDone = (uid?: string | null) => {
  try { localStorage.setItem(doneKey(uid), '1'); } catch { /* sem armazenamento */ }
};

// ─────────────────────────────────────────────────────────────────────────────
// Alvos e furos no escurecido
// ─────────────────────────────────────────────────────────────────────────────
interface Box { x: number; y: number; w: number; h: number; round: boolean }

const visibleRect = (el: Element): DOMRect | null => {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  if (r.right < 0 || r.bottom < 0 || r.left > window.innerWidth || r.top > window.innerHeight) return null;
  const cs = window.getComputedStyle(el as HTMLElement);
  if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return null;
  return r;
};
const isPresent = (selector: string) => Array.from(document.querySelectorAll(selector)).some(el => !!visibleRect(el));

const rectOf = (name: string): DOMRect | null =>
  (Array.from(document.querySelectorAll(`[data-tour="${name}"]`)).map(visibleRect).find(Boolean) as DOMRect | undefined) ?? null;

const toBox = (r: DOMRect, round: boolean, pad: number): Box => {
  if (round) {
    const d = Math.min(r.width, r.height) + 2 * pad;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return { x: cx - d / 2, y: cy - d / 2, w: d, h: d, round: true };
  }
  return { x: r.left - pad, y: r.top - pad, w: r.width + 2 * pad, h: r.height + 2 * pad, round: false };
};

const findBoxes = (step: TourStep): { main: Box | null; extra: Box[] } => {
  let main: Box | null = null;
  for (const t of step.targets ?? []) {
    const r = rectOf(t);
    if (r) { main = toBox(r, !!step.round, step.pad ?? 6); break; }
  }
  const extra: Box[] = [];
  for (const a of step.also ?? []) {
    const r = rectOf(a);
    if (!r) continue;
    const b = toBox(r, a === 'clock', a === 'clock' ? 0 : 4);
    // não repete área que já está aberta (evita "furo dentro de furo")
    const overlaps = (o: Box) => !(b.x + b.w <= o.x || o.x + o.w <= b.x || b.y + b.h <= o.y || o.y + o.h <= b.y);
    if (main && overlaps(main)) continue;
    if (extra.some(overlaps)) continue;
    extra.push(b);
  }
  return { main, extra };
};

/** Caminho SVG: tela inteira menos os furos (regra evenodd). */
const holesPath = (boxes: Box[]): string => {
  const vw = window.innerWidth, vh = window.innerHeight;
  let d = `M0 0H${vw}V${vh}H0Z`;
  for (const b of boxes) {
    if (b.round) {
      const r = b.w / 2, cx = b.x + r, cy = b.y + r;
      d += `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`;
    } else {
      const r = Math.min(14, b.w / 2, b.h / 2);
      d += `M${b.x + r} ${b.y}H${b.x + b.w - r}A${r} ${r} 0 0 1 ${b.x + b.w} ${b.y + r}V${b.y + b.h - r}A${r} ${r} 0 0 1 ${b.x + b.w - r} ${b.y + b.h}H${b.x + r}A${r} ${r} 0 0 1 ${b.x} ${b.y + b.h - r}V${b.y + r}A${r} ${r} 0 0 1 ${b.x + r} ${b.y}Z`;
    }
  }
  return d;
};

// ─────────────────────────────────────────────────────────────────────────────
// Ilustrações
// ─────────────────────────────────────────────────────────────────────────────
const DayCardMedia: React.FC = () => (
  <div className="tour-media">
    <div className="tour-daycard">
      <b>9 nov <span className="tour-sign">♏︎</span></b>
      <span className="tour-moon" />
      <span className="tour-dow"><span className="tour-dot" />SEG</span>
    </div>
    <div className="tour-ann">
      <span><i className="ti ti-arrow-left" />Data e signo do Sol</span>
      <span><i className="ti ti-arrow-left" />Fase da Lua</span>
      <span><i className="ti ti-arrow-left" />Dia e seu planeta</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────
interface OnboardingTourProps {
  open: boolean;
  onClose: (completed: boolean) => void;
  onNeedSidebar?: () => void;
  onScene?: (scene: TourScene) => void;
  state?: TourState;
  isFreeTier?: boolean;
  theme?: 'dark' | 'light';
}

const CARD_W = 288;

const OnboardingTour: React.FC<OnboardingTourProps> = ({ open, onClose, onNeedSidebar, onScene, state = {}, isFreeTier = false, theme = 'dark' }) => {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<'full' | ChapterId>('full');
  const [boxes, setBoxes] = useState<{ main: Box | null; extra: Box[] }>({ main: null, extra: [] });
  const [cardPos, setCardPos] = useState<{ left: number; top: number } | null>(null);
  const [isSheet, setIsSheet] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = TOUR_STEPS[index];

  const onSceneRef = useRef(onScene); onSceneRef.current = onScene;
  const onSidebarRef = useRef(onNeedSidebar); onSidebarRef.current = onNeedSidebar;
  const stateRef = useRef(state); stateRef.current = state;

  useEffect(() => { if (open) { setIndex(0); setMode('full'); } }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('tour-open');
    return () => document.body.classList.remove('tour-open');
  }, [open]);

  // Ao entrar em cada passo: cena + barra lateral
  useEffect(() => {
    if (!open || !step) return;
    if (step.scene) onSceneRef.current?.(step.scene);
    if (step.needsSidebar) onSidebarRef.current?.();
  }, [open, index, step]);

  // ── Navegação ─────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    setIndex(i => {
      if (i >= END_INDEX) return i;
      const n = i + 1;
      if (mode !== 'full' && TOUR_STEPS[i].chapter === mode && TOUR_STEPS[n].chapter !== mode) return END_INDEX;
      return n;
    });
  }, [mode]);
  const goBack = useCallback(() => {
    setIndex(i => {
      if (i <= 0) return 0;
      if (mode !== 'full') {
        if (i === END_INDEX) {
          const last = TOUR_STEPS.map(s => s.chapter).lastIndexOf(mode);
          return last >= 0 ? last : 0;
        }
        if (TOUR_STEPS[i - 1].chapter !== mode) return 0;
      }
      return i - 1;
    });
  }, [mode]);
  const startChapter = (ch: ChapterId | 'full') => { setMode(ch); setIndex(ch === 'full' ? 1 : firstIndexOf(ch)); };
  const backToMenu = () => { setMode('full'); setIndex(0); };

  // ── Missões ───────────────────────────────────────────────────────────────
  const [done, setDone] = useState(false);          // missão cumprida agora
  const [alreadyDone, setAlreadyDone] = useState(false);
  const sawAbsentRef = useRef(false);
  const clickedRef = useRef(false);
  const eventCountRef = useRef(0);
  const baseTimeRef = useRef<number | undefined>(undefined);
  const finishedRef = useRef(false);

  const evaluate = useCallback((w: Wait): boolean => {
    const st = stateRef.current;
    if ('state' in w) return !!st[w.state];
    if ('dom' in w) return isPresent(w.dom);
    if ('domGone' in w) return !isPresent(w.domGone);
    if ('click' in w) return clickedRef.current;
    if ('timeMoved' in w) {
      const t = st.time, b = baseTimeRef.current;
      return !st.realTime && typeof t === 'number' && typeof b === 'number' && Math.abs(t - b) > 60_000;
    }
    return eventCountRef.current >= (w.count ?? 1);
  }, []);

  useEffect(() => {
    setDone(false);
    finishedRef.current = false;
    clickedRef.current = false;
    eventCountRef.current = 0;
    baseTimeRef.current = stateRef.current.time;
    if (!open || !step?.wait) { setAlreadyDone(false); return; }
    const w = step.wait;
    const initial = evaluate(w);
    sawAbsentRef.current = 'dom' in w ? !initial : true;
    setAlreadyDone(('state' in w || 'domGone' in w) && initial);
  }, [open, index, step, evaluate]);

  // cliques e eventos dentro da área esperada
  useEffect(() => {
    if (!open || !step?.wait) return;
    const w = step.wait;
    if ('click' in w) {
      const on = (e: MouseEvent) => { if ((e.target as Element)?.closest?.(w.click)) clickedRef.current = true; };
      document.addEventListener('click', on, true);
      return () => document.removeEventListener('click', on, true);
    }
    if ('event' in w) {
      let last = 0;
      const on = (e: Event) => {
        if (!(e.target as Element)?.closest?.(w.within)) return;
        const now = Date.now();
        if (w.event === 'wheel' && now - last < 400) return; // uma rolagem conta uma vez
        last = now;
        eventCountRef.current += 1;
      };
      document.addEventListener(w.event, on, { capture: true, passive: true });
      return () => document.removeEventListener(w.event, on, { capture: true } as EventListenerOptions);
    }
  }, [open, index, step]);

  // acompanha a missão; cumprida → ✓ e passa para a próxima
  useEffect(() => {
    if (!open || !step?.wait || alreadyDone) return;
    const w = step.wait;
    const tick = () => {
      if (finishedRef.current) return;
      const now = evaluate(w);
      if ('dom' in w && !now) sawAbsentRef.current = true;
      const ok = 'dom' in w ? now && sawAbsentRef.current : now;
      if (ok) {
        finishedRef.current = true;
        setDone(true);
        window.setTimeout(() => goNext(), 1100);
      }
    };
    tick();
    const t = window.setInterval(tick, 200);
    return () => window.clearInterval(t);
  }, [open, index, step, alreadyDone, evaluate, goNext]);

  // ── Medição ───────────────────────────────────────────────────────────────
  const measure = useCallback(() => {
    if (!open || !step) return;
    setIsSheet(window.innerWidth < 640);
    setBoxes(findBoxes(step));
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    measure();
    const t = window.setInterval(measure, 300);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { window.clearInterval(t); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [open, measure]);

  // Cartão: ao lado do conjunto aberto (controle + relógio), sem cobrir
  useLayoutEffect(() => {
    if (!open) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const ch = cardRef.current?.offsetHeight ?? 220;
    if (isSheet) { setCardPos(null); return; }
    const all = [boxes.main, ...boxes.extra].filter(Boolean) as Box[];
    if (!all.length) { setCardPos({ left: (vw - CARD_W) / 2, top: Math.max(10, (vh - ch) / 2) }); return; }
    const m = boxes.main ?? all[0];
    const gap = 16;
    const fitsRight = (b: Box) => b.x + b.w + gap + CARD_W < vw - 10;
    const fitsLeft = (b: Box) => b.x - gap - CARD_W > 10;
    // evita cair em cima do relógio aberto
    const hits = (l: number, t: number) => all.some(b => !(l + CARD_W <= b.x || b.x + b.w <= l || t + ch <= b.y || b.y + b.h <= t));
    const cands: Array<[number, number]> = [];
    if (fitsRight(m)) cands.push([m.x + m.w + gap, m.y + m.h / 2 - ch / 2]);
    if (fitsLeft(m)) cands.push([m.x - gap - CARD_W, m.y + m.h / 2 - ch / 2]);
    cands.push([m.x + m.w / 2 - CARD_W / 2, m.y - gap - ch]);
    cands.push([m.x + m.w / 2 - CARD_W / 2, m.y + m.h + gap]);
    const clampL = (l: number) => Math.max(10, Math.min(l, vw - CARD_W - 10));
    const clampT = (t: number) => Math.max(10, Math.min(t, vh - ch - 10));
    let pick = cands.map(([l, t]) => [clampL(l), clampT(t)] as [number, number]).find(([l, t]) => !hits(l, t));
    if (!pick) pick = [clampL(cands[0][0]), clampT(cands[0][1])];
    setCardPos({ left: pick[0], top: pick[1] });
  }, [open, boxes, isSheet, index, done, alreadyDone]);

  // Teclado
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.('input, textarea, [contenteditable="true"]');
      if (typing && e.key !== 'Escape') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); if (index === END_INDEX) onClose(true); else if (index > 0 && step?.media !== 'knowledge') goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goBack(); }
      else if (e.key === 'Escape') { e.preventDefault(); onClose(false); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, index, step, goNext, goBack, onClose]);

  if (!open || !step || typeof document === 'undefined') return null;

  const light = theme === 'light';
  const isMenu = step.media === 'menu';
  const isKnowledge = step.media === 'knowledge';
  const isEnd = index === END_INDEX;
  const kind: Kind = step.wait && alreadyDone ? 'explore' : step.kind;
  const interactiveArea = kind !== 'info';
  const missionLive = kind === 'mission' && !done;

  const holeList = [boxes.main, ...boxes.extra].filter(Boolean) as Box[];
  const clip = `path(evenodd, '${holesPath(holeList)}')`;

  const progressSteps = mode === 'full'
    ? TOUR_STEPS.map((_, k) => k).filter(k => k > 0 && k < END_INDEX)
    : TOUR_STEPS.map((s, k) => (s.chapter === mode ? k : -1)).filter(k => k >= 0);
  const capLabel = step.chapter === 'intro' ? 'BOAS-VINDAS'
    : step.chapter === 'end' ? 'FIM'
      : `FASE ${chapterNumber(step.chapter)} · ${(TOUR_CHAPTERS.find(c => c.id === step.chapter)?.label || '').toUpperCase()}`;

  const main = boxes.main;

  return createPortal(
    <div className={`tour-root ${light ? 'tour-light' : ''}`} role="dialog" aria-modal="true" aria-label="Tutorial do Cronógrafo">
      {/* Escurecido com furos. Em info, uma camada extra bloqueia até os furos. */}
      <div className="tour-dim" style={{ clipPath: clip, WebkitClipPath: clip }} onClick={e => e.stopPropagation()} />
      {!interactiveArea && <div className="tour-block" onClick={e => e.stopPropagation()} />}

      {main && (
        <div
          className={`tour-ring ${missionLive ? 'tour-ring-live' : ''}`}
          style={{ left: main.x - 2, top: main.y - 2, width: main.w + 4, height: main.h + 4, borderRadius: main.round ? '50%' : 16 }}
        />
      )}
      {boxes.extra.map((b, k) => (
        <div key={k} className="tour-ring-soft" style={{ left: b.x - 1, top: b.y - 1, width: b.w + 2, height: b.h + 2, borderRadius: b.round ? '50%' : 15 }} />
      ))}
      {main && missionLive && (
        <i
          className="ti ti-hand-finger tour-hand"
          aria-hidden="true"
          style={{ left: main.x + main.w / 2 - 12, top: Math.min(main.y + main.h - 6, window.innerHeight - 40) }}
        />
      )}

      <div
        key={index}
        ref={cardRef}
        className={`tour-card ${isSheet ? 'tour-sheet' : ''} ${done ? 'tour-card-done' : ''}`}
        style={isSheet ? undefined : { left: cardPos?.left ?? -9999, top: cardPos?.top ?? -9999, width: CARD_W }}
      >
        <div className="tour-cap">
          <span>{capLabel}</span>
          {!isMenu && !isKnowledge && step.chapter !== 'end' && (
            <span className={`tour-kind tour-kind-${kind}`}>
              <i className={`ti ${kind === 'mission' ? 'ti-target-arrow' : kind === 'explore' ? 'ti-eye' : 'ti-info-circle'}`} aria-hidden="true" />
              {kind === 'mission' ? 'Missão' : kind === 'explore' ? 'Explore' : 'Saiba'}
            </span>
          )}
        </div>
        <div className="tour-head">
          <i className={`ti ${step.icon} tour-icon`} aria-hidden="true" />
          <h4>{step.title}</h4>
        </div>
        <p>{step.wait && alreadyDone && step.doneText ? step.doneText : step.text}</p>

        {step.media === 'daycard' && <DayCardMedia />}

        {step.goal && kind === 'mission' && (
          <div className={`tour-goal ${done ? 'ok' : ''}`}>
            <i className={`ti ${done ? 'ti-circle-check' : 'ti-target-arrow'}`} aria-hidden="true" />
            <span>{done ? 'Missão cumprida!' : step.goal}</span>
          </div>
        )}
        {step.goal && kind === 'explore' && !(step.wait && alreadyDone) && (
          <div className="tour-goal tour-goal-explore">
            <i className="ti ti-eye" aria-hidden="true" />
            <span>{step.goal}</span>
          </div>
        )}

        {step.pro && isFreeTier && (
          <div className="tour-pro"><i className="ti ti-lock" aria-hidden="true" /> {step.pro}</div>
        )}

        {isMenu ? (
          <div className="tour-menu">
            <button type="button" className="tour-next tour-full" onClick={() => startChapter('full')} autoFocus>
              <i className="ti ti-player-play" aria-hidden="true" /> Tour completo
            </button>
            <div className="tour-menu-label">Por onde quer começar?</div>
            {TOUR_CHAPTERS.map(c => (
              <button key={c.id} type="button" className="tour-q" onClick={() => startChapter(c.id)}>
                <i className={`ti ${c.icon}`} aria-hidden="true" />
                <span>{c.label}</span>
                <i className="ti ti-chevron-right tour-q-arrow" aria-hidden="true" />
              </button>
            ))}
            <button type="button" className="tour-skip tour-menu-skip" onClick={() => onClose(false)}>Agora não</button>
          </div>
        ) : isKnowledge ? (
          <div className="tour-menu">
            <button type="button" className="tour-q" onClick={() => goNext()} autoFocus>
              <i className="ti ti-check" aria-hidden="true" /><span>Sim, conheço</span>
              <i className="ti ti-chevron-right tour-q-arrow" aria-hidden="true" />
            </button>
            <button type="button" className="tour-q" onClick={() => { onSceneRef.current?.('simplify'); goNext(); }}>
              <i className="ti ti-sparkles" aria-hidden="true" /><span>Ainda não</span>
              <i className="ti ti-chevron-right tour-q-arrow" aria-hidden="true" />
            </button>
            <div className="tour-note">"Ainda não" deixa o relógio mais simples: sem termos e decanatos.</div>
          </div>
        ) : (
          <>
            <div className="tour-prog" aria-hidden="true">
              {progressSteps.map(k => <span key={k} className={k < index ? 'd' : k === index ? 'a' : ''} />)}
            </div>
            <div className="tour-btns">
              {isEnd
                ? <button type="button" className="tour-skip" onClick={backToMenu}>Outra pergunta</button>
                : <button type="button" className="tour-skip" onClick={() => onClose(false)}>Pular</button>}
              <span>
                <button type="button" className="tour-back" onClick={goBack}>Voltar</button>
                <button
                  type="button"
                  className={`tour-next ${missionLive ? 'tour-next-quiet' : ''}`}
                  onClick={() => (isEnd ? onClose(true) : goNext())}
                  autoFocus={kind === 'info'}
                >
                  {isEnd ? 'Concluir' : missionLive ? 'Pular missão' : 'Próximo'}
                </button>
              </span>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default OnboardingTour;

/** CSS do tutorial (injetado uma vez). */
export const ONBOARDING_TOUR_CSS = `
@property --tour-a{syntax:'<angle>';inherits:false;initial-value:0deg}
.tour-root{position:fixed;inset:0;z-index:2147483000;pointer-events:none}
.tour-dim{position:fixed;inset:0;background:rgba(4,0,4,.78);pointer-events:auto;animation:tour-fade .35s ease-out}
.tour-block{position:fixed;inset:0;pointer-events:auto;background:transparent}
@keyframes tour-fade{from{opacity:0}to{opacity:1}}
body.tour-open .itt{z-index:2147483100!important}
.tour-ring{position:fixed;padding:2px;pointer-events:none;transition:all .5s cubic-bezier(.65,0,.35,1);
  background:conic-gradient(from var(--tour-a),transparent 0deg,#D4AF37 70deg,#FFF3C4 110deg,#D4AF37 150deg,transparent 220deg);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;
  animation:tour-spin 2.4s linear infinite;filter:drop-shadow(0 0 6px rgba(212,175,55,.45))}
.tour-ring-live{animation:tour-spin 1.1s linear infinite;filter:drop-shadow(0 0 12px rgba(245,217,138,.75))}
.tour-ring-soft{position:fixed;pointer-events:none;border:1px dashed rgba(245,217,138,.45);transition:all .5s cubic-bezier(.65,0,.35,1)}
@keyframes tour-spin{to{--tour-a:360deg}}
.tour-hand{position:fixed;pointer-events:none;font-size:26px;color:#F5D98A;filter:drop-shadow(0 2px 6px rgba(0,0,0,.8));animation:tour-tap 1.1s ease-in-out infinite;z-index:2}
@keyframes tour-tap{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(.92)}}
.tour-card{position:fixed;pointer-events:auto;box-sizing:border-box;background:rgba(10,8,18,.98);border:1px solid rgba(212,175,55,.35);
  border-radius:16px;padding:14px 16px 12px;color:#E8E4DA;font-family:'DM Sans',system-ui,sans-serif;max-height:calc(100vh - 20px);overflow-y:auto;
  box-shadow:0 24px 60px -16px rgba(0,0,0,.8);animation:tour-in .32s ease-out;transition:left .45s cubic-bezier(.65,0,.35,1),top .45s cubic-bezier(.65,0,.35,1),border-color .3s}
.tour-card-done{border-color:rgba(74,222,128,.6)}
@keyframes tour-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.tour-sheet{left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));top:auto}
.tour-cap{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10px;letter-spacing:.1em;font-weight:700;color:#D4AF37}
.tour-kind{display:inline-flex;align-items:center;gap:4px;letter-spacing:.04em;font-size:10.5px;padding:2px 8px;border-radius:999px;white-space:nowrap}
.tour-kind-mission{background:rgba(212,175,55,.18);color:#F5D98A}
.tour-kind-explore{background:rgba(96,165,250,.16);color:#93c5fd}
.tour-kind-info{background:rgba(255,255,255,.07);color:#b7b1a5}
.tour-head{display:flex;align-items:center;gap:9px;margin:7px 0 5px}
.tour-head h4{margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:20px;line-height:1.2;color:#F5F2EB}
.tour-icon{font-size:22px;color:#F5D98A;animation:tour-bob 1.6s ease-in-out infinite}
@keyframes tour-bob{50%{transform:translateY(-3px)}}
.tour-card p{margin:0;font-size:14px;line-height:1.5;color:#D9D4C8}
.tour-goal{display:flex;align-items:center;gap:8px;margin-top:12px;padding:9px 11px;border-radius:11px;font-size:13px;font-weight:700;
  color:#F5D98A;background:rgba(212,175,55,.12);border:1px solid rgba(212,175,55,.35);animation:tour-glow 1.6s ease-in-out infinite}
.tour-goal i{font-size:18px}
.tour-goal.ok{color:#86efac;background:rgba(74,222,128,.13);border-color:rgba(74,222,128,.5);animation:tour-pop .35s ease-out}
.tour-goal-explore{color:#bfdbfe;background:rgba(96,165,250,.10);border-color:rgba(96,165,250,.3);font-weight:600;animation:none}
@keyframes tour-glow{50%{box-shadow:0 0 0 3px rgba(212,175,55,.12)}}
@keyframes tour-pop{0%{transform:scale(.96)}60%{transform:scale(1.03)}100%{transform:scale(1)}}
.tour-pro{margin-top:9px;font-size:11.5px;color:#b7b1a5;display:flex;align-items:center;gap:5px}
.tour-pro i{color:#D4AF37}
.tour-note{font-size:11.5px;color:#9b958a;margin-top:4px;line-height:1.4}
.tour-prog{display:flex;gap:3px;margin:13px 0 10px}
.tour-prog span{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.1);transition:background .3s}
.tour-prog span.d{background:#8a6a12}.tour-prog span.a{background:#F5D98A}
.tour-btns{display:flex;justify-content:space-between;align-items:center}
.tour-btns button,.tour-menu button{height:32px;border-radius:999px;padding:0 14px;font:600 12.5px/1 'DM Sans',sans-serif;cursor:pointer}
.tour-skip{background:transparent;border:0;color:#8e887c}.tour-skip:hover{color:#cfc9bd}
.tour-back{background:transparent;border:1px solid rgba(255,255,255,.18);color:#cfc9bd;margin-right:6px}
.tour-next{background:linear-gradient(90deg,#D4AF37,#F5D98A);border:0;color:#1a1408;font-weight:700}
.tour-next-quiet{background:transparent;border:1px solid rgba(255,255,255,.18);color:#9b958a;font-weight:600}
.tour-next:focus-visible,.tour-back:focus-visible,.tour-q:focus-visible{outline:2px solid #F5D98A;outline-offset:2px}
.tour-menu{display:flex;flex-direction:column;gap:6px;margin-top:14px}
.tour-full{height:38px!important;display:flex;align-items:center;justify-content:center;gap:7px;font-size:13.5px!important}
.tour-menu-label{font-size:11px;letter-spacing:.08em;color:#9b958a;margin:8px 0 2px;text-transform:uppercase;font-weight:600}
.tour-q{display:flex;align-items:center;gap:9px;height:38px!important;border-radius:10px!important;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:#ECE8DE;text-align:left;padding:0 10px!important;font-weight:500!important}
.tour-q:hover{background:rgba(212,175,55,.10);border-color:rgba(212,175,55,.4)}
.tour-q i{color:#F5D98A;font-size:16px}.tour-q span{flex:1}.tour-q-arrow{color:#6d675c!important;font-size:14px!important}
.tour-menu-skip{align-self:center;margin-top:4px}
.tour-media{display:flex;gap:10px;align-items:center;margin-top:12px}
.tour-daycard{width:64px;height:86px;flex:0 0 auto;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:#100d18;
  display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:6px 3px;font-size:10.5px;box-sizing:border-box}
.tour-daycard b{display:flex;gap:3px;align-items:center;font-weight:700}
.tour-sign{color:#60A5FA}
.tour-moon{width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 66% 40%,#f1f5f9 0 40%,#1e1b26 42%)}
.tour-dow{display:flex;gap:3px;align-items:center;font-weight:700;color:#9b958a;letter-spacing:.06em}
.tour-dot{width:9px;height:9px;border-radius:50%;background:#F1F5F9;display:inline-block}
.tour-ann{display:flex;flex-direction:column;gap:13px;font-size:11.5px;color:#F5D98A}
.tour-ann i{margin-right:4px}
.tour-light .tour-card{background:rgba(252,250,245,.99);color:#2a2620;border-color:rgba(176,138,30,.45)}
.tour-light .tour-card p{color:#3b362d}.tour-light .tour-head h4{color:#1d1a15}
.tour-light .tour-cap,.tour-light .tour-icon,.tour-light .tour-ann,.tour-light .tour-q i{color:#8a6a12}
.tour-light .tour-goal{color:#6b520c}
.tour-light .tour-back{border-color:rgba(0,0,0,.18);color:#3b362d}
.tour-light .tour-prog span{background:rgba(0,0,0,.1)}
.tour-light .tour-q{background:rgba(0,0,0,.03);border-color:rgba(0,0,0,.1);color:#2a2620}
.tour-light .tour-daycard{background:#fff;border-color:rgba(0,0,0,.12);color:#2a2620}
@keyframes tour-help-pulse{0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,.55)}50%{box-shadow:0 0 0 8px rgba(212,175,55,0)}}
.tour-help-pulse{animation:tour-help-pulse 1.8s ease-in-out infinite}
`;
