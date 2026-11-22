/**
 * Conteúdo do popover "Mapa natal" (botão + da barra da direita).
 * Corrige a adição do mapa natal: agora pede também a cidade de nascimento
 * (antes só a data, e as casas eram calculadas no lugar errado).
 * Identidade do Cronógrafo: fundo escuro, linhas finas, Cormorant no título, DM Sans/Mono.
 */
import React, { useMemo, useState } from 'react';
import { useLocationSearch, type LocationResult } from '../hooks/useLocationSearch';

type Loc = { latitude: number; longitude: number; displayName: string };

interface Props {
  isLight: boolean;
  natalTime?: Date | null;
  natalLocationName?: string;
  currentLocation?: Loc | null;
  savedMaps?: any[];
  onUseSavedNatal?: (map: any) => void;
  onApply: (date: Date, loc: Loc | null) => void;
  onClear?: () => void;
  showNatalLines?: boolean;
  onToggleLines?: () => void;
  natalColorMode?: 'gold' | 'colored';
  onColorMode?: (v: 'gold' | 'colored') => void;
  onOpenFull?: () => void;
  onClose: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
/** 29111998 0805 → 29/11/1998 08:05 */
const mask = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 12);
  let o = d.slice(0, 2);
  if (d.length > 2) o += '/' + d.slice(2, 4);
  if (d.length > 4) o += '/' + d.slice(4, 8);
  if (d.length > 8) o += ' ' + d.slice(8, 10);
  if (d.length > 10) o += ':' + d.slice(10, 12);
  return o;
};
const parse = (v: string): Date | null => {
  const d = v.replace(/\D/g, '');
  if (d.length < 8) return null;
  const D = +d.slice(0, 2), M = +d.slice(2, 4), Y = +d.slice(4, 8), h = d.length >= 10 ? +d.slice(8, 10) : 12, m = d.length >= 12 ? +d.slice(10, 12) : 0;
  if (D < 1 || D > 31 || M < 1 || M > 12 || Y < 1 || Y > 3000 || h > 23 || m > 59) return null;
  const out = new Date(Y, M - 1, D, h, m, 0);
  return out.getDate() === D ? out : null;
};
const savedWhen = (map: any) => { const raw = map.natalDate || map.targetDate || map.date; const d = raw ? new Date(raw) : null; return d && !isNaN(d.getTime()) ? d : null; };

export const NatalPopoverBody: React.FC<Props> = (p) => {
  const [tab, setTab] = useState<'saved' | 'type'>(p.savedMaps?.length ? 'saved' : 'type');
  const [q, setQ] = useState('');
  const [when, setWhen] = useState('');
  const [city, setCity] = useState('');
  const [loc, setLoc] = useState<Loc | null>(null);
  const [err, setErr] = useState('');
  const { results, isLoading } = useLocationSearch(loc ? '' : city);

  const saved = useMemo(() => (p.savedMaps ?? [])
    .filter(m => !q.trim() || String(m.name || '').toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR', { sensitivity: 'base' })), [p.savedMaps, q]);

  const apply = () => {
    const d = parse(when);
    if (!d) { setErr('Digite dia, mês e ano (a hora é opcional).'); return; }
    if (!loc) { setErr('Escolha a cidade de nascimento na lista.'); return; }
    setErr('');
    p.onApply(d, loc);
  };

  return (
    <div className={`npb ${p.isLight ? 'is-light' : ''}`}>
      <style>{CSS}</style>
      <div className="npb-head">
        <h3>Mapa natal</h3>
        <button type="button" className="npb-x" onClick={p.onClose} aria-label="Fechar">×</button>
      </div>

      {p.natalTime ? (
        <div className="npb-active">
          <span className="npb-lbl">Ativo</span>
          <b>{fmt(p.natalTime)}</b>
          <small>{p.natalLocationName || 'Local não informado'}</small>
          {p.onClear && <button type="button" onClick={p.onClear}>Remover</button>}
        </div>
      ) : (
        <p className="npb-hint">O mapa de nascimento fica por baixo, e o céu de agora gira por cima.</p>
      )}

      <div className="npb-seg" role="tablist" aria-label="Como adicionar">
        <button type="button" role="tab" aria-selected={tab === 'saved'} className={tab === 'saved' ? 'on' : ''} onClick={() => setTab('saved')}>Mapa salvo</button>
        <button type="button" role="tab" aria-selected={tab === 'type'} className={tab === 'type' ? 'on' : ''} onClick={() => setTab('type')}>Digitar</button>
      </div>

      {tab === 'saved' ? (
        <div className="npb-saved" data-tour="natal-saved">
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar mapa salvo" aria-label="Buscar mapa salvo" />
          <div className="npb-list">
            {(p.savedMaps ?? []).length === 0 && <p className="npb-empty">Nenhum mapa salvo ainda. Use “Digitar”.</p>}
            {saved.map(m => {
              const d = savedWhen(m);
              const place = (m.natalDate ? (m.natalLocation || m.location) : (m.location || m.natalLocation))?.displayName;
              return (
                <button key={m.id || m.name} type="button" onClick={() => p.onUseSavedNatal?.(m)}>
                  <span className="nm">{m.name || 'Mapa sem nome'}</span>
                  <span className="dt">{d ? fmt(d) : '—'}{place ? ` · ${String(place).split(',')[0]}` : ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="npb-type">
          <label className="npb-lbl" htmlFor="npb-when">Data e hora de nascimento</label>
          <input id="npb-when" inputMode="numeric" value={when} onChange={e => { setWhen(mask(e.target.value)); setErr(''); }}
            onKeyDown={e => { if (e.key === 'Enter') apply(); }} placeholder="29/11/1998 08:05" autoComplete="off" className="mono" />
          <label className="npb-lbl" htmlFor="npb-city">Cidade de nascimento</label>
          <div className="npb-city">
            <input id="npb-city" value={loc ? loc.displayName.split(',').slice(0, 2).join(',') : city}
              onChange={e => { setLoc(null); setCity(e.target.value); setErr(''); }} placeholder="Busque a cidade" autoComplete="off" />
            {loc && <button type="button" onClick={() => { setLoc(null); setCity(''); }} aria-label="Trocar cidade">×</button>}
          </div>
          {!loc && city.trim().length >= 2 && (
            <div className="npb-list" role="listbox" aria-label="Cidades">
              {isLoading && <p className="npb-empty">Buscando…</p>}
              {!isLoading && results.length === 0 && <p className="npb-empty">Nenhuma cidade encontrada.</p>}
              {results.map((r: LocationResult) => (
                <button key={`${r.latitude},${r.longitude}`} type="button" role="option" aria-selected={false} onClick={() => { setLoc(r); setErr(''); }}>
                  <span className="nm">{r.displayName.split(',')[0]}</span>
                  <span className="dt">{r.displayName.split(',').slice(1, 3).join(',')}</span>
                </button>
              ))}
            </div>
          )}
          {!loc && !city && p.currentLocation && (
            <button type="button" className="npb-link" onClick={() => setLoc(p.currentLocation!)}>Usar {p.currentLocation.displayName.split(',')[0]}</button>
          )}
          {err && <p className="npb-err" role="alert">{err}</p>}
          <button type="button" className="npb-apply" onClick={apply}>Aplicar mapa natal</button>
        </div>
      )}

      <div className="npb-opts">
        <label className="npb-row">
          <span>Linhas natais</span>
          <button type="button" role="switch" aria-checked={!!p.showNatalLines} className={`npb-sw ${p.showNatalLines ? 'on' : ''}`} onClick={p.onToggleLines}><i /></button>
        </label>
        <div className="npb-row">
          <span>Cor dos astros natais</span>
          <div className="npb-seg sm">
            <button type="button" className={(p.natalColorMode || 'gold') === 'gold' ? 'on' : ''} onClick={() => p.onColorMode?.('gold')}>Dourado</button>
            <button type="button" className={p.natalColorMode === 'colored' ? 'on' : ''} onClick={() => p.onColorMode?.('colored')}>Colorido</button>
          </div>
        </div>
      </div>
      {p.onOpenFull && <button type="button" className="npb-link" onClick={p.onOpenFull}>Mais ajustes do mapa natal</button>}
    </div>
  );
};

const CSS = `
.npb{--fg:#EDE9E3;--hi:#FAF6EE;--mut:#B9B4BE;--dim:#8a8590;--line:#221d27;--line2:#2a2430;--in:#040004;font-family:'DM Sans',system-ui,sans-serif;color:var(--fg);display:flex;flex-direction:column;gap:10px}
.npb.is-light{--fg:#231714;--hi:#140c0a;--mut:#4b4038;--dim:#6b6253;--line:rgba(35,23,20,.12);--line2:rgba(35,23,20,.2);--in:#fff}
.npb *,.npb *::before,.npb *::after{box-sizing:border-box}
.npb.is-light .npb-active .npb-lbl{color:#8a6d1a}
.npb.is-light .npb-active{border-color:rgba(138,109,26,.45);background:rgba(212,175,55,.08)}
.npb.is-light .npb-sw.on{background:rgba(138,109,26,.3)}
.npb.is-light .npb-sw.on i{background:#8a6d1a}
.npb-head{display:flex;align-items:center;justify-content:space-between}
.npb-head h3{margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:24px;line-height:1;color:var(--hi)}
.npb-x{width:28px;height:28px;border-radius:50%;border:0;background:none;color:var(--dim);font-size:18px;cursor:pointer}
.npb-x:hover{color:var(--hi);background:rgba(127,127,127,.12)}
.npb-hint{margin:0;font-size:12.5px;line-height:1.45;color:var(--dim)}
.npb-lbl{display:block;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);font-weight:600}
.npb-active{display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center;padding:10px 12px;border-radius:14px;border:1px solid rgba(212,175,55,.45);background:rgba(212,175,55,.06)}
.npb-active .npb-lbl{grid-column:1;color:#D4AF37}
.npb-active b{grid-column:1;font-family:'DM Mono',monospace;font-weight:500;font-size:13px;color:var(--hi)}
.npb-active small{grid-column:1;font-size:11.5px;color:var(--mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.npb-active button{grid-column:2;grid-row:1/4;height:30px;padding:0 12px;border-radius:999px;border:1px solid var(--line2);background:none;color:var(--fg);font-size:11.5px;cursor:pointer}
.npb-active button:hover{border-color:#fca5a5;color:#fca5a5}
.npb-seg{display:flex;gap:3px;padding:3px;border:1px solid var(--line2);border-radius:999px}
.npb-seg button{flex:1;height:28px;border:0;border-radius:999px;background:none;color:var(--mut);font:500 12px 'DM Sans',sans-serif;cursor:pointer}
.npb-seg button.on{background:var(--fg);color:var(--in)}
.npb-seg.sm button{height:24px;font-size:11px;padding:0 10px}
.npb input{width:100%;height:36px;padding:0 12px;border-radius:12px;border:1px solid var(--line2);background:var(--in);color:var(--hi);font:13px 'DM Sans',sans-serif;outline:0}
.npb input.mono{font-family:'DM Mono',monospace;letter-spacing:.02em}
.npb input:focus{border-color:var(--fg)}
.npb-type{display:flex;flex-direction:column;gap:6px}
.npb-type .npb-lbl{margin-top:4px}
.npb-city{position:relative}
.npb-city button{position:absolute;right:6px;top:6px;width:24px;height:24px;border-radius:50%;border:0;background:none;color:var(--dim);font-size:16px;cursor:pointer}
.npb-list{max-height:190px;overflow-y:auto;display:flex;flex-direction:column;gap:1px;border:1px solid var(--line);border-radius:12px;padding:4px;margin-top:6px}
.npb-list button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:7px 9px;border:0;border-radius:9px;background:none;color:var(--fg);text-align:left;cursor:pointer}
.npb-list button:hover{background:rgba(127,127,127,.12)}
.npb-list .nm{font-size:12.5px;font-weight:600;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.npb-list .dt{font-family:'DM Mono',monospace;font-size:10.5px;color:var(--dim);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.npb-empty{margin:6px;font-size:11.5px;color:var(--dim)}
.npb-err{margin:2px 0 0;font-size:11.5px;color:#fca5a5}
.npb.is-light .npb-err{color:#b91c1c}
.npb-apply{margin-top:6px;height:38px;border-radius:999px;border:0;background:var(--fg);color:var(--in);font:600 13px 'DM Sans',sans-serif;cursor:pointer}
.npb-apply:hover{filter:brightness(1.08)}
.npb-link{align-self:flex-start;border:0;background:none;padding:2px 0;color:var(--mut);font-size:12px;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.npb-opts{border-top:1px solid var(--line);padding-top:10px;display:flex;flex-direction:column;gap:8px}
.npb-row{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12.5px;color:var(--mut)}
.npb-sw{width:32px;height:18px;border-radius:999px;border:0;background:var(--line2);position:relative;cursor:pointer}
.npb-sw i{position:absolute;top:3px;left:3px;width:12px;height:12px;border-radius:50%;background:var(--dim);transition:transform .15s}
.npb-sw.on{background:color-mix(in srgb,#D4AF37 40%,transparent)}
.npb-sw.on i{transform:translateX(14px);background:#D4AF37}
.npb button:focus-visible,.npb input:focus-visible{outline:2px solid var(--fg);outline-offset:2px}
`;
