/**
 * OnboardingTour — tutorial guiado do Cronógrafo, em forma de história (roteiro aprovado pelo Rafa).
 *
 * • Abre sozinho no primeiro acesso (por conta, salvo no navegador) e pelo botão "?" do topo.
 * • Abertura: "Tour completo" ou "Por onde quer começar?" (uma pergunta por capítulo).
 * • Capítulos: Que horas são? · Em que dia estamos? · Como estava o céu quando nasci? ·
 *   Como guardo meu mapa? · O que está acontecendo comigo agora? · Mais caminhos.
 * • Cenas: o tutorial prepara a tela (só Sol e Lua + relógio 24h, depois planetas, casas,
 *   aspectos) e, ao terminar ou pular, o App devolve tudo como a pessoa deixou.
 * • Passos interativos (👆): só a área em foco fica clicável; o tutorial espera a ação
 *   e avança sozinho. Sempre há "Próximo" — ninguém fica preso.
 * • Cada passo aponta para elementos com data-tour="…". Se o alvo não estiver visível,
 *   tenta os alternativos; senão o cartão aparece no centro.
 * • Teclado: → avança, ← volta, Esc fecha.
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

/** Estados do app que o tutorial acompanha. */
export type TourStateKey = 'atmosphere' | 'houseSelected' | 'timeMoved' | 'realTime' | 'zodiacLocked' | 'natal';
export type TourState = Partial<Record<TourStateKey, boolean>>;

/** Cenas que o App monta a pedido do tutorial. */
export type TourScene = 'story' | 'planets' | 'houses' | 'aspects' | 'restore' | 'close-overlays';

type Wait =
  | { state: TourStateKey }
  | { dom: string }       // espera um elemento aparecer
  | { domGone: string }   // espera um elemento sumir
  | { click: string };    // espera um clique dentro do seletor

type ChapterId = 'hora' | 'lua' | 'nascimento' | 'salvar' | 'agora' | 'mais';

interface TourStep {
  chapter: ChapterId | 'intro' | 'end';
  title: string;
  text: string;
  icon: string;
  targets?: string[];
  round?: boolean;
  pad?: number;
  needsSidebar?: boolean;
  media?: 'daycard' | 'menu';
  scene?: TourScene;
  wait?: Wait;
  /** o que a pessoa deve fazer (aparece no selo "Sua vez") */
  hint?: string;
  /** texto quando a ação já estava feita ao chegar no passo */
  doneText?: string;
  /** aviso para o plano gratuito */
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
  { chapter: 'intro', title: 'O céu, agora', text: 'Um relógio que mostra onde está cada astro neste instante.', icon: 'ti-sparkles', media: 'menu', scene: 'restore' },

  // 1 · Que horas são?
  { chapter: 'hora', title: 'Ligue o céu', text: 'Clique no botão destacado.', icon: 'ti-cloud', targets: ['atmosphere'], pad: 6, needsSidebar: true, scene: 'story', wait: { state: 'atmosphere' }, hint: 'Clique em Atmosfera', doneText: 'O céu já está ligado.' },
  { chapter: 'hora', title: 'Que horas são?', text: 'O Cronógrafo é um relógio. Acima da linha, o céu visível. Abaixo, o céu sob a Terra.', icon: 'ti-clock', targets: ['clock'], round: true, pad: 0 },
  { chapter: 'hora', title: 'O Sol marca o dia', text: 'No alto, meio-dia. Embaixo, meia-noite. O anel mostra as 24 horas.', icon: 'ti-sun', targets: ['planet', 'clock'], round: true, pad: 14 },
  { chapter: 'hora', title: 'A Lua marca o mês', text: 'Fase, luz e o humor dos dias.', icon: 'ti-moon', targets: ['planet-moon', 'clock'], round: true, pad: 14 },
  { chapter: 'hora', title: 'Os planetas', text: 'Cada um, uma energia, no seu ritmo.', icon: 'ti-planet', targets: ['clock'], round: true, pad: 0, scene: 'planets', wait: { dom: '.itt[data-kind="planet"]' }, hint: 'Pare o mouse num astro' },
  { chapter: 'hora', title: 'Os signos', text: 'O caminho por onde todos passam.', icon: 'ti-zodiac-aries', targets: ['zodiac', 'clock'], round: true, pad: 4, wait: { dom: '.itt[data-kind="sign"]' }, hint: 'Pare o mouse num signo' },
  { chapter: 'hora', title: 'Cores do zodíaco', text: 'Elementos, ritmos ou polaridade.', icon: 'ti-palette', targets: ['status'], pad: 4, wait: { click: '[data-tour="status"] button' }, hint: 'Alterne uma vez' },
  { chapter: 'hora', title: 'As casas', text: '12 áreas da vida, contadas a partir do horizonte.', icon: 'ti-home', targets: ['clock'], round: true, pad: 0, scene: 'houses', wait: { state: 'houseSelected' }, hint: 'Clique numa casa' },
  { chapter: 'hora', title: 'Aspectos', text: 'A conversa entre dois astros. Pare o mouse numa linha e abra "Ver detalhes".', icon: 'ti-affiliate', targets: ['clock'], round: true, pad: 0, scene: 'aspects' },

  // 2 · Em que dia estamos?
  { chapter: 'lua', title: 'O card da Lua', text: 'Fase, luz, nascer, pôr e o próximo eclipse.', icon: 'ti-moon', targets: ['lunar'], pad: 6, scene: 'restore', wait: { dom: '[data-tour="calendar-panel"]' }, hint: 'Clique no card' },
  { chapter: 'lua', title: 'Três leituras do tempo', text: 'Mensal, Anual e Ciclos. E também o Solar.', icon: 'ti-calendar', targets: ['calendar-tabs', 'calendar-panel', 'lunar'], pad: 4, pro: 'Anual e Ciclos: planos Mensal e Vitalício.' },
  { chapter: 'lua', title: 'Ciclos lunares', text: 'Cada ciclo nasce na Lua Nova. Cada linha é uma fase: Nova, Crescente, Cheia, Minguante.', icon: 'ti-moon-stars', targets: ['cycle', 'calendar-panel', 'lunar'], pad: 4, pro: 'Ciclos: planos Mensal e Vitalício.' },
  { chapter: 'lua', title: 'O card do dia', text: 'Clique num dia e o relógio vai para ele.', icon: 'ti-layout-cards', targets: ['day-card', 'calendar-panel', 'lunar'], pad: 6, media: 'daycard', wait: { state: 'timeMoved' }, hint: 'Clique num dia' },

  // 3 · Como estava o céu quando nasci?
  { chapter: 'nascimento', title: 'Viaje no tempo', text: 'Clique no calendário da data, ou no centro do relógio.', icon: 'ti-calendar-event', targets: ['date', 'date-display'], pad: 6, scene: 'restore', wait: { dom: '[data-tour="date-input"]' }, hint: 'Clique no calendário' },
  { chapter: 'nascimento', title: 'Role ou digite', text: 'Dia, mês, ano e hora. Ex.: 21/03/1990 às 08:15.', icon: 'ti-keyboard', targets: ['date-input', 'calendar-panel'], pad: 6, wait: { state: 'timeMoved' }, hint: 'Digite uma data e tecle Enter', doneText: 'Pronto: o relógio já está em outra data.' },
  { chapter: 'nascimento', title: 'Arraste para viajar', text: 'A linha do tempo leva o céu para frente e para trás.', icon: 'ti-arrows-horizontal', targets: ['timeline', 'time-step'], pad: 6, scene: 'close-overlays' },
  { chapter: 'nascimento', title: 'Zoom no tempo', text: 'Role o mouse sobre a linha: horas, dias, anos.', icon: 'ti-zoom-in', targets: ['timeline', 'time-step'], pad: 6 },
  { chapter: 'nascimento', title: 'Loop A-B', text: 'Duplo clique marca A e B. O trecho se repete.', icon: 'ti-repeat', targets: ['timeline', 'time-step'], pad: 6 },
  { chapter: 'nascimento', title: 'Avance e volte', text: 'Segure para o tempo correr.', icon: 'ti-player-track-next', targets: ['time-step'], pad: 6 },
  { chapter: 'nascimento', title: 'Trave o zodíaco', text: 'Depois avance o tempo: os astros caminham pelos signos.', icon: 'ti-lock', targets: ['zodiac-lock'], pad: 6, wait: { state: 'zodiacLocked' }, hint: 'Clique no cadeado', doneText: 'O zodíaco já está travado.' },

  // 4 · Como guardo meu mapa?
  { chapter: 'salvar', title: 'Salve seu mapa', text: 'Ele fica guardado na sua conta.', icon: 'ti-bookmark', targets: ['save'], pad: 6, needsSidebar: true, scene: 'restore', wait: { dom: '[data-tour="save-modal"]' }, hint: 'Clique em salvar' },
  { chapter: 'salvar', title: 'Dê um nome', text: 'Escolha um nome e confirme.', icon: 'ti-pencil', targets: ['save-modal', 'save'], pad: 6, wait: { domGone: '[data-tour="save-modal"]' }, hint: 'Nomeie e salve' },
  { chapter: 'salvar', title: 'Exporte em PDF', text: 'Pronto para enviar ou imprimir.', icon: 'ti-download', targets: ['export'], pad: 6, needsSidebar: true },

  // 5 · O que está acontecendo comigo agora?
  { chapter: 'agora', title: 'Seu mapa por baixo', text: 'Adicione o seu mapa natal. O céu de hoje gira sobre ele.', icon: 'ti-circles', targets: ['natal'], pad: 6, needsSidebar: true, scene: 'restore', wait: { dom: '[data-tour="natal-popover"]' }, hint: 'Clique no +' },
  { chapter: 'agora', title: 'Quando você nasceu?', text: 'Dia, mês, ano, hora e cidade.', icon: 'ti-keyboard', targets: ['natal-popover', 'natal'], pad: 6, needsSidebar: true, wait: { state: 'natal' }, hint: 'Digite e aplique', doneText: 'Seu mapa natal já está no relógio.' },
  { chapter: 'agora', title: 'Volte para hoje', text: 'O céu de agora, sobre o seu mapa.', icon: 'ti-clock-bolt', targets: ['now'], pad: 6, wait: { state: 'realTime' }, hint: 'Clique em Agora', doneText: 'O relógio já está no agora.' },
  { chapter: 'agora', title: 'Os trânsitos', text: 'Cada linha é o céu de hoje tocando o seu mapa.', icon: 'ti-affiliate', targets: ['clock'], round: true, pad: 0 },
  { chapter: 'agora', title: 'Todos os aspectos', text: 'A lista completa do momento, com início e fim.', icon: 'ti-list-details', targets: ['astros-panel'], pad: 4 },
  { chapter: 'agora', title: 'Quando começa e termina', text: '"Ver detalhes" mostra o início, o exato e o fim.', icon: 'ti-calendar-time', targets: ['clock'], round: true, pad: 0, wait: { dom: '.itt-details' }, hint: 'Pare numa linha e clique no cartão' },

  // 6 · Mais caminhos
  { chapter: 'mais', title: 'Quando é o próximo eclipse?', text: 'Data, local e animação.', icon: 'ti-sun-low', targets: ['eclipses'], pad: 6, needsSidebar: true, scene: 'restore' },
  { chapter: 'mais', title: 'Qual a energia do meu dia?', text: 'O arcano de cada dia.', icon: 'ti-cards', targets: ['arcane'], pad: 6, needsSidebar: true },
  { chapter: 'mais', title: 'Tela cheia', text: 'Para aulas e atendimentos.', icon: 'ti-maximize', targets: ['present'], pad: 6 },
  { chapter: 'mais', title: 'Do seu jeito', text: 'Planetas, casas, graus, anéis, céu e tamanho.', icon: 'ti-adjustments', targets: ['settings'], pad: 6, needsSidebar: true },

  { chapter: 'end', title: 'Pronto', text: 'Volte aqui quando quiser, ou escolha outra pergunta.', icon: 'ti-help-circle', targets: ['help'], round: true, pad: 6, scene: 'restore' },
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
// Alvos
// ─────────────────────────────────────────────────────────────────────────────
interface Box { x: number; y: number; w: number; h: number }

const visibleRect = (el: Element): DOMRect | null => {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  if (r.right < 0 || r.bottom < 0 || r.left > window.innerWidth || r.top > window.innerHeight) return null;
  const cs = window.getComputedStyle(el as HTMLElement);
  if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return null;
  return r;
};
const isPresent = (selector: string) => Array.from(document.querySelectorAll(selector)).some(el => !!visibleRect(el));

const findTargetBox = (step: TourStep): Box | null => {
  if (!step.targets?.length) return null;
  let r: DOMRect | null = null;
  for (const t of step.targets) {
    const found = Array.from(document.querySelectorAll(`[data-tour="${t}"]`)).map(visibleRect).find(Boolean) as DOMRect | undefined;
    if (found) { r = found; break; }
  }
  if (!r) return null;
  const p = step.pad ?? 6;
  if (step.round) {
    // círculo de verdade: diâmetro = menor lado, centralizado
    const d = Math.min(r.width, r.height) + 2 * p;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return { x: cx - d / 2, y: cy - d / 2, w: d, h: d };
  }
  return { x: r.left - p, y: r.top - p, w: r.width + 2 * p, h: r.height + 2 * p };
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
  /** monta/desfaz as cenas da história */
  onScene?: (scene: TourScene) => void;
  state?: TourState;
  isFreeTier?: boolean;
  theme?: 'dark' | 'light';
}

const CARD_W = 284;

const OnboardingTour: React.FC<OnboardingTourProps> = ({ open, onClose, onNeedSidebar, onScene, state = {}, isFreeTier = false, theme = 'dark' }) => {
  const [index, setIndex] = useState(0);
  /** 'full' = tour completo; senão, só o capítulo escolhido */
  const [mode, setMode] = useState<'full' | ChapterId>('full');
  const [box, setBox] = useState<Box | null>(null);
  const [cardPos, setCardPos] = useState<{ left: number; top: number } | null>(null);
  const [isSheet, setIsSheet] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = TOUR_STEPS[index];

  const onSceneRef = useRef(onScene); onSceneRef.current = onScene;
  const onSidebarRef = useRef(onNeedSidebar); onSidebarRef.current = onNeedSidebar;
  const stateRef = useRef(state); stateRef.current = state;

  useEffect(() => { if (open) { setIndex(0); setMode('full'); } }, [open]);

  // body.tour-open: as dicas do relógio ficam acima do escurecido
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

  // Navegação (respeita o modo "só um capítulo")
  const goNext = useCallback(() => {
    setIndex(i => {
      if (i >= END_INDEX) return i;
      const nextIdx = i + 1;
      if (mode !== 'full' && TOUR_STEPS[i].chapter === mode && TOUR_STEPS[nextIdx].chapter !== mode) return END_INDEX;
      return nextIdx;
    });
  }, [mode]);
  const goBack = useCallback(() => {
    setIndex(i => {
      if (i <= 0) return 0;
      if (mode !== 'full') {
        if (i === END_INDEX) {
          const lastOfChapter = TOUR_STEPS.map(s => s.chapter).lastIndexOf(mode);
          return lastOfChapter >= 0 ? lastOfChapter : 0;
        }
        if (TOUR_STEPS[i - 1].chapter !== mode) return 0; // volta ao menu
      }
      return i - 1;
    });
  }, [mode]);
  const startChapter = (ch: ChapterId | 'full') => {
    setMode(ch);
    setIndex(ch === 'full' ? 1 : firstIndexOf(ch));
  };
  const backToMenu = () => { setMode('full'); setIndex(0); };

  // ── Passos interativos ────────────────────────────────────────────────────
  const [waitOk, setWaitOk] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const sawAbsentRef = useRef(false);
  const clickedRef = useRef(false);
  const advancedRef = useRef(false);

  const evaluate = useCallback((w: Wait): boolean => {
    if ('state' in w) return !!stateRef.current[w.state];
    if ('dom' in w) return isPresent(w.dom);
    if ('domGone' in w) return !isPresent(w.domGone);
    return clickedRef.current;
  }, []);

  useEffect(() => {
    setWaitOk(false);
    advancedRef.current = false;
    clickedRef.current = false;
    if (!open || !step?.wait) { setAlreadyDone(false); return; }
    const w = step.wait;
    const initial = evaluate(w);
    // "dom" exige ver o elemento surgir (evita contar uma dica que já estava aberta)
    sawAbsentRef.current = 'dom' in w ? !initial : true;
    setAlreadyDone(('state' in w || 'domGone' in w) && initial);
  }, [open, index, step, evaluate]);

  // clique dentro do seletor esperado
  useEffect(() => {
    if (!open || !step?.wait || !('click' in step.wait)) return;
    const sel = step.wait.click;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (t && t.closest && t.closest(sel)) clickedRef.current = true;
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [open, index, step]);

  // acompanha a ação e avança sozinho
  useEffect(() => {
    if (!open || !step?.wait || alreadyDone) return;
    const w = step.wait;
    const tick = () => {
      if (advancedRef.current) return;
      const now = evaluate(w);
      if ('dom' in w && !now) sawAbsentRef.current = true;
      const ok = 'dom' in w ? now && sawAbsentRef.current : now;
      if (ok) {
        advancedRef.current = true;
        setWaitOk(true);
        window.setTimeout(() => goNext(), 900);
      }
    };
    tick();
    const t = window.setInterval(tick, 250);
    return () => window.clearInterval(t);
  }, [open, index, step, alreadyDone, evaluate, goNext, state]);

  // ── Medição do alvo ───────────────────────────────────────────────────────
  const measure = useCallback(() => {
    if (!open || !step) return;
    setIsSheet(window.innerWidth < 640);
    setBox(findTargetBox(step));
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    measure();
    const t = window.setInterval(measure, 300);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { window.clearInterval(t); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [open, measure]);

  // Posição do cartão
  useLayoutEffect(() => {
    if (!open) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const ch = cardRef.current?.offsetHeight ?? 200;
    if (isSheet) { setCardPos(null); return; }
    if (!box) { setCardPos({ left: (vw - CARD_W) / 2, top: Math.max(10, (vh - ch) / 2) }); return; }
    const gap = 16;
    let left: number, top: number;
    if (box.x + box.w + gap + CARD_W < vw - 10) { left = box.x + box.w + gap; top = box.y + box.h / 2 - ch / 2; }
    else if (box.x - gap - CARD_W > 10) { left = box.x - gap - CARD_W; top = box.y + box.h / 2 - ch / 2; }
    else { left = box.x + box.w / 2 - CARD_W / 2; top = box.y - gap - ch > 10 ? box.y - gap - ch : box.y + box.h + gap; }
    left = Math.max(10, Math.min(left, vw - CARD_W - 10));
    top = Math.max(10, Math.min(top, vh - ch - 10));
    setCardPos({ left, top });
  }, [open, box, isSheet, index, waitOk, alreadyDone]);

  // Teclado
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.('input, textarea, [contenteditable="true"]');
      if (typing && e.key !== 'Escape') return; // deixa a pessoa digitar a data
      if (e.key === 'ArrowRight') { e.preventDefault(); if (index === END_INDEX) onClose(true); else if (index > 0) goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goBack(); }
      else if (e.key === 'Escape') { e.preventDefault(); onClose(false); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, index, goNext, goBack, onClose]);

  if (!open || !step || typeof document === 'undefined') return null;

  const light = theme === 'light';
  const interactive = !!step.wait && !alreadyDone && !waitOk;
  const isMenu = step.media === 'menu';
  const isEnd = index === END_INDEX;

  // Progresso: no tour completo, todos os passos; num capítulo, só os dele
  const progressSteps = mode === 'full'
    ? TOUR_STEPS.map((_, k) => k).filter(k => k > 0 && k < END_INDEX)
    : TOUR_STEPS.map((s, k) => (s.chapter === mode ? k : -1)).filter(k => k >= 0);
  const capLabel = step.chapter === 'intro' ? 'BOAS-VINDAS'
    : step.chapter === 'end' ? 'FIM'
      : `${chapterNumber(step.chapter)} · ${(TOUR_CHAPTERS.find(c => c.id === step.chapter)?.label || '').toUpperCase()}`;

  const spotStyle: React.CSSProperties = box
    ? { left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: step.round ? '50%' : 14 }
    : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0, borderRadius: 14 };

  return createPortal(
    <div className={`tour-root ${light ? 'tour-light' : ''}`} role="dialog" aria-modal="true" aria-label="Tutorial do Cronógrafo">
      {/* bloqueia o app; em passo interativo, só a área em foco fica clicável */}
      {step.wait && box ? (
        <>
          <div className="tour-catcher" style={{ left: 0, top: 0, right: 0, height: Math.max(0, box.y) }} />
          <div className="tour-catcher" style={{ left: 0, top: box.y + box.h, right: 0, bottom: 0 }} />
          <div className="tour-catcher" style={{ left: 0, top: box.y, width: Math.max(0, box.x), height: box.h }} />
          <div className="tour-catcher" style={{ left: box.x + box.w, top: box.y, right: 0, height: box.h }} />
        </>
      ) : (
        <div className="tour-catcher" style={{ inset: 0 }} onClick={e => e.stopPropagation()} />
      )}
      <div className="tour-spot" style={spotStyle} />
      {box && (
        <div
          className={`tour-ring ${interactive ? 'tour-ring-live' : ''}`}
          style={{ left: box.x - 2, top: box.y - 2, width: box.w + 4, height: box.h + 4, borderRadius: step.round ? '50%' : 16 }}
        />
      )}

      <div
        key={index}
        ref={cardRef}
        className={`tour-card ${isSheet ? 'tour-sheet' : ''}`}
        style={isSheet ? undefined : { left: cardPos?.left ?? -9999, top: cardPos?.top ?? -9999, width: CARD_W }}
      >
        <div className="tour-cap">{capLabel}</div>
        <div className="tour-head">
          <i className={`ti ${step.icon} tour-icon`} aria-hidden="true" />
          <h4>{step.title}</h4>
        </div>
        <p>{step.wait && alreadyDone && step.doneText ? step.doneText : step.text}</p>

        {step.media === 'daycard' && <DayCardMedia />}

        {step.wait && !alreadyDone && (
          <div className={`tour-wait ${waitOk ? 'ok' : ''}`}>
            <i className={`ti ${waitOk ? 'ti-circle-check' : 'ti-hand-click'}`} aria-hidden="true" />
            {waitOk ? 'Isso!' : <>Sua vez: {step.hint || 'faça a ação destacada'}</>}
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
                <button type="button" className="tour-next" onClick={() => (isEnd ? onClose(true) : goNext())} autoFocus={!step.wait}>
                  {isEnd ? 'Concluir' : 'Próximo'}
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
.tour-root{position:fixed;inset:0;z-index:10050;pointer-events:none}
.tour-catcher{position:fixed;pointer-events:auto;background:transparent}
body.tour-open .itt{z-index:10060!important}
.tour-spot{position:fixed;box-shadow:0 0 0 200vmax rgba(4,0,4,.78);transition:all .55s cubic-bezier(.65,0,.35,1);pointer-events:none}
.tour-ring{position:fixed;padding:2px;pointer-events:none;transition:all .55s cubic-bezier(.65,0,.35,1);
  background:conic-gradient(from var(--tour-a),transparent 0deg,#D4AF37 70deg,#FFF3C4 110deg,#D4AF37 150deg,transparent 220deg);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;
  animation:tour-spin 2.4s linear infinite;filter:drop-shadow(0 0 6px rgba(212,175,55,.45))}
.tour-ring-live{animation:tour-spin 1.2s linear infinite;filter:drop-shadow(0 0 10px rgba(245,217,138,.7))}
@keyframes tour-spin{to{--tour-a:360deg}}
.tour-card{position:fixed;pointer-events:auto;box-sizing:border-box;background:rgba(10,8,18,.98);border:1px solid rgba(212,175,55,.35);
  border-radius:16px;padding:15px 16px 12px;color:#E8E4DA;font-family:'DM Sans',system-ui,sans-serif;max-height:calc(100vh - 20px);overflow-y:auto;
  box-shadow:0 24px 60px -16px rgba(0,0,0,.8);animation:tour-in .32s ease-out;transition:left .45s cubic-bezier(.65,0,.35,1),top .45s cubic-bezier(.65,0,.35,1)}
@keyframes tour-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.tour-sheet{left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));top:auto}
.tour-cap{font-size:10.5px;letter-spacing:.1em;font-weight:700;color:#D4AF37}
.tour-head{display:flex;align-items:center;gap:9px;margin:6px 0 5px}
.tour-head h4{margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:20px;line-height:1.2;color:#F5F2EB}
.tour-icon{font-size:22px;color:#F5D98A;animation:tour-bob 1.6s ease-in-out infinite}
@keyframes tour-bob{50%{transform:translateY(-3px)}}
.tour-card p{margin:0;font-size:14px;line-height:1.5;color:#D9D4C8}
.tour-wait{display:inline-flex;align-items:center;gap:6px;margin-top:11px;font-size:12.5px;font-weight:600;color:#F5D98A;padding:5px 11px;border-radius:999px;background:rgba(212,175,55,.13);animation:tour-blink 1.4s ease-in-out infinite}
.tour-wait.ok{color:#86efac;background:rgba(74,222,128,.14);animation:none}
@keyframes tour-blink{50%{opacity:.6}}
.tour-pro{margin-top:9px;font-size:11.5px;color:#b7b1a5;display:flex;align-items:center;gap:5px}
.tour-pro i{color:#D4AF37}
.tour-prog{display:flex;gap:3px;margin:13px 0 10px}
.tour-prog span{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.1);transition:background .3s}
.tour-prog span.d{background:#8a6a12}.tour-prog span.a{background:#F5D98A}
.tour-btns{display:flex;justify-content:space-between;align-items:center}
.tour-btns button,.tour-menu button{height:32px;border-radius:999px;padding:0 14px;font:600 12.5px/1 'DM Sans',sans-serif;cursor:pointer}
.tour-skip{background:transparent;border:0;color:#8e887c}.tour-skip:hover{color:#cfc9bd}
.tour-back{background:transparent;border:1px solid rgba(255,255,255,.18);color:#cfc9bd;margin-right:6px}
.tour-next{background:linear-gradient(90deg,#D4AF37,#F5D98A);border:0;color:#1a1408;font-weight:700}
.tour-next:focus-visible,.tour-back:focus-visible,.tour-q:focus-visible{outline:2px solid #F5D98A;outline-offset:2px}
.tour-menu{display:flex;flex-direction:column;gap:6px;margin-top:14px}
.tour-full{height:38px!important;display:flex;align-items:center;justify-content:center;gap:7px;font-size:13.5px!important}
.tour-menu-label{font-size:11px;letter-spacing:.08em;color:#9b958a;margin:8px 0 2px;text-transform:uppercase;font-weight:600}
.tour-q{display:flex;align-items:center;gap:9px;height:36px!important;border-radius:10px!important;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:#ECE8DE;text-align:left;padding:0 10px!important;font-weight:500!important}
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
.tour-light .tour-back{border-color:rgba(0,0,0,.18);color:#3b362d}
.tour-light .tour-prog span{background:rgba(0,0,0,.1)}
.tour-light .tour-q{background:rgba(0,0,0,.03);border-color:rgba(0,0,0,.1);color:#2a2620}
.tour-light .tour-daycard{background:#fff;border-color:rgba(0,0,0,.12);color:#2a2620}
@keyframes tour-help-pulse{0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,.55)}50%{box-shadow:0 0 0 8px rgba(212,175,55,0)}}
.tour-help-pulse{animation:tour-help-pulse 1.8s ease-in-out infinite}
`;
