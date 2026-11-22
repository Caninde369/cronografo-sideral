/**
 * Navegação da data de leitura no celular (Calendário Arcano).
 * «« −22 · ‹ −1 · [dia da semana + data: toque abre o seletor nativo] · › +1 · »» +22 · Hoje
 * O input nativo fica por cima da data (invisível): o toque abre o calendário do próprio celular.
 */
import React from 'react';

const WEEK = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const p2 = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

interface Props {
  value: string;               // AAAA-MM-DD
  onChange: (v: string) => void;
  label?: string;
  className?: string;
}

export const ArcaneDateNav: React.FC<Props> = ({ value, onChange, label = 'Data de leitura', className = '' }) => {
  const d = new Date(`${value}T12:00:00`);
  const ok = !isNaN(d.getTime());
  const shift = (n: number) => { const x = ok ? new Date(d) : new Date(); x.setDate(x.getDate() + n); onChange(toISO(x)); };
  const today = toISO(new Date());
  return (
    <div className={`adn ${className}`} role="group" aria-label={label}>
      <style>{CSS}</style>
      <span className="adn-lbl">{label}</span>
      <div className="adn-row">
        <button type="button" onClick={() => shift(-22)} aria-label="Voltar 22 dias">«</button>
        <button type="button" onClick={() => shift(-1)} aria-label="Dia anterior">‹</button>
        <label className="adn-date">
          <span className="w">{ok ? WEEK[d.getDay()] : '—'}</span>
          <span className="v">{ok ? `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}` : 'Escolher'}</span>
          <input type="date" value={value} onChange={e => e.target.value && onChange(e.target.value)} aria-label="Escolher a data" />
        </label>
        <button type="button" onClick={() => shift(1)} aria-label="Próximo dia">›</button>
        <button type="button" onClick={() => shift(22)} aria-label="Avançar 22 dias">»</button>
        <button type="button" className={`adn-today ${value === today ? 'on' : ''}`} onClick={() => onChange(today)}>Hoje</button>
      </div>
    </div>
  );
};

const CSS = `
.adn{display:flex;flex-direction:column;gap:6px;padding:9px 10px;border:1px solid var(--a-line,#221d27);border-radius:14px;background:var(--a-card,#0a070c);min-width:0;box-sizing:border-box}
.adn *{box-sizing:border-box}
.adn-lbl{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--a-faint,#6f6a76);font-weight:600}
.adn-row{display:grid;grid-template-columns:32px 32px minmax(0,1fr) 32px 32px auto;gap:4px;align-items:center}
@media (max-width:400px){.adn-row{grid-template-columns:30px 30px minmax(0,1fr) 30px 30px auto;gap:3px}.adn-date .w{display:none}.adn-row>.adn-today{padding:0 8px}}
.adn-row>button{height:36px;border-radius:10px;border:1px solid var(--a-line2,#2a2430);background:none;color:var(--a-fg,#EDE9E3);font:500 17px/1 'DM Sans',sans-serif;cursor:pointer;padding:0;touch-action:manipulation}
.adn-row>button:active{background:rgba(237,233,227,.1)}
.adn-date{position:relative;display:flex;align-items:center;justify-content:center;gap:7px;height:36px;min-width:0;border-radius:10px;border:1px solid var(--a-line2,#2a2430);background:var(--a-bg,#040004);overflow:hidden;cursor:pointer}
.adn-date .w{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--a-dim,#8a8590);font-weight:600}
.adn-date .v{font:13px 'DM Mono',ui-monospace,monospace;color:var(--a-hi,#FAF6EE);white-space:nowrap}
.adn-date input{position:absolute;inset:0;width:100%;height:100%;opacity:0;border:0;padding:0;margin:0;cursor:pointer;-webkit-appearance:none;appearance:none;color-scheme:dark;font-size:16px}
.adn-row>.adn-today{padding:0 10px;border-radius:999px;font:600 10px 'DM Sans',sans-serif;letter-spacing:.1em;text-transform:uppercase}
.adn-row>.adn-today.on{background:var(--a-fg,#EDE9E3);color:var(--a-bg,#040004);border-color:var(--a-fg,#EDE9E3)}
.adn button:focus-visible,.adn-date:focus-within{outline:2px solid var(--a-fg,#EDE9E3);outline-offset:2px}
`;
