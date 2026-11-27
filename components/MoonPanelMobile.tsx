/**
 * Aba Lua do celular (aprovada pelo Rafa em 22/11/2026, versão B do calendário).
 * Gaveta de tela cheia logo abaixo do logo. Topo enxuto (27/11/2026): Lua, fase, etiqueta do signo na cor
 * do elemento + casa, uma linha com % · nasce · põe. Controles: ‹ ano › · Hoje · busca · Outros (inclui eclipse).
 * Ciclos lunares em rolagem vertical com encaixe: cada lunação aparece inteira (boa para print).
 */
import React, { useMemo, useState } from 'react';
import { getMoonPhaseInfo } from '../lib/astrology/moon';
import { getMoonAge } from '../lib/astrology/calendars';
import { getUpcomingEclipse } from '../lib/astrology/eclipses';
import { getYearCycleStart } from '../lib/astrology/lunarCycles';
import { LunarCyclesGrid } from './LunarCyclesGrid';

const SIGNS = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'];
const GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const M3 = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const p2 = (n: number) => String(n).padStart(2, '0');
const EL_COLOR = ['#F54E42', '#4ADE80', '#D6F3FF', '#34D9EF']; // fogo, terra, ar, água
const EL_COLOR_L = ['#B91C1C', '#047857', '#4B5563', '#0E7490'];

interface Props {
  currentDate: Date;
  locationName?: string;
  latitude?: number;
  moonPhase: number;              // 0..1
  moonIllumination: number;       // 0..1
  moonLongitude: number;          // no zodíaco do app
  moonHouse?: number;
  moonriseTime: string;
  moonsetTime: string;
  isLight?: boolean;
  isFreeTier?: boolean;
  onClose: () => void;
  onPickDate: (d: Date) => void;
  onOpenEclipses?: () => void;
  onOpenPaymentPlans?: () => void;
  onOpenCalendar?: (view: 'monthly' | 'annual' | 'solar' | 'month' | 'year') => void;
}

export const MoonPanelMobile: React.FC<Props> = (p) => {
  const cycleYearOf = (d: Date) => (d < getYearCycleStart(d.getFullYear()) ? d.getFullYear() - 1 : d.getFullYear());
  const [year, setYear] = useState(() => cycleYearOf(new Date()));
  const [todaySig, setTodaySig] = useState(0);
  const [focus, setFocus] = useState<{ date: Date; sig: number } | null>(null);
  const goToDate = (v: string) => {
    const [yy, mm, dd] = v.split('-').map(Number);
    if (!yy || !mm || !dd) return;
    const dt = new Date(yy, mm - 1, dd, 12);
    const cy = cycleYearOf(dt);
    if (cy !== year) { if (p.isFreeTier) { p.onOpenPaymentPlans?.(); return; } setYear(cy); }
    setFocus(f => ({ date: dt, sig: (f?.sig ?? 0) + 1 }));
  };
  const [more, setMore] = useState(false);

  const info = getMoonPhaseInfo(p.moonPhase);
  const age = Math.max(1, Math.min(30, Math.round(getMoonAge(p.moonPhase)) || 1));
  const lon = ((p.moonLongitude % 360) + 360) % 360;
  const si = Math.floor(lon / 30) % 12;
  const dg = lon - si * 30;
  const degTxt = `${Math.floor(dg)}°${p2(Math.floor((dg % 1) * 60))}′`;
  const eclipse = useMemo(() => { try { return getUpcomingEclipse(p.currentDate); } catch { return null; } }, [p.currentDate]);
  const d = p.currentDate;

  return (
    <div className={`mlp ${p.isLight ? 'is-light' : ''}`} role="dialog" aria-label="Lua" data-tour="calendar-panel">
      <style>{MLP_CSS}</style>
      <div className="mlp-grab" aria-hidden="true" />
      <div className="mlp-top">
        <div className="mlp-main">
          <MoonBig phase={p.moonPhase} />
          <div className="mlp-main-t">
            <b>{info.name}</b>
            <span className="mlp-chips">
              <span className="mlp-chip sg" style={{ ['--sc' as any]: (p.isLight ? EL_COLOR_L : EL_COLOR)[si % 4] }}><i>{GLYPHS[si]}{'︎'}</i>{SIGNS[si]} <em>{degTxt}</em></span>
              {p.moonHouse ? <span className="mlp-chip">casa {p.moonHouse}</span> : null}
            </span>
            <span className="mlp-info"><b>{Math.round(p.moonIllumination * 100)}%</b><i /><small>nasce</small><b>{p.moonriseTime || '--:--'}</b><i /><small>põe</small><b>{p.moonsetTime || '--:--'}</b></span>
          </div>
          <button type="button" className="cs-x mlp-x" onClick={p.onClose} aria-label="Fechar"><i className="ti ti-x" aria-hidden="true" /></button>
        </div>
        <div className="mlp-bar">
          <span className="yr">
            <button type="button" aria-label="Ano anterior" onClick={() => { if (p.isFreeTier) { p.onOpenPaymentPlans?.(); return; } setYear(y => y - 1); }}>‹</button>
            <b>{year}</b>
            <button type="button" aria-label="Próximo ano" onClick={() => { if (p.isFreeTier) { p.onOpenPaymentPlans?.(); return; } setYear(y => y + 1); }}>›</button>
          </span>
          <button type="button" className="mini on" onClick={() => { const y = cycleYearOf(new Date()); if (y !== year) setYear(y); setTodaySig(n => n + 1); }} title="Centralizar no dia de hoje">Hoje</button>
          <label className="mini lcy-search" title="Buscar uma data" aria-label="Buscar uma data no calendário de ciclos">
            <i className="ti ti-search" aria-hidden="true" />
            <input type="date" onChange={e => e.target.value && goToDate(e.target.value)} />
          </label>
          {(p.onOpenCalendar || (eclipse && p.onOpenEclipses)) && (
            <span className="more">
              <button type="button" className="mini" aria-haspopup="menu" aria-expanded={more} onClick={() => setMore(v => !v)}>Outros<i className="ti ti-chevron-down" aria-hidden="true" /></button>
              {more && (
                <span className="more-list" role="menu">
                  {p.onOpenCalendar && ([['monthly', 'Lunar · mensal'], ['annual', 'Lunar · anual'], ['solar', 'Solar'], ['month', 'Mês'], ['year', 'Ano']] as const).map(([v, l]) => (
                    <button key={v} type="button" role="menuitem" onClick={() => { setMore(false); p.onOpenCalendar!(v); }}>{l}</button>
                  ))}
                  {eclipse && p.onOpenEclipses && (
                    <button type="button" role="menuitem" className="ecl" onClick={() => { setMore(false); p.onOpenEclipses!(); }}>
                      Próximo eclipse<small>{eclipse.event.peak.getDate()} {M3[eclipse.event.peak.getMonth()]} {eclipse.event.peak.getFullYear()}</small>
                    </button>
                  )}
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="mlp-cal">
        <LunarCyclesGrid
          year={year}
          latitude={p.latitude}
          isLight={p.isLight}
          selected={p.currentDate}
          onPickDate={p.onPickDate}
          isFreeTier={p.isFreeTier}
          onLocked={p.onOpenPaymentPlans}
          todaySignal={todaySig}
          focus={focus}
        />
      </div>
    </div>
  );
};

const MoonBig: React.FC<{ phase: number }> = ({ phase }) => {
  const S = 64, r = S / 2 - 1;
  const f = ((phase % 1) + 1) % 1;
  const k = Math.cos(2 * Math.PI * f);
  const rx = Math.abs(k * r).toFixed(2);
  const lit = f < 0.5
    ? `M0,${-r} A${r},${r} 0 0 1 0,${r} A${rx},${r} 0 0 ${k > 0 ? 0 : 1} 0,${-r}`
    : `M0,${-r} A${r},${r} 0 0 0 0,${r} A${rx},${r} 0 0 ${k > 0 ? 1 : 0} 0,${-r}`;
  return (
    <svg width={S} height={S} viewBox={`${-S / 2} ${-S / 2} ${S} ${S}`} aria-hidden="true" style={{ flex: 'none' }}>
      <defs><radialGradient id="mlp-lit" cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#fff" /><stop offset=".6" stopColor="#dcd6ca" /><stop offset="1" stopColor="#a9a394" /></radialGradient></defs>
      <circle r={r} fill="#15121a" stroke="rgba(237,233,227,.25)" strokeWidth={0.8} />
      {f > 0.015 && f < 0.985 && (f > 0.485 && f < 0.515 ? <circle r={r} fill="url(#mlp-lit)" /> : <path d={lit} fill="url(#mlp-lit)" />)}
    </svg>
  );
};

const MLP_CSS = `
.mlp{--fg:#EDE9E3;--hi:#FAF6EE;--mut:#B9B4BE;--dim:#8a8590;--line:#221d27;--line2:#2a2430;--line3:#3a3340;--card:#0a070c;position:fixed;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 54px);bottom:var(--m-tabs,68px);z-index:60;display:flex;flex-direction:column;border-radius:24px 24px 0 0;border:1px solid var(--line2);border-bottom:0;background:var(--card);color:var(--fg);font-family:'DM Sans',system-ui,sans-serif;box-shadow:0 -20px 50px -20px rgba(0,0,0,.8)}
.mlp.is-light{--fg:#231714;--hi:#140c0a;--mut:#4b4038;--dim:#6b6253;--line:rgba(35,23,20,.12);--line2:rgba(35,23,20,.18);--line3:rgba(35,23,20,.28);--card:#fbf9f4}
.mlp-grab{width:38px;height:4px;border-radius:2px;background:var(--line3);margin:8px auto 0;flex:none}
.mlp-top{flex:none;display:flex;flex-direction:column;gap:12px;padding:8px 12px 0}
.mlp-main{display:flex;align-items:center;gap:12px}
.mlp-main svg{width:56px;height:56px}
.mlp-main-t{flex:1;display:flex;flex-direction:column;gap:7px;min-width:0}
.mlp-main-t>b{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:600;font-size:25px;line-height:1;color:var(--hi)}
.mlp-x{align-self:flex-start;flex:none}
.mlp-chips{display:flex;gap:6px;flex-wrap:wrap}
.mlp-chip{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 9px;border-radius:999px;border:1px solid var(--line3);font-size:12px;color:var(--fg);white-space:nowrap}
.mlp-chip.sg{color:var(--sc);background:color-mix(in srgb,var(--sc) 10%,transparent);border-color:color-mix(in srgb,var(--sc) 38%,transparent)}
.mlp-chip i{font-style:normal;font-weight:700;font-size:13px;font-family:'Noto Sans Symbols 2','Segoe UI Symbol','Apple Symbols',serif;font-variant-emoji:text}
.mlp-chip em{font-style:normal;font-family:'DM Mono',ui-monospace,monospace;font-size:11.5px;color:var(--mut)}
.mlp-info{display:flex;align-items:center;gap:7px;white-space:nowrap;overflow:hidden;font-size:12px}
.mlp-info b{font:500 12px 'DM Mono',ui-monospace,monospace;color:var(--hi)}
.mlp-info small{font-size:12px;color:var(--dim)}
.mlp-info i{width:3px;height:3px;border-radius:50%;background:var(--line3);flex:none}
.mlp-bar{display:flex;align-items:center;gap:6px;padding:0 0 10px}
.mlp-bar .yr{display:flex;align-items:center;height:36px;border:1px solid var(--line2);border-radius:999px}
.mlp-bar .yr button{width:32px;height:34px;border:0;background:none;color:var(--fg);font-size:15px;line-height:1;cursor:pointer}
.mlp-bar .yr b{font:500 14px 'DM Mono',ui-monospace,monospace;color:var(--hi);padding:0 2px;white-space:nowrap}
.mlp .mini.on{background:var(--fg);color:var(--card);border-color:var(--fg)}
.mlp .more{margin-left:auto}
.mlp .more-list button.ecl{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--line);border-radius:0 0 10px 10px}
.mlp .more-list button.ecl small{font:11px 'DM Mono',ui-monospace,monospace;color:var(--dim)}
.mlp .mini.lcy-search{width:36px;padding:0;justify-content:center}
.mlp .mini{height:36px;display:inline-flex;align-items:center;gap:4px;padding:0 10px;border-radius:999px;border:1px solid var(--line3);background:none;color:var(--fg);font:600 11px 'DM Sans',sans-serif;cursor:pointer;white-space:nowrap}
.mlp .mini i{font-size:14px}
.mlp .more{position:relative}
.mlp .more-list{width:200px!important}
.mlp .more-list{position:absolute;right:0;top:calc(100% + 6px);z-index:5;width:170px;padding:5px;border-radius:14px;border:1px solid var(--line2);background:var(--card);box-shadow:0 18px 40px -12px rgba(0,0,0,.9);display:flex;flex-direction:column}
.mlp .more-list button{height:38px;text-align:left;padding:0 10px;border:0;border-radius:10px;background:none;color:var(--fg);font:500 13px 'DM Sans',sans-serif;cursor:pointer}
.mlp-cal{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;scroll-snap-type:y mandatory;scroll-padding-top:4px;padding:4px 8px 16px;-webkit-overflow-scrolling:touch}
/* cada lunação encaixa inteira */
.mlp-cal .lcy-cycle{scroll-snap-align:start;scroll-snap-stop:always}
body.is-mobile[data-morient="landscape"] .mlp{left:var(--m-col,0);top:0;bottom:0;border-radius:0}
`;

export default MoonPanelMobile;
