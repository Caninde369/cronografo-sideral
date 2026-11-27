/**
 * Calendário de ciclos lunares (versão B aprovada pelo Rafa em 22/11/2026).
 *
 * Estrutura: cada lunação tem 4 linhas, uma por fase (nova, crescente, cheia, minguante).
 * O primeiro dia de cada linha é o dia da fase principal. Sem texto de fase nos dias.
 * Card do dia (aprovado em 27/11/2026): topo = dia + mês (serifa) e glifo do signo solar à direita;
 * centro = a Lua (foco) com selinho do signo da Lua; rodapé = dia da semana abreviado + glifo do planeta do dia.
 * Fundo do dia: tinta sutil da cor do elemento do signo do Sol. Entrada de fase (1º dia de cada linha) = anel na Lua.
 * Hoje = borda branca + selo "hoje". Tocar num dia abre a leitura num popover junto ao dia.
 * Usado no calendário (Lunar › Ciclos) e no painel da Lua do celular.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoonPhase } from 'astronomy-engine';
import { getYearCycles, LunarCycle } from '../lib/astrology/lunarCycles';
import { calculateSunTropicalLongitude, calculateMoonTropicalLongitude } from '../lib/astrology/celestialBodies';
import { getTermAt } from '../lib/astrology/terms';
import { getDecanRuler } from '../lib/astrology/dignities';
import { CelestialGlyphSvg } from './chart/CelestialGlyphSvg';

const WD_PLANET = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];
/* cores de identidade dos elementos */
const EL = { fire: '#F54E42', earth: '#4ADE80', air: '#D6F3FF', water: '#34D9EF' } as const;
const ELL = { fire: '#B91C1C', earth: '#047857', air: '#4B5563', water: '#0E7490' } as const;

const M3 = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MF = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WD: Array<[string, string, string, string]> = [
  ['dom', '☉', 'Sol', 'Domingo'], ['seg', '☽', 'Lua', 'Segunda'], ['ter', '♂', 'Marte', 'Terça'], ['qua', '☿', 'Mercúrio', 'Quarta'],
  ['qui', '♃', 'Júpiter', 'Quinta'], ['sex', '♀', 'Vênus', 'Sexta'], ['sáb', '♄', 'Saturno', 'Sábado'],
];
const SIGNS: Array<[string, string, string, 'fire' | 'earth' | 'air' | 'water']> = [
  ['♈', 'Áries', 'ÁRI', 'fire'], ['♉', 'Touro', 'TOU', 'earth'], ['♊', 'Gêmeos', 'GÊM', 'air'], ['♋', 'Câncer', 'CÂN', 'water'],
  ['♌', 'Leão', 'LEÃ', 'fire'], ['♍', 'Virgem', 'VIR', 'earth'], ['♎', 'Libra', 'LIB', 'air'], ['♏', 'Escorpião', 'ESC', 'water'],
  ['♐', 'Sagitário', 'SAG', 'fire'], ['♑', 'Capricórnio', 'CAP', 'earth'], ['♒', 'Aquário', 'AQU', 'air'], ['♓', 'Peixes', 'PEI', 'water'],
];
/* cores do calendário atual (ELEMENT_COLORS do CalendarPanel) */
const EC = {
  fire: { bg: 'rgba(239,68,68,0.28)', text: '#FCA5A5', textL: '#B91C1C' },
  earth: { bg: 'rgba(52,211,153,0.28)', text: '#6EE7B7', textL: '#047857' },
  air: { bg: 'rgba(254,243,199,0.22)', text: '#FDE68A', textL: '#92400E' },
  water: { bg: 'rgba(96,165,250,0.28)', text: '#93C5FD', textL: '#1D4ED8' },
};
const PLANET: Record<string, [string, string]> = {
  sun: ['☉', 'Sol'], moon: ['☽', 'Lua'], mars: ['♂', 'Marte'], mercury: ['☿', 'Mercúrio'],
  jupiter: ['♃', 'Júpiter'], venus: ['♀', 'Vênus'], saturn: ['♄', 'Saturno'],
};
const PHASE_MAIN = ['Lua nova', 'Quarto crescente', 'Lua cheia', 'Quarto minguante'];
const VS = '︎';

const deg = (x: number) => { const g = Math.floor(x); const m = Math.floor((x - g) * 60); return `${g}°${String(m).padStart(2, '0')}′`; };
const noon = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

interface DayInfo {
  date: Date; sun: number; moon: number; phase: number; illum: number;
  sunSign: number; moonSign: number; wd: number; lunarDay: number;
}
const dayInfo = (date: Date, lunarDay: number): DayInfo => {
  const t = noon(date);
  const sun = calculateSunTropicalLongitude(t);
  const moon = calculateMoonTropicalLongitude(t);
  const phase = ((MoonPhase(t) % 360) + 360) % 360 / 360;
  return {
    date: t, sun, moon, phase, illum: Math.round((1 - Math.cos(2 * Math.PI * phase)) / 2 * 100),
    sunSign: Math.floor(sun / 30) % 12, moonSign: Math.floor(moon / 30) % 12, wd: t.getDay(), lunarDay,
  };
};

const phaseLabel = (phase: number) => {
  if (phase < 0.03 || phase > 0.97) return 'Lua nova';
  if (phase < 0.22) return 'Crescente';
  if (phase < 0.28) return 'Quarto crescente';
  if (phase < 0.47) return 'Gibosa crescente';
  if (phase < 0.53) return 'Lua cheia';
  if (phase < 0.72) return 'Gibosa minguante';
  if (phase < 0.78) return 'Quarto minguante';
  return 'Minguante';
};

/** Lua desenhada (mesma geometria do MoonPhaseDisk, sem gradiente: leve e nítida). */
const MoonGlyph: React.FC<{ phase: number; size: number; isLight: boolean }> = ({ phase, size, isLight }) => {
  const r = size / 2 - 0.6;
  const f = ((phase % 1) + 1) % 1;
  const k = Math.cos(2 * Math.PI * f);
  const rx = Math.abs(k * r).toFixed(2);
  const lit = f < 0.5
    ? `M0,${-r} A${r},${r} 0 0 1 0,${r} A${rx},${r} 0 0 ${k > 0 ? 0 : 1} 0,${-r}`
    : `M0,${-r} A${r},${r} 0 0 0 0,${r} A${rx},${r} 0 0 ${k > 0 ? 1 : 0} 0,${-r}`;
  const full = f > 0.485 && f < 0.515;
  const none = f < 0.015 || f > 0.985;
  return (
    <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} aria-hidden="true" style={{ display: 'block', flex: 'none' }}>
      <circle r={r} fill={isLight ? '#3a3340' : '#120f16'} stroke={isLight ? 'rgba(35,23,20,.45)' : 'rgba(237,233,227,.38)'} strokeWidth={0.7} />
      {!none && (full ? <circle r={r} fill="#EDE9E3" /> : <path d={lit} fill="#EDE9E3" />)}
    </svg>
  );
};

interface Props {
  year: number;
  latitude?: number;
  isLight?: boolean;
  /** data marcada (contorno) — em geral a data do relógio */
  selected?: Date | null;
  /** "Ir para este dia no relógio" */
  onPickDate?: (d: Date) => void;
  /** plano gratuito: só o ciclo vigente aberto */
  isFreeTier?: boolean;
  onLocked?: () => void;
  /** a cada mudança, rola até hoje e centraliza */
  todaySignal?: number;
  /** rola até o ciclo de hoje ao montar */
  scrollOnMount?: boolean;
  /** busca por data: rola até o dia e marca (sig muda a cada busca) */
  focus?: { date: Date; sig: number } | null;
}

export const LunarCyclesGrid: React.FC<Props> = ({ year, latitude = 0, isLight = false, selected, onPickDate, isFreeTier, onLocked, todaySignal, scrollOnMount = true, focus }) => {
  const cycles = useMemo<LunarCycle[]>(() => getYearCycles(year, latitude), [year, latitude]);
  const today = useMemo(() => noon(new Date()), []);
  const todayRef = useRef<HTMLButtonElement | null>(null);
  const curRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState<{ info: DayInfo; cycle: LunarCycle; row: number; first: boolean; rect: DOMRect } | null>(null);

  const scrollToToday = (smooth: boolean) => {
    const el = todayRef.current || curRef.current;
    if (el) el.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' });
  };
  useEffect(() => { if (scrollOnMount) requestAnimationFrame(() => scrollToToday(false)); /* eslint-disable-next-line */ }, [year]);
  useEffect(() => { if (todaySignal) scrollToToday(true); /* eslint-disable-next-line */ }, [todaySignal]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [found, setFound] = useState<string | null>(null);
  useEffect(() => {
    if (!focus) return;
    const key = `${focus.date.getFullYear()}-${focus.date.getMonth()}-${focus.date.getDate()}`;
    setFound(key);
    const t = window.setTimeout(() => {
      const el = rootRef.current?.querySelector(`[data-day="${key}"]`) as HTMLElement | null;
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 120);
    const t2 = window.setTimeout(() => setFound(null), 4000);
    return () => { window.clearTimeout(t); window.clearTimeout(t2); };
  }, [focus?.sig]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);

  return (
    <div ref={rootRef} className={`lcy ${isLight ? 'is-light' : ''}`}>
      <style>{LCY_CSS}</style>
      {cycles.map((cycle, ci) => {
        const next = cycles[ci + 1];
        const isCurrent = today >= cycle.start && (next ? today < next.start : today < cycle.nextStart);
        const locked = !!isFreeTier && !isCurrent;
        const endDay = new Date(cycle.nextStart); endDay.setDate(endDay.getDate() - 1);
        return (
          <section key={ci} ref={isCurrent ? curRef : undefined} data-tour={isCurrent ? 'cycle' : undefined}
            className={`lcy-cycle ${isCurrent ? 'is-cur' : ''} ${locked ? 'is-locked' : ''}`}
            onClick={locked ? () => onLocked?.() : undefined}>
            <header className="lcy-h">
              <span className="lcy-em" aria-hidden="true">{cycle.emoji}</span>
              <span className="lcy-t">
                <b>{cycle.name}</b>
                <small>{cycle.start.getDate()} {M3[cycle.start.getMonth()]} → {endDay.getDate()} {M3[endDay.getMonth()]}{endDay.getFullYear() !== cycle.start.getFullYear() ? ` ${endDay.getFullYear()}` : ''}</small>
              </span>
              {locked && <span className="lcy-lock"><i className="ti ti-lock" aria-hidden="true" /> PRO</span>}
            </header>
            <div className="lcy-rows" aria-hidden={locked || undefined}>
              {cycle.phases.map((ph, r) => (
                <React.Fragment key={r}>
                  {Array.from({ length: 8 }, (_, k) => {
                    const lunarDay = ph.days[k];
                    if (lunarDay === undefined) return <span key={k} className="lcy-blank" />;
                    const date = new Date(cycle.start); date.setDate(cycle.start.getDate() + lunarDay - 1);
                    const info = dayInfo(date, lunarDay);
                    const s = SIGNS[info.sunSign]; const ms = SIGNS[info.moonSign]; const w = WD[info.wd];
                    const isToday = sameDay(info.date, today);
                    const isSel = !!selected && sameDay(info.date, selected);
                    return (
                      <button key={k} type="button" ref={isToday ? todayRef : undefined}
                        data-day={`${info.date.getFullYear()}-${info.date.getMonth()}-${info.date.getDate()}`}
                        className={`lcy-d ${k === 0 ? 'is-phase' : ''} ${isToday ? 'is-today' : ''} ${isSel ? 'is-sel' : ''} ${found === `${info.date.getFullYear()}-${info.date.getMonth()}-${info.date.getDate()}` ? 'is-found' : ''}`}
                        style={{ ['--el' as any]: EL[s[3]], ['--elt' as any]: isLight ? ELL[s[3]] : EL[s[3]] }}
                        aria-disabled={locked || undefined}
                        tabIndex={locked ? -1 : undefined}
                        onClick={(e) => { e.stopPropagation(); if (locked) { onLocked?.(); return; } setOpen({ info, cycle, row: r, first: k === 0, rect: e.currentTarget.getBoundingClientRect() }); }}
                        aria-label={`${info.date.getDate()} de ${MF[info.date.getMonth()]}${k === 0 ? `, entrada da ${PHASE_MAIN[r]}` : ''}, Sol em ${s[1]}, Lua em ${ms[1]}${isToday ? ', hoje' : ''}`}>
                        {isToday && <span className="lcy-tag">hoje</span>}
                        <span className="lcy-top">
                          <span className="lcy-n">{info.date.getDate()}<small>{M3[info.date.getMonth()]}</small></span>
                          <i className="lcy-ss">{s[0]}{VS}</i>
                        </span>
                        <span className="lcy-mo">
                          <MoonGlyph phase={info.phase} size={36} isLight={isLight} />
                          <i className="lcy-ms" style={{ color: isLight ? ELL[ms[3]] : EL[ms[3]] }}>{ms[0]}{VS}</i>
                        </span>
                        <span className="lcy-bot"><span>{w[0]}</span><CelestialGlyphSvg bodyId={WD_PLANET[info.wd]} size={13} /></span>
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </section>
        );
      })}

      {open && typeof document !== 'undefined' && createPortal(
        <DayPopup data={open} isLight={isLight} onClose={() => setOpen(null)}
          onPick={onPickDate ? (d) => { setOpen(null); onPickDate(d); } : undefined} />,
        document.body,
      )}
    </div>
  );
};

const DayPopup: React.FC<{
  data: { info: DayInfo; cycle: LunarCycle; row: number; first: boolean; rect: DOMRect };
  isLight: boolean; onClose: () => void; onPick?: (d: Date) => void;
}> = ({ data, isLight, onClose, onPick }) => {
  const { info, cycle, row, first, rect } = data;
  const popRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  React.useLayoutEffect(() => {
    const el = popRef.current; if (!el) return;
    const vw = window.innerWidth, vh = window.innerHeight, w = el.offsetWidth, h = el.offsetHeight;
    const left = Math.max(12, Math.min(rect.left + rect.width / 2 - w / 2, vw - w - 12));
    let top = rect.bottom + 8;
    if (top + h > vh - 12) top = rect.top - h - 8;
    if (top < 12) top = Math.max(12, Math.min(vh - h - 12, rect.bottom + 8));
    setPos({ left, top });
  }, [rect]);
  const s = SIGNS[info.sunSign]; const ms = SIGNS[info.moonSign]; const w = WD[info.wd];
  const term = PLANET[getTermAt(info.sun).ruler]; const dec = PLANET[getDecanRuler(info.sun)];
  const phaseName = first ? PHASE_MAIN[row] : phaseLabel(info.phase);
  return (
    <div className={`lcy-pop-wrap ${isLight ? 'is-light' : ''}`} onClick={onClose}>
      <style>{LCY_CSS}</style>
      <div ref={popRef} className="lcy-pop" role="dialog" aria-modal="true" aria-label="Leitura do dia" onClick={e => e.stopPropagation()}
        style={pos ? { left: pos.left, top: pos.top } : { left: -9999, top: 0 }}>
        <div className="lcy-pop-h">
          <div>
            <b>{w[3]}, {info.date.getDate()} de {MF[info.date.getMonth()]}</b>
            <small>{cycle.name} · {info.lunarDay}º dia do ciclo · {info.date.getFullYear()}</small>
          </div>
          <button type="button" className="cs-x" onClick={onClose} aria-label="Fechar"><i className="ti ti-x" aria-hidden="true" /></button>
        </div>
        <dl className="lcy-dl">
          <div><dt>Lua</dt><dd><MoonGlyph phase={info.phase} size={16} isLight={isLight} />{first ? <b className="lcy-ent">Entrada da {phaseName}</b> : phaseName} · {info.illum}%<small><span className="sy">{ms[0]}{VS}</span>{ms[1]} {deg(info.moon - info.moonSign * 30)} ao meio-dia</small></dd></div>
          <div><dt>Sol</dt><dd><span className="sy">{s[0]}{VS}</span>{s[1]} {deg(info.sun - info.sunSign * 30)}</dd></div>
          <div><dt>Planeta do dia</dt><dd><span className="sy"><CelestialGlyphSvg bodyId={WD_PLANET[info.wd]} size={14} /></span>{w[2]}</dd></div>
          <div><dt>Termo</dt><dd><span className="sy">{term[0]}</span>{term[1]}</dd></div>
          <div><dt>Decanato</dt><dd><span className="sy">{dec[0]}</span>{dec[1]}</dd></div>
        </dl>
        {onPick && <button type="button" className="lcy-go" onClick={() => onPick(info.date)}>Ir para este dia no relógio</button>}
      </div>
    </div>
  );
};

export const LCY_CSS = `
.lcy{--fg:#EDE9E3;--hi:#FAF6EE;--mut:#B9B4BE;--dim:#8a8590;--line:#221d27;--line2:#2a2430;--line3:#3a3340;--card:#0a070c;--bg:#040004;display:flex;flex-direction:column;gap:12px;font-family:'DM Sans',system-ui,sans-serif}
.lcy.is-light{--fg:#231714;--hi:#140c0a;--mut:#4b4038;--dim:#6b6253;--line:rgba(35,23,20,.12);--line2:rgba(35,23,20,.18);--line3:rgba(35,23,20,.28);--card:#fbf9f4;--bg:#fff}
.lcy-cycle{flex:none;border:1px solid var(--line2);border-radius:16px;overflow:visible;background:var(--bg);scroll-margin:12px}
.lcy-cycle.is-cur{border-color:color-mix(in srgb,var(--fg) 40%,transparent)}
.lcy-cycle.is-locked{cursor:pointer}
.lcy-cycle.is-locked .lcy-rows{filter:blur(3px);opacity:.35}
.lcy-h{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line)}
.lcy-em{font-size:18px;line-height:1}
.lcy-t{flex:1;min-width:0}
.lcy-t b{display:block;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:600;font-size:24px;line-height:1.05;color:var(--hi)}
.lcy-t{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.lcy-t small{display:block;font:italic 500 15px 'Cormorant Garamond',Georgia,serif;color:var(--dim)}
.lcy-now{font:600 9px 'DM Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--hi);border:1px solid var(--line3);border-radius:999px;padding:4px 8px}
.lcy-lock{font:700 9px 'DM Sans',sans-serif;color:#D4AF37;border:1px solid rgba(212,175,55,.35);border-radius:999px;padding:3px 7px}
.lcy-rows{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:7px 5px;padding:9px 6px 6px}
.lcy-blank{display:block}
.lcy-d{--el:#888;position:relative;height:102px;min-width:0;display:flex;flex-direction:column;align-items:center;padding:6px 7px 7px;border:1px solid color-mix(in srgb,var(--el) 18%,var(--line));border-radius:4px;background:color-mix(in srgb,var(--el) 11%,var(--bg));color:var(--fg);font-family:'DM Sans',sans-serif;cursor:pointer;transition:none}
.lcy.is-light .lcy-d{background:color-mix(in srgb,var(--el) 13%,#fff);border-color:color-mix(in srgb,var(--el) 28%,var(--line))}
.lcy-d.is-sel{border-color:color-mix(in srgb,var(--fg) 60%,transparent)}
.lcy-d.is-today{border:1.5px solid var(--hi);box-shadow:0 0 0 2px var(--bg),0 0 0 3px color-mix(in srgb,var(--hi) 35%,transparent)}
.lcy-d.is-found{box-shadow:0 0 0 2px var(--fg)}
.lcy-d:focus-visible{outline:2px solid var(--fg);outline-offset:1px}
.lcy-tag{position:absolute;top:-8px;left:50%;transform:translateX(-50%);z-index:2;background:var(--hi);color:var(--bg);font:700 7.5px/1 'DM Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;padding:2.5px 5px;border-radius:3px}
.lcy-top{width:100%;display:flex;align-items:baseline;gap:3px}
.lcy-n{display:flex;align-items:baseline;gap:3px;font:600 16px/1 'Cormorant Infant','Cormorant Garamond',Georgia,serif;color:var(--hi)}
.lcy-n small{font:italic 500 12px/1 'Cormorant Garamond',Georgia,serif;color:var(--mut)}
.lcy-ss,.lcy-ms,.lcy-dl .sy{font-style:normal;font-family:'Noto Sans Symbols 2','Segoe UI Symbol','Apple Symbols',serif;font-variant-emoji:text}
.lcy-ss{margin-left:auto;font-size:12px;line-height:1;color:var(--elt);font-weight:700}
.lcy-mo{position:relative;margin:6px 0 0;flex:none}
.lcy-ms{position:absolute;right:-8px;bottom:-4px;z-index:1;width:17px;height:17px;border-radius:50%;background:var(--bg);border:1px solid var(--line3);font-size:10px;line-height:15px;text-align:center;font-weight:700}
.lcy-d.is-phase .lcy-mo::before{content:"";position:absolute;inset:-4px;border-radius:50%;border:1px solid var(--fg);opacity:.85}
.lcy-bot{margin-top:auto;width:100%;display:flex;justify-content:space-between;align-items:center;font:italic 500 13px/1 'Cormorant Garamond',Georgia,serif;color:var(--mut)}
.lcy-bot svg{color:var(--fg)}
/* celular: 8 dias por linha numa tela estreita */
body.is-mobile .lcy-rows{gap:7px 3px;padding:9px 3px 4px}
body.is-mobile .lcy-d{height:90px;padding:4px 3px 4px}
body.is-mobile .lcy-top{align-items:flex-start;justify-content:space-between}
body.is-mobile .lcy-n{flex-direction:column;gap:0;font-size:14px}
body.is-mobile .lcy-n small{font-size:9.5px;line-height:1.1}
body.is-mobile .lcy-ss{font-size:9.5px;margin-left:0}
body.is-mobile .lcy-mo{margin-top:3px}
body.is-mobile .lcy-mo svg{width:26px;height:26px}
body.is-mobile .lcy-ms{width:14px;height:14px;font-size:8.5px;line-height:12px;right:-7px}
body.is-mobile .lcy-bot{font-size:10.5px}
body.is-mobile .lcy-bot svg{width:10px;height:10px}
body.is-mobile .lcy-tag{font-size:6.5px;padding:2px 4px;top:-7px}
body.is-mobile .lcy-h{padding:9px 10px}
body.is-mobile .lcy-t b{font-size:19px}
.lcy-today{height:32px;display:inline-flex;align-items:center;gap:6px;padding:0 13px 0 11px;border-radius:999px;border:1px solid rgba(160,154,168,.45);background:rgba(10,7,12,.85);color:inherit;font:600 11px 'DM Sans',sans-serif;letter-spacing:.06em;cursor:pointer}
.lcy-today:hover{border-color:currentColor}
.lcy-search{position:relative;overflow:hidden}
.lcy-search input{position:absolute;inset:0;width:100%;height:100%;opacity:0;border:0;padding:0;margin:0;cursor:pointer;-webkit-appearance:none;appearance:none;font-size:16px;color-scheme:dark}
.lcy-today i{font-size:15px}
/* pop-up do dia */
.lcy-pop-wrap{position:fixed;inset:0;z-index:12000;background:transparent;--fg:#EDE9E3;--hi:#FAF6EE;--mut:#B9B4BE;--dim:#8a8590;--line:#221d27;--line2:#2a2430;--line3:#3a3340;--card:#0a070c}
.lcy-pop-wrap.is-light{--fg:#231714;--hi:#140c0a;--mut:#4b4038;--dim:#6b6253;--line:rgba(35,23,20,.12);--line2:rgba(35,23,20,.18);--line3:rgba(35,23,20,.28);--card:#fbf9f4;background:transparent}
.lcy-pop{position:fixed;width:min(360px,calc(100vw - 24px));border-radius:20px;border:1px solid var(--line2);background:var(--card);padding:16px;box-shadow:0 24px 60px -16px rgba(0,0,0,.9);font-family:'DM Sans',system-ui,sans-serif;color:var(--fg)}
.lcy-pop-h{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.lcy-pop-h b{display:block;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:23px;line-height:1.1;color:var(--hi)}
.lcy-pop-h small{display:block;margin-top:4px;font-size:11.5px;color:var(--dim)}
.lcy-dl{margin:10px 0 0}
.lcy-dl>div{display:grid;grid-template-columns:110px 1fr;gap:8px;align-items:baseline;padding:9px 0;border-top:1px solid var(--line)}
.lcy-dl dt{font:600 9.5px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
.lcy-dl dd{margin:0;font-size:14px;color:var(--hi);display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.lcy-dl dd small{flex-basis:100%;font-size:12px;color:var(--mut);display:flex;align-items:center;gap:5px}
.lcy-dl .sy{font-size:16px;color:var(--fg);width:18px;text-align:center;display:inline-flex;justify-content:center}
.lcy-ent{font-weight:600;color:var(--hi)}
.lcy-go{width:100%;height:44px;margin-top:10px;border-radius:14px;border:1px solid var(--line3);background:none;color:var(--fg);font:600 13px 'DM Sans',sans-serif;cursor:pointer}
.lcy-go:hover{border-color:var(--fg)}
`;

export default LunarCyclesGrid;
