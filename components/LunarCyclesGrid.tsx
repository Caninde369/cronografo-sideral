/**
 * Calendário de ciclos lunares (versão B aprovada pelo Rafa em 22/11/2026).
 *
 * Estrutura: cada lunação tem 4 linhas, uma por fase (nova, crescente, cheia, minguante).
 * O primeiro dia de cada linha é o dia da fase principal. Sem texto de fase nos dias.
 * Card do dia, de cima para baixo: signo do Sol (glifo + abreviação), data, Lua do dia,
 * glifo do planeta do dia + dia da semana + signo da Lua.
 * Fundo do dia na cor do elemento do signo do Sol (cores do calendário atual).
 * Tocar num dia abre a leitura do dia num pop-up.
 * Usado no calendário (Lunar › Ciclos) e no painel da Lua do celular.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoonPhase } from 'astronomy-engine';
import { getYearCycles, LunarCycle } from '../lib/astrology/lunarCycles';
import { calculateSunTropicalLongitude, calculateMoonTropicalLongitude } from '../lib/astrology/celestialBodies';
import { getTermAt } from '../lib/astrology/terms';
import { getDecanRuler } from '../lib/astrology/dignities';

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
  const [open, setOpen] = useState<{ info: DayInfo; cycle: LunarCycle; row: number; first: boolean } | null>(null);

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
                <small>Ciclo {cycle.index} · {cycle.start.getDate()} {M3[cycle.start.getMonth()]} → {endDay.getDate()} {M3[endDay.getMonth()]}{endDay.getFullYear() !== cycle.start.getFullYear() ? ` ${endDay.getFullYear()}` : ''} · {cycle.totalDays} dias</small>
              </span>
              {isCurrent && <span className="lcy-now">Agora</span>}
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
                        style={{ ['--tint' as any]: EC[s[3]].bg }}
                        aria-disabled={locked || undefined}
                        tabIndex={locked ? -1 : undefined}
                        onClick={(e) => { e.stopPropagation(); if (locked) { onLocked?.(); return; } setOpen({ info, cycle, row: r, first: k === 0 }); }}
                        aria-label={`${info.date.getDate()} de ${MF[info.date.getMonth()]}, Sol em ${s[1]}, Lua em ${ms[1]}`}>
                        <span className="lcy-sg"><i style={{ color: isLight ? EC[s[3]].textL : EC[s[3]].text }}>{s[0]}{VS}</i>{s[2]}</span>
                        <span className="lcy-dt">{info.date.getDate()} {M3[info.date.getMonth()]}</span>
                        <MoonGlyph phase={info.phase} size={18} isLight={isLight} />
                        <span className="lcy-bot"><i>{w[1]}</i>{w[0]}<i style={{ color: isLight ? EC[ms[3]].textL : EC[ms[3]].text }}>{ms[0]}{VS}</i></span>
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
  data: { info: DayInfo; cycle: LunarCycle; row: number; first: boolean };
  isLight: boolean; onClose: () => void; onPick?: (d: Date) => void;
}> = ({ data, isLight, onClose, onPick }) => {
  const { info, cycle, row, first } = data;
  const s = SIGNS[info.sunSign]; const ms = SIGNS[info.moonSign]; const w = WD[info.wd];
  const term = PLANET[getTermAt(info.sun).ruler]; const dec = PLANET[getDecanRuler(info.sun)];
  const phaseName = first ? PHASE_MAIN[row] : phaseLabel(info.phase);
  return (
    <div className={`lcy-pop-wrap ${isLight ? 'is-light' : ''}`} onClick={onClose}>
      <style>{LCY_CSS}</style>
      <div className="lcy-pop" role="dialog" aria-modal="true" aria-label="Leitura do dia" onClick={e => e.stopPropagation()}>
        <div className="lcy-pop-h">
          <div>
            <b>{w[3]}, {info.date.getDate()} de {MF[info.date.getMonth()]}</b>
            <small>{cycle.name} · {info.lunarDay}º dia do ciclo · {info.date.getFullYear()}</small>
          </div>
          <button type="button" className="cs-x" onClick={onClose} aria-label="Fechar"><i className="ti ti-x" aria-hidden="true" /></button>
        </div>
        <dl className="lcy-dl">
          <div><dt>Lua</dt><dd><MoonGlyph phase={info.phase} size={16} isLight={isLight} />{phaseName} · {info.illum}%<small><span className="sy">{ms[0]}{VS}</span>{ms[1]} {deg(info.moon - info.moonSign * 30)} ao meio-dia</small></dd></div>
          <div><dt>Sol</dt><dd><span className="sy">{s[0]}{VS}</span>{s[1]} {deg(info.sun - info.sunSign * 30)}</dd></div>
          <div><dt>Planeta do dia</dt><dd><span className="sy">{w[1]}</span>{w[2]}</dd></div>
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
.lcy-cycle{flex:none;border:1px solid var(--line2);border-radius:16px;overflow:hidden;background:var(--bg);scroll-margin:12px}
.lcy-cycle.is-cur{border-color:color-mix(in srgb,var(--fg) 40%,transparent)}
.lcy-cycle.is-locked{cursor:pointer}
.lcy-cycle.is-locked .lcy-rows{filter:blur(3px);opacity:.35}
.lcy-h{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line)}
.lcy-em{font-size:18px;line-height:1}
.lcy-t{flex:1;min-width:0}
.lcy-t b{display:block;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:21px;line-height:1.05;color:var(--hi)}
.lcy-t small{display:block;margin-top:2px;font:11px 'DM Mono',ui-monospace,monospace;color:var(--dim)}
.lcy-now{font:600 9px 'DM Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--hi);border:1px solid var(--line3);border-radius:999px;padding:4px 8px}
.lcy-lock{font:700 9px 'DM Sans',sans-serif;color:#D4AF37;border:1px solid rgba(212,175,55,.35);border-radius:999px;padding:3px 7px}
.lcy-rows{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:3px;padding:3px}
.lcy-blank{display:block}
.lcy-d{position:relative;height:100px;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:9px 2px 9px;border:0;border-radius:4px;background:linear-gradient(var(--tint),var(--tint)),var(--bg);color:var(--fg);font-family:'DM Sans',sans-serif;cursor:pointer;transition:none}
.lcy-d.is-phase{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--fg) 42%,transparent)}
.lcy-d.is-sel{box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--fg) 70%,transparent)}
.lcy-d.is-today{box-shadow:inset 0 0 0 2px var(--fg)}
.lcy-d.is-found{box-shadow:inset 0 0 0 2px var(--fg),0 0 0 3px color-mix(in srgb,var(--fg) 35%,transparent)}
.lcy-d:focus-visible{outline:2px solid var(--fg);outline-offset:1px}
.lcy-sg{display:flex;align-items:center;gap:4px;font:600 10px 'DM Sans',sans-serif;letter-spacing:.04em;color:color-mix(in srgb,var(--fg) 88%,transparent);line-height:1}
.lcy-sg i,.lcy-bot i,.lcy-dl .sy{font-style:normal;font-family:'Noto Sans Symbols 2','Segoe UI Symbol','Apple Symbols',serif}
.lcy-sg i{font-size:14px}
.lcy-dt{font:500 13px 'DM Mono',ui-monospace,monospace;color:var(--hi);line-height:1;white-space:nowrap}
.lcy-bot{display:flex;align-items:center;gap:4px;font:600 9.5px 'DM Sans',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:color-mix(in srgb,var(--fg) 85%,transparent);line-height:1}
.lcy-bot i{font-size:14px;color:var(--hi);letter-spacing:0}
/* celular: 8 dias por linha numa tela estreita */
body.is-mobile .lcy-rows{gap:2px;padding:2px}
body.is-mobile .lcy-d{height:80px;padding:6px 0 6px}
body.is-mobile .lcy-sg{font-size:7.5px;gap:2px}
body.is-mobile .lcy-sg i{font-size:10px}
body.is-mobile .lcy-dt{font-size:9.5px}
body.is-mobile .lcy-d svg{width:15px;height:15px}
body.is-mobile .lcy-bot{font-size:7px;gap:1px;letter-spacing:0}
body.is-mobile .lcy-bot i{font-size:10px}
body.is-mobile .lcy-h{padding:9px 10px}
body.is-mobile .lcy-t b{font-size:19px}
.lcy-today{height:32px;display:inline-flex;align-items:center;gap:6px;padding:0 13px 0 11px;border-radius:999px;border:1px solid rgba(160,154,168,.45);background:rgba(10,7,12,.85);color:inherit;font:600 11px 'DM Sans',sans-serif;letter-spacing:.06em;cursor:pointer}
.lcy-today:hover{border-color:currentColor}
.lcy-search{position:relative;overflow:hidden}
.lcy-search input{position:absolute;inset:0;width:100%;height:100%;opacity:0;border:0;padding:0;margin:0;cursor:pointer;-webkit-appearance:none;appearance:none;font-size:16px;color-scheme:dark}
.lcy-today i{font-size:15px}
/* pop-up do dia */
.lcy-pop-wrap{position:fixed;inset:0;z-index:12000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.55);--fg:#EDE9E3;--hi:#FAF6EE;--mut:#B9B4BE;--dim:#8a8590;--line:#221d27;--line2:#2a2430;--line3:#3a3340;--card:#0a070c}
.lcy-pop-wrap.is-light{--fg:#231714;--hi:#140c0a;--mut:#4b4038;--dim:#6b6253;--line:rgba(35,23,20,.12);--line2:rgba(35,23,20,.18);--line3:rgba(35,23,20,.28);--card:#fbf9f4;background:rgba(20,12,10,.35)}
.lcy-pop{width:100%;max-width:380px;border-radius:20px;border:1px solid var(--line2);background:var(--card);padding:16px;box-shadow:0 24px 60px -16px rgba(0,0,0,.9);font-family:'DM Sans',system-ui,sans-serif;color:var(--fg)}
.lcy-pop-h{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.lcy-pop-h b{display:block;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:23px;line-height:1.1;color:var(--hi)}
.lcy-pop-h small{display:block;margin-top:4px;font-size:11.5px;color:var(--dim)}
.lcy-dl{margin:10px 0 0}
.lcy-dl>div{display:grid;grid-template-columns:110px 1fr;gap:8px;align-items:baseline;padding:9px 0;border-top:1px solid var(--line)}
.lcy-dl dt{font:600 9.5px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
.lcy-dl dd{margin:0;font-size:14px;color:var(--hi);display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.lcy-dl dd small{flex-basis:100%;font-size:12px;color:var(--mut);display:flex;align-items:center;gap:5px}
.lcy-dl .sy{font-size:16px;color:var(--fg);width:18px;text-align:center}
.lcy-go{width:100%;height:44px;margin-top:10px;border-radius:14px;border:1px solid var(--line3);background:none;color:var(--fg);font:600 13px 'DM Sans',sans-serif;cursor:pointer}
.lcy-go:hover{border-color:var(--fg)}
`;

export default LunarCyclesGrid;
