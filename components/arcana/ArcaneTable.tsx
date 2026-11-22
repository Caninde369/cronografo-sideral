/**
 * Mesa: compara Jornada, Ano, Mês e Dia de várias pessoas na mesma data.
 * Uma linha compacta por pessoa, colunas fixas, pessoas escolhidas por busca
 * com lista de busca, filtros e limpar seleção.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Arcanum } from './tarot';
import type { Person } from './SlimPersonManager';

type Detail = { jornada: number; ano: number; mes: number; dia: number };
const COLS: { key: keyof Detail; label: string }[] = [
  { key: 'jornada', label: 'Jornada' }, { key: 'ano', label: 'Ano' }, { key: 'mes', label: 'Mês' }, { key: 'dia', label: 'Dia' },
];

interface Props {
  persons: Person[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  /** tira todo mundo da mesa */
  onClear: () => void;
  readDateLabel: string;
  getArcano: (n: number) => Arcanum;
  detail: (birthDate: string) => Detail;
  personal: (birthDate: string) => number;
  toRoman: (n: number) => string;
  onOpenCard: (arcano: Arcanum, context: string, value: number) => void;
}

const Thumb: React.FC<{ a: Arcanum; w: number }> = ({ a, w }) => (
  <span className="mt-thumb" style={{ width: w }}>
    <img src={a.image} alt="" referrerPolicy="no-referrer" crossOrigin="anonymous" decoding="async" loading="lazy"
      onError={e => { if (a.backupImage && e.currentTarget.src !== a.backupImage) e.currentTarget.src = a.backupImage; }} />
  </span>
);

export const ArcaneTable: React.FC<Props> = ({ persons, selectedIds, onToggle, onClear, readDateLabel, getArcano, detail, personal, toRoman, onOpenCard }) => {
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState<'az' | 'recent'>('az');
  const [show, setShow] = useState<'all' | 'in' | 'out'>('all');
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adding) return;
    const off = (e: MouseEvent) => { if (popRef.current && !popRef.current.contains(e.target as Node)) setAdding(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAdding(false); };
    document.addEventListener('mousedown', off); window.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); window.removeEventListener('keydown', esc); };
  }, [adding]);

  const rows = useMemo(() => selectedIds
    .map(id => persons.find(p => p.id === id))
    .filter((p): p is Person => !!p)
    .map(p => ({ p, d: detail(p.birthDate), pa: personal(p.birthDate) })), [selectedIds, persons, detail, personal]);

  // Lista do botão Adicionar: todos os consulentes, com busca, filtro e ordem
  const when = (p: Person) => { const n = Number(p.id); return isFinite(n) ? n : 0; };
  const listed = persons
    .filter(p => !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()))
    .filter(p => show === 'all' || (show === 'in' ? selectedIds.includes(p.id) : !selectedIds.includes(p.id)))
    .sort((a, b) => sortBy === 'az' ? a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }) : when(b) - when(a));

  return (
    <div className="mt h-full flex flex-col min-h-0">
      <style>{CSS}</style>

      <div className="mt-bar">
        <div className="mt-title">
          <h3>Mesa</h3>
          <span>{readDateLabel} · {rows.length} {rows.length === 1 ? 'pessoa' : 'pessoas'}</span>
        </div>
        <div className="mt-chips">
          {rows.map(({ p }) => (
            <span key={p.id} className="mt-chip">
              {p.name.split(' ')[0]}
              <button type="button" onClick={() => onToggle(p.id)} aria-label={`Tirar ${p.name} da mesa`} title="Tirar da mesa">×</button>
            </span>
          ))}
          <div className="mt-add" ref={popRef}>
            <button type="button" className="mt-addbtn" onClick={() => setAdding(v => !v)} aria-expanded={adding}>+ Adicionar pessoa</button>
            {adding && (
              <div className="mt-pop" role="dialog" aria-label="Escolher pessoas da mesa">
                <label className="mt-lbl" htmlFor="mt-q">Buscar pessoa</label>
                <input id="mt-q" autoFocus type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Nome" autoComplete="off" />
                <div className="mt-seg" role="radiogroup" aria-label="Mostrar">
                  {([['all', 'Todos'], ['in', 'Na mesa'], ['out', 'Fora']] as const).map(([v, l]) => (
                    <button key={v} type="button" role="radio" aria-checked={show === v} className={show === v ? 'on' : ''} onClick={() => setShow(v)}>{l}</button>
                  ))}
                </div>
                <div className="mt-seg" role="radiogroup" aria-label="Ordenar">
                  {([['az', 'A–Z'], ['recent', 'Mais recentes']] as const).map(([v, l]) => (
                    <button key={v} type="button" role="radio" aria-checked={sortBy === v} className={sortBy === v ? 'on' : ''} onClick={() => setSortBy(v)}>{l}</button>
                  ))}
                </div>
                <div className="mt-list" role="listbox" aria-multiselectable="true" aria-label="Pessoas">
                  {listed.length === 0 && <p className="mt-empty">Ninguém por aqui.</p>}
                  {listed.map(p => {
                    const inT = selectedIds.includes(p.id);
                    return (
                      <button key={p.id} type="button" role="option" aria-selected={inT} className={inT ? 'is-in' : ''} onClick={() => onToggle(p.id)}>
                        <span className="mt-check" aria-hidden="true">{inT ? '✓' : ''}</span>
                        <span className="mt-ln">{p.name}</span><small>{toRoman(personal(p.birthDate))}</small>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-popfoot">
                  <span>{selectedIds.length} na mesa</span>
                  <button type="button" onClick={onClear} disabled={selectedIds.length === 0}>Limpar seleção</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-zero">
          <p>Adicione duas ou mais pessoas para comparar os arcanos na mesma data.</p>
        </div>
      ) : (
        <div className="mt-scroll">
          <div className="mt-grid" role="table" aria-label="Arcanos de cada pessoa">
            <div className="mt-head" role="row">
              <span role="columnheader">Pessoa</span>
              {COLS.map(c => <span key={c.key} role="columnheader">{c.label}</span>)}
            </div>
            {rows.map(({ p, d, pa }) => {
              const pArc = getArcano(pa);
              return (
                <div key={p.id} className="mt-row" role="row">
                  <button type="button" className="mt-person" role="cell" onClick={() => onOpenCard(pArc, `${p.name} · Arcano pessoal`, pa)} title={`${p.name} · arcano pessoal ${pArc.name}`}>
                    <Thumb a={pArc} w={34} />
                    <span className="mt-pname"><b>{p.name}</b><small>Pessoal <i>{toRoman(pa)}</i> · {pArc.name}</small></span>
                  </button>
                  {COLS.map(c => {
                    const v = d[c.key];
                    const a = getArcano(v);
                    return (
                      <button key={c.key} type="button" role="cell" className="mt-cell"
                        onClick={() => onOpenCard(a, `${p.name} · ${c.label}`, v)} title={`${c.label}: ${a.name}`}>
                        <Thumb a={a} w={40} />
                        <span className="mt-cv"><i>{toRoman(v % 22)}</i><small>{a.name}</small></span>
                      </button>
                    );
                  })}
                  <button type="button" className="mt-x" onClick={() => onToggle(p.id)} aria-label={`Tirar ${p.name} da mesa`} title="Tirar da mesa">×</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const CSS = `
.mt-bar{flex:none;display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:10px 12px;border:1px solid var(--a-line,#221d27);border-radius:16px;background:var(--a-card,#0a070c);margin-bottom:10px}
.mt-title{display:flex;align-items:baseline;gap:10px;flex:none}
.mt-title h3{margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:24px;line-height:1;color:var(--a-hi,#FAF6EE)}
.mt-title span{font-family:'DM Mono',monospace;font-size:11.5px;color:var(--a-dim,#8a8590)}
.mt-title b{color:var(--a-hi,#FAF6EE);font-weight:500}
.mt-chips{flex:1;min-width:0;display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.mt-chip{display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 4px 0 12px;border-radius:999px;background:var(--a-fg,#EDE9E3);color:#040004;font-size:12px;font-weight:600}
.mt-chip button{width:20px;height:20px;border-radius:50%;border:0;background:rgba(4,0,4,.08);color:#040004;font-size:14px;line-height:1;cursor:pointer}
.mt-chip button:hover{background:rgba(4,0,4,.18)}
.mt-add{position:relative}
.mt-addbtn{height:28px;padding:0 12px;border-radius:999px;border:1px dashed var(--a-line3,#3a3340);background:none;color:var(--a-mut,#B9B4BE);font-size:12px;cursor:pointer;white-space:nowrap}
.mt-addbtn:hover{border-color:var(--a-fg,#EDE9E3);color:var(--a-hi,#FAF6EE)}
.mt-pop{position:absolute;right:0;top:calc(100% + 6px);z-index:40;width:290px;padding:10px;border-radius:14px;border:1px solid var(--a-line2,#2a2430);background:#0a070c;box-shadow:0 20px 50px -12px rgba(0,0,0,.85)}
.mt-lbl{display:block;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--a-dim,#8a8590);margin:0 0 5px}
.mt-pop input{width:100%;height:32px;padding:0 12px;border-radius:999px;border:1px solid var(--a-line2,#2a2430);background:var(--a-bg,#040004);color:var(--a-hi,#FAF6EE);font:inherit;font-size:12.5px;outline:0}
.mt-pop input:focus{border-color:var(--a-fg,#EDE9E3)}
.mt-list{margin-top:6px;max-height:240px;overflow-y:auto;display:flex;flex-direction:column;gap:1px}
.mt-list button{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;border:0;background:none;color:var(--a-fg,#EDE9E3);font-size:12.5px;text-align:left;cursor:pointer}
.mt-list button:hover{background:rgba(255,255,255,.06)}
.mt-list small{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:15px;color:var(--a-dim,#8a8590)}
.mt-seg{display:flex;gap:3px;margin-top:6px}
.mt-seg button{flex:1;height:26px;border-radius:999px;border:1px solid var(--a-line2,#2a2430);background:none;color:var(--a-mut,#B9B4BE);font-size:11px;cursor:pointer}
.mt-seg button.on{background:var(--a-fg,#EDE9E3);color:#040004;border-color:var(--a-fg,#EDE9E3)}
.mt-list button.is-in{color:var(--a-hi,#FAF6EE)}
.mt-check{flex:none;width:16px;height:16px;border-radius:5px;border:1px solid var(--a-line3,#3a3340);display:inline-flex;align-items:center;justify-content:center;font-size:11px;color:#040004}
.mt-list button.is-in .mt-check{background:var(--a-fg,#EDE9E3);border-color:var(--a-fg,#EDE9E3)}
.mt-ln{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mt-popfoot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid var(--a-line,#221d27);font-size:11.5px;color:var(--a-dim,#8a8590)}
.mt-popfoot button{height:28px;padding:0 12px;border-radius:999px;border:1px solid var(--a-line2,#2a2430);background:none;color:var(--a-fg,#EDE9E3);font-size:11.5px;cursor:pointer}
.mt-popfoot button:hover:not(:disabled){border-color:#fca5a5;color:#fca5a5}
.mt-popfoot button:disabled{opacity:.4;cursor:default}
.mt-empty{margin:6px 4px;font-size:12px;color:var(--a-dim,#8a8590)}
.mt-zero{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:24px;border:1px dashed var(--a-line2,#2a2430);border-radius:16px}
.mt-zero p{margin:0;font-size:13.5px;color:var(--a-fg,#EDE9E3);max-width:34em}
.mt-zero .dim{font-size:12px;color:var(--a-dim,#8a8590)}
.mt-scroll{flex:1;min-height:0;overflow:auto;border:1px solid var(--a-line,#221d27);border-radius:16px}
.mt-grid{min-width:640px}
.mt-head,.mt-row{display:grid;grid-template-columns:minmax(170px,1.3fr) repeat(4,minmax(0,1fr)) 30px;align-items:center}
.mt-head{position:sticky;top:0;z-index:2;background:#0a070c;border-bottom:1px solid var(--a-line,#221d27)}
.mt-head span{padding:9px 10px;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--a-dim,#8a8590);font-weight:600}
.mt-row{border-bottom:1px solid var(--a-line,#221d27)}
.mt-row:last-child{border-bottom:0}
.mt-row:hover{background:rgba(255,255,255,.02)}
.mt-person,.mt-cell{display:flex;align-items:center;gap:9px;min-width:0;padding:8px 10px;border:0;background:none;color:inherit;text-align:left;cursor:pointer;height:100%}
.mt-person:hover .mt-pname b,.mt-cell:hover small{color:var(--a-hi,#FAF6EE)}
.mt-thumb{position:relative;flex:none;aspect-ratio:2/3.2;border-radius:6px;overflow:hidden;border:1px solid var(--a-line2,#2a2430);background:#000}
.mt-thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mt-pname{display:flex;flex-direction:column;min-width:0}
.mt-pname b{font-size:13px;font-weight:600;color:var(--a-fg,#EDE9E3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mt-pname small{font-size:11px;color:var(--a-dim,#8a8590);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mt-pname i{font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;color:var(--a-hi,#FAF6EE)}
.mt-cv{display:flex;flex-direction:column;min-width:0;gap:1px}
.mt-cv i{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:22px;line-height:1;color:var(--a-hi,#FAF6EE)}
.mt-cv small{font-size:11px;color:var(--a-mut,#B9B4BE);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mt-x{width:26px;height:26px;border-radius:50%;border:0;background:none;color:var(--a-faint,#6f6a76);font-size:16px;cursor:pointer;opacity:0}
.mt-row:hover .mt-x,.mt-x:focus-visible{opacity:1}
.mt-x:hover{color:#fca5a5;background:rgba(239,68,68,.1)}
.mt button:focus-visible{outline:2px solid var(--a-fg,#EDE9E3);outline-offset:-2px}
@media (hover:none){.mt-x{opacity:1}}
`;
