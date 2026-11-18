/**
 * Peças das janelas de "Opções do painel", no estilo de lista do Notion:
 * grupos com título pequeno, uma opção por linha (nome à esquerda, chave pequena à direita),
 * subopções recuadas que só aparecem com a opção principal ligada, seletor de duas posições e
 * controle deslizante discreto com o valor ao lado.
 */
import React from 'react';

export const OPT_CSS = `
.po{font-family:'DM Sans',system-ui,sans-serif;color:#EDE9E3}
.po-h{display:flex;align-items:baseline;justify-content:space-between;padding:6px 8px 8px}
.po-t{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:19px;line-height:1}
.po-k{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:#6f6a76}
.po-g{padding:10px 8px 3px;font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:#6f6a76}
.po-r{display:flex;align-items:center;gap:10px;min-height:32px;padding:0 8px;border-radius:8px;font-size:13px;cursor:pointer;user-select:none}
.po-r:hover{background:rgba(255,255,255,.045)}
.po-r .ic{width:18px;text-align:center;color:#8a8590;font-size:15px;flex:none}
.po-r .lb{flex:1;min-width:0}
.po-r.sub{padding-left:36px;min-height:28px;font-size:12.5px;color:#B9B4BE}
.po-sw{width:26px;height:15px;border-radius:999px;background:#2a2430;position:relative;flex:none;border:0;padding:0;cursor:pointer;transition:background .2s}
.po-sw::after{content:'';position:absolute;top:2px;left:2px;width:11px;height:11px;border-radius:50%;background:#8a8590;transition:transform .2s,background .2s}
.po-sw.on{background:#EDE9E3}
.po-sw.on::after{transform:translateX(11px);background:#040004}
.po-seg{display:inline-flex;border:1px solid #2a2430;border-radius:999px;padding:2px;gap:2px}
.po-seg button{border:0;background:transparent;color:#8a8590;font-size:11px;padding:3px 10px;border-radius:999px;cursor:pointer;font-family:inherit}
.po-seg button.on{background:#EDE9E3;color:#040004}
.po-sl{display:flex;align-items:center;gap:10px;min-height:34px;padding:0 8px;font-size:13px}
.po-sl .nm{width:104px;flex:none}
.po-sl input{flex:1;min-width:0;accent-color:#EDE9E3;height:16px}
.po-sl .v{font-family:'DM Mono',ui-monospace,monospace;font-size:11.5px;color:#B9B4BE;width:40px;text-align:right;flex:none}
.po-div{height:1px;background:#1c1820;margin:6px 8px}
.po-lock{margin:2px 4px 8px;padding:10px 12px;border-radius:12px;border:1px solid rgba(212,175,55,.45);display:flex;align-items:center;gap:10px;font-size:12px;color:#F5D98A}
.po-lock button{margin-left:auto;height:28px;padding:0 12px;border-radius:999px;border:1px solid #D4AF37;background:#D4AF37;color:#040004;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;font-family:inherit;font-weight:500}
.po-off{opacity:.4;pointer-events:none;user-select:none}
.po-light{color:#231714}
.po-light .po-r:hover{background:rgba(0,0,0,.05)}
.po-light .po-r.sub{color:#5c4b3e}
.po-light .po-sw{background:#d8d0c6}
.po-light .po-sw.on{background:#231714}
.po-light .po-sw.on::after{background:#F4F1EA}
`;

export const OptHeader: React.FC<{ title: string; context?: string }> = ({ title, context }) => (
  <div className="po-h"><span className="po-t">{title}</span>{context && <span className="po-k">{context}</span>}</div>
);

export const OptGroup: React.FC<{ title: string }> = ({ title }) => <div className="po-g">{title}</div>;

export const OptDivider: React.FC = () => <div className="po-div" />;

export const OptToggle: React.FC<{ icon?: React.ReactNode; label: string; checked: boolean; onChange: () => void; sub?: boolean }> = ({ icon, label, checked, onChange, sub }) => (
  <div className={`po-r ${sub ? 'sub' : ''}`} onClick={onChange} role="switch" aria-checked={checked} tabIndex={0}
    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(); } }}>
    {!sub && <span className="ic">{icon}</span>}
    <span className="lb">{label}</span>
    <span className={`po-sw ${checked ? 'on' : ''}`} aria-hidden="true" />
  </div>
);

export function OptSegment<T extends string>({ label, value, options, onChange, sub }: { label: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; sub?: boolean }) {
  return (
    <div className={`po-r ${sub ? 'sub' : ''}`} style={{ cursor: 'default' }}>
      {!sub && <span className="ic" />}
      <span className="lb">{label}</span>
      <span className="po-seg">
        {options.map(o => (
          <button key={o.v} type="button" className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>{o.label}</button>
        ))}
      </span>
    </div>
  );
}

export const OptSlider: React.FC<{ label: string; value: number; min: number; max: number; step?: number; unit?: string; display?: (v: number) => string; onChange: (v: number) => void }> = ({ label, value, min, max, step = 1, unit = '', display, onChange }) => (
  <div className="po-sl">
    <span className="nm">{label}</span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} aria-label={label} />
    <span className="v">{display ? display(value) : `${value}${unit}`}</span>
  </div>
);
