/**
 * Início do Calendário Arcano no celular (abaixo de 640px).
 * Segue o esquema do Rafa (planilha do Quarto Místico, 21/11/2026): nome, dados do nascimento em uma linha,
 * barra da jornada, data de leitura, as três cartas (Ano, Mês, Dia) lado a lado e a Leitura em colunas.
 * Identidade do Cronógrafo (escopo .arc-skin).
 */
import { ArcaneDateNav } from './ArcaneDateNav';
import React from 'react';
import type { Arcanum } from './tarot';

interface Pillar { label: string; val: number; arcano: Arcanum }

interface Props {
  personPicker: React.ReactNode;
  onNew: () => void;
  birthDate: string;          // AAAA-MM-DD
  totalDays: number;
  personalArcane: number;
  progress: number;           // 0 a 100
  daysRemaining: number;
  journeys: number;
  readDate: string;           // AAAA-MM-DD
  onReadDate: (v: string) => void;
  onToday: () => void;
  ano: Pillar; mes: Pillar; dia: Pillar;
  onSelectCard: (p: Pillar) => void;
}

const WEEK = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
const dmy = (iso: string) => { const [y, m, d] = iso.split('-'); return d && m && y ? `${d}.${m}.${y}` : iso; };
const weekdayOf = (iso: string) => { const d = new Date(`${iso}T12:00:00`); return isNaN(d.getTime()) ? '' : WEEK[d.getDay()]; };

export const ArcaneMobileHome: React.FC<Props> = (p) => {
  const cards = [{ k: 'Ano', ...p.ano }, { k: 'Mês', ...p.mes }, { k: 'Dia', ...p.dia }];
  // Ano arcano muda no aniversário: ‹‹‹ / ››› pulam para o aniversário anterior / seguinte
  const yearJump = (dir: -1 | 1) => {
    const [by, bm, bd] = p.birthDate.split('-').map(Number);
    const r = new Date(`${p.readDate}T12:00:00`);
    if (!by || isNaN(r.getTime())) return;
    let y = r.getFullYear();
    const bday = (yy: number) => new Date(yy, bm - 1, bd, 12);
    if (bday(y) > r) y -= 1;            // início do ano arcano atual
    const t = bday(y + dir);
    const p2 = (n: number) => String(n).padStart(2, '0');
    p.onReadDate(`${t.getFullYear()}-${p2(t.getMonth() + 1)}-${p2(t.getDate())}`);
  };
  return (
    <div className="amh">
      <style>{CSS}</style>

      <div className="amh-pick">{p.personPicker}<button type="button" className="amh-new" onClick={p.onNew} aria-label="Novo consulente" title="Novo consulente">+</button></div>

      <section className="amh-journey" aria-label="Jornada">
        <dl className="amh-stats">
          <div><dt>Nascimento</dt><dd>{dmy(p.birthDate)}</dd></div>
          <div><dt>Semana</dt><dd>{weekdayOf(p.birthDate)}</dd></div>
          <div><dt>Dias</dt><dd>{p.totalDays}</dd></div>
          <div><dt>Anos</dt><dd>{(p.totalDays / 365.25).toFixed(1).replace('.', ',')}</dd></div>
          <div><dt>Arcano</dt><dd className="hi">{p.personalArcane}</dd></div>
        </dl>
        <div className="amh-jrow">
          <div className="amh-big"><b>{p.daysRemaining}</b><span>dias para<br />concluir</span></div>
          <div className="amh-bar" role="progressbar" aria-valuenow={Math.round(p.progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Jornada">
            <i style={{ width: `${p.progress}%` }} />
          </div>
          <div className="amh-big r"><b>{p.journeys}</b><span>jornadas<br />completas</span></div>
        </div>
      </section>

      <ArcaneDateNav className="amh-datenav" value={p.readDate} onChange={p.onReadDate} label="Data de leitura" bare
        onYearPrev={() => yearJump(-1)} onYearNext={() => yearJump(1)} />

      <section className="amh-table" aria-label="Leitura">
        {cards.map(c => (
          <div key={c.k} className="amh-col">
            <button type="button" className="amh-card" onClick={() => p.onSelectCard(c)} aria-label={`${c.k} ${c.val}: ${c.arcano.name}`}>
              <span className="amh-card-head"><span className="k">{c.k}</span><span className="n">{c.val}</span></span>
              <span className="amh-img">
                <img src={c.arcano.image} alt="" referrerPolicy="no-referrer" crossOrigin="anonymous" decoding="async"
                  onError={e => { if (c.arcano.backupImage && e.currentTarget.src !== c.arcano.backupImage) e.currentTarget.src = c.arcano.backupImage; }} />
              </span>
              <span className="amh-card-name">{c.arcano.name}</span>
            </button>
            <div className="amh-cell">
              <span className="amh-tag">Força</span>
              <b>{c.arcano.keywords[0]}</b>
              <p className="kw">{c.arcano.keywords.slice(1).join(' · ')}</p>
            </div>
            <div className="amh-cell amh-advice">
              <span className="amh-tag">Conselho</span>
              <p>“{c.arcano.advice}”</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

const CSS = `
.amh{display:flex;flex-direction:column;gap:10px;padding:2px 0 16px;min-width:0;max-width:100%;overflow-x:hidden}
.amh-pick{display:flex;align-items:center;gap:8px}
.amh-pick>div:first-child{flex:1 1 0;min-width:0}
.amh-pick #btn-consulentes-list-toggle{width:100%;justify-content:flex-start;height:40px;border-radius:999px;padding:0 14px}
.amh-pick #btn-consulentes-list-toggle span{max-width:none!important}
.amh-new{flex:none;width:40px;height:40px;border-radius:50%;border:1px solid var(--a-line2,#2a2430);background:var(--a-fg,#EDE9E3);color:var(--a-bg,#040004);font:400 24px/1 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;padding:0 0 2px;cursor:pointer}
.amh-journey{display:flex;flex-direction:column;gap:10px;padding:10px 12px 12px;border:1px solid var(--a-line,#221d27);border-radius:16px;background:var(--a-card,#0a070c)}
.amh-stats{display:grid;grid-template-columns:1.35fr .8fr 1fr .8fr .8fr;gap:6px;margin:0}
.amh-stats dt{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--a-faint,#6f6a76);margin-bottom:3px;white-space:nowrap}
.amh-stats dd{margin:0;font-family:'DM Mono',ui-monospace,monospace;font-size:13px;color:var(--a-hi,#FAF6EE);white-space:nowrap}
.amh-stats dd.hi{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:20px;line-height:.9}
.amh-jrow{display:flex;align-items:center;gap:10px;padding-top:10px;border-top:1px solid var(--a-line,#221d27)}
.amh-big{display:flex;align-items:center;gap:6px;flex:none}
.amh-big.r{flex-direction:row-reverse;text-align:right}
.amh-big b{font-family:'DM Mono',ui-monospace,monospace;font-weight:500;font-size:24px;line-height:1;color:var(--a-hi,#FAF6EE)}
.amh-big span{font-size:8.5px;letter-spacing:.1em;line-height:1.3;text-transform:uppercase;color:var(--a-faint,#6f6a76);font-weight:600}
.amh-bar{flex:1 1 auto;min-width:30px;height:7px;background:var(--a-line2,#2a2430);clip-path:polygon(0 50%,7px 0,calc(100% - 7px) 0,100% 50%,calc(100% - 7px) 100%,7px 100%);overflow:hidden}
.amh-bar i{display:block;height:100%;background:var(--a-spec);clip-path:polygon(0 50%,7px 0,calc(100% - 7px) 0,100% 50%,calc(100% - 7px) 100%,7px 100%)}
.amh-table{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--a-line,#221d27);border:1px solid var(--a-line,#221d27);border-radius:14px;overflow:hidden}
.amh-col{display:flex;flex-direction:column;background:var(--a-card,#0a070c);min-width:0}
.amh-card{display:flex;flex-direction:column;align-items:center;gap:6px;padding:9px 6px 8px;border:0;background:none;color:inherit;cursor:pointer;min-width:0}
.amh-card-head{display:flex;align-items:baseline;justify-content:center;gap:6px}
.amh-card-head .k{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--a-dim,#8a8590);font-weight:600}
.amh-card-head .n{font-family:'DM Mono',ui-monospace,monospace;font-size:13px;color:var(--a-hi,#FAF6EE)}
.amh-img{position:relative;display:block;width:100%;max-width:76px;aspect-ratio:74/122;border-radius:8px;overflow:hidden;border:1px solid var(--a-line2,#2a2430);background:#000}
.amh-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.amh-card-name{max-width:100%;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:16px;line-height:1.1;text-align:center;color:var(--a-hi,#FAF6EE);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.amh-card:focus-visible .amh-img{outline:2px solid var(--a-fg,#EDE9E3);outline-offset:2px}
.amh-cell{padding:0 8px 8px;min-width:0}
.amh-tag{display:block;font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--a-faint,#6f6a76);font-weight:600;margin-bottom:4px}
.amh-cell b{display:block;font-size:12px;font-weight:600;line-height:1.25;color:var(--a-hi,#FAF6EE);margin-bottom:2px}
.amh-cell .kw{margin:0;font-size:10.5px;line-height:1.4;color:var(--a-mut,#B9B4BE)}
.amh-advice{margin-top:4px;padding-top:12px;border-top:1px solid var(--a-line,#221d27)}
.amh-advice p{margin:0;font-size:10.5px;line-height:1.45;font-style:italic;color:var(--a-fg,#EDE9E3)}
`;
