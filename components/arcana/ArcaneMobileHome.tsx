/**
 * Início do Calendário Arcano no celular (abaixo de 640px).
 * Segue o esquema do Rafa (planilha do Quarto Místico, 21/11/2026): nome, dados do nascimento em uma linha,
 * barra da jornada, data de leitura, as três cartas (Ano, Mês, Dia) lado a lado e a Leitura em colunas.
 * Identidade do Cronógrafo (escopo .arc-skin).
 */
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
  return (
    <div className="amh">
      <style>{CSS}</style>

      <div className="amh-name">
        <span className="amh-lbl">Nome completo</span>
        <div className="amh-pick">{p.personPicker}<button type="button" className="arc-novo" onClick={p.onNew}>Novo</button></div>
      </div>

      <dl className="amh-stats">
        <div><dt>Nascimento</dt><dd>{dmy(p.birthDate)}</dd></div>
        <div><dt>Semana</dt><dd>{weekdayOf(p.birthDate)}</dd></div>
        <div><dt>Dias</dt><dd>{p.totalDays}</dd></div>
        <div><dt>Anos</dt><dd>{(p.totalDays / 365.25).toFixed(1).replace('.', ',')}</dd></div>
        <div><dt>Arcano</dt><dd className="hi">{p.personalArcane}</dd></div>
      </dl>

      <div className="amh-bar" role="progressbar" aria-valuenow={Math.round(p.progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Jornada">
        <i style={{ width: `${p.progress}%` }} />
      </div>

      <div className="amh-read">
        <label className="amh-date">
          <span className="amh-lbl">Data de leitura · {weekdayOf(p.readDate)}</span>
          <span className="amh-date-row">
            <input type="date" value={p.readDate} onChange={e => e.target.value && p.onReadDate(e.target.value)} />
            <button type="button" onClick={p.onToday}>Hoje</button>
          </span>
        </label>
        <div className="amh-kpi"><span className="amh-lbl">Dias para<br />concluir a jornada</span><b>{p.daysRemaining}</b></div>
        <div className="amh-kpi"><span className="amh-lbl">Jornadas<br />completas</span><b>{p.journeys}</b></div>
      </div>

      <div className="amh-cards">
        {cards.map(c => (
          <button key={c.k} type="button" className="amh-card" onClick={() => p.onSelectCard(c)} aria-label={`${c.k}: ${c.arcano.name}`}>
            <span className="amh-card-head"><span className="k">{c.k}</span><span className="n">{c.val}</span></span>
            <span className="amh-img">
              <img src={c.arcano.image} alt="" referrerPolicy="no-referrer" crossOrigin="anonymous" decoding="async"
                onError={e => { if (c.arcano.backupImage && e.currentTarget.src !== c.arcano.backupImage) e.currentTarget.src = c.arcano.backupImage; }} />
            </span>
            <span className="amh-card-name">{c.arcano.name}</span>
          </button>
        ))}
      </div>

      <section className="amh-reading" aria-label="Leitura">
        <h3>Leitura</h3>
        <div className="amh-table">
          <span className="amh-side">Força</span>
          {cards.map(c => (
            <div key={c.k} className="amh-colcell">
              <b>{c.arcano.keywords[0]}</b>
              <ul>{c.arcano.keywords.slice(1).map(k => <li key={k}>{k}</li>)}</ul>
            </div>
          ))}
          <span className="amh-side">Conselho</span>
          {cards.map(c => (
            <div key={c.k} className="amh-colcell amh-advice"><p>“{c.arcano.advice}”</p></div>
          ))}
        </div>
      </section>
    </div>
  );
};

const CSS = `
.amh{display:flex;flex-direction:column;gap:12px;padding:2px 0 16px}
.amh-lbl{display:block;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--a-faint,#6f6a76);font-weight:600}
.amh-name .amh-lbl{margin:0 0 5px 2px}
.amh-pick{display:flex;align-items:center;gap:8px}
.amh-pick>div:first-child{flex:1 1 0;min-width:0}
.amh-pick .arc-novo{flex:none;padding:0 14px}
.amh-pick #btn-consulentes-list-toggle{width:100%;justify-content:flex-start;height:38px;border-radius:999px;padding:0 14px}
.amh-pick #btn-consulentes-list-toggle span{max-width:none!important}
.amh-pick .arc-novo{height:38px}
.amh-stats{display:grid;grid-template-columns:1.35fr .8fr 1fr .8fr .8fr;gap:6px;margin:0;padding:10px 12px;border:1px solid var(--a-line,#221d27);border-radius:16px;background:var(--a-card,#0a070c)}
.amh-stats dt{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--a-faint,#6f6a76);margin-bottom:3px;white-space:nowrap}
.amh-stats dd{margin:0;font-family:'DM Mono',ui-monospace,monospace;font-size:13px;color:var(--a-hi,#FAF6EE);white-space:nowrap}
.amh-stats dd.hi{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:20px;line-height:.9}
.amh-bar{height:5px;border-radius:3px;background:var(--a-line,#221d27);overflow:hidden}
.amh-bar i{display:block;height:100%;border-radius:3px;background:var(--a-spec)}
.amh-read{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:stretch}
.amh-read .amh-date{grid-column:1/-1;flex-direction:row;align-items:center}
.amh-read .amh-date .amh-lbl{flex:1}
.amh-date,.amh-kpi{display:flex;flex-direction:column;justify-content:space-between;gap:6px;padding:9px 10px;border:1px solid var(--a-line,#221d27);border-radius:14px;background:var(--a-card,#0a070c)}
.amh-date-row{display:flex;align-items:center;gap:6px}
.amh-date input{flex:1;min-width:0;height:30px;padding:0 6px;border-radius:8px;border:1px solid var(--a-line2,#2a2430);background:var(--a-bg,#040004);color:var(--a-hi,#FAF6EE);font:12px 'DM Mono',monospace}
.amh-date button{height:30px;padding:0 9px;border-radius:999px;border:1px solid var(--a-line2,#2a2430);background:none;color:var(--a-fg,#EDE9E3);font:600 10px 'DM Sans',sans-serif;letter-spacing:.1em;text-transform:uppercase}
.amh-kpi b{font-family:'DM Mono',monospace;font-weight:500;font-size:20px;color:var(--a-hi,#FAF6EE);line-height:1}
.amh-kpi{flex-direction:row;align-items:center}
.amh-kpi .amh-lbl{font-size:8.5px;letter-spacing:.1em;line-height:1.35}
.amh-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.amh-card{display:flex;flex-direction:column;gap:6px;padding:0;border:0;background:none;color:inherit;text-align:left;cursor:pointer;min-width:0}
.amh-card-head{display:flex;align-items:baseline;justify-content:space-between;padding:0 2px}
.amh-card-head .k{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--a-dim,#8a8590);font-weight:600}
.amh-card-head .n{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:30px;line-height:.8;color:var(--a-hi,#FAF6EE)}
.amh-img{position:relative;display:block;aspect-ratio:2/3.3;border-radius:12px;overflow:hidden;border:1px solid var(--a-line2,#2a2430);background:#000}
.amh-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.amh-card-name{font-size:12px;font-weight:600;text-align:center;color:var(--a-hi,#FAF6EE);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.amh-card:focus-visible .amh-img{outline:2px solid var(--a-fg,#EDE9E3);outline-offset:2px}
.amh-reading h3{margin:6px 0 8px;text-align:center;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:30px;color:var(--a-hi,#FAF6EE)}
.amh-table{display:grid;grid-template-columns:18px repeat(3,minmax(0,1fr));gap:1px;background:var(--a-line,#221d27);border:1px solid var(--a-line,#221d27);border-radius:14px;overflow:hidden}
.amh-side{writing-mode:vertical-rl;transform:rotate(180deg);display:flex;align-items:center;justify-content:center;background:var(--a-bg,#040004);font-size:8.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--a-faint,#6f6a76);font-weight:600}
.amh-colcell{background:var(--a-card,#0a070c);padding:8px 8px 10px;min-width:0}
.amh-colcell b{display:block;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:17px;line-height:1.1;color:var(--a-hi,#FAF6EE);margin-bottom:5px}
.amh-colcell ul{list-style:none;margin:0;padding:0;font-size:11px;line-height:1.45;color:var(--a-mut,#B9B4BE)}
.amh-advice p{margin:0;font-size:11px;line-height:1.45;font-style:italic;color:var(--a-fg,#EDE9E3)}
`;
