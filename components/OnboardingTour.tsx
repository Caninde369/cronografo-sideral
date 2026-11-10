/**
 * OnboardingTour — tutorial guiado do Cronógrafo (aprovado pelo Rafa).
 *
 * • Abre sozinho no primeiro acesso (por conta, salvo no navegador) e pelo botão "?" do topo.
 * • 4 capítulos: Ler o céu · Mover o tempo · Seu mapa · Ferramentas.
 * • Foco: o resto da tela escurece e a área em foco ganha uma borda dourada girando.
 * • Cada passo aponta para um elemento marcado com data-tour="…" no código.
 *   Se o elemento não estiver visível, tenta os alternativos; se nenhum estiver,
 *   o cartão aparece no centro (o passo nunca quebra).
 * • Teclado: → avança, ← volta, Esc fecha.
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Media = 'daycard';

interface TourStep {
  chapter: string;
  title: string;
  text: string;
  icon: string;
  /** alvos em ordem de preferência (valores de data-tour) */
  targets?: string[];
  /** foco redondo */
  round?: boolean;
  /** folga em volta do alvo (px) */
  pad?: number;
  /** precisa da barra lateral aberta */
  needsSidebar?: boolean;
  media?: Media;
  /**
   * Passo interativo: a área em foco fica clicável e o tutorial espera a pessoa agir.
   * Avança sozinho quando o estado indicado (vindo do App) fica verdadeiro.
   */
  waitFor?: TourStateKey;
  /** texto quando o estado já estava ligado ao chegar no passo */
  doneText?: string;
}

/** Estados do app que o tutorial acompanha (passos interativos). */
export type TourStateKey = 'atmosphere';
export type TourState = Partial<Record<TourStateKey, boolean>>;

export const TOUR_STEPS: TourStep[] = [
  { chapter: 'Boas-vindas', title: 'Bem-vindo', text: 'O céu de agora, em tempo real. Vamos lá?', icon: 'ti-sparkles' },

  // 1 · Ler o céu
  { chapter: '1 · Ler o céu', title: 'O relógio do céu', text: 'Cada astro na posição exata de agora.', icon: 'ti-clock', targets: ['clock'], round: true, pad: 0 },
  { chapter: '1 · Ler o céu', title: 'Astros', text: 'Clique para destacar. Pare o mouse para ler.', icon: 'ti-hand-finger', targets: ['planet', 'clock'], round: true, pad: 10 },
  { chapter: '1 · Ler o céu', title: 'Signos', text: 'Clique num signo para destacar.', icon: 'ti-zodiac-aries', targets: ['clock'], round: true, pad: 0 },
  { chapter: '1 · Ler o céu', title: 'Cores do zodíaco', text: 'Alterne: elementos, ritmos ou polaridade.', icon: 'ti-palette', targets: ['status'], pad: 4 },
  { chapter: '1 · Ler o céu', title: 'Casas', text: 'Clique numa casa. A área da vida acende.', icon: 'ti-home', targets: ['house', 'clock'], pad: 6 },
  { chapter: '1 · Ler o céu', title: 'Aspectos', text: 'Clique numa linha. É a conversa entre dois astros.', icon: 'ti-affiliate', targets: ['aspect', 'clock'], pad: 10 },
  { chapter: '1 · Ler o céu', title: 'Ligue a atmosfera', text: 'Clique no botão destacado.', icon: 'ti-hand-click', targets: ['atmosphere'], pad: 6, needsSidebar: true, waitFor: 'atmosphere', doneText: 'A atmosfera já está ligada.' },
  { chapter: '1 · Ler o céu', title: 'O céu de agora', text: 'Acima da linha, o céu visível. Abaixo, o céu sob a Terra.', icon: 'ti-sunset-2', targets: ['clock'], round: true, pad: 0 },

  // 2 · Mover o tempo
  { chapter: '2 · Mover o tempo', title: 'Botões do tempo', text: 'Avance e volte. Segure para correr.', icon: 'ti-player-track-next', targets: ['time-step'], pad: 6 },
  { chapter: '2 · Mover o tempo', title: 'Linha do tempo', text: 'Arraste para viajar no tempo.', icon: 'ti-arrows-horizontal', targets: ['timeline', 'time-step'], pad: 6 },
  { chapter: '2 · Mover o tempo', title: 'Zoom no tempo', text: 'Role o mouse na linha: horas, dias, anos.', icon: 'ti-zoom-in', targets: ['timeline', 'time-step'], pad: 6 },
  { chapter: '2 · Mover o tempo', title: 'Loop A-B', text: 'Duplo clique marca A e B. O trecho se repete.', icon: 'ti-repeat', targets: ['timeline', 'time-step'], pad: 6 },
  { chapter: '2 · Mover o tempo', title: 'Travar o zodíaco', text: 'Trave e veja os astros andando pelos signos.', icon: 'ti-lock', targets: ['zodiac-lock'], pad: 6 },
  { chapter: '2 · Mover o tempo', title: 'Agora', text: 'Volte ao presente num clique.', icon: 'ti-clock-bolt', targets: ['now'], pad: 6 },

  // 3 · Seu mapa
  { chapter: '3 · Seu mapa', title: 'Calcular um mapa', text: 'Clique na data ou no centro. Role ou digite.', icon: 'ti-calendar-event', targets: ['date-display', 'date', 'clock'], pad: 6 },
  { chapter: '3 · Seu mapa', title: 'Mapa sobreposto', text: 'Sobreponha um mapa: horóscopo ou sinastria.', icon: 'ti-circles', targets: ['natal'], pad: 6, needsSidebar: true },
  { chapter: '3 · Seu mapa', title: 'Salvar', text: 'Guarde seus mapas.', icon: 'ti-bookmark', targets: ['save'], pad: 6, needsSidebar: true },
  { chapter: '3 · Seu mapa', title: 'Exportar', text: 'PDF ou imagem, pronto para enviar.', icon: 'ti-download', targets: ['export'], pad: 6, needsSidebar: true },

  // 4 · Ferramentas
  { chapter: '4 · Ferramentas', title: 'Calendário lunar', text: 'Os dias contados pela Lua, em ciclos.', icon: 'ti-moon', targets: ['lunar'], pad: 6 },
  { chapter: '4 · Ferramentas', title: 'O card do dia', text: 'Cada linha é uma fase. Cada card é um dia.', icon: 'ti-layout-cards', targets: ['lunar'], pad: 6, media: 'daycard' },
  { chapter: '4 · Ferramentas', title: 'Eclipses e Arcano', text: 'Eclipses do ano. O arcano de cada dia.', icon: 'ti-sun-low', targets: ['eclipses', 'arcane'], pad: 6, needsSidebar: true },
  { chapter: '4 · Ferramentas', title: 'Do seu jeito', text: 'Planetas, casas, graus, anéis, céu e tamanho.', icon: 'ti-adjustments', targets: ['settings'], pad: 6, needsSidebar: true },
  { chapter: '4 · Ferramentas', title: 'Modo apresentação', text: 'Tela cheia para aulas e atendimentos.', icon: 'ti-maximize', targets: ['present'], pad: 6 },

  { chapter: 'Fim', title: 'Pronto', text: 'Volte aqui quando quiser.', icon: 'ti-help-circle', targets: ['help'], round: true, pad: 6 },
];

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
// Utilitários de alvo
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

/** Primeiro alvo visível; para o passo de Eclipses+Arcano junta os dois. */
const findTargetBox = (step: TourStep): Box | null => {
  if (!step.targets?.length) return null;
  const rects: DOMRect[] = [];
  for (const t of step.targets) {
    const found = Array.from(document.querySelectorAll(`[data-tour="${t}"]`))
      .map(visibleRect).find(Boolean) as DOMRect | undefined;
    if (found) {
      rects.push(found);
      // "eclipses" + "arcane" ficam juntos no mesmo foco
      if (!(t === 'eclipses' && step.targets.includes('arcane'))) break;
    }
  }
  if (!rects.length) return null;
  const x1 = Math.min(...rects.map(r => r.left)), y1 = Math.min(...rects.map(r => r.top));
  const x2 = Math.max(...rects.map(r => r.right)), y2 = Math.max(...rects.map(r => r.bottom));
  const p = step.pad ?? 6;
  if (step.round) {
    // círculo de verdade: diâmetro = menor lado, centralizado (o contêiner do relógio é mais largo que alto)
    const d = Math.min(x2 - x1, y2 - y1) + 2 * p;
    const cxm = (x1 + x2) / 2, cym = (y1 + y2) / 2;
    return { x: cxm - d / 2, y: cym - d / 2, w: d, h: d };
  }
  return { x: x1 - p, y: y1 - p, w: x2 - x1 + 2 * p, h: y2 - y1 + 2 * p };
};

// ─────────────────────────────────────────────────────────────────────────────
// Ilustração: o card do dia do calendário lunar
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
  /** abre a barra lateral quando um passo precisa dela */
  onNeedSidebar?: () => void;
  /** estados do app (passos interativos) */
  state?: TourState;
  theme?: 'dark' | 'light';
}

const CARD_W = 268;

const OnboardingTour: React.FC<OnboardingTourProps> = ({ open, onClose, onNeedSidebar, state = {}, theme = 'dark' }) => {
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [cardPos, setCardPos] = useState<{ left: number; top: number } | null>(null);
  const [cardKey, setCardKey] = useState(0);
  const [isSheet, setIsSheet] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = TOUR_STEPS[index];
  const last = TOUR_STEPS.length - 1;

  useEffect(() => { if (open) setIndex(0); }, [open]);

  // Barra lateral aberta quando o passo precisa dela
  useEffect(() => {
    if (open && step?.needsSidebar) onNeedSidebar?.();
  }, [open, index, step, onNeedSidebar]);

  // Mede o alvo (e acompanha painéis que se movem / animam)
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

  useEffect(() => { setCardKey(k => k + 1); }, [index]);

  // Posição do cartão: à direita do foco, senão à esquerda, senão acima/abaixo; sempre na tela
  useLayoutEffect(() => {
    if (!open) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const ch = cardRef.current?.offsetHeight ?? 190;
    if (isSheet) { setCardPos(null); return; }
    if (!box) { setCardPos({ left: (vw - CARD_W) / 2, top: (vh - ch) / 2 }); return; }
    const gap = 16;
    let left: number, top: number;
    if (box.x + box.w + gap + CARD_W < vw - 10) { left = box.x + box.w + gap; top = box.y + box.h / 2 - ch / 2; }
    else if (box.x - gap - CARD_W > 10) { left = box.x - gap - CARD_W; top = box.y + box.h / 2 - ch / 2; }
    else {
      left = box.x + box.w / 2 - CARD_W / 2;
      top = box.y - gap - ch > 10 ? box.y - gap - ch : box.y + box.h + gap;
    }
    left = Math.max(10, Math.min(left, vw - CARD_W - 10));
    top = Math.max(10, Math.min(top, vh - ch - 10));
    setCardPos({ left, top });
  }, [open, box, isSheet, cardKey]);

  const next = useCallback(() => {
    if (index >= last) onClose(true); else setIndex(i => i + 1);
  }, [index, last, onClose]);

  // Passo interativo: guarda se o estado já estava ligado ao entrar; avança quando a pessoa liga
  const waitKey = step?.waitFor;
  const waitValue = waitKey ? !!state[waitKey] : false;
  const [alreadyDone, setAlreadyDone] = useState(false);
  const enteredRef = useRef<number>(-1);
  useEffect(() => {
    if (!open || !waitKey) return;
    if (enteredRef.current !== index) {
      enteredRef.current = index;
      setAlreadyDone(waitValue);
      return;
    }
    if (waitValue && !alreadyDone) {
      const t = window.setTimeout(() => setIndex(i => Math.min(i + 1, last)), 700);
      return () => window.clearTimeout(t);
    }
  }, [open, index, waitKey, waitValue, alreadyDone, last]);
  useEffect(() => { if (!waitKey) enteredRef.current = -1; }, [waitKey]);
  const back = useCallback(() => setIndex(i => Math.max(0, i - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
      else if (e.key === 'Escape') { e.preventDefault(); onClose(false); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, next, back, onClose]);

  if (!open || !step || typeof document === 'undefined') return null;

  const light = theme === 'light';
  const spotStyle: React.CSSProperties = box
    ? { left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: step.round ? '50%' : 14, opacity: 1 }
    : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0, borderRadius: 14, opacity: 1 };

  return createPortal(
    <div className={`tour-root ${light ? 'tour-light' : ''}`} role="dialog" aria-modal="true" aria-label="Tutorial do Cronógrafo">
      {/* bloqueia cliques no app enquanto o tutorial está aberto.
          Em passo interativo, deixa só a área em foco clicável. */}
      {waitKey && box ? (
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
          className="tour-ring"
          style={{ left: box.x - 2, top: box.y - 2, width: box.w + 4, height: box.h + 4, borderRadius: step.round ? '50%' : 16 }}
        />
      )}

      <div
        key={cardKey}
        ref={cardRef}
        className={`tour-card ${isSheet ? 'tour-sheet' : ''}`}
        style={isSheet ? undefined : { left: cardPos?.left ?? -9999, top: cardPos?.top ?? -9999, width: CARD_W }}
      >
        <div className="tour-cap">{step.chapter.toUpperCase()}</div>
        <div className="tour-head">
          <i className={`ti ${step.icon} tour-icon`} aria-hidden="true" />
          <h4>{step.title}</h4>
        </div>
        <p>{waitKey && alreadyDone && step.doneText ? step.doneText : step.text}</p>
        {waitKey && !alreadyDone && (
          <div className={`tour-wait ${waitValue ? 'ok' : ''}`}>
            <i className={`ti ${waitValue ? 'ti-circle-check' : 'ti-pointer'}`} aria-hidden="true" />
            {waitValue ? 'Isso!' : 'Aguardando seu clique…'}
          </div>
        )}
        {step.media === 'daycard' && <DayCardMedia />}

        <div className="tour-prog" aria-hidden="true">
          {TOUR_STEPS.map((_, k) => <span key={k} className={k < index ? 'd' : k === index ? 'a' : ''} />)}
        </div>
        <div className="tour-btns">
          <button type="button" className="tour-skip" onClick={() => onClose(false)}>Pular</button>
          <span>
            {index > 0 && <button type="button" className="tour-back" onClick={back}>Voltar</button>}
            <button type="button" className="tour-next" onClick={next} autoFocus>
              {index === 0 ? 'Começar' : index === last ? 'Concluir' : 'Próximo'}
            </button>
          </span>
        </div>
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
.tour-wait{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:12px;color:#F5D98A;padding:4px 10px;border-radius:999px;background:rgba(212,175,55,.12);animation:tour-blink 1.4s ease-in-out infinite}
.tour-wait.ok{color:#86efac;background:rgba(74,222,128,.14);animation:none}
@keyframes tour-blink{50%{opacity:.55}}
.tour-spot{position:fixed;box-shadow:0 0 0 200vmax rgba(4,0,4,.78);transition:all .55s cubic-bezier(.65,0,.35,1);pointer-events:none}
.tour-ring{position:fixed;padding:2px;pointer-events:none;transition:all .55s cubic-bezier(.65,0,.35,1);
  background:conic-gradient(from var(--tour-a),transparent 0deg,#D4AF37 70deg,#FFF3C4 110deg,#D4AF37 150deg,transparent 220deg);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;
  animation:tour-spin 2.4s linear infinite;filter:drop-shadow(0 0 6px rgba(212,175,55,.45))}
@keyframes tour-spin{to{--tour-a:360deg}}
.tour-card{position:fixed;pointer-events:auto;box-sizing:border-box;background:rgba(10,8,18,.98);border:1px solid rgba(212,175,55,.35);
  border-radius:16px;padding:15px 16px 12px;color:#E8E4DA;font-family:'DM Sans',system-ui,sans-serif;
  box-shadow:0 24px 60px -16px rgba(0,0,0,.8);animation:tour-in .32s ease-out;transition:left .45s cubic-bezier(.65,0,.35,1),top .45s cubic-bezier(.65,0,.35,1)}
@keyframes tour-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.tour-sheet{left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));top:auto}
.tour-cap{font-size:10.5px;letter-spacing:.1em;font-weight:700;color:#D4AF37}
.tour-head{display:flex;align-items:center;gap:9px;margin:6px 0 5px}
.tour-head h4{margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:20px;line-height:1.2;color:#F5F2EB}
.tour-icon{font-size:22px;color:#F5D98A;animation:tour-bob 1.6s ease-in-out infinite}
@keyframes tour-bob{50%{transform:translateY(-3px)}}
.tour-card p{margin:0;font-size:14px;line-height:1.5;color:#D9D4C8}
.tour-prog{display:flex;gap:3px;margin:13px 0 10px}
.tour-prog span{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.1);transition:background .3s}
.tour-prog span.d{background:#8a6a12}.tour-prog span.a{background:#F5D98A}
.tour-btns{display:flex;justify-content:space-between;align-items:center}
.tour-btns button{height:32px;border-radius:999px;padding:0 14px;font:600 12.5px/1 'DM Sans',sans-serif;cursor:pointer}
.tour-skip{background:transparent;border:0;color:#8e887c}.tour-skip:hover{color:#cfc9bd}
.tour-back{background:transparent;border:1px solid rgba(255,255,255,.18);color:#cfc9bd;margin-right:6px}
.tour-next{background:linear-gradient(90deg,#D4AF37,#F5D98A);border:0;color:#1a1408;font-weight:700}
.tour-next:focus-visible,.tour-back:focus-visible{outline:2px solid #F5D98A;outline-offset:2px}
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
.tour-light .tour-cap{color:#8a6a12}.tour-light .tour-icon,.tour-light .tour-ann{color:#8a6a12}
.tour-light .tour-back{border-color:rgba(0,0,0,.18);color:#3b362d}
.tour-light .tour-prog span{background:rgba(0,0,0,.1)}
.tour-light .tour-daycard{background:#fff;border-color:rgba(0,0,0,.12);color:#2a2620}
@keyframes tour-help-pulse{0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,.55)}50%{box-shadow:0 0 0 8px rgba(212,175,55,0)}}
.tour-help-pulse{animation:tour-help-pulse 1.8s ease-in-out infinite}
`;
