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
  /** Mapas salvos: escolher um preenche data, hora e local (o Confirmar aplica) */
  savedMaps?: any[];
  onDeleteMap?: (id: string) => void;
  /** Editar um mapa salvo: nome, data, hora e local */
  onUpdateMap?: (id: string, patch: { name: string; date: Date; location: Loc }) => void;
  /** Salvar mapa: aplica a data, hora e local escolhidos e abre a janela de salvar */
  onSaveMap?: (date: Date, loc: Loc) => void;
}> = ({ open, value, location, focusLocation, rightOffset = 0, onClose, onConfirm, onLocationPick, anchorRect, savedMaps = [], onDeleteMap, onUpdateMap, onSaveMap }) => {
  const [showMaps, setShowMaps] = useState(false);
  const [mapQuery, setMapQuery] = useState('');
  const [mapSort, setMapSort] = useState<'recent' | 'az'>('recent');
  // Edição de mapa salvo: o mapa abre na janela inteira (data, hora e local) e o Confirmar vira "Salvar mapa"
  const [editMap, setEditMap] = useState<{ id: string; name: string } | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);
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
    const onWheelM = (e: WheelEvent) => { e.preventDefault(); const { m: cm, y: cy } = stateRef.current; const d = e.deltaY < 0 ? 1 : -1; const nm = cm + d; if (nm < 0) { setM(11); setY(cy - 1); } else if (nm > 11) { setM(0); setY(cy + 1); } else setM(nm); };
    const onWheelY = (e: WheelEvent) => { e.preventDefault(); setY(stateRef.current.y + (e.deltaY < 0 ? 1 : -1)); };
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
    setView('dias'); setClockMode('h'); setQuery(''); setQuick(''); setQuickErr(false); setShowMaps(false); setQuickOk(false);
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
  const [quickOk, setQuickOk] = useState(false);
  const pickOnGlobe = (lat: number, lon: number) => {
    const f = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(2).replace('.', ',')}° ${v >= 0 ? pos : neg}`;
    chooseLoc({ latitude: +lat.toFixed(4), longitude: +lon.toFixed(4), displayName: `${f(lat, 'N', 'S')} · ${f(lon, 'L', 'O')}` });
  };

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
    // preenche data e hora; o Confirmar aplica (assim dá para ajustar o local antes)
    setY(qy); setM(qm - 1); setD(qd); setH(qh); setMi(qi); setView('dias'); setQuickOk(true);
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
         <div className="dtp-col dtp-col-date" data-tour="date-col">
          <div className="dtp-eyebrow"><i className="ti ti-calendar dtp-pin" aria-hidden="true" />Data</div>
          <div className="dtp-quick" data-tour="date-quick">
            <label className={`dtp-search ${quickErr ? 'err' : ''}`}>
              <i className="ti ti-keyboard" />
              <input
                data-tour="date-input"
                inputMode="numeric"
                value={quick}
                onChange={e => { setQuick(fmtQuick(e.target.value)); setQuickErr(false); setQuickOk(false); }}
                onKeyDown={e => { if (e.key === 'Enter') applyQuick(); }}
                placeholder="Digite 21/03/1990 08:15"
                autoComplete="off"
                aria-label="Digitar data e hora"
              />
            </label>
            <button data-tour="date-ok" className="dtp-okq" onClick={applyQuick}>OK</button>
          </div>
          {quickErr && <div className="dtp-err">Use dia, mês, ano e hora, como 21/03/1990 08:15.</div>}
          {quickOk && !quickErr && <div className="dtp-okmsg"><i className="ti ti-check" /> Data e hora preenchidas. Confira e clique em Confirmar.</div>}
          <div data-tour="date-nav">
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

         </div>

         <div className="dtp-col dtp-col-clock" data-tour="clock-col">
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
              <LocationGlobe lat={loc.latitude} lon={loc.longitude} timeMs={new Date(y, m, dd, h, mi).getTime()} size={168} onPick={pickOnGlobe} />
            </React.Suspense>
            <div className="dtp-globe-hint">Dois cliques no globo marcam o ponto exato</div>
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

        {editMap && (
          <div className="dtp-editbar" role="group" aria-label="Editando mapa salvo">
            <i className="ti ti-pencil" aria-hidden="true" />
            <label htmlFor="dtp-edit-name">Editando mapa</label>
            <input id="dtp-edit-name" value={editMap.name} onChange={e => setEditMap({ ...editMap, name: e.target.value })} placeholder="Nome do mapa" autoComplete="off" />
            <span className="hint">Ajuste data, hora e local acima e salve.</span>
            <button type="button" onClick={() => setEditMap(null)}>Cancelar edição</button>
          </div>
        )}
        {savedFlash && !editMap && <div className="dtp-savedflash" role="status"><i className="ti ti-check" aria-hidden="true" /> Mapa salvo</div>}
        <div className={`dtp-foot ${onSaveMap && !editMap ? 'has-save' : ''}`} data-tour="date-foot">
          <div className="dtp-mapsw">
            <button className={`dtp-btn dtp-btn-gold ${showMaps ? 'on' : ''}`} onClick={() => setShowMaps(v => !v)} aria-expanded={showMaps} title="Escolher um mapa salvo">
              <i className="ti ti-bookmarks" /> Mapas salvos
            </button>
            {showMaps && (() => {
              const savedAt = (mp: any) => {
                const v = mp.dateSaved ?? mp.updatedAt ?? mp.createdAt;
                const t = typeof v === 'number' ? v : v ? new Date(v).getTime() : 0;
                return isNaN(t) ? 0 : t;
              };
              const q = mapQuery.trim().toLowerCase();
              const list = savedMaps
                .filter((mp: any) => !q || `${mp.name || ''} ${mp.description || ''} ${mp.location?.displayName || ''}`.toLowerCase().includes(q))
                .sort((x: any, z: any) => mapSort === 'az'
                  ? String(x.name || '').localeCompare(String(z.name || ''), 'pt-BR', { sensitivity: 'base' })
                  : savedAt(z) - savedAt(x));
              return (
              <div className="dtp-maps" role="dialog" aria-label="Mapas salvos">
                <div className="dtp-maps-head">
                  <label className="dtp-maps-lbl" htmlFor="dtp-maps-q">Buscar mapa</label>
                  <div className="dtp-maps-search">
                    <i className="ti ti-search" aria-hidden="true" />
                    <input id="dtp-maps-q" type="search" value={mapQuery} onChange={e => setMapQuery(e.target.value)} placeholder="Nome, descrição ou cidade" autoComplete="off" />
                  </div>
                  <div className="dtp-maps-sort" role="radiogroup" aria-label="Ordenar">
                    <button type="button" role="radio" aria-checked={mapSort === 'recent'} className={mapSort === 'recent' ? 'on' : ''} onClick={() => setMapSort('recent')}><i className="ti ti-clock" aria-hidden="true" /> Mais recentes</button>
                    <button type="button" role="radio" aria-checked={mapSort === 'az'} className={mapSort === 'az' ? 'on' : ''} onClick={() => setMapSort('az')}><i className="ti ti-sort-ascending-letters" aria-hidden="true" /> A–Z</button>
                  </div>
                </div>
                <div className="dtp-maps-list">
                {savedMaps.length === 0 ? (
                  <div className="dtp-maps-empty">Nenhum mapa salvo ainda. Use o menu ⋯ ao lado do + para salvar.</div>
                ) : list.length === 0 ? (
                  <div className="dtp-maps-empty">Nenhum mapa com "{mapQuery}".</div>
                ) : list.map((mp: any) => {
                  const raw = mp.targetDate || mp.date;
                  const dt = raw ? new Date(raw) : null;
                  const ok = !!dt && !isNaN(dt.getTime());
                  const id = mp.id || mp.name;
                  if (delId === id) return (
                    <div key={id} className="dtp-map-row is-del">
                      <span className="nm">Excluir “{mp.name || 'Mapa sem nome'}”?</span>
                      <button type="button" className="dtp-map-yes" onClick={() => { onDeleteMap?.(mp.id); setDelId(null); }}>Excluir</button>
                      <button type="button" className="dtp-map-no" onClick={() => setDelId(null)}>Cancelar</button>
                    </div>
                  );
                  return (
                    <div key={id} className="dtp-map-row">
                      <button type="button" className="dtp-map-pick" disabled={!ok} onClick={() => {
                        if (!ok || !dt) return;
                        setY(dt.getFullYear()); setM(dt.getMonth()); setD(dt.getDate()); setH(dt.getHours()); setMi(dt.getMinutes()); setView('dias');
                        if (mp.location && typeof mp.location.latitude === 'number') chooseLoc(mp.location);
                        setShowMaps(false);
                      }}>
                        <span className="nm">{mp.name || 'Mapa sem nome'}</span>
                        <span className="dt">{ok && dt ? `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} · ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}` : '—'}{mp.location?.displayName ? ` · ${String(mp.location.displayName).split(',')[0]}` : ''}</span>
                      </button>
                      {onUpdateMap && mp.id && <button type="button" className="dtp-map-act" onClick={() => {
                        setDelId(null);
                        if (ok && dt) { setY(dt.getFullYear()); setM(dt.getMonth()); setD(dt.getDate()); setH(dt.getHours()); setMi(dt.getMinutes()); setView('dias'); }
                        if (mp.location && typeof mp.location.latitude === 'number') chooseLoc(mp.location);
                        setEditMap({ id: mp.id, name: mp.name || '' }); setShowMaps(false);
                      }} title="Editar nome, data, hora e local" aria-label={`Editar ${mp.name || 'mapa'}`}><i className="ti ti-pencil" /></button>}
                      {onDeleteMap && mp.id && <button type="button" className="dtp-map-act is-danger" onClick={() => { setDelId(id); }} title="Excluir" aria-label={`Excluir ${mp.name || 'mapa'}`}><i className="ti ti-trash" /></button>}
                    </div>
                  );
                })}
                </div>
              </div>
              );
            })()}
          </div>
          {onSaveMap && !editMap && (
            <button className="dtp-btn dtp-save" onClick={() => onSaveMap(new Date(y, m, dd, h, mi, 0), loc)} title="Salvar esta data, hora e local como mapa"><i className="ti ti-bookmark-plus" /> Salvar mapa</button>
          )}
          <button className="dtp-btn" onClick={() => { const n = new Date(); setY(n.getFullYear()); setM(n.getMonth()); setD(n.getDate()); setH(n.getHours()); setMi(n.getMinutes()); setView('dias'); }}><span className="dtp-live" aria-hidden="true" />Agora</button>
          {editMap ? (
            <button className="dtp-btn dtp-ok" disabled={!editMap.name.trim()} onClick={() => {
              onUpdateMap?.(editMap.id, { name: editMap.name.trim(), date: new Date(y, m, dd, h, mi, 0), location: loc });
              setEditMap(null); setSavedFlash(true); window.setTimeout(() => setSavedFlash(false), 2200);
            }}><i className="ti ti-device-floppy" /> Salvar mapa</button>
          ) : (
            <button data-tour="date-confirm" className="dtp-btn dtp-ok" onClick={() => onConfirm(new Date(y, m, dd, h, mi, 0), loc)}><i className="ti ti-check" /> Confirmar</button>
          )}
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
.dtp-okmsg{margin-top:6px;font-size:11.5px;color:#86EFAC;display:flex;align-items:center;gap:5px}
.dtp-globe-hint{font-size:10.5px;color:#6f6a76;text-align:center;margin:-2px 0 6px}
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
.dtp-live{width:7px;height:7px;border-radius:50%;background:#4ADE80;box-shadow:0 0 0 3px rgba(74,222,128,.18)}
.dtp.dtp-in{animation:dtp-zoom .42s cubic-bezier(.16,1,.3,1)}
@keyframes dtp-zoom{from{opacity:0;transform:scale(.18)}60%{opacity:1}to{opacity:1;transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.dtp.dtp-in{animation:none}}
.dtp-foot{padding:12px 16px 14px;border-top:1px solid rgba(255,255,255,.1);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:center;gap:8px}
.dtp-foot>*{justify-self:stretch;min-width:0}
.dtp-foot.has-save{grid-template-columns:repeat(4,minmax(0,1fr))}
@media (max-width:560px){.dtp-foot.has-save{grid-template-columns:repeat(2,minmax(0,1fr))}}
.dtp-foot .dtp-btn{letter-spacing:.08em}
.dtp-foot .dtp-btn,.dtp-foot .dtp-mapsw .dtp-btn{flex:none;width:100%;height:44px;padding:0 10px;border-radius:14px;white-space:nowrap}
.dtp-mapsw{position:relative;display:flex}
.dtp-editbar{display:flex;align-items:center;gap:10px;padding:10px 16px;border-top:1px solid rgba(212,175,55,.35);background:rgba(212,175,55,.06);flex-wrap:wrap}
.dtp-editbar>i{color:#F5D98A}
.dtp-editbar label{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#F5D98A;white-space:nowrap}
.dtp-editbar input{flex:1 1 180px;min-width:0;height:32px;padding:0 12px;border-radius:999px;border:1px solid rgba(212,175,55,.5);background:#040004;color:#EDE9E3;font:inherit;font-size:13px;outline:0}
.dtp-editbar input:focus{border-color:#D4AF37}
.dtp-editbar .hint{font-size:11.5px;color:#8a8590}
.dtp-editbar button{height:30px;padding:0 12px;border-radius:999px;border:1px solid #2a2430;background:none;font-size:11px}
.dtp-editbar button:hover{border-color:#EDE9E3}
.dtp-savedflash{display:flex;align-items:center;justify-content:center;gap:6px;padding:8px;border-top:1px solid #221d27;font-size:12px;color:#86EFAC}
.dtp-btn:disabled{opacity:.4;cursor:default}
.dtp-btn.dtp-btn-gold{border-color:rgba(212,175,55,.75);color:#F5D98A}
.dtp-btn.dtp-btn-gold:hover,.dtp-btn.dtp-btn-gold.on{border-color:#D4AF37;background:rgba(212,175,55,.1)}
.dtp-btn.on{border-color:#EDE9E3;background:rgba(237,233,227,.08)}
.dtp-maps{position:absolute;bottom:calc(100% + 8px);left:0;width:340px;max-width:calc(100vw - 40px);max-height:360px;background:#0a070c;border:1px solid #2a2430;border-radius:14px;display:flex;flex-direction:column;box-shadow:0 20px 50px -12px rgba(0,0,0,.85);z-index:5;overflow:hidden}
.dtp-maps-head{padding:10px 10px 8px;border-bottom:1px solid #221d27;display:flex;flex-direction:column;gap:6px}
.dtp-maps-lbl{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#8a8590}
.dtp-maps-search{display:flex;align-items:center;gap:8px;height:34px;padding:0 12px;border:1px solid #2a2430;border-radius:999px}
.dtp-maps-search:focus-within{border-color:#EDE9E3}
.dtp-maps-search i{color:#8a8590;font-size:14px}
.dtp-maps-search input{flex:1;min-width:0;background:none;border:0;outline:0;color:#EDE9E3;font:inherit;font-size:12.5px}
.dtp-maps-search input::placeholder{color:#6f6a76}
.dtp-maps-sort{display:flex;gap:4px}
.dtp-maps-sort button{flex:1;height:28px;border-radius:999px;border:1px solid #2a2430;background:none;font-size:11px;display:inline-flex;align-items:center;justify-content:center;gap:5px;opacity:.75}
.dtp-maps-sort button.on{opacity:1;background:#EDE9E3;color:#040004;border-color:#EDE9E3}
.dtp-maps-list{overflow-y:auto;padding:6px;display:flex;flex-direction:column;gap:2px;scrollbar-width:thin}
.dtp-map-row{display:flex;align-items:center;gap:2px;border-radius:9px}
.dtp-map-row:hover{background:rgba(255,255,255,.05)}
.dtp-map-pick{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left;padding:8px 10px;border-radius:9px;border:0;background:transparent}
.dtp-map-pick:disabled{opacity:.4;cursor:default}
.dtp-map-act{flex:none;width:30px;height:30px;border-radius:50%;border:0;background:none;display:inline-flex;align-items:center;justify-content:center;font-size:15px;opacity:.6}
.dtp-map-act:hover{opacity:1;background:rgba(255,255,255,.08)}
.dtp-map-act.is-danger:hover{color:#fca5a5}
.dtp-map-row.is-edit{padding:4px 4px 4px 6px;background:rgba(255,255,255,.05)}
.dtp-map-row.is-edit input{flex:1;min-width:0;height:30px;padding:0 10px;border-radius:8px;border:1px solid #EDE9E3;background:#040004;color:#EDE9E3;font:inherit;font-size:12.5px;outline:0}
.dtp-map-row.is-del{padding:6px 6px 6px 10px;background:rgba(239,68,68,.08)}
.dtp-map-row.is-del .nm{flex:1}
.dtp-map-yes,.dtp-map-no{height:28px;padding:0 10px;border-radius:999px;font-size:11px;border:1px solid #2a2430;background:none}
.dtp-map-yes{border-color:rgba(239,68,68,.6);color:#fca5a5}
.dtp-maps .nm{font-size:12.5px;font-weight:500;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dtp-maps .dt{font-family:'DM Mono',monospace;font-size:10.5px;color:#B9B4BE;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dtp-maps-empty{padding:12px 10px;font-size:11.5px;color:#8a8590;line-height:1.5}
.dtp-btn{flex:1;height:40px;border-radius:999px;border:1px solid rgba(237,233,227,.28);background:transparent;font-size:10.5px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.dtp-btn:hover{border-color:#EDE9E3}
.dtp-ok{flex:2;background:#EDE9E3;border-color:#EDE9E3;color:#040004!important}
.dtp-ok:hover{background:#fff}
@media (max-width:900px){.dtp-body{display:flex;flex-direction:column;gap:14px}.dtp-col{padding:0!important}.dtp-col+.dtp-col{border-left:0;border-top:1px solid rgba(255,255,255,.07);padding-top:14px!important}.dtp{width:min(420px,calc(100vw - 32px));top:16px}}
@media (max-width:640px){.dtp{left:8px;right:8px!important;width:auto;top:max(8px,env(safe-area-inset-top,0px));bottom:max(8px,env(safe-area-inset-bottom,0px));max-width:none;max-height:none}}
`;

export default DateTimePicker;
