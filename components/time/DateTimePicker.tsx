/**
 * Navegador de data, hora e local (botão de calendário do controle de tempo).
 * Coluna única, de cima para baixo: mês e ano (dois botões), dias da semana, dias do mês em cartões,
 * relógio circular (anel de fora 1–12, de dentro 13–00; depois da hora passa sozinho para os minutos),
 * local (busca em qualquer lugar do mundo + caixa rolável com as 27 capitais). Agora e Confirmar fixos embaixo.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocationSearch } from '../../hooks/useLocationSearch';
const LocationGlobe = React.lazy(() => import('./LocationGlobe'));

type Loc = { latitude: number; longitude: number; displayName: string };

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const CAPITAIS: Array<[string, string, number, number]> = [
  ['São Paulo', 'SP', -23.5505, -46.6333], ['Rio de Janeiro', 'RJ', -22.9068, -43.1729], ['Brasília', 'DF', -15.7801, -47.9292],
  ['Belo Horizonte', 'MG', -19.9167, -43.9345], ['Salvador', 'BA', -12.9777, -38.5016], ['Natal', 'RN', -5.7945, -35.211],
  ['Recife', 'PE', -8.0476, -34.877], ['Fortaleza', 'CE', -3.7172, -38.5433], ['Curitiba', 'PR', -25.4284, -49.2733],
  ['Porto Alegre', 'RS', -30.0346, -51.2177], ['Florianópolis', 'SC', -27.5954, -48.548], ['Goiânia', 'GO', -16.6869, -49.2648],
  ['Manaus', 'AM', -3.119, -60.0217], ['Belém', 'PA', -1.4558, -48.4902], ['Vitória', 'ES', -20.3155, -40.3128],
  ['João Pessoa', 'PB', -7.1195, -34.845], ['Maceió', 'AL', -9.6658, -35.735], ['Aracaju', 'SE', -10.9472, -37.0731],
  ['Teresina', 'PI', -5.0892, -42.8019], ['São Luís', 'MA', -2.5307, -44.3068], ['Cuiabá', 'MT', -15.601, -56.0979],
  ['Campo Grande', 'MS', -20.4697, -54.6201], ['Palmas', 'TO', -10.2491, -48.3243], ['Porto Velho', 'RO', -8.7619, -63.9039],
  ['Rio Branco', 'AC', -9.9754, -67.8249], ['Macapá', 'AP', 0.0355, -51.0705], ['Boa Vista', 'RR', 2.8235, -60.6758],
];
const pad = (n: number) => String(n).padStart(2, '0');

export const DateTimePicker: React.FC<{
  open: boolean;
  value: Date;
  location: Loc;
  focusLocation?: boolean;
  rightOffset?: number;
  onClose: () => void;
  onConfirm: (date: Date, loc: Loc) => void;
  /** Local escolhido vale na hora (o tutorial espera a troca de local antes do OK da data) */
  onLocationPick?: (loc: Loc) => void;
  /** Botão que abriu a janela: a entrada é um zoom saindo dele */
  anchorRect?: DOMRect | null;
}> = ({ open, value, location, focusLocation, rightOffset = 0, onClose, onConfirm, onLocationPick, anchorRect }) => {
  const [y, setY] = useState(value.getFullYear());
  const [m, setM] = useState(value.getMonth());
  const [d, setD] = useState(value.getDate());
  const [h, setH] = useState(value.getHours());
  const [mi, setMi] = useState(value.getMinutes());
  const [loc, setLoc] = useState<Loc>(location);
  const [view, setView] = useState<'dias' | 'meses' | 'anos'>('dias');
    const [clockMode, setClockMode] = useState<'h' | 'm'>('h');
  const [query, setQuery] = useState('');
  const [quick, setQuick] = useState('');
  const [quickErr, setQuickErr] = useState(false);
  const { results, isLoading } = useLocationSearch(query);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const mBtnRef = useRef<HTMLButtonElement>(null);
  const yBtnRef = useRef<HTMLButtonElement>(null);
  const stateRef = useRef({ y, m });
  stateRef.current = { y, m };

  // entrada: zoom saindo do botão de calendário
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!open || !el) return;
    const r = el.getBoundingClientRect();
    if (anchorRect) el.style.transformOrigin = `${anchorRect.left + anchorRect.width / 2 - r.left}px ${anchorRect.top + anchorRect.height / 2 - r.top}px`;
    el.classList.remove('dtp-in'); void el.offsetWidth; el.classList.add('dtp-in');
  }, [open]);

  // roda do mouse sobre Mês / Ano troca o valor
  useEffect(() => {
    if (!open) return;
    const onWheelM = (e: WheelEvent) => { e.preventDefault(); const { m: cm, y: cy } = stateRef.current; const d = e.deltaY < 0 ? -1 : 1; const nm = cm + d; if (nm < 0) { setM(11); setY(cy - 1); } else if (nm > 11) { setM(0); setY(cy + 1); } else setM(nm); };
    const onWheelY = (e: WheelEvent) => { e.preventDefault(); setY(stateRef.current.y + (e.deltaY < 0 ? -1 : 1)); };
    const mb = mBtnRef.current, yb = yBtnRef.current;
    mb?.addEventListener('wheel', onWheelM, { passive: false });
    yb?.addEventListener('wheel', onWheelY, { passive: false });
    return () => { mb?.removeEventListener('wheel', onWheelM); yb?.removeEventListener('wheel', onWheelY); };
  }, [open]);

  // ao abrir a lista de meses ou anos, centraliza o item escolhido
  useEffect(() => {
    if (view === 'dias') return;
    const sel = listRef.current?.querySelector('.sel') as HTMLElement | null;
    if (sel && listRef.current) listRef.current.scrollTop = sel.offsetTop - listRef.current.clientHeight / 2 + sel.clientHeight / 2;
  }, [view]);
  const locRef = useRef<HTMLDivElement>(null);

  // ao abrir: copia a data, a hora e o local atuais
  useEffect(() => {
    if (!open) return;
    setY(value.getFullYear()); setM(value.getMonth()); setD(value.getDate());
    setH(value.getHours()); setMi(value.getMinutes()); setLoc(location);
    setView('dias'); setClockMode('h'); setQuery(''); setQuick(''); setQuickErr(false);
    if (focusLocation) {
      window.setTimeout(() => { locRef.current?.scrollIntoView({ block: 'nearest' }); searchRef.current?.focus(); }, 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);

  const nDays = new Date(y, m + 1, 0).getDate();
  const firstDow = new Date(y, m, 1).getDay();
  const dd = Math.min(d, nDays);
  const now = new Date();


  const capitais = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CAPITAIS.filter(c => !q || c[0].toLowerCase().includes(q) || c[1].toLowerCase() === q);
  }, [query]);

  // relógio
  const R_OUT = 94, R_IN = 62;
  const pos = (i: number, r: number, steps = 12) => {
    const a = (i * 360 / steps - 90) * Math.PI / 180;
    return [120 + r * Math.cos(a), 120 + r * Math.sin(a)];
  };
  const handAngle = clockMode === 'h' ? (h % 12) * 30 : mi * 6;
  const handR = clockMode === 'h' ? (h === 0 || h > 12 ? R_IN : R_OUT) : R_OUT;
  const [kx, ky] = (() => { const a = (handAngle - 90) * Math.PI / 180; return [120 + handR * Math.cos(a), 120 + handR * Math.sin(a)]; })();
  const clockRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef(false);
  const pick = (e: React.PointerEvent, final: boolean) => {
    const el = clockRef.current; if (!el) return;
    const b = el.getBoundingClientRect();
    const x = (e.clientX - b.left) * 240 / b.width - 120, yy = (e.clientY - b.top) * 240 / b.height - 120;
    const deg = (Math.atan2(yy, x) * 180 / Math.PI + 90 + 360) % 360;
    if (clockMode === 'h') {
      const i = Math.round(deg / 30) % 12;
      const inner = Math.hypot(x, yy) < (R_IN + R_OUT) / 2;
      setH(inner ? (i === 0 ? 0 : i + 12) : (i === 0 ? 12 : i));
      if (final) setClockMode('m');
    } else setMi(Math.round(deg / 6) % 60);
  };

  const chooseLoc = (l: Loc) => { setLoc(l); onLocationPick?.(l); };

  // digitação rápida: DDMMAAAA ou DDMMAAAAHHMM (ex.: 210319900815)
  const fmtQuick = (raw: string) => {
    const g = raw.replace(/\D/g, '').slice(0, 12);
    let out = g.slice(0, 2);
    if (g.length > 2) out += '/' + g.slice(2, 4);
    if (g.length > 4) out += '/' + g.slice(4, 8);
    if (g.length > 8) out += ' ' + g.slice(8, 10);
    if (g.length > 10) out += ':' + g.slice(10, 12);
    return out;
  };
  const applyQuick = () => {
    const g = quick.replace(/\D/g, '');
    if (g.length < 8) { setQuickErr(true); return; }
    const qd = +g.slice(0, 2), qm = +g.slice(2, 4), qy = +g.slice(4, 8);
    const qh = g.length >= 10 ? +g.slice(8, 10) : h, qi = g.length >= 12 ? +g.slice(10, 12) : mi;
    const date = new Date(qy, qm - 1, qd, qh, qi, 0);
    if (qd < 1 || qd > 31 || qm < 1 || qm > 12 || qh > 23 || qi > 59 || date.getDate() !== qd) { setQuickErr(true); return; }
    onConfirm(date, loc);
  };

  if (!open) return null;

  return (
    <>
      <div className="dtp-scrim" onClick={onClose} />
      <div ref={panelRef} className="dtp" data-tour="calendar-panel" role="dialog" aria-label="Escolher data, hora e local" style={{ right: `${rightOffset + 16}px` }}>
        <style>{CSS}</style>
        <div className="dtp-h">
          <span className="dtp-t">Data, hora e local</span>
          <button className="dtp-x" onClick={onClose} aria-label="Fechar"><i className="ti ti-x" /></button>
        </div>

        <div className="dtp-body">
         <div className="dtp-col dtp-col-date">
          <div className="dtp-eyebrow"><i className="ti ti-calendar dtp-pin" aria-hidden="true" />Data</div>
          <div className="dtp-quick">
            <label className={`dtp-search ${quickErr ? 'err' : ''}`}>
              <i className="ti ti-keyboard" />
              <input
                data-tour="date-input"
                inputMode="numeric"
                value={quick}
                onChange={e => { setQuick(fmtQuick(e.target.value)); setQuickErr(false); }}
                onKeyDown={e => { if (e.key === 'Enter') applyQuick(); }}
                placeholder="Digite 21/03/1990 08:15"
                autoComplete="off"
                aria-label="Digitar data e hora"
              />
            </label>
            <button data-tour="date-ok" className="dtp-okq" onClick={applyQuick}>OK</button>
          </div>
          {quickErr && <div className="dtp-err">Use dia, mês, ano e hora, como 21/03/1990 08:15.</div>}
          <div className="dtp-my">
            <button ref={mBtnRef} className={`dtp-m ${view === 'meses' ? 'on' : ''}`} onClick={() => setView(view === 'meses' ? 'dias' : 'meses')} title="Escolher o mês (ou role a rodinha aqui)">
              <span>{MESES[m]}</span><i className={`ti ${view === 'meses' ? 'ti-chevron-up' : 'ti-chevron-down'}`} />
            </button>
            <button ref={yBtnRef} className={`dtp-y ${view === 'anos' ? 'on' : ''}`} onClick={() => setView(view === 'anos' ? 'dias' : 'anos')} title="Escolher o ano (ou role a rodinha aqui)">
              <span>{y}</span><i className={`ti ${view === 'anos' ? 'ti-chevron-up' : 'ti-chevron-down'}`} />
            </button>
          </div>

          {view === 'dias' && (
            <div>
              <div className="dtp-wd">{SEMANA.map(s => <span key={s}>{s}</span>)}</div>
              <div className="dtp-days">
                {Array.from({ length: firstDow }).map((_, i) => <span key={`v${i}`} />)}
                {Array.from({ length: nDays }).map((_, i) => {
                  const day = i + 1;
                  const isToday = y === now.getFullYear() && m === now.getMonth() && day === now.getDate();
                  return (
                    <button key={day} className={`dtp-day ${day === dd ? 'sel' : ''} ${isToday ? 'today' : ''}`} onClick={() => setD(day)}>{day}</button>
                  );
                })}
              </div>
            </div>
          )}
          {view === 'meses' && (
            <div className="dtp-list" ref={listRef} role="listbox" aria-label="Meses">
              {MESES.map((nome, i) => (
                <button key={nome} role="option" aria-selected={i === m} className={i === m ? 'sel' : ''} onClick={() => { setM(i); setView('dias'); }}>{nome}</button>
              ))}
            </div>
          )}
          {view === 'anos' && (
            <div className="dtp-list dtp-mono" ref={listRef} role="listbox" aria-label="Anos">
              {Array.from({ length: 2200 - 1800 + 1 }).map((_, k) => 1800 + k).map(ano => (
                <button key={ano} role="option" aria-selected={ano === y} className={ano === y ? 'sel' : ''} onClick={() => { setY(ano); setView('dias'); }}>{ano}</button>
              ))}
            </div>
          )}

         </div>

         <div className="dtp-col dtp-col-clock">
          <div className="dtp-eyebrow"><i className="ti ti-clock dtp-pin" aria-hidden="true" />Hora</div>
          <div>
            <div className="dtp-hm">
              <button className={clockMode === 'h' ? 'on' : ''} onClick={() => setClockMode('h')}>{pad(h)}</button>
              <span>:</span>
              <button className={clockMode === 'm' ? 'on' : ''} onClick={() => setClockMode('m')}>{pad(mi)}</button>
            </div>
            <svg
              ref={clockRef}
              className="dtp-clock"
              viewBox="0 0 240 240"
              role="img"
              aria-label={clockMode === 'h' ? 'Relógio: escolha a hora' : 'Relógio: escolha os minutos'}
              onPointerDown={e => { dragRef.current = true; (e.currentTarget as any).setPointerCapture?.(e.pointerId); pick(e, false); }}
              onPointerMove={e => { if (dragRef.current) pick(e, false); }}
              onPointerUp={e => { if (dragRef.current) { dragRef.current = false; pick(e, true); } }}
            >
              <circle cx="120" cy="120" r="116" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.12)" />
              <line x1="120" y1="120" x2={kx} y2={ky} stroke="#EDE9E3" strokeWidth="1.5" />
              <circle cx="120" cy="120" r="3.5" fill="#EDE9E3" />
              <circle cx={kx} cy={ky} r={clockMode === 'm' && mi % 5 ? 7 : 16} fill="#EDE9E3" />
              {clockMode === 'h'
                ? Array.from({ length: 12 }).map((_, i) => {
                    const ho = i === 0 ? 12 : i, hi = i === 0 ? 0 : i + 12;
                    const [x1, y1] = pos(i, R_OUT), [x2, y2] = pos(i, R_IN);
                    return (
                      <g key={i} fontFamily="'DM Mono', monospace" textAnchor="middle">
                        <text x={x1} y={y1 + 4.5} fontSize="13" fill={h === ho ? '#040004' : '#EDE9E3'}>{ho}</text>
                        <text x={x2} y={y2 + 4} fontSize="11" fill={h === hi ? '#040004' : '#8a8590'}>{pad(hi)}</text>
                      </g>
                    );
                  })
                : <>
                    {Array.from({ length: 60 }).map((_, i) => i % 5 ? (() => { const [x, yy] = pos(i, R_OUT, 60); return <circle key={`t${i}`} cx={x} cy={yy} r="1.2" fill="rgba(255,255,255,.25)" />; })() : null)}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const [x, yy] = pos(i, R_OUT);
                      return <text key={i} x={x} y={yy + 4.5} fontSize="13" textAnchor="middle" fontFamily="'DM Mono', monospace" fill={mi === i * 5 ? '#040004' : '#EDE9E3'}>{pad(i * 5)}</text>;
                    })}
                  </>}
            </svg>
          </div>

         </div>

         <div className="dtp-col dtp-col-loc">
          <div className="dtp-loc" ref={locRef} data-tour="location">
            <div className="dtp-eyebrow"><i className="ti ti-map-pin dtp-pin" aria-hidden="true" />Local · <span className="dtp-cur">{loc.displayName}</span></div>
            <React.Suspense fallback={<div className="dtp-globe-ph" />}>
              <LocationGlobe lat={loc.latitude} lon={loc.longitude} timeMs={new Date(y, m, dd, h, mi).getTime()} size={168} />
            </React.Suspense>
            <label className="dtp-search">
              <i className="ti ti-search" />
              <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar qualquer cidade do mundo" autoComplete="off" />
              {isLoading && <i className="ti ti-loader-2 dtp-spin" />}
            </label>
            {query.trim().length >= 2 && results.length > 0 && (
              <div className="dtp-results">
                {results.map(r => (
                  <button key={`${r.latitude},${r.longitude}`} onClick={() => { chooseLoc(r); setQuery(''); }}>
                    <i className="ti ti-world" /><span>{r.displayName}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="dtp-caps">
              {capitais.map(([nome, uf, lat, lng]) => {
                const label = `${nome}, ${uf}, Brasil`;
                const sel = loc.displayName === label || loc.displayName.startsWith(`${nome}, ${uf}`);
                return (
                  <button key={uf} className={sel ? 'sel' : ''} onClick={() => chooseLoc({ latitude: lat, longitude: lng, displayName: label })}>
                    <span>{nome}</span><b>{uf}</b>
                  </button>
                );
              })}
            </div>
          </div>
         </div>
        </div>

        <div className="dtp-foot">
          <button className="dtp-btn" onClick={() => { const n = new Date(); setY(n.getFullYear()); setM(n.getMonth()); setD(n.getDate()); setH(n.getHours()); setMi(n.getMinutes()); setView('dias'); }}><span className="dtp-live" aria-hidden="true" />Agora</button>
          <button className="dtp-btn dtp-ok" onClick={() => onConfirm(new Date(y, m, dd, h, mi, 0), loc)}><i className="ti ti-check" /> Confirmar</button>
        </div>
      </div>
    </>
  );
};

const CSS = `
.dtp-scrim{position:fixed;inset:0;z-index:11490;background:rgba(0,0,0,.35)}
.dtp{position:fixed;z-index:11500;bottom:150px;width:min(940px,calc(100vw - 32px));max-height:calc(100vh - 166px);background:#0a070c;border:1px solid #2a2430;border-radius:20px;box-shadow:0 30px 80px -20px rgba(0,0,0,.9);display:flex;flex-direction:column;overflow:hidden;color:#EDE9E3;font-family:'DM Sans',system-ui,sans-serif}
.dtp button{font-family:inherit;color:inherit;cursor:pointer}
.dtp i.ti{font-size:14px}
.dtp-h{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 6px}
.dtp-t{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:20px}
.dtp-x{width:32px;height:32px;border-radius:50%;border:0;background:transparent;color:#B9B4BE;display:inline-flex;align-items:center;justify-content:center}
.dtp-x:hover{background:rgba(255,255,255,.08);color:#fff}
.dtp-body{flex:1;min-height:0;overflow-y:auto;padding:4px 16px 14px;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr) minmax(0,1fr);gap:0;scrollbar-width:thin}
.dtp-col{display:flex;flex-direction:column;gap:12px;min-width:0;padding:0 16px}
.dtp-col:first-child{padding-left:0}
.dtp-col:last-child{padding-right:0}
.dtp-col+.dtp-col{border-left:1px solid rgba(255,255,255,.07)}
.dtp-col-clock{align-items:center}
.dtp-col-clock .dtp-eyebrow{align-self:flex-start}
.dtp-col-clock .dtp-clock{width:200px}
.dtp-globe-ph{width:168px;height:168px;border-radius:50%;margin:0 auto;background:#0f1d30;border:1px solid rgba(255,255,255,.18)}
.dtp-col-loc .dtp-loc{border:0;padding:0}
.dtp-my{display:flex;gap:6px}
.dtp-my button{flex:1;height:34px;border-radius:999px;border:1px solid rgba(237,233,227,.22);background:transparent;display:inline-flex;align-items:center;justify-content:space-between;gap:6px;padding:0 12px}
.dtp-my button:hover,.dtp-my button.on{border-color:#EDE9E3}
.dtp-my button.on{background:rgba(237,233,227,.08)}
.dtp-my i{color:#8a8590}
.dtp-m{flex:1.4!important;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:17px;font-weight:500}
.dtp-y{flex:1;font-family:'DM Mono',monospace;font-size:13px}
.dtp-nav{flex:none!important;width:32px;padding:0!important;justify-content:center!important}
.dtp-wide{flex:1!important;width:auto;font-size:11px;gap:6px!important}
.dtp-wd{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:9.5px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:#B9B4BE;margin-bottom:6px}
.dtp-days{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.dtp-day{height:28px;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:transparent;font-family:'DM Mono',monospace;font-size:11.5px}
.dtp-day:hover{border-color:rgba(255,255,255,.45)}
.dtp-day.today{border-color:rgba(239,68,68,.6)}
.dtp-day.sel{background:#EDE9E3;color:#040004;border-color:#EDE9E3}
.dtp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.dtp-grid button{height:34px;border-radius:999px;border:1px solid rgba(255,255,255,.1);background:transparent;font-size:12px}
.dtp-grid button:hover{border-color:rgba(255,255,255,.45)}
.dtp-grid button.sel{background:#EDE9E3;color:#040004;border-color:#EDE9E3}
.dtp-mono button{font-family:'DM Mono',monospace}
.dtp-hm{display:flex;align-items:center;justify-content:center;gap:6px}
.dtp-hm button{font-family:'DM Mono',monospace;font-size:24px;border:1px solid rgba(255,255,255,.1);background:transparent;border-radius:10px;padding:1px 9px}
.dtp-hm button.on{background:#EDE9E3;color:#040004;border-color:#EDE9E3}
.dtp-hm span{font-family:'DM Mono',monospace;font-size:22px;color:#6f6a76}
.dtp-clock{display:block;margin:4px auto 0;width:160px;max-width:100%;cursor:pointer;touch-action:none;user-select:none}
.dtp-loc{border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:10px;display:flex;flex-direction:column;gap:8px}
.dtp-eyebrow{font-size:9.5px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:#B9B4BE;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dtp-cur{letter-spacing:.04em;text-transform:none;color:#EDE9E3;font-size:11px}
.dtp-search{display:flex;align-items:center;gap:8px;height:34px;border-radius:999px;border:1px solid rgba(237,233,227,.22);background:rgba(0,0,0,.35);padding:0 12px}
.dtp-search i{color:#B9B4BE}
.dtp-search input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:#EDE9E3;font-family:'DM Sans',system-ui,sans-serif;font-size:12px}
.dtp-quick{display:flex;gap:6px}
.dtp-quick .dtp-search{flex:1}
.dtp-search.err{border-color:rgba(248,113,113,.7)}
.dtp-okq{height:34px;padding:0 14px;border-radius:999px;border:1px solid rgba(237,233,227,.28);background:transparent;font-size:10.5px;font-weight:500;letter-spacing:.14em}
.dtp-okq:hover{border-color:#EDE9E3}
.dtp-err{font-size:11px;color:#F87171;margin-top:-6px}
.dtp-spin{animation:dtp-spin 1s linear infinite}
@keyframes dtp-spin{to{transform:rotate(360deg)}}
.dtp-results{display:flex;flex-direction:column;gap:4px;max-height:132px;overflow-y:auto}
.dtp-results button{display:flex;align-items:center;gap:8px;text-align:left;padding:7px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:transparent;font-size:11.5px}
.dtp-results button:hover{border-color:rgba(255,255,255,.45)}
.dtp-results span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dtp-caps{display:grid;grid-template-columns:repeat(2,1fr);gap:5px;height:113px;overflow-y:auto;padding-right:4px;scrollbar-width:thin}
.dtp-caps button{height:29px;border-radius:999px;border:1px solid rgba(255,255,255,.1);background:transparent;font-size:11px;font-weight:500;display:flex;align-items:center;justify-content:space-between;padding:0 10px;gap:4px;min-width:0}
.dtp-caps button:hover{border-color:rgba(255,255,255,.45)}
.dtp-caps button.sel{border-color:#EDE9E3;background:rgba(237,233,227,.1)}
.dtp-caps span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dtp-caps b{font-family:'DM Mono',monospace;font-weight:400;font-size:10.5px;color:#B9B4BE}
.dtp-more{font-size:10px;color:#6f6a76;text-align:center;display:flex;align-items:center;justify-content:center;gap:4px}
.dtp-list{height:236px;overflow-y:auto;display:flex;flex-direction:column;gap:3px;scroll-snap-type:y proximity;scrollbar-width:thin;padding:2px}
.dtp-list button{flex:none;height:34px;border-radius:999px;border:1px solid transparent;background:transparent;font-size:13px;scroll-snap-align:center}
.dtp-list button:hover{border-color:rgba(255,255,255,.3)}
.dtp-list button.sel{background:#EDE9E3;color:#040004;border-color:#EDE9E3}
.dtp-list.dtp-mono button{font-family:'DM Mono',monospace}
.dtp-pin{font-size:12px!important;margin-right:4px;vertical-align:-1px;color:#B9B4BE}
.dtp-live{width:7px;height:7px;border-radius:50%;background:#EF4444;box-shadow:0 0 0 3px rgba(239,68,68,.18)}
.dtp.dtp-in{animation:dtp-zoom .42s cubic-bezier(.16,1,.3,1)}
@keyframes dtp-zoom{from{opacity:0;transform:scale(.18)}60%{opacity:1}to{opacity:1;transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.dtp.dtp-in{animation:none}}
.dtp-foot{padding:12px 16px 14px;border-top:1px solid rgba(255,255,255,.1);display:flex;gap:8px;justify-content:flex-end}
@media (min-width:901px){.dtp-foot .dtp-btn{flex:0 0 150px}.dtp-foot .dtp-ok{flex:0 0 220px}}
.dtp-btn{flex:1;height:40px;border-radius:999px;border:1px solid rgba(237,233,227,.28);background:transparent;font-size:10.5px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.dtp-btn:hover{border-color:#EDE9E3}
.dtp-ok{flex:2;background:#EDE9E3;border-color:#EDE9E3;color:#040004!important}
.dtp-ok:hover{background:#fff}
@media (max-width:900px){.dtp-body{display:flex;flex-direction:column;gap:14px}.dtp-col{padding:0!important}.dtp-col+.dtp-col{border-left:0;border-top:1px solid rgba(255,255,255,.07);padding-top:14px!important}.dtp{width:min(420px,calc(100vw - 32px));top:16px}}
@media (max-width:640px){.dtp{left:8px;right:8px!important;width:auto;top:max(8px,env(safe-area-inset-top,0px));bottom:max(8px,env(safe-area-inset-bottom,0px));max-width:none;max-height:none}}
`;

export default DateTimePicker;
