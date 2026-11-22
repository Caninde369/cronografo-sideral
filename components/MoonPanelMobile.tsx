/**
 * Aba Lua do celular (aprovada pelo Rafa em 22/11/2026, versão B do calendário).
 * Gaveta de tela cheia logo abaixo do logo: fase, signo, grau e casa, nascer e pôr,
 * próximo eclipse e o calendário de ciclos lunares (13 lunações, rolagem, botão Hoje).
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
      <div className="mlp-h">
        <div>
          <h3>Lua</h3>
          <small>{p2(d.getDate())} {M3[d.getMonth()]} {d.getFullYear()} · {p2(d.getHours())}:{p2(d.getMinutes())}{p.locationName ? ` · ${p.locationName.split(',')[0]}` : ''}</small>
        </div>
        <button type="button" className="cs-x" onClick={p.onClose} aria-label="Fechar"><i className="ti ti-x" aria-hidden="true" /></button>
      </div>

      <div className="mlp-top">
        <div className="mlp-main">
          <MoonBig phase={p.moonPhase} />
          <div className="mlp-main-t">
            <b>{info.name}</b>
            <span className="mlp-sign"><i>{GLYPHS[si]}{'︎'}</i>{SIGNS[si]} <em>{degTxt}</em>{p.moonHouse ? <><span className="sep">·</span>casa {p.moonHouse}</> : null}</span>
            <span className="mlp-meta">{Math.round(p.moonIllumination * 100)}% iluminada · {age}º dia do ciclo</span>
          </div>
        </div>
        <div className="mlp-rise"><span><small>Nasce</small>{p.moonriseTime || '--:--'}</span><span><small>Põe</small>{p.moonsetTime || '--:--'}</span></div>
        {eclipse && (
          <button type="button" className="mlp-ecl" onClick={p.onOpenEclipses}>
            <i className="ti ti-sun-low" aria-hidden="true" />
            <span className="t"><b>Próximo eclipse</b><small>{eclipse.event.name.replace(/^Eclipse /, '')} · {eclipse.event.peak.getDate()} {M3[eclipse.event.peak.getMonth()]} {eclipse.event.peak.getFullYear()}{eclipse.daysUntil > 0 ? ` · em ${eclipse.daysUntil} d` : ' · hoje'}</small></span>
            <span className="go">Ver</span>
          </button>
        )}
        <div className="mlp-bar">
          <span className="lbl">Ciclos lunares</span>
          <span className="yr">
            <button type="button" aria-label="Ano anterior" onClick={() => { if (p.isFreeTier) { p.onOpenPaymentPlans?.(); return; } setYear(y => y - 1); }}>‹</button>
            <b>{year} · {String((year + 1) % 100).padStart(2, '0')}</b>
            <button type="button" aria-label="Próximo ano" onClick={() => { if (p.isFreeTier) { p.onOpenPaymentPlans?.(); return; } setYear(y => y + 1); }}>›</button>
          </span>
          <button type="button" className="mini" onClick={() => { const y = cycleYearOf(new Date()); if (y !== year) setYear(y); setTodaySig(n => n + 1); }} title="Centralizar no dia de hoje">
            <i className="ti ti-focus-centered" aria-hidden="true" />Hoje
          </button>
          {p.onOpenCalendar && (
            <span className="more">
              <button type="button" className="mini" aria-haspopup="menu" aria-expanded={more} onClick={() => setMore(v => !v)}>Outros<i className="ti ti-chevron-down" aria-hidden="true" /></button>
              {more && (
                <span className="more-list" role="menu">
                  {([['monthly', 'Lunar · mensal'], ['annual', 'Lunar · anual'], ['solar', 'Solar'], ['month', 'Mês'], ['year', 'Ano']] as const).map(([v, l]) => (
                    <button key={v} type="button" role="menuitem" onClick={() => { setMore(false); p.onOpenCalendar!(v); }}>{l}</button>
                  ))}
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
.mlp-h{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 14px 6px;flex:none}
.mlp-h h3{margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:26px;line-height:1;color:var(--hi)}
.mlp-h small{display:block;margin-top:4px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
.mlp-top{flex:none;display:flex;flex-direction:column;gap:10px;padding:0 14px}
.mlp-main{display:flex;align-items:center;gap:14px}
.mlp-main-t{display:flex;flex-direction:column;gap:4px;min-width:0}
.mlp-main-t>b{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:27px;line-height:1;color:var(--hi)}
.mlp-sign{font-size:15px;color:var(--hi);display:flex;align-items:baseline;flex-wrap:wrap;gap:5px}
.mlp-sign i{font-style:normal;font-family:'Noto Sans Symbols 2','Segoe UI Symbol','Apple Symbols',serif}
.mlp-sign em{font-style:normal;font-family:'DM Mono',ui-monospace,monospace;font-size:13.5px;color:var(--fg)}
.mlp-sign .sep{color:var(--dim)}
.mlp-meta{font-size:12px;color:var(--dim)}
.mlp-rise{display:flex;gap:18px;font:14px 'DM Mono',ui-monospace,monospace;color:var(--hi);padding:0 2px}
.mlp-rise small{font:600 9px 'DM Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin-right:7px}
.mlp-ecl{display:flex;align-items:center;gap:11px;width:100%;padding:10px 12px;border-radius:14px;border:1px solid var(--line2);background:none;color:var(--fg);text-align:left;cursor:pointer;font-family:inherit}
.mlp-ecl>i{font-size:22px;color:var(--mut)}
.mlp-ecl .t{flex:1;min-width:0}
.mlp-ecl b{display:block;font-size:13.5px;color:var(--hi)}
.mlp-ecl small{font-size:11.5px;color:var(--dim)}
.mlp-ecl .go{height:30px;padding:0 11px;border-radius:999px;border:1px solid var(--line3);display:flex;align-items:center;font:600 10.5px 'DM Sans',sans-serif;letter-spacing:.08em;text-transform:uppercase}
.mlp-bar{display:flex;align-items:center;gap:6px;padding:10px 0 8px;border-top:1px solid var(--line)}
.mlp-bar .lbl{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:600 9.5px 'DM Sans',sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--dim)}
.mlp-bar .yr{display:flex;align-items:center;gap:1px}
.mlp-bar .yr button{width:28px;height:28px;border-radius:50%;border:1px solid var(--line2);background:none;color:var(--fg);font-size:14px;line-height:1;cursor:pointer}
.mlp-bar .yr b{font:500 12px 'DM Mono',ui-monospace,monospace;color:var(--hi);padding:0 4px;white-space:nowrap}
.mlp .mini{height:30px;display:inline-flex;align-items:center;gap:4px;padding:0 10px;border-radius:999px;border:1px solid var(--line3);background:none;color:var(--fg);font:600 11px 'DM Sans',sans-serif;cursor:pointer;white-space:nowrap}
.mlp .mini i{font-size:14px}
.mlp .more{position:relative}
.mlp .more-list{position:absolute;right:0;top:calc(100% + 6px);z-index:5;width:170px;padding:5px;border-radius:14px;border:1px solid var(--line2);background:var(--card);box-shadow:0 18px 40px -12px rgba(0,0,0,.9);display:flex;flex-direction:column}
.mlp .more-list button{height:38px;text-align:left;padding:0 10px;border:0;border-radius:10px;background:none;color:var(--fg);font:500 13px 'DM Sans',sans-serif;cursor:pointer}
.mlp-cal{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:4px 10px 16px;-webkit-overflow-scrolling:touch}
body.is-mobile[data-morient="landscape"] .mlp{left:var(--m-col,0);top:0;bottom:0;border-radius:0}
`;

export default MoonPanelMobile;
