/**
 * OnboardingTour — tutoriais guiados do Cronógrafo (roteiro aprovado pelo Rafa em 13/11/2026).
 *
 * TRÊS TUTORIAIS, escolhidos no cartão de boas-vindas:
 *  1. O Cronógrafo — monta o céu peça por peça (Sol → Lua → planetas → signos → casas →
 *     aspectos → termos e decanatos → tempo → data → salvar → exportar). Abre no primeiro acesso.
 *  2. A Lua e o calendário   (provisório: passos antigos, aguardando o roteiro novo)
 *  3. Ferramentas            (provisório: passos antigos, aguardando o roteiro novo)
 *
 * Tipos de passo:
 *  • info     — só olhar; a tela fica bloqueada. Avança em "Próximo".
 *  • explore  — a área em foco fica livre; avança só em "Próximo".
 *  • mission  — lista de tarefas ("Faça"). Ao cumprir todas passa sozinho, exceto com
 *               hold: true (espera o "Próximo", para a pessoa ver o resultado no relógio).
 *
 * No Tutorial 1 as tooltips do relógio só abrem para o assunto do passo (campo tips →
 * body[data-tour-tips], lido pelo SiderealClock). lock: 'also' deixa o relógio só para olhar.
 * Ao sair, o App devolve a tela como estava.
 *
 * Alvos: elementos com data-tour="…". Teclado: → avança, ← volta, Esc fecha.
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

/** Estados do app que o tutorial acompanha. */
export type TourState = {
  atmosphere?: boolean;
  realTime?: boolean;
  zodiacLocked?: boolean;
  natal?: boolean;
  /** currentTime em ms */
  time?: number;
  /** alguma casa selecionada tem astro */
  houseWithPlanet?: boolean;
  housesCount?: number;
  aspectHovered?: boolean;
  aspectsSelected?: number;
  colorMode?: string;
  /** há destaque ativo vindo do painel Status */
  highlight?: boolean;
  /** quantos dos 10 astros principais estão visíveis */
  planetsVisible?: number;
  planetsSelected?: number;
};

/** Cenas que o App monta a pedido do tutorial. */
export type TourScene = 'clear-select' | 'day-spin' | 'sun' | 'moon' | 'planets' | 'select' | 'signs' | 'colors' | 'summary' | 'houses' | 'aspects' | 'rings' | 'time' | 'restore' | 'close-overlays';

type Wait =
  | { fn: (s: TourState) => boolean }
  | { dom: string }                       // elemento precisa surgir
  | { domGone: string }                   // elemento precisa sumir
  | { click: string }                     // clique dentro do seletor
  | { timeMoved: true }                   // o relógio saiu do horário em que estava (> 1 min)
  | { event: 'wheel' | 'dblclick'; within: string; count?: number };

interface Task {
  label: string;
  wait: Wait;
  /** alvo próprio da tarefa (senão, o do passo) */
  targets?: string[];
  also?: string[];
  round?: boolean;
  pad?: number;
  /** a mãozinha aponta para este alvo (data-tour) */
  hand?: string;
  /** desenho do mouse com o botão que deve ser usado */
  mouse?: 'left' | 'right';
}

type ChapterId = 'cronografo' | 'lua' | 'ferramentas';
type Kind = 'info' | 'explore' | 'mission';

interface TourStep {
  chapter: ChapterId | 'intro' | 'end';
  kind: Kind;
  title: string;
  text: string;
  icon: string;
  targets?: string[];
  also?: string[];
  round?: boolean;
  pad?: number;
  needsSidebar?: boolean;
  media?: 'daycard' | 'menu';
  scene?: TourScene;
  /** cor do passo (senão, a do tutorial) */
  color?: string;
  /** tooltips do relógio liberadas neste passo: 'none', 'all', 'sign', 'planet:sun', 'term,decan'… */
  tips?: string;
  /** 'also': as áreas de apoio (relógio) ficam só para olhar */
  lock?: 'also';
  /** missão: ao terminar, espera o "Próximo" em vez de passar sozinho */
  hold?: boolean;
  /** cena pedida ao terminar a missão */
  doneScene?: TourScene;
  /** linha extra para quem já é astrólogo */
  expert?: string;
  /** contornos girando nestes alvos (no lugar do contorno do alvo principal) */
  rings?: string[];
  /** tooltips do relógio abrem quase na hora */
  fastTips?: boolean;
  /** clique esquerdo num astro é desfeito e a pessoa recebe um aviso */
  noSelect?: boolean;
  /** foco em anel: o miolo deste alvo (data-tour) fica escuro */
  innerOf?: string;
  /** missão: tarefas em sequência */
  tasks?: Task[];
  /** explorar: convite */
  goal?: string;
  pro?: string;
}

export const TOUR_CHAPTERS: { id: ChapterId; label: string; sub: string; icon: string; color: string }[] = [
  { id: 'cronografo', label: 'O Cronógrafo', sub: 'Aprenda a ler o céu deste instante, peça por peça.', icon: 'ti-clock', color: '#FBBF24' },
  { id: 'lua', label: 'A Lua e o calendário', sub: 'Fases, ciclos e os meses lunares.', icon: 'ti-moon', color: '#A5B4FC' },
  { id: 'ferramentas', label: 'Ferramentas', sub: 'Seu mapa natal, eclipses, Calendário Arcano e ajustes.', icon: 'ti-tools', color: '#22D3EE' },
];
const GOLD = '#F5D98A';
const chapterNumber = (id: string) => TOUR_CHAPTERS.findIndex(c => c.id === id) + 1;
const chapterColor = (id: string) => TOUR_CHAPTERS.find(c => c.id === id)?.color ?? GOLD;

// cores dos blocos do Tutorial 1
const C_SKY = '#FBBF24', C_PLANETS = '#FB7185', C_SIGNS = '#34D399', C_HOUSES = '#C084FC', C_ASPECTS = '#22D3EE', C_TIME = '#A5B4FC', C_KEEP = '#34D399';

// ─────────────────────────────────────────────────────────────────────────────
// Roteiro
// ─────────────────────────────────────────────────────────────────────────────
export const TOUR_STEPS: TourStep[] = [
  { chapter: 'intro', kind: 'info', title: 'Bem-vindo ao Cronógrafo', text: 'O céu deste instante, desenhado como um relógio. O que você quer aprender?', icon: 'ti-sparkles', media: 'menu', scene: 'restore' },

  // ══ Tutorial 1 · O Cronógrafo ═══════════════════════════════════════════════
  { chapter: 'cronografo', kind: 'info', color: C_SKY, title: 'O relógio do céu', icon: 'ti-sun', targets: ['clock'], round: true, pad: 0, scene: 'sun', tips: 'none',
    text: 'O anel de fora tem 24 horas, como um relógio. O Sol é o ponteiro: ele dá uma volta inteira por dia. No alto é meio-dia; embaixo, meia-noite.' },
  { chapter: 'cronografo', kind: 'mission', color: C_SKY, title: 'Dia e noite', icon: 'ti-sunset-2', targets: ['atmosphere'], also: ['clock'], lock: 'also', pad: 6, needsSidebar: true, scene: 'sun', tips: 'none', hold: true,
    text: 'A linha no meio do relógio é o horizonte. Acima dela está o céu que vemos. Abaixo, o céu escondido sob a Terra. Acenda o céu e veja o Sol dar a volta de 24 horas: ele se põe, a noite passa, ele nasce e volta ao meio-dia.',
    expert: 'O horizonte liga o Ascendente ao Descendente.', doneScene: 'day-spin',
    tasks: [{ label: 'Clique em Atmosfera, na barra da direita, para acender o céu', wait: { fn: s => !!s.atmosphere }, mouse: 'left' }] },
  { chapter: 'cronografo', kind: 'info', color: C_SKY, title: 'A Lua', icon: 'ti-moon', targets: ['clock'], round: true, pad: 0, scene: 'moon', tips: 'none',
    text: 'A Lua é o ponteiro do mês. Veja: em um mês ela dá uma volta inteira, reencontra o Sol e, no caminho, muda de fase. Depois o relógio volta para agora.' },

  { chapter: 'cronografo', kind: 'mission', color: C_PLANETS, title: 'Os planetas', icon: 'ti-planet', targets: ['planets-panel'], also: ['clock'], pad: 4, scene: 'planets', tips: 'planet', noSelect: true,
    text: 'Cada astro é um ponteiro com velocidade própria. O painel Astros lista todos. O botão DIREITO do mouse mostra ou esconde um astro no céu.',
    tasks: [
      { label: 'Clique com o botão DIREITO do mouse em Mercúrio: ele aparece no céu', wait: { fn: s => (s.planetsVisible ?? 0) >= 3 }, hand: 'body-mercury', mouse: 'right' },
      { label: 'Ligue a chave ao lado de PLANETAS para mostrar todos de uma vez', wait: { fn: s => (s.planetsVisible ?? 0) >= 10 }, hand: 'planets-toggle', mouse: 'left' },
    ] },
  { chapter: 'cronografo', kind: 'mission', color: C_PLANETS, title: 'Destacar um astro', icon: 'ti-focus-2', targets: ['planets-panel'], also: ['clock'], pad: 4, scene: 'select', tips: 'planet',
    text: 'O botão ESQUERDO destaca o astro e apaga o resto, para você olhar só para ele. Nada some de verdade: outro clique devolve tudo.',
    tasks: [
      { label: 'Clique em Mercúrio com o botão esquerdo: ele fica em destaque', wait: { fn: s => (s.planetsSelected ?? 0) >= 1 }, hand: 'body-mercury', mouse: 'left' },
      { label: 'Clique nele de novo: tudo volta ao normal', wait: { fn: s => (s.planetsSelected ?? 0) === 0 }, hand: 'body-mercury', mouse: 'left' },
      { label: 'Agora clique em Vênus', wait: { fn: s => (s.planetsSelected ?? 0) >= 1 }, hand: 'body-venus', mouse: 'left' },
      { label: 'E em Marte: os dois ficam em destaque juntos', wait: { fn: s => (s.planetsSelected ?? 0) >= 2 }, hand: 'body-mars', mouse: 'left' },
      { label: 'Clique no ✕ vermelho, ao lado de PLANETAS, para limpar tudo', wait: { fn: s => (s.planetsSelected ?? 0) === 0 }, hand: 'planets-clear', mouse: 'left' },
    ] },

  { chapter: 'cronografo', kind: 'explore', color: C_SIGNS, title: 'Os signos', icon: 'ti-zodiac-aries', targets: ['clock'], round: true, pad: 0, scene: 'signs', tips: 'sign',
    text: 'Os astros caminham por uma estrada dividida em 12 partes iguais: os signos. Veja o Sol percorrer todos, de Áries a Peixes: é a volta de um ano.',
    goal: 'Quando o Sol completar a volta, pare o mouse sobre um signo, sem clicar, para ler.',
    expert: 'Zodíaco sideral ou tropical: você escolhe nos ajustes.' },
  { chapter: 'cronografo', kind: 'mission', color: C_SIGNS, title: 'As cores dos signos', icon: 'ti-palette', targets: ['status'], also: ['clock'], lock: 'also', pad: 4, scene: 'colors', tips: 'none',
    text: 'O painel Status tem três cartões: Polaridade, Elementos e Ritmos. Cada um agrupa os 12 signos de um jeito, e o título de cada cartão pinta o zodíaco.',
    tasks: [
      { label: 'Clique no título Elementos: fogo, terra, ar e água', wait: { fn: s => s.colorMode === 'element' }, hand: 'status-element', mouse: 'left' },
      { label: 'Clique em Polaridade: signos masculinos e femininos', wait: { fn: s => s.colorMode === 'polarity' }, hand: 'status-polarity', mouse: 'left' },
      { label: 'Clique em Ritmos: os que começam, os que mantêm e os que mudam', wait: { fn: s => s.colorMode === 'modality' }, hand: 'status-modality', mouse: 'left' },
      { label: 'Volte para Elementos', wait: { fn: s => s.colorMode === 'element' }, hand: 'status-element', mouse: 'left' },
    ] },
  { chapter: 'cronografo', kind: 'mission', color: C_SIGNS, title: 'O resumo do céu', icon: 'ti-chart-pie', targets: ['status'], also: ['clock'], lock: 'also', pad: 4, scene: 'summary', tips: 'none',
    text: 'Com os astros de volta, cada cartão conta quantos estão naquele grupo. É o tempero do céu de agora.',
    tasks: [
      { label: 'Pare o mouse num cartão (Fogo, por exemplo): os signos do grupo acendem no relógio', wait: { fn: s => !!s.highlight } },
      { label: 'Clique no cartão para fixar o destaque', wait: { click: '[data-status-card]' } },
      { label: 'Clique nele de novo para soltar', wait: { fn: s => !s.highlight } },
    ] },

  { chapter: 'cronografo', kind: 'mission', color: C_HOUSES, title: 'As casas', icon: 'ti-home', targets: ['cusps-panel'], pad: 4, also: ['clock'], scene: 'houses', tips: 'house',
    text: 'O céu também se divide em 12 casas, contadas a partir do horizonte. Cada casa é um assunto da vida: dinheiro, família, trabalho, amizades. O painel Casas mostra onde cada uma começa.',
    tasks: [
      { label: 'No relógio, clique numa casa que tenha um astro dentro', wait: { fn: s => !!s.houseWithPlanet }, mouse: 'left' },
      { label: 'Pare o mouse numa casa do relógio, sem clicar, para ler o assunto dela', wait: { dom: '.itt[data-kind="house"]' } },
      { label: 'Clique de novo na casa marcada para soltar', wait: { fn: s => (s.housesCount ?? 0) === 0 }, mouse: 'left' },
    ] },

  { chapter: 'cronografo', kind: 'mission', color: C_ASPECTS, title: 'Os aspectos', icon: 'ti-affiliate', targets: ['astros-panel'], also: ['clock'], pad: 4, scene: 'aspects', tips: 'aspect', fastTips: true,
    text: 'Quando dois astros formam certos ângulos, eles conversam. O painel Aspectos lista as conversas de agora, e cada uma vira uma linha no relógio.',
    expert: '"Ver detalhes" mostra o início, o exato e o fim de cada aspecto.',
    tasks: [
      { label: 'Passe o mouse num aspecto do painel: ele acende no relógio', wait: { fn: s => !!s.aspectHovered } },
      { label: 'Agora pare o mouse sobre uma linha do relógio: veja o que aquele aspecto significa', wait: { dom: '.itt[data-kind="aspect"]' }, targets: ['clock'], round: true, pad: 0, also: ['astros-panel'] },
      { label: 'Clique em dois aspectos do painel para destacar', wait: { fn: s => (s.aspectsSelected ?? 0) >= 2 }, mouse: 'left' },
      { label: 'Clique no ✕ vermelho, no alto do painel, para limpar', wait: { fn: s => (s.aspectsSelected ?? 0) === 0 }, hand: 'aspects-clear', mouse: 'left' },
    ] },

  { chapter: 'cronografo', kind: 'explore', color: GOLD, title: 'Termos e decanatos', icon: 'ti-ruler-measure', targets: ['rings-outer'], round: true, pad: 2, innerOf: 'rings-inner', scene: 'rings', tips: 'term,decan', rings: ['rings-outer', 'rings-inner'],
    text: 'Cada signo se divide em pedaços menores, e cada pedaço tem um astro responsável. São os dois anéis finos entre as linhas douradas: por fora, os termos; por dentro, os decanatos.',
    goal: 'Pare o mouse num pedaço, sem clicar, para ler.',
    expert: 'Termos egípcios e decanatos caldeus.' },

  { chapter: 'cronografo', kind: 'mission', color: C_TIME, title: 'A linha do tempo', icon: 'ti-arrows-horizontal', targets: ['time-controls', 'timeline'], also: ['clock'], pad: 6, scene: 'time', tips: 'all', hold: true,
    text: 'Até aqui você viu o céu de agora. Esta linha leva o relógio para qualquer momento. Olhe o relógio enquanto mexe.',
    tasks: [
      { label: 'Clique na estrela branca e arraste para os lados', wait: { timeMoved: true }, hand: 'scrub-thumb', mouse: 'left' },
      { label: 'Muita coisa girando na tela? Trave o zodíaco: clique no cadeado', wait: { fn: s => !!s.zodiacLocked }, targets: ['zodiac-lock'], also: ['clock'], hand: 'zodiac-lock', mouse: 'left' },
      { label: 'Clique e arraste a estrela de novo: os signos ficam parados e você vê os astros evoluindo', wait: { timeMoved: true }, hand: 'scrub-thumb', mouse: 'left' },
      { label: 'Role a rodinha do mouse sobre a linha do tempo: zoom', wait: { event: 'wheel', within: '[data-tour="timeline"]' } },
    ] },
  { chapter: 'cronografo', kind: 'mission', color: C_KEEP, title: 'O seu mapa', icon: 'ti-calendar-event', targets: ['date', 'date-display'], also: ['clock'], pad: 6, tips: 'all', hold: true, doneScene: 'close-overlays',
    text: 'Agora vamos montar o SEU mapa: coloque a data e a hora em que você nasceu. Nos próximos passos você salva e exporta esse mapa.',
    tasks: [
      { label: 'Clique no calendário da data', wait: { dom: '[data-tour="date-input"]' } },
      { label: 'Digite só os números do seu nascimento, confira e clique em OK (ex.: 210319900815 = 21/03/1990 às 08:15)', wait: { click: '[data-tour="date-ok"]' }, targets: ['date-input', 'calendar-panel'], also: ['clock'], hand: 'date-ok', mouse: 'left' },
    ] },

  { chapter: 'cronografo', kind: 'mission', color: C_KEEP, title: 'Salvar o seu mapa', icon: 'ti-bookmark', targets: ['save'], pad: 6, needsSidebar: true, scene: 'close-overlays', tips: 'all',
    text: 'O céu do seu nascimento fica guardado na sua conta.',
    tasks: [
      { label: 'Clique em Salvar', wait: { dom: '[data-tour="save-modal"]' } },
      { label: 'Dê um nome (o seu, por exemplo) e confirme', wait: { domGone: '[data-tour="save-modal"]' }, targets: ['save-modal', 'save'] },
    ] },
  { chapter: 'cronografo', kind: 'mission', color: C_KEEP, title: 'Exportar o seu mapa', icon: 'ti-download', targets: ['export'], pad: 6, needsSidebar: true, tips: 'all',
    text: 'Um PDF do seu mapa, pronto para enviar ou imprimir.',
    tasks: [
      { label: 'Clique em Exportar', wait: { dom: '[data-tour="export-modal"]' } },
      { label: 'Escolha o formato e baixe o PDF', wait: { domGone: '[data-tour="export-modal"]' }, targets: ['export-modal', 'export'] },
    ] },

  // ══ Tutorial 2 · A Lua e o calendário (provisório) ══════════════════════════
  { chapter: 'lua', kind: 'mission', title: 'O card da Lua', text: 'A fase, o brilho, a hora em que a Lua nasce, a hora em que ela se esconde e o próximo eclipse.', icon: 'ti-moon', targets: ['lunar'], pad: 6, scene: 'restore',
    tasks: [{ label: 'Clique no card da Lua', wait: { dom: '[data-tour="calendar-panel"]' } }] },
  { chapter: 'lua', kind: 'explore', title: 'Três leituras do tempo', text: 'Mensal, Anual e Ciclos. E também o calendário Solar.', icon: 'ti-calendar', targets: ['calendar-panel', 'lunar'], pad: 4, goal: 'Troque de aba, se quiser.', pro: 'Anual e Ciclos: planos Mensal e Vitalício.' },
  { chapter: 'lua', kind: 'mission', title: 'Os ciclos lunares', text: 'Cada ciclo é um mês lunar com nome próprio e nasce na Lua Nova. Cada linha é uma fase.', icon: 'ti-moon-stars', targets: ['calendar-panel', 'lunar'], pad: 4, media: 'daycard', pro: 'Ciclos: planos Mensal e Vitalício.', hold: true, doneScene: 'close-overlays',
    tasks: [
      { label: 'Desça para ver os outros meses lunares e seus nomes', wait: { event: 'wheel', within: '[data-tour="calendar-panel"]', count: 2 } },
      { label: 'Clique num dia e veja o relógio ir até ele', wait: { timeMoved: true }, targets: ['calendar-panel', 'lunar'], also: ['clock'] },
    ] },

  // ══ Tutorial 3 · Ferramentas (provisório) ═══════════════════════════════════
  { chapter: 'ferramentas', kind: 'mission', title: 'Zoom e repetição', text: 'Aproxime a linha do tempo e repita um trecho em loop.', icon: 'ti-zoom-in', targets: ['time-controls', 'timeline'], also: ['clock'], pad: 6, scene: 'restore',
    tasks: [
      { label: 'Role o mouse sobre a linha do tempo: zoom', wait: { event: 'wheel', within: '[data-tour="timeline"]' } },
      { label: 'Crie um loop: dois duplos cliques na linha (A e B)', wait: { dom: '[data-tour="loop-chip"][data-complete="true"]' } },
      { label: 'Feche o loop no ✕', wait: { domGone: '[data-tour="loop-chip"]' } },
    ] },
  { chapter: 'ferramentas', kind: 'mission', title: 'Seu mapa natal', text: 'Seu mapa por baixo, o céu de hoje por cima.', icon: 'ti-circles', targets: ['natal'], pad: 6, needsSidebar: true, hold: true,
    tasks: [
      { label: 'Clique no +', wait: { dom: '[data-tour="natal-popover"]' } },
      { label: 'Use um mapa salvo ou digite sua data e aplique', wait: { fn: s => !!s.natal }, targets: ['natal-popover', 'natal'], also: ['clock'] },
      { label: 'Clique em Agora', wait: { fn: s => !!s.realTime }, targets: ['now'], also: ['clock'] },
    ] },
  { chapter: 'ferramentas', kind: 'explore', title: 'Os trânsitos', text: 'Cada linha é o céu de hoje tocando o seu mapa.', icon: 'ti-affiliate', targets: ['clock'], round: true, pad: 0, also: ['astros-panel'], goal: 'Pare o mouse nas linhas, sem clicar, para ler.' },
  { chapter: 'ferramentas', kind: 'mission', title: 'Eclipses', text: 'Data, local e animação de cada eclipse.', icon: 'ti-sun-low', targets: ['eclipses'], pad: 6, needsSidebar: true,
    tasks: [
      { label: 'Clique em Eclipses', wait: { dom: '[data-tour="eclipse-panel"]' } },
      { label: 'Explore e feche quando quiser', wait: { domGone: '[data-tour="eclipse-panel"]' }, targets: ['eclipse-panel'] },
    ] },
  { chapter: 'ferramentas', kind: 'mission', title: 'Calendário Arcano', text: 'O arcano de cada dia.', icon: 'ti-cards', targets: ['arcane'], pad: 6, needsSidebar: true,
    tasks: [
      { label: 'Clique no Calendário Arcano', wait: { dom: '[data-tour="arcane-panel"]' } },
      { label: 'Explore e feche quando quiser', wait: { domGone: '[data-tour="arcane-panel"]' }, targets: ['arcane-panel'] },
    ] },
  { chapter: 'ferramentas', kind: 'explore', title: 'Tela cheia', text: 'Para aulas e atendimentos. A tecla Esc sai da tela cheia.', icon: 'ti-maximize', targets: ['present'], pad: 6, goal: 'Experimente, se quiser.' },
  { chapter: 'ferramentas', kind: 'explore', title: 'Do seu jeito', text: 'Planetas, casas, graus, anéis, céu e tamanhos.', icon: 'ti-adjustments', targets: ['settings'], also: ['sidebar-popover'], pad: 6, needsSidebar: true, goal: 'Abra os ajustes que quiser.' },

  { chapter: 'end', kind: 'info', title: 'Muito bem!', text: 'Quer aprender mais ou explorar sozinho? O botão "?" no alto abre os tutoriais quando você quiser.', icon: 'ti-confetti', targets: ['help'], round: true, pad: 6, scene: 'restore' },
];

const END_INDEX = TOUR_STEPS.length - 1;
const firstIndexOf = (ch: ChapterId) => TOUR_STEPS.findIndex(s => s.chapter === ch);
/** janelas abertas em que o Esc deve fechar a janela, não o tutorial */
const WINDOW_SELECTORS = '[data-tour="eclipse-panel"],[data-tour="arcane-panel"],[data-tour="export-modal"],[data-tour="save-modal"],[data-tour="calendar-panel"]';

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
interface Box { x: number; y: number; w: number; h: number; round: boolean; inner?: number; full?: Box }

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

const findBoxes = (targets: string[] | undefined, also: string[] | undefined, round: boolean, pad: number): { main: Box | null; extra: Box[] } => {
  let main: Box | null = null;
  for (const t of targets ?? []) {
    const r = rectOf(t);
    if (r) { main = toBox(r, round, pad); break; }
  }
  const extra: Box[] = [];
  for (const a of also ?? []) {
    const r = rectOf(a);
    if (!r) continue;
    let b = toBox(r, a === 'clock', a === 'clock' ? 0 : 4);
    const overlaps = (x: Box, o: Box) => !(x.x + x.w <= o.x || o.x + o.w <= x.x || x.y + x.h <= o.y || o.y + o.h <= x.y);
    const others = [...(main ? [main] : []), ...extra];
    if (b.round && others.some(o => overlaps(b, o))) {
      // círculo do relógio: encolhe até não tocar no alvo (mantém o relógio visível)
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      let rad = b.w / 2;
      for (const o of others) {
        const nx = Math.max(o.x, Math.min(cx, o.x + o.w)), ny = Math.max(o.y, Math.min(cy, o.y + o.h));
        rad = Math.min(rad, Math.hypot(cx - nx, cy - ny) - 6);
      }
      if (rad < b.w * 0.3) continue;
      b = { x: cx - rad, y: cy - rad, w: rad * 2, h: rad * 2, round: true, full: b };
    }
    if (others.some(o => overlaps(b, o))) continue;
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
      if (b.inner) {
        const ri = b.inner;
        d += `M${cx - ri} ${cy}A${ri} ${ri} 0 1 0 ${cx + ri} ${cy}A${ri} ${ri} 0 1 0 ${cx - ri} ${cy}Z`;
      }
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

/** Mouse desenhado com o botão a usar piscando (esquerdo ou direito). */
const MouseIcon: React.FC<{ button: 'left' | 'right' }> = ({ button }) => (
  <span className="tour-mouse">
    <svg width="30" height="42" viewBox="0 0 30 42" aria-hidden="true">
      <rect x="1.5" y="1.5" width="27" height="39" rx="13.5" fill="rgba(10,8,18,.92)" stroke="#E8E4DA" strokeWidth="2" />
      <path d="M15 1.5V17" stroke="#E8E4DA" strokeWidth="2" />
      <path d="M1.5 17H28.5" stroke="#E8E4DA" strokeWidth="2" />
      <path className="tour-mouse-btn" d={button === 'left' ? 'M14 2.6V16H2.6V15A12.4 12.4 0 0 1 14 2.6Z' : 'M16 2.6V16H27.4V15A12.4 12.4 0 0 0 16 2.6Z'} />
    </svg>
    <b>{button === 'left' ? 'esquerdo' : 'direito'}</b>
  </span>
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

const CARD_W = 340;

const OnboardingTour: React.FC<OnboardingTourProps> = ({ open, onClose, onNeedSidebar, onScene, state = {}, isFreeTier = false, theme = 'dark' }) => {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<ChapterId>('cronografo');
  const [boxes, setBoxes] = useState<{ main: Box | null; extra: Box[] }>({ main: null, extra: [] });
  const [handBox, setHandBox] = useState<DOMRect | null>(null);
  const [ringBoxes, setRingBoxes] = useState<Box[]>([]);
  const [cardPos, setCardPos] = useState<{ left: number; top: number } | null>(null);
  const [isSheet, setIsSheet] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = TOUR_STEPS[index];

  const onSceneRef = useRef(onScene); onSceneRef.current = onScene;
  const onSidebarRef = useRef(onNeedSidebar); onSidebarRef.current = onNeedSidebar;
  const stateRef = useRef(state); stateRef.current = state;

  useEffect(() => { if (open) { setIndex(0); setMode('cronografo'); } }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('tour-open');
    return () => document.body.classList.remove('tour-open');
  }, [open]);

  useEffect(() => {
    if (!open || !step) return;
    if (step.scene) onSceneRef.current?.(step.scene);
    if (step.needsSidebar) onSidebarRef.current?.();
  }, [open, index, step]);

  // Passo 4: clique esquerdo num astro destaca e apaga o resto → desfaz e avisa
  const [leftWarn, setLeftWarn] = useState(false);
  useEffect(() => {
    if (!open || !step?.noSelect || (state.planetsSelected ?? 0) === 0) return;
    onSceneRef.current?.('clear-select');
    setLeftWarn(true);
  }, [open, step, state.planetsSelected]);
  useEffect(() => {
    if (!leftWarn) return;
    const t = window.setTimeout(() => setLeftWarn(false), 5000);
    return () => window.clearTimeout(t);
  }, [leftWarn]);
  useEffect(() => { setLeftWarn(false); }, [index]);

  // Tooltips do relógio liberadas neste passo (Tutorial 1: só o assunto do passo)
  useEffect(() => {
    if (!open || !step) return;
    const tips = step.tips ?? (step.chapter === 'cronografo' ? 'none' : undefined);
    if (tips) document.body.dataset.tourTips = tips; else delete document.body.dataset.tourTips;
    if (step.fastTips) document.body.dataset.tourTipFast = '1'; else delete document.body.dataset.tourTipFast;
    return () => { delete document.body.dataset.tourTips; delete document.body.dataset.tourTipFast; };
  }, [open, index, step]);

  // ── Navegação ─────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    setIndex(i => {
      if (i >= END_INDEX) return i;
      const n = i + 1;
      if (TOUR_STEPS[i].chapter === mode && TOUR_STEPS[n].chapter !== mode) return END_INDEX;
      return n;
    });
  }, [mode]);
  const goBack = useCallback(() => {
    setIndex(i => {
      if (i <= 0) return 0;
      if (i === END_INDEX) {
        const last = TOUR_STEPS.map(s => s.chapter).lastIndexOf(mode);
        return last >= 0 ? last : 0;
      }
      if (TOUR_STEPS[i - 1].chapter !== mode) return 0;
      return i - 1;
    });
  }, [mode]);
  const startChapter = (ch: ChapterId) => { setMode(ch); setIndex(firstIndexOf(ch)); };
  const backToMenu = () => { setIndex(0); };

  // ── Missões (tarefas em sequência) ────────────────────────────────────────
  const tasks = step?.kind === 'mission' ? step.tasks ?? [] : [];
  const [taskIdx, setTaskIdx] = useState(0);
  const [missionDone, setMissionDone] = useState(false);
  const sawAbsentRef = useRef(false);
  const clickedRef = useRef(false);
  const eventCountRef = useRef(0);
  const baseTimeRef = useRef<number | undefined>(undefined);
  const finishedRef = useRef(false);

  const evaluate = useCallback((w: Wait): boolean => {
    const st = stateRef.current;
    if ('fn' in w) return w.fn(st);
    if ('dom' in w) return isPresent(w.dom);
    if ('domGone' in w) return !isPresent(w.domGone);
    if ('click' in w) return clickedRef.current;
    if ('timeMoved' in w) {
      const t = st.time, b = baseTimeRef.current;
      return !st.realTime && typeof t === 'number' && typeof b === 'number' && Math.abs(t - b) > 60_000;
    }
    return eventCountRef.current >= (w.count ?? 1);
  }, []);

  /** prepara a tarefa (zera contadores e marca o horário de partida) */
  const armTask = useCallback((t: Task | undefined) => {
    clickedRef.current = false;
    eventCountRef.current = 0;
    baseTimeRef.current = stateRef.current.time;
    sawAbsentRef.current = t && 'dom' in t.wait ? !isPresent(t.wait.dom) : true;
  }, []);

  // novo passo → primeira tarefa
  useEffect(() => {
    setTaskIdx(0);
    setMissionDone(false);
    finishedRef.current = false;
    const first = TOUR_STEPS[index]?.kind === 'mission' ? TOUR_STEPS[index].tasks?.[0] : undefined;
    armTask(first);
  }, [open, index, armTask]);

  const currentTask: Task | undefined = tasks[taskIdx];

  // cliques e eventos da tarefa atual
  useEffect(() => {
    if (!open || !currentTask) return;
    const w = currentTask.wait;
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
  }, [open, index, taskIdx, currentTask]);

  const completeTask = useCallback(() => {
    if (finishedRef.current) return;
    const nextIdx = taskIdx + 1;
    if (nextIdx >= tasks.length) {
      finishedRef.current = true;
      setTaskIdx(nextIdx);
      setMissionDone(true);
      const st = TOUR_STEPS[index];
      if (st?.doneScene) onSceneRef.current?.(st.doneScene);
      if (!st?.hold) window.setTimeout(() => goNext(), 1200);
    } else {
      setTaskIdx(nextIdx);
      armTask(tasks[nextIdx]);
    }
  }, [taskIdx, tasks, goNext, armTask, index]);

  // acompanha a tarefa atual
  useEffect(() => {
    if (!open || !currentTask || missionDone) return;
    const w = currentTask.wait;
    const tick = () => {
      if (finishedRef.current) return;
      const now = evaluate(w);
      if ('dom' in w && !now) sawAbsentRef.current = true;
      const ok = 'dom' in w ? now && sawAbsentRef.current : now;
      if (ok) completeTask();
    };
    const t = window.setInterval(tick, 200);
    tick();
    return () => window.clearInterval(t);
  }, [open, index, taskIdx, currentTask, missionDone, evaluate, completeTask]);

  // ── Medição (alvo da tarefa atual, ou do passo) ───────────────────────────
  const measure = useCallback(() => {
    if (!open || !step) return;
    setIsSheet(window.innerWidth < 640);
    const t = !missionDone ? currentTask : undefined;
    const targets = t?.targets ?? step.targets;
    const also = t?.also ?? (t?.targets ? undefined : step.also);
    const round = t?.round ?? (t?.targets ? false : !!step.round);
    const pad = t?.pad ?? step.pad ?? 6;
    const found = findBoxes(targets, also, round, pad);
    if (found.main && step.innerOf && !t?.targets) {
      const ir = rectOf(step.innerOf);
      if (ir) found.main = { ...found.main, inner: Math.max(0, Math.min(ir.width, ir.height) / 2 - 2) };
    }
    setBoxes(found);
    setHandBox(t?.hand ? rectOf(t.hand) : null);
    setRingBoxes((step.rings ?? []).map(n => rectOf(n)).filter(Boolean).map(r => toBox(r as DOMRect, true, 0)));
  }, [open, step, currentTask, missionDone]);

  useEffect(() => {
    if (!open) return;
    measure();
    const t = window.setInterval(measure, 300);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { window.clearInterval(t); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [open, measure]);

  // Cartão: ao lado do conjunto aberto, sem cobrir
  useLayoutEffect(() => {
    if (!open) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const ch = cardRef.current?.offsetHeight ?? 240;
    if (isSheet) { setCardPos(null); return; }
    const all = [boxes.main, ...boxes.extra].filter(Boolean) as Box[];
    if (!all.length) { setCardPos({ left: (vw - CARD_W) / 2, top: Math.max(10, (vh - ch) / 2) }); return; }
    const m = boxes.main ?? all[0];
    const gap = 16;
    const hits = (l: number, t: number) => all.some(b => !(l + CARD_W <= b.x || b.x + b.w <= l || t + ch <= b.y || b.y + b.h <= t));
    const cands: Array<[number, number]> = [];
    if (m.x + m.w + gap + CARD_W < vw - 10) cands.push([m.x + m.w + gap, m.y + m.h / 2 - ch / 2]);
    if (m.x - gap - CARD_W > 10) cands.push([m.x - gap - CARD_W, m.y + m.h / 2 - ch / 2]);
    cands.push([m.x + m.w / 2 - CARD_W / 2, m.y - gap - ch]);
    cands.push([m.x + m.w / 2 - CARD_W / 2, m.y + m.h + gap]);
    cands.push([vw - CARD_W - 16, vh - ch - 16], [16, vh - ch - 16], [vw - CARD_W - 16, 16], [16, 16]);
    const clampL = (l: number) => Math.max(10, Math.min(l, vw - CARD_W - 10));
    const clampT = (t: number) => Math.max(10, Math.min(t, vh - ch - 10));
    let pick = cands.map(([l, t]) => [clampL(l), clampT(t)] as [number, number]).find(([l, t]) => !hits(l, t));
    if (!pick) pick = [clampL(cands[0][0]), clampT(cands[0][1])];
    setCardPos({ left: pick[0], top: pick[1] });
  }, [open, boxes, isSheet, index, taskIdx, missionDone]);

  // Teclado
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.('input, textarea, [contenteditable="true"]');
      if (typing && e.key !== 'Escape') return;
      if (e.key === 'Escape') {
        // Esc fecha a janela aberta (eclipses, arcano, exportar…) ou sai da tela cheia — não o tutorial
        if (document.fullscreenElement || isPresent(WINDOW_SELECTORS)) return;
        e.preventDefault(); onClose(false); return;
      }
      if (e.key === 'ArrowRight') { e.preventDefault(); if (index === END_INDEX) onClose(true); else if (index > 0) goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goBack(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, index, step, goNext, goBack, onClose]);

  if (!open || !step || typeof document === 'undefined') return null;

  const light = theme === 'light';
  const isMenu = step.media === 'menu';
  const isEnd = index === END_INDEX;
  const kind = step.kind;
  const missionLive = kind === 'mission' && !missionDone;
  const color = step.color ?? (step.chapter === 'intro' || step.chapter === 'end' ? GOLD : chapterColor(step.chapter));

  const holeList = [boxes.main, ...boxes.extra].filter(Boolean) as Box[];
  const clip = `path(evenodd, '${holesPath(holeList)}')`;

  const progressSteps = TOUR_STEPS.map((s, k) => (s.chapter === mode ? k : -1)).filter(k => k >= 0);
  const stepNumber = progressSteps.indexOf(index) + 1;
  const capLabel = step.chapter === 'intro' ? 'BOAS-VINDAS'
    : step.chapter === 'end' ? 'FIM'
      : `TUTORIAL ${chapterNumber(step.chapter)} · PASSO ${stepNumber} DE ${progressSteps.length}`;
  const main = boxes.main;

  return createPortal(
    <div
      className={`tour-root ${light ? 'tour-light' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial do Cronógrafo"
      style={{ ['--tc' as string]: color } as React.CSSProperties}
    >
      <svg className="tour-dim-art" width="100%" height="100%" aria-hidden="true">
        <defs>
          <mask id="tour-dim-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {holeList.map((b0, k) => {
              const b = b0.full ?? b0;
              return b.round
                ? <g key={k}><circle cx={b.x + b.w / 2} cy={b.y + b.h / 2} r={b.w / 2} fill="black" />{b0.inner ? <circle cx={b.x + b.w / 2} cy={b.y + b.h / 2} r={b0.inner} fill="white" /> : null}</g>
                : <rect key={k} x={b.x} y={b.y} width={b.w} height={b.h} rx={Math.min(14, b.w / 2, b.h / 2)} fill="black" />;
            })}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" className="tour-dim-fill" mask="url(#tour-dim-mask)" />
      </svg>
      <div className="tour-dim" style={{ clipPath: clip, WebkitClipPath: clip }} onClick={e => e.stopPropagation()} />
      {kind === 'info' && <div className="tour-block" onClick={e => e.stopPropagation()} />}
      {step.lock === 'also' && boxes.extra.map((b, k) => (
        <div key={`lk${k}`} className="tour-block" style={{ inset: 'auto', left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: b.round ? '50%' : 15 }} onClick={e => e.stopPropagation()} />
      ))}

      {ringBoxes.map((b, k) => (
        <div key={`rgg${k}`} className="tour-ring-glow" style={{ left: b.x - 1, top: b.y - 1, width: b.w + 2, height: b.h + 2 }} />
      ))}
      {ringBoxes.map((b, k) => (
        <div key={`rg${k}`} className="tour-ring tour-ring-thin" style={{ left: b.x - 2, top: b.y - 2, width: b.w + 4, height: b.h + 4, borderRadius: '50%', animationDirection: k % 2 ? 'reverse' : 'normal' }} />
      ))}
      {main && !ringBoxes.length && (
        <div
          className={`tour-ring ${missionLive ? 'tour-ring-live' : ''}`}
          style={{ left: main.x - 2, top: main.y - 2, width: main.w + 4, height: main.h + 4, borderRadius: main.round ? '50%' : 16 }}
        />
      )}
      {boxes.extra.map((b, k) => (
        <div key={k} className="tour-ring-soft" style={{ left: b.x - 1, top: b.y - 1, width: b.w + 2, height: b.h + 2, borderRadius: b.round ? '50%' : 15 }} />
      ))}
      {missionLive && handBox && (
        <div className="tour-pointer" aria-hidden="true" style={{ left: handBox.left + handBox.width / 2 - 13, top: Math.min(handBox.bottom - 4, window.innerHeight - 70) }}>
          <i className="ti ti-hand-finger tour-hand-static" />
          {currentTask?.mouse && <MouseIcon button={currentTask.mouse} />}
        </div>
      )}
      {missionLive && !handBox && currentTask?.mouse && main && !main.round && (
        <div className="tour-pointer" aria-hidden="true" style={{ left: main.x + main.w / 2 - 13, top: Math.min(main.y + main.h - 6, window.innerHeight - 70) }}>
          <i className="ti ti-hand-finger tour-hand-static" />
          <MouseIcon button={currentTask.mouse} />
        </div>
      )}
      {main && missionLive && !main.round && !handBox && !currentTask?.mouse && (
        <i
          className="ti ti-hand-finger tour-hand"
          aria-hidden="true"
          style={{ left: main.x + main.w / 2 - 12, top: Math.min(main.y + main.h - 6, window.innerHeight - 40) }}
        />
      )}

      <div
        key={index}
        ref={cardRef}
        className={`tour-card ${isSheet ? 'tour-sheet' : ''} ${missionDone ? 'tour-card-done' : ''}`}
        style={isSheet ? undefined : { left: cardPos?.left ?? -9999, top: cardPos?.top ?? -9999, width: CARD_W }}
      >
        <div className="tour-cap">
          <span>{capLabel}</span>
          {!isMenu && step.chapter !== 'end' && (
            <span className={`tour-kind tour-kind-${kind}`}>
              <i className={`ti ${kind === 'mission' ? 'ti-target-arrow' : kind === 'explore' ? 'ti-eye' : 'ti-info-circle'}`} aria-hidden="true" />
              {kind === 'mission' ? (tasks.length > 1 ? `Faça · ${Math.min(taskIdx, tasks.length)}/${tasks.length}` : 'Faça') : kind === 'explore' ? 'Explore' : 'Veja'}
            </span>
          )}
        </div>
        <div className="tour-head">
          <i className={`ti ${step.icon} tour-icon`} aria-hidden="true" />
          <h4>{step.title}</h4>
        </div>
        <p>{step.text}</p>

        {step.media === 'daycard' && <DayCardMedia />}

        {kind === 'mission' && tasks.length > 0 && (
          <ol className="tour-tasks">
            {tasks.map((t, k) => (
              <li key={k} className={k < taskIdx ? 'done' : k === taskIdx ? 'now' : ''}>
                <i className={`ti ${k < taskIdx ? 'ti-circle-check' : k === taskIdx ? 'ti-target-arrow' : 'ti-circle'}`} aria-hidden="true" />
                <span>{t.label}</span>
                {k === taskIdx && !missionDone && (
                  <button type="button" className="tour-task-skip" onClick={completeTask} title="Pular esta tarefa">pular</button>
                )}
              </li>
            ))}
          </ol>
        )}
        {leftWarn && (
          <div className="tour-warn"><i className="ti ti-mouse" aria-hidden="true" /><span>Esse foi o botão esquerdo: ele destaca um astro e apaga os outros. Desfiz para você. Use o botão <b>direito</b>.</span></div>
        )}
        {missionDone && (
          <div className="tour-goal ok"><i className="ti ti-circle-check" aria-hidden="true" /><span>{step.hold ? 'Muito bem! Olhe o relógio e siga em "Próximo".' : 'Muito bem!'}</span></div>
        )}
        {step.expert && (
          <div className="tour-expert"><i className="ti ti-school" aria-hidden="true" /><span><b>Para astrólogos:</b> {step.expert}</span></div>
        )}
        {step.goal && kind === 'explore' && (
          <div className="tour-goal tour-goal-explore"><i className="ti ti-eye" aria-hidden="true" /><span>{step.goal}</span></div>
        )}

        {step.pro && isFreeTier && (
          <div className="tour-pro"><i className="ti ti-lock" aria-hidden="true" /> {step.pro}</div>
        )}

        {isMenu ? (
          <div className="tour-menu">
            {TOUR_CHAPTERS.map((c, k) => (
              <button key={c.id} type="button" className={`tour-q tour-q-big ${k === 0 ? 'tour-q-first' : ''}`} onClick={() => startChapter(c.id)} autoFocus={k === 0} style={{ ['--qc' as string]: c.color } as React.CSSProperties}>
                <i className={`ti ${c.icon}`} aria-hidden="true" />
                <span><b>{k + 1}. {c.label}</b><small>{c.sub}</small></span>
                <i className="ti ti-chevron-right tour-q-arrow" aria-hidden="true" />
              </button>
            ))}
            <div className="tour-note">Comece pelo 1 se é a sua primeira vez. Cada passo pede uma coisa só.</div>
            <button type="button" className="tour-skip tour-menu-skip" onClick={() => onClose(false)}>Agora não</button>
          </div>
        ) : (
          <>
            <div className="tour-prog" aria-hidden="true">
              {progressSteps.map(k => <span key={k} className={k < index ? 'd' : k === index ? 'a' : ''} />)}
            </div>
            <div className="tour-btns">
              {isEnd
                ? <button type="button" className="tour-skip" onClick={backToMenu}>Aprender mais</button>
                : <button type="button" className="tour-skip" onClick={() => onClose(false)}>Sair</button>}
              <span>
                <button type="button" className="tour-back" onClick={goBack}>Voltar</button>
                <button
                  type="button"
                  className={`tour-next ${missionLive ? 'tour-next-quiet' : ''}`}
                  onClick={() => (isEnd ? onClose(true) : goNext())}
                  autoFocus={kind === 'info'}
                >
                  {isEnd ? 'Explorar sozinho' : missionLive ? 'Pular passo' : 'Próximo'}
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

/** CSS do tutorial (injetado uma vez). A cor da fase vem de --tc. */
export const ONBOARDING_TOUR_CSS = `
@property --tour-a{syntax:'<angle>';inherits:false;initial-value:0deg}
.tour-root{position:fixed;inset:0;z-index:2147483000;pointer-events:none;--tc:#F5D98A}
.tour-dim{position:fixed;inset:0;background:transparent;pointer-events:auto}
.tour-dim-art{position:fixed;inset:0;pointer-events:none;animation:tour-fade .35s ease-out}
.tour-dim-fill{fill:rgba(4,0,4,.78)}
.tour-block{position:fixed;inset:0;pointer-events:auto;background:transparent}
@keyframes tour-fade{from{opacity:0}to{opacity:1}}
body.tour-open .itt{z-index:2147483100!important}
.tour-ring{position:fixed;padding:2px;pointer-events:none;transition:all .5s cubic-bezier(.65,0,.35,1);
  background:conic-gradient(from var(--tour-a),transparent 0deg,var(--tc) 70deg,#ffffff 110deg,var(--tc) 150deg,transparent 220deg);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;
  animation:tour-spin 2.4s linear infinite;filter:drop-shadow(0 0 6px color-mix(in srgb,var(--tc) 55%,transparent))}
.tour-ring-live{animation:tour-spin 1.1s linear infinite;filter:drop-shadow(0 0 12px color-mix(in srgb,var(--tc) 80%,transparent))}
.tour-ring-soft{position:fixed;pointer-events:none;border:1px dashed color-mix(in srgb,var(--tc) 55%,transparent);transition:all .5s cubic-bezier(.65,0,.35,1)}
@keyframes tour-spin{to{--tour-a:360deg}}
.tour-hand{position:fixed;pointer-events:none;font-size:26px;color:var(--tc);filter:drop-shadow(0 2px 6px rgba(0,0,0,.8));animation:tour-tap 1.1s ease-in-out infinite;z-index:2}
@keyframes tour-tap{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(.92)}}
.tour-card{position:fixed;pointer-events:auto;box-sizing:border-box;background:rgba(10,8,18,.98);border:1px solid color-mix(in srgb,var(--tc) 40%,transparent);
  border-radius:16px;padding:14px 16px 12px;color:#E8E4DA;font-family:'DM Sans',system-ui,sans-serif;max-height:calc(100vh - 20px);overflow-y:auto;
  box-shadow:0 24px 60px -16px rgba(0,0,0,.8),0 0 0 1px rgba(0,0,0,.3);animation:tour-in .32s ease-out;transition:left .45s cubic-bezier(.65,0,.35,1),top .45s cubic-bezier(.65,0,.35,1),border-color .3s}
.tour-card-done{border-color:rgba(74,222,128,.6)}
@keyframes tour-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.tour-sheet{left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));top:auto}
.tour-cap{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11.5px;letter-spacing:.1em;font-weight:700;color:var(--tc)}
.tour-kind{display:inline-flex;align-items:center;gap:4px;letter-spacing:.04em;font-size:12px;padding:3px 9px;border-radius:999px;white-space:nowrap}
.tour-kind-mission{background:color-mix(in srgb,var(--tc) 20%,transparent);color:var(--tc)}
.tour-kind-explore{background:rgba(255,255,255,.08);color:#d6d1c4}
.tour-kind-info{background:rgba(255,255,255,.07);color:#b7b1a5}
.tour-head{display:flex;align-items:center;gap:9px;margin:7px 0 5px}
.tour-head h4{margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:23px;line-height:1.2;color:#F5F2EB}
.tour-icon{font-size:22px;color:var(--tc);animation:tour-bob 1.6s ease-in-out infinite}
@keyframes tour-bob{50%{transform:translateY(-3px)}}
.tour-card p{margin:0;font-size:16px;line-height:1.5;color:#E3DED2}
.tour-tasks{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:4px}
.tour-tasks li{display:flex;align-items:flex-start;gap:8px;font-size:15px;line-height:1.4;padding:7px 9px;border-radius:9px;color:#8e887c;transition:all .25s}
.tour-tasks li i{font-size:18px;margin-top:-1px;flex:0 0 auto}
.tour-tasks li span{flex:1}
.tour-tasks li.done{color:#86efac}
.tour-tasks li.done span{text-decoration:line-through;text-decoration-color:rgba(134,239,172,.5)}
.tour-tasks li.now{color:var(--tc);font-weight:700;background:color-mix(in srgb,var(--tc) 12%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tc) 40%,transparent);animation:tour-glow 1.6s ease-in-out infinite}
.tour-task-skip{background:transparent;border:0;color:#8e887c;font-size:12.5px;font-weight:500;cursor:pointer;padding:0 2px;text-decoration:underline;flex:0 0 auto}
.tour-task-skip:hover{color:#cfc9bd}
.tour-goal{display:flex;align-items:center;gap:8px;margin-top:10px;padding:9px 11px;border-radius:11px;font-size:15px;line-height:1.4;font-weight:700}
.tour-goal i{font-size:18px}
.tour-goal.ok{color:#86efac;background:rgba(74,222,128,.13);border:1px solid rgba(74,222,128,.5);animation:tour-pop .35s ease-out}
.tour-goal-explore{color:#e5e1d6;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);font-weight:600}
.tour-goal-explore i{color:var(--tc)}
@keyframes tour-glow{50%{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tc) 40%,transparent),0 0 0 3px color-mix(in srgb,var(--tc) 12%,transparent)}}
@keyframes tour-pop{0%{transform:scale(.96)}60%{transform:scale(1.03)}100%{transform:scale(1)}}
.tour-pro{margin-top:9px;font-size:13px;color:#b7b1a5;display:flex;align-items:center;gap:5px}
.tour-pro i{color:var(--tc)}
.tour-note{font-size:13px;color:#9b958a;margin-top:4px;line-height:1.4}
.tour-expert{display:flex;gap:7px;align-items:flex-start;margin-top:10px;font-size:13px;line-height:1.4;color:#a8a296}
.tour-expert i{color:var(--tc);font-size:16px;margin-top:1px}.tour-expert b{color:#cfc9bd;font-weight:700}
.tour-q-big{height:auto!important;min-height:58px;padding:9px 11px!important;align-items:center}
.tour-q-big i:first-child{font-size:22px}
.tour-q-big span{display:flex;flex-direction:column;gap:2px}
.tour-q-big b{font-size:15.5px;font-weight:700}
.tour-q-big small{font-size:13px;line-height:1.35;color:#a8a296;font-weight:400}
.tour-q-first{background:color-mix(in srgb,var(--qc) 12%,transparent);border-color:color-mix(in srgb,var(--qc) 50%,transparent)}
.tour-light .tour-q-big small,.tour-light .tour-expert{color:#6b6559}.tour-light .tour-expert b{color:#3b362d}
.tour-prog{display:flex;gap:3px;margin:13px 0 10px}
.tour-prog span{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.1);transition:background .3s}
.tour-prog span.d{background:color-mix(in srgb,var(--tc) 45%,transparent)}.tour-prog span.a{background:var(--tc)}
.tour-btns{display:flex;justify-content:space-between;align-items:center}
.tour-btns button,.tour-menu button{height:36px;border-radius:999px;padding:0 16px;font:600 14px/1 'DM Sans',sans-serif;cursor:pointer}
.tour-skip{background:transparent;border:0;color:#8e887c}.tour-skip:hover{color:#cfc9bd}
.tour-back{background:transparent;border:1px solid rgba(255,255,255,.18);color:#cfc9bd;margin-right:6px}
.tour-next{background:var(--tc);border:0;color:#140f05;font-weight:700}
.tour-next-quiet{background:transparent;border:1px solid rgba(255,255,255,.18);color:#9b958a;font-weight:600}
.tour-next:focus-visible,.tour-back:focus-visible,.tour-q:focus-visible{outline:2px solid var(--tc);outline-offset:2px}
.tour-menu{display:flex;flex-direction:column;gap:6px;margin-top:14px}
.tour-full{height:38px!important;display:flex;align-items:center;justify-content:center;gap:7px;font-size:13.5px!important}
.tour-menu-label{font-size:11px;letter-spacing:.08em;color:#9b958a;margin:8px 0 2px;text-transform:uppercase;font-weight:600}
.tour-q{--qc:var(--tc);display:flex;align-items:center;gap:9px;height:38px!important;border-radius:10px!important;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:#ECE8DE;text-align:left;padding:0 10px!important;font-weight:500!important}
.tour-q:hover{background:color-mix(in srgb,var(--qc) 12%,transparent);border-color:color-mix(in srgb,var(--qc) 45%,transparent)}
.tour-q i{color:var(--qc);font-size:16px}.tour-q span{flex:1}.tour-q-arrow{color:#6d675c!important;font-size:14px!important}
.tour-menu-skip{align-self:center;margin-top:4px}
.tour-media{display:flex;gap:10px;align-items:center;margin-top:12px}
.tour-daycard{width:64px;height:86px;flex:0 0 auto;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:#100d18;
  display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:6px 3px;font-size:10.5px;box-sizing:border-box}
.tour-daycard b{display:flex;gap:3px;align-items:center;font-weight:700}
.tour-sign{color:#60A5FA}
.tour-moon{width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 66% 40%,#f1f5f9 0 40%,#1e1b26 42%)}
.tour-dow{display:flex;gap:3px;align-items:center;font-weight:700;color:#9b958a;letter-spacing:.06em}
.tour-dot{width:9px;height:9px;border-radius:50%;background:#F1F5F9;display:inline-block}
.tour-ann{display:flex;flex-direction:column;gap:13px;font-size:11.5px;color:var(--tc)}
.tour-ann i{margin-right:4px}
.tour-light .tour-card{background:rgba(252,250,245,.99);color:#2a2620}
.tour-light .tour-card p{color:#3b362d}.tour-light .tour-head h4{color:#1d1a15}
.tour-light .tour-back{border-color:rgba(0,0,0,.18);color:#3b362d}
.tour-light .tour-prog span{background:rgba(0,0,0,.1)}
.tour-light .tour-q{background:rgba(0,0,0,.03);border-color:rgba(0,0,0,.1);color:#2a2620}
.tour-light .tour-daycard{background:#fff;border-color:rgba(0,0,0,.12);color:#2a2620}
.tour-light .tour-tasks li{color:#6b6559}
@keyframes tour-help-pulse{0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,.55)}50%{box-shadow:0 0 0 8px rgba(212,175,55,0)}}
.tour-help-pulse{animation:tour-help-pulse 1.8s ease-in-out infinite}
.tour-ring-thin{padding:3px;animation-duration:3.2s}
.tour-ring-glow{position:fixed;pointer-events:none;border-radius:50%;border:1.5px solid rgba(245,217,138,.85);box-shadow:inset 0 0 16px 3px rgba(245,217,138,.45),0 0 10px rgba(245,217,138,.4);transition:all .5s cubic-bezier(.65,0,.35,1)}
.tour-pointer{position:fixed;pointer-events:none;z-index:3;display:flex;align-items:flex-start;gap:6px;animation:tour-tap 1.1s ease-in-out infinite}
.tour-hand-static{font-size:28px;color:var(--tc);filter:drop-shadow(0 2px 6px rgba(0,0,0,.85))}
.tour-mouse{display:flex;flex-direction:column;align-items:center;gap:2px;margin-top:6px;filter:drop-shadow(0 2px 6px rgba(0,0,0,.85))}
.tour-mouse b{font:700 11px/1 'DM Sans',sans-serif;color:var(--tc);background:rgba(10,8,18,.92);padding:3px 6px;border-radius:6px;letter-spacing:.03em}
.tour-mouse-btn{fill:var(--tc);animation:tour-click 1.1s ease-in-out infinite}
@keyframes tour-click{0%,35%{opacity:.25}45%,70%{opacity:1}100%{opacity:.25}}
.tour-warn{display:flex;gap:8px;align-items:flex-start;margin-top:10px;padding:9px 11px;border-radius:11px;font-size:14px;line-height:1.4;color:#fde68a;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.5);animation:tour-pop .35s ease-out}
.tour-warn i{font-size:18px;margin-top:1px}
body[data-tour-glow] [data-tour="zodiac"]>g[data-sign]{opacity:.1!important;transition:opacity 1.3s ease,filter 1.3s ease!important}
body[data-tour-glow="all"] [data-tour="zodiac"]>g[data-sign]{opacity:1!important}
body[data-tour-glow="0"] [data-tour="zodiac"]>g[data-sign="0"]{opacity:1!important}
body[data-tour-glow="0"] [data-tour="zodiac"]>g[data-sign="0"]{filter:drop-shadow(0 0 10px rgba(255,236,170,.95)) brightness(1.35)}
body[data-tour-glow="1"] [data-tour="zodiac"]>g[data-sign="0"],body[data-tour-glow="1"] [data-tour="zodiac"]>g[data-sign="1"]{opacity:1!important}
body[data-tour-glow="1"] [data-tour="zodiac"]>g[data-sign="1"]{filter:drop-shadow(0 0 10px rgba(255,236,170,.95)) brightness(1.35)}
body[data-tour-glow="2"] [data-tour="zodiac"]>g[data-sign="0"],body[data-tour-glow="2"] [data-tour="zodiac"]>g[data-sign="1"],body[data-tour-glow="2"] [data-tour="zodiac"]>g[data-sign="2"]{opacity:1!important}
body[data-tour-glow="2"] [data-tour="zodiac"]>g[data-sign="2"]{filter:drop-shadow(0 0 10px rgba(255,236,170,.95)) brightness(1.35)}
body[data-tour-glow="3"] [data-tour="zodiac"]>g[data-sign="0"],body[data-tour-glow="3"] [data-tour="zodiac"]>g[data-sign="1"],body[data-tour-glow="3"] [data-tour="zodiac"]>g[data-sign="2"],body[data-tour-glow="3"] [data-tour="zodiac"]>g[data-sign="3"]{opacity:1!important}
body[data-tour-glow="3"] [data-tour="zodiac"]>g[data-sign="3"]{filter:drop-shadow(0 0 10px rgba(255,236,170,.95)) brightness(1.35)}
body[data-tour-glow="4"] [data-tour="zodiac"]>g[data-sign="0"],body[data-tour-glow="4"] [data-tour="zodiac"]>g[data-sign="1"],body[data-tour-glow="4"] [data-tour="zodiac"]>g[data-sign="2"],body[data-tour-glow="4"] [data-tour="zodiac"]>g[data-sign="3"],body[data-tour-glow="4"] [data-tour="zodiac"]>g[data-sign="4"]{opacity:1!important}
body[data-tour-glow="4"] [data-tour="zodiac"]>g[data-sign="4"]{filter:drop-shadow(0 0 10px rgba(255,236,170,.95)) brightness(1.35)}
body[data-tour-glow="5"] [data-tour="zodiac"]>g[data-sign="0"],body[data-tour-glow="5"] [data-tour="zodiac"]>g[data-sign="1"],body[data-tour-glow="5"] [data-tour="zodiac"]>g[data-sign="2"],body[data-tour-glow="5"] [data-tour="zodiac"]>g[data-sign="3"],body[data-tour-glow="5"] [data-tour="zodiac"]>g[data-sign="4"],body[data-tour-glow="5"] [data-tour="zodiac"]>g[data-sign="5"]{opacity:1!important}
body[data-tour-glow="5"] [data-tour="zodiac"]>g[data-sign="5"]{filter:drop-shadow(0 0 10px rgba(255,236,170,.95)) brightness(1.35)}
body[data-tour-glow="6"] [data-tour="zodiac"]>g[data-sign="0"],body[data-tour-glow="6"] [data-tour="zodiac"]>g[data-sign="1"],body[data-tour-glow="6"] [data-tour="zodiac"]>g[data-sign="2"],body[data-tour-glow="6"] [data-tour="zodiac"]>g[data-sign="3"],body[data-tour-glow="6"] [data-tour="zodiac"]>g[data-sign="4"],body[data-tour-glow="6"] [data-tour="zodiac"]>g[data-sign="5"],body[data-tour-glow="6"] [data-tour="zodiac"]>g[data-sign="6"]{opacity:1!important}
body[data-tour-glow="6"] [data-tour="zodiac"]>g[data-sign="6"]{filter:drop-shadow(0 0 10px rgba(255,236,170,.95)) brightness(1.35)}
body[data-tour-glow="7"] [data-tour="zodiac"]>g[data-sign="0"],body[data-tour-glow="7"] [data-tour="zodiac"]>g[data-sign="1"],body[data-tour-glow="7"] [data-tour="zodiac"]>g[data-sign="2"],body[data-tour-glow="7"] [data-tour="zodiac"]>g[data-sign="3"],body[data-tour-glow="7"] [data-tour="zodiac"]>g[data-sign="4"],body[data-tour-glow="7"] [data-tour="zodiac"]>g[data-sign="5"],body[data-tour-glow="7"] [data-tour="zodiac"]>g[data-sign="6"],body[data-tour-glow="7"] [data-tour="zodiac"]>g[data-sign="7"]{opacity:1!important}
body[data-tour-glow="7"] [data-tour="zodiac"]>g[data-sign="7"]{filter:drop-shadow(0 0 10px rgba(255,236,170,.95)) brightness(1.35)}
body[data-tour-glow="8"] [data-tour="zodiac"]>g[data-sign="0"],body[data-tour-glow="8"] [data-tour="zodiac"]>g[data-sign="1"],body[data-tour-glow="8"] [data-tour="zodiac"]>g[data-sign="2"],body[data-tour-glow="8"] [data-tour="zodiac"]>g[data-sign="3"],body[data-tour-glow="8"] [data-tour="zodiac"]>g[data-sign="4"],body[data-tour-glow="8"] [data-tour="zodiac"]>g[data-sign="5"],body[data-tour-glow="8"] [data-tour="zodiac"]>g[data-sign="6"],body[data-tour-glow="8"] [data-tour="zodiac"]>g[data-sign="7"],body[data-tour-glow="8"] [data-tour="zodiac"]>g[data-sign="8"]{opacity:1!important}
body[data-tour-glow="8"] [data-tour="zodiac"]>g[data-sign="8"]{filter:drop-shadow(0 0 10px rgba(255,236,170,.95)) brightness(1.35)}
body[data-tour-glow="9"] [data-tour="zodiac"]>g[data-sign="0"],body[data-tour-glow="9"] [data-tour="zodiac"]>g[data-sign="1"],body[data-tour-glow="9"] [data-tour="zodiac"]>g[data-sign="2"],body[data-tour-glow="9"] [data-tour="zodiac"]>g[data-sign="3"],body[data-tour-glow="9"] [data-tour="zodiac"]>g[data-sign="4"],body[data-tour-glow="9"] [data-tour="zodiac"]>g[data-sign="5"],body[data-tour-glow="9"] [data-tour="zodiac"]>g[data-sign="6"],body[data-tour-glow="9"] [data-tour="zodiac"]>g[data-sign="7"],body[data-tour-glow="9"] [data-tour="zodiac"]>g[data-sign="8"],body[data-tour-glow="9"] [data-tour="zodiac"]>g[data-sign="9"]{opacity:1!important}
body[data-tour-glow="9"] [data-tour="zodiac"]>g[data-sign="9"]{filter:drop-shadow(0 0 10px rgba(255,236,170,.95)) brightness(1.35)}
body[data-tour-glow="10"] [data-tour="zodiac"]>g[data-sign="0"],body[data-tour-glow="10"] [data-tour="zodiac"]>g[data-sign="1"],body[data-tour-glow="10"] [data-tour="zodiac"]>g[data-sign="2"],body[data-tour-glow="10"] [data-tour="zodiac"]>g[data-sign="3"],body[data-tour-glow="10"] [data-tour="zodiac"]>g[data-sign="4"],body[data-tour-glow="10"] [data-tour="zodiac"]>g[data-sign="5"],body[data-tour-glow="10"] [data-tour="zodiac"]>g[data-sign="6"],body[data-tour-glow="10"] [data-tour="zodiac"]>g[data-sign="7"],body[data-tour-glow="10"] [data-tour="zodiac"]>g[data-sign="8"],body[data-tour-glow="10"] [data-tour="zodiac"]>g[data-sign="9"],body[data-tour-glow="10"] [data-tour="zodiac"]>g[data-sign="10"]{opacity:1!important}
body[data-tour-glow="10"] [data-tour="zodiac"]>g[data-sign="10"]{filter:drop-shadow(0 0 10px rgba(255,236,170,.95)) brightness(1.35)}
body[data-tour-glow="11"] [data-tour="zodiac"]>g[data-sign="0"],body[data-tour-glow="11"] [data-tour="zodiac"]>g[data-sign="1"],body[data-tour-glow="11"] [data-tour="zodiac"]>g[data-sign="2"],body[data-tour-glow="11"] [data-tour="zodiac"]>g[data-sign="3"],body[data-tour-glow="11"] [data-tour="zodiac"]>g[data-sign="4"],body[data-tour-glow="11"] [data-tour="zodiac"]>g[data-sign="5"],body[data-tour-glow="11"] [data-tour="zodiac"]>g[data-sign="6"],body[data-tour-glow="11"] [data-tour="zodiac"]>g[data-sign="7"],body[data-tour-glow="11"] [data-tour="zodiac"]>g[data-sign="8"],body[data-tour-glow="11"] [data-tour="zodiac"]>g[data-sign="9"],body[data-tour-glow="11"] [data-tour="zodiac"]>g[data-sign="10"],body[data-tour-glow="11"] [data-tour="zodiac"]>g[data-sign="11"]{opacity:1!important}
body[data-tour-glow="11"] [data-tour="zodiac"]>g[data-sign="11"]{filter:drop-shadow(0 0 10px rgba(255,236,170,.95)) brightness(1.35)}
`;
