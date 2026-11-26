/**
 * Navegação da data de leitura do Calendário Arcano (celular e computador).
 * Base 22: ‹‹‹ −484 dias (ano arcano) · ‹‹ −22 (mês arcano) · ‹ −1 (dia)
 *          [ícone de calendário: escolhe a data | data: toque volta para hoje]
 *          › +1 · ›› +22 · ››› +484
 */
import React, { useRef } from 'react';

const p2 = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

interface Props {
  value: string;               // AAAA-MM-DD
  onChange: (v: string) => void;
  label?: string;
  className?: string;
  size?: 'md' | 'lg';          // lg: computador (leitura em chamada de vídeo)
}

const CalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
);

export const ArcaneDateNav: React.FC<Props> = ({ value, onChange, label = 'Data de leitura', className = '', size = 'md' }) => {
  const d = new Date(`${value}T12:00:00`);
  const ok = !isNaN(d.getTime());
  const shift = (n: number) => { const x = ok ? new Date(d) : new Date(); x.setDate(x.getDate() + n); onChange(toISO(x)); };
  const today = toISO(new Date());
  const isToday = value === today;
  const inputRef = useRef<HTMLInputElement>(null);
  const openPicker = () => { const el = inputRef.current; if (!el) return; try { (el as any).showPicker?.(); } catch { /* o input por cima já abre no toque */ } };
  const steps: [number, string, string][] = [[-484, '‹‹‹', 'Voltar um ano arcano (484 dias)'], [-22, '‹‹', 'Voltar um mês arcano (22 dias)'], [-1, '‹', 'Voltar um dia']];
  return (
    <div className={`adn adn-${size} ${className}`} role="group" aria-label={label}>
      <style>{CSS}</style>
      {steps.map(([n, t, a]) => <button key={n} type="button" className={`adn-s s${t.length}`} onClick={() => shift(n)} aria-label={a} title={a}>{t}</button>)}
      <div className={`adn-mid ${isToday ? 'is-today' : ''}`}>
        <label className="adn-cal" title="Escolher a data">
          <CalIcon />
          <input ref={inputRef} type="date" value={value} onClick={openPicker}
            onChange={e => e.target.value && onChange(e.target.value)} aria-label="Escolher a data" />
        </label>
        <button type="button" className="adn-date" onClick={() => onChange(today)}
          title={isToday ? 'Hoje' : 'Voltar para hoje'} aria-label={isToday ? 'Data de leitura: hoje' : 'Voltar para hoje'}>
          <span className="v">{ok ? `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}` : '—'}</span>
          <span className="h">{isToday ? 'hoje' : 'voltar p/ hoje'}</span>
        </button>
      </div>
      {steps.slice().reverse().map(([n, t, a]) => <button key={-n} type="button" className={`adn-s s${t.length}`} onClick={() => shift(-n)}
        aria-label={a.replace('Voltar', 'Avançar')} title={a.replace('Voltar', 'Avançar')}>{t.replace(/‹/g, '›')}</button>)}
    </div>
  );
};

const CSS = `
.adn{display:grid;grid-template-columns:34px 30px 30px minmax(0,1fr) 30px 30px 34px;gap:4px;align-items:center;padding:6px;border:1px solid var(--a-line,#221d27);border-radius:14px;background:var(--a-card,#0a070c);min-width:0;box-sizing:border-box}
.adn *{box-sizing:border-box}
.adn-s{height:40px;border-radius:10px;border:1px solid var(--a-line2,#2a2430);background:none;color:var(--a-fg,#EDE9E3);font:500 16px/1 'DM Sans',sans-serif;letter-spacing:-.02em;cursor:pointer;padding:0;touch-action:manipulation}
.adn-s.s3{font-size:13px}.adn-s.s2{font-size:14.5px}
.adn-s:active{background:rgba(237,233,227,.1)}
.adn-mid{display:flex;align-items:stretch;height:40px;min-width:0;border-radius:10px;border:1px solid var(--a-line2,#2a2430);background:var(--a-bg,#040004);overflow:hidden}
.adn-cal{position:relative;flex:none;width:38px;display:flex;align-items:center;justify-content:center;color:var(--a-fg,#EDE9E3);border-right:1px solid var(--a-line2,#2a2430);cursor:pointer}
.adn-cal input{position:absolute;inset:0;width:100%;height:100%;opacity:0;border:0;padding:0;margin:0;cursor:pointer;-webkit-appearance:none;appearance:none;color-scheme:dark;font-size:16px}
.adn-cal input::-webkit-calendar-picker-indicator{position:absolute;inset:0;width:100%;height:100%;cursor:pointer}
.adn-date{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:0;background:none;color:inherit;cursor:pointer;padding:0 4px}
.adn-date .v{font:13.5px/1 'DM Mono',ui-monospace,monospace;color:var(--a-hi,#FAF6EE);white-space:nowrap}
.adn-date .h{font:600 8px/1 'DM Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--a-faint,#6f6a76);white-space:nowrap}
.adn-mid:not(.is-today) .adn-date .h{color:var(--a-fg,#EDE9E3)}
.adn-mid.is-today .adn-date .h{color:#4ADE80}
.adn-date:active{background:rgba(237,233,227,.08)}
@media (max-width:380px){.adn{grid-template-columns:30px 27px 27px minmax(0,1fr) 27px 27px 30px;gap:3px;padding:5px}.adn-cal{width:32px}.adn-date .v{font-size:12.5px}}
.adn-lg{grid-template-columns:38px 34px 34px minmax(160px,1fr) 34px 34px 38px;gap:5px;padding:6px;border-radius:16px}
.adn-lg .adn-s,.adn-lg .adn-mid{height:46px;border-radius:12px}
.adn-lg .adn-s{font-size:18px}.adn-lg .adn-s.s3{font-size:14px}.adn-lg .adn-s.s2{font-size:16px}
.adn-lg .adn-cal{width:42px}
.adn-lg .adn-date .v{font-size:17px}
.adn-lg .adn-date .h{font-size:9px}
.adn button:hover{background:rgba(237,233,227,.06)}
.adn button:focus-visible,.adn-cal:focus-within{outline:2px solid var(--a-fg,#EDE9E3);outline-offset:-2px}
`;
