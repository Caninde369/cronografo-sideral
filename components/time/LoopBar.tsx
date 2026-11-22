/**
 * Barra do loop na linha do tempo (mockup aprovado).
 * Liga/desliga sem apagar os pontos · A e B editáveis (data e hora) · presets de duração · × apaga.
 */
import React, { useEffect, useRef, useState } from 'react';

const DAY = 864e5;
const PRESETS: Array<[string, number]> = [['1 dia', 1], ['7 dias', 7], ['Lunação', 29.530589], ['Signo', 30.44]];

interface Props {
  isLight: boolean;
  loopOn: boolean;
  a: Date | null;
  b: Date | null;
  now: Date;
  onToggle: () => void;
  onSetRange: (a: Date, b: Date) => void;
  onSetA: (d: Date) => void;
  onSetB: (d: Date) => void;
  onClear: () => void;
}

const p2 = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${p2(d.getDate())}/${p2(d.getMonth() + 1)} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
const iso = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
const fmtDur = (ms: number) => {
  const d = ms / DAY;
  if (d < 1) return `${Math.max(1, Math.round(ms / 36e5))} h`;
  const r = Math.round(d * 10) / 10;
  return `${String(r).replace('.', ',')} ${r >= 2 ? 'dias' : 'dia'}`;
};

export const LoopBar: React.FC<Props> = ({ isLight, loopOn, a, b, now, onToggle, onSetRange, onSetA, onSetB, onClear }) => {
  const [edit, setEdit] = useState<'a' | 'b' | null>(null);
  const [val, setVal] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const has = !!(a || b);
  const dur = a && b ? Math.abs(b.getTime() - a.getTime()) : 0;

  useEffect(() => {
    if (!edit) return;
    const onDown = (e: PointerEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setEdit(null); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setEdit(null); };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('keydown', onKey); };
  }, [edit]);

  const openEdit = (k: 'a' | 'b') => {
    const d = (k === 'a' ? a : b) || now;
    setVal(iso(d));
    setEdit(edit === k ? null : k);
  };
  const save = (d: Date | null) => {
    if (!d || isNaN(d.getTime()) || !edit) return;
    if (edit === 'a') { if (b && d.getTime() > b.getTime()) onSetRange(b, d); else onSetA(d); }
    else { if (a && d.getTime() < a.getTime()) onSetRange(d, a); else onSetB(d); }
    setEdit(null);
  };
  const preset = (days: number) => {
    const start = a || now;
    onSetRange(start, new Date(start.getTime() + days * DAY));
  };
  const activePreset = dur ? PRESETS.find(([, d]) => Math.abs(dur - d * DAY) < 36e5)?.[1] : undefined;

  return (
    <div ref={wrapRef} data-tour="loop-chip" data-complete={a && b ? 'true' : 'false'} data-on={loopOn ? 'true' : 'false'}
      className={`lpb ${isLight ? 'is-light' : ''} ${has ? 'has' : ''} ${loopOn ? 'on' : ''}`}>
      <style>{CSS}</style>
      <button type="button" className="lpb-sw" data-tour="loop-toggle" aria-pressed={loopOn} onClick={onToggle}
        title={loopOn ? 'Desligar o loop (os pontos ficam guardados)' : 'Ligar o loop'}>
        <i />Loop
      </button>
      {has && (
        <>
          <div className="lpb-pts">
            <button type="button" className="lpb-pt a" data-tour="loop-a" aria-haspopup="dialog" aria-expanded={edit === 'a'} onClick={() => openEdit('a')} title="Editar o ponto A">
              <span className="k">A</span><span>{a ? fmt(a) : '—'}</span>
            </button>
            <span className="lpb-arrow" aria-hidden="true">→</span>
            <button type="button" className="lpb-pt b" data-tour="loop-b" aria-haspopup="dialog" aria-expanded={edit === 'b'} onClick={() => openEdit('b')} title="Editar o ponto B">
              <span className="k">B</span><span>{b ? fmt(b) : '—'}</span>
            </button>
            {dur > 0 && <span className="lpb-dur">{fmtDur(dur)}</span>}
          </div>
          <div className="lpb-presets" role="group" aria-label="Duração do loop" data-tour="loop-presets">
            {PRESETS.map(([label, d]) => (
              <button key={label} type="button" className={activePreset === d ? 'on' : ''} onClick={() => preset(d)}>{label}</button>
            ))}
          </div>
          <button type="button" className="lpb-x" data-tour="loop-close" onClick={onClear} title="Apagar o loop" aria-label="Apagar o loop">×</button>
        </>
      )}
      {edit && (
        <div className="lpb-edit" role="dialog" aria-label={`Editar ponto ${edit.toUpperCase()}`}>
          <label htmlFor="lpb-dt">Ponto {edit.toUpperCase()} · data e hora</label>
          <input id="lpb-dt" type="datetime-local" value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(new Date(val)); }} autoFocus />
          <div className="row">
            <button type="button" onClick={() => save(new Date(now.getTime()))}>Usar o instante atual</button>
            <button type="button" className="p" onClick={() => save(new Date(val))}>Salvar</button>
          </div>
        </div>
      )}
    </div>
  );
};

const CSS = `
.lpb{--fg:#EDE9E3;--hi:#FAF6EE;--mut:#B9B4BE;--dim:#8a8590;--line:#2a2430;--bg:#0a070c;--in:#040004;--a:#22D3EE;--b:#F472B6;position:relative;display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-family:'DM Sans',system-ui,sans-serif;user-select:none}
.lpb *,.lpb *::before,.lpb *::after{box-sizing:border-box}
.lpb.is-light{--fg:#231714;--hi:#140c0a;--mut:#4b4038;--dim:#6b6253;--line:rgba(35,23,20,.2);--bg:#fbf9f4;--in:#fff;--a:#0891B2;--b:#DB2777}
.lpb-sw{display:inline-flex;align-items:center;gap:7px;height:26px;padding:0 10px 0 6px;border-radius:999px;border:1px solid var(--line);background:none;color:var(--mut);font:600 10.5px 'DM Sans',sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
.lpb-sw i{width:24px;height:14px;border-radius:999px;background:var(--line);position:relative;transition:background .15s}
.lpb-sw i::after{content:"";position:absolute;top:2px;left:2px;width:10px;height:10px;border-radius:50%;background:var(--dim);transition:transform .15s,background .15s}
.lpb-sw:hover{color:var(--fg);border-color:var(--fg)}
.lpb-sw[aria-pressed="true"]{color:var(--hi);border-color:var(--fg)}
.lpb-sw[aria-pressed="true"] i::after{transform:translateX(10px);background:var(--hi)}
.lpb-pts{display:flex;align-items:center;gap:4px;transition:opacity .2s}
.lpb:not(.on) .lpb-pts,.lpb:not(.on) .lpb-presets{opacity:.55}
.lpb-pt{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 8px 0 4px;border-radius:999px;border:1px solid var(--line);background:none;color:var(--fg);font:11px 'DM Mono',monospace;cursor:pointer}
.lpb-pt:hover,.lpb-pt[aria-expanded="true"]{border-color:var(--fg)}
.lpb-pt .k{width:17px;height:17px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font:700 9.5px 'DM Sans',sans-serif;color:#040004}
.lpb.is-light .lpb-pt .k{color:#fff}
.lpb-pt.a .k{background:var(--a)}.lpb-pt.b .k{background:var(--b)}
.lpb-arrow{color:var(--dim);font-size:11px}
.lpb-dur{font:10.5px 'DM Mono',monospace;color:var(--dim);padding:0 2px}
.lpb-presets{display:flex;gap:3px;flex-wrap:wrap}
.lpb-presets button{height:24px;padding:0 9px;border-radius:999px;border:1px solid var(--line);background:none;color:var(--mut);font:500 10.5px 'DM Sans',sans-serif;cursor:pointer}
.lpb-presets button:hover{color:var(--fg);border-color:var(--fg)}
.lpb-presets button.on{background:var(--fg);color:var(--in);border-color:var(--fg)}
.lpb-x{width:24px;height:24px;border-radius:50%;border:0;background:none;color:var(--dim);font-size:15px;line-height:1;cursor:pointer}
.lpb-x:hover{color:#fca5a5;background:rgba(239,68,68,.12)}
.lpb.is-light .lpb-x:hover{color:#b91c1c}
.lpb-edit{position:absolute;bottom:calc(100% + 8px);left:0;z-index:80;width:250px;padding:12px;border-radius:14px;border:1px solid var(--line);background:var(--bg);box-shadow:0 20px 50px -12px rgba(0,0,0,.7)}
.lpb-edit label{display:block;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);margin-bottom:6px;font-weight:600}
.lpb-edit input{width:100%;height:32px;padding:0 10px;border-radius:9px;border:1px solid var(--line);background:var(--in);color:var(--hi);font:12.5px 'DM Mono',monospace;color-scheme:dark;outline:0}
.lpb.is-light .lpb-edit input{color-scheme:light}
.lpb-edit input:focus{border-color:var(--fg)}
.lpb-edit .row{display:flex;gap:6px;margin-top:8px}
.lpb-edit .row button{flex:1;height:30px;border-radius:999px;border:1px solid var(--line);background:none;color:var(--fg);font:500 11px 'DM Sans',sans-serif;cursor:pointer}
.lpb-edit .row button.p{background:var(--fg);color:var(--in);border-color:var(--fg)}
/* Celular: sem botão Loop e sem durações; só os pontos e o × se um loop já existir */
body.is-mobile .lpb-sw,body.is-mobile .lpb-presets,body.is-mobile .lpb:not(.has){display:none!important}
.lpb button:focus-visible,.lpb input:focus-visible{outline:2px solid var(--fg);outline-offset:2px}
`;
