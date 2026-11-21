/**
 * Editor de cores do anel do zodíaco e dos elementos (painel Astros e anel tradicional).
 * Abre por Anéis › Graduação e Zodíaco › Editar cores. Tudo fica salvo no navegador.
 */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  useColorEditorOpen, setColorEditorOpen, useRingColors, updateRingColors, resetRingColors,
  useZodiacStyle, setZodiacStyle, paletteStops, spectralAt, ELEMENT_DEFAULTS, RING_DEFAULTS,
  type RingColors, type Element,
} from '../lib/appearance';
import { ZODIAC_ICONS } from './icons';

const SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
const SIGN_NAMES = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'];
const ELEMENTS: [Element, string][] = [['fire', 'Fogo'], ['earth', 'Terra'], ['air', 'Ar'], ['water', 'Água']];

const Seg = <T extends string | number>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) => (
  <div className="rce-seg" role="radiogroup">
    {options.map(([v, l]) => (
      <button key={String(v)} type="button" role="radio" aria-checked={v === value} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>
    ))}
  </div>
);

const Slider: React.FC<{ label: string; k: keyof RingColors; min: number; max: number; step: number; r: RingColors; fmt?: (v: number) => string }> = ({ label, k, min, max, step, r, fmt }) => {
  const v = r[k] as number;
  return (
    <label className="rce-row">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={e => updateRingColors({ [k]: +e.target.value } as Partial<RingColors>)} />
      <output>{fmt ? fmt(v) : v}</output>
    </label>
  );
};

export const RingColorEditor: React.FC<{ isLight?: boolean }> = ({ isLight }) => {
  const open = useColorEditorOpen();
  const r = useRingColors();
  const style = useZodiacStyle();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setColorEditorOpen(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open]);

  if (!open) return null;

  const onDown = (e: React.PointerEvent) => {
    const box = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    drag.current = { dx: e.clientX - box.left, dy: e.clientY - box.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos({ x: Math.max(8, Math.min(window.innerWidth - 120, e.clientX - drag.current.dx)), y: Math.max(8, Math.min(window.innerHeight - 60, e.clientY - drag.current.dy)) });
  };
  const onUp = () => { drag.current = null; };

  const els = r.elements || ELEMENT_DEFAULTS;
  const stops = paletteStops(r);
  const modern = style === 'modern';

  return createPortal(
    <div className={`rce ${isLight ? 'is-light' : ''}`} role="dialog" aria-label="Editar cores"
      style={pos ? { left: pos.x, top: pos.y, right: 'auto' } : undefined}>
      <style>{CSS}</style>
      <div className="rce-head" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
        <i className="ti ti-grip-horizontal" aria-hidden="true" />
        <b>Editar cores</b>
        <button type="button" className="rce-x" onPointerDown={e => e.stopPropagation()} onClick={() => setColorEditorOpen(false)} aria-label="Fechar"><i className="ti ti-x" aria-hidden="true" /></button>
      </div>
      <div className="rce-body">
        <section>
          <h3>Anel do zodíaco</h3>
          <Seg value={style} options={[['traditional', 'Tradicional'], ['modern', 'Modernas']]} onChange={v => setZodiacStyle(v)} />
        </section>

        <section>
          <h3>Elementos</h3>
          <p className="rce-hint">Cores dos signos no painel Astros{modern ? '' : ' e no anel tradicional'}.</p>
          <div className="rce-els">
            {ELEMENTS.map(([el, name]) => (
              <label key={el} className="rce-el">
                <input type="color" value={els[el]} onChange={e => updateRingColors({ elements: { ...els, [el]: e.target.value } })} />
                <span>{name}</span>
              </label>
            ))}
          </div>
          {r.elements && <button type="button" className="rce-link" onClick={() => updateRingColors({ elements: null })}>Voltar às cores originais dos elementos</button>}
        </section>

        {modern && <>
          <section>
            <h3>Espectro</h3>
            <div className="rce-bar" style={{ background: `linear-gradient(90deg, ${[...stops, stops[0]].join(',')})` }} />
            <label className="rce-row rce-row-sel">
              <span>Começa em</span>
              <select value={r.start} onChange={e => updateRingColors({ start: +e.target.value })}>
                {SIGN_NAMES.map((n, i) => <option key={n} value={i}>{n}</option>)}
              </select>
            </label>
            <Seg value={r.dir} options={[[1, 'Sentido dos signos'], [-1, 'Invertido']]} onChange={v => updateRingColors({ dir: v })} />
            <Seg value={r.pal} options={[['lp', 'Linha da LP'], ['full', 'Com violeta']]} onChange={v => updateRingColors({ pal: v })} />
            <Seg value={r.mode} options={[['flow', 'Contínuo'], ['solid', 'Uma cor por signo']]} onChange={v => updateRingColors({ mode: v })} />
            <div className="rce-signs" aria-hidden="true">
              {SIGNS.map((id, i) => {
                const Icon = (ZODIAC_ICONS as any)[id];
                const c = spectralAt(i * 30 + 15, r);
                return <span key={id} title={SIGN_NAMES[i]} style={{ background: `${c}26`, borderColor: `${c}80` }}><Icon width={16} height={16} fill={c} /></span>;
              })}
            </div>
          </section>

          <section>
            <h3>Faixa</h3>
            <Slider label="Largura" k="width" min={30} max={80} step={1} r={r} />
            <Slider label="Fundo" k="fill" min={0} max={0.6} step={0.01} r={r} />
            <Slider label="Borda" k="edge" min={0} max={1} step={0.05} r={r} />
            <Slider label="Divisórias" k="sep" min={0} max={1} step={0.05} r={r} />
          </section>

          <section>
            <h3>Signos</h3>
            <Seg value={r.glyph} options={[['white', 'Brancos'], ['color', 'Na cor']]} onChange={v => updateRingColors({ glyph: v })} />
            <Slider label="Tamanho" k="glyphScale" min={0.5} max={1.3} step={0.01} r={r} fmt={v => `${Math.round(v * 100)}%`} />
            <Slider label="Brilho" k="glyphGlow" min={0} max={1} step={0.05} r={r} />
            {r.glyph === 'color' && <Slider label="Clareza" k="glyphLight" min={0} max={0.6} step={0.02} r={r} />}
          </section>

          <section>
            <h3>Relógio central</h3>
            <Slider label="Hora" k="hourSize" min={40} max={80} step={1} r={r} />
            <Slider label="Estrela" k="starSize" min={6} max={28} step={0.5} r={r} />
            <Slider label="Brilho" k="starGlow" min={0} max={1} step={0.05} r={r} />
            <Slider label="Respiro" k="starGap" min={0} max={24} step={1} r={r} />
            <label className="rce-chk"><input type="checkbox" checked={r.pulse} onChange={e => updateRingColors({ pulse: e.target.checked })} /> Estrela pulsa a cada segundo</label>
          </section>
        </>}

        <button type="button" className="rce-reset" onClick={() => resetRingColors()}
          disabled={JSON.stringify(r) === JSON.stringify(RING_DEFAULTS)}>Restaurar padrão</button>
      </div>
    </div>,
    document.body,
  );
};

const CSS = `
.rce{position:fixed;top:72px;right:16px;z-index:12500;width:300px;max-width:calc(100vw - 24px);max-height:calc(100vh - 96px);display:flex;flex-direction:column;border-radius:18px;border:1px solid #2a2430;background:rgba(10,7,12,.97);color:#EDE9E3;font-family:'DM Sans',system-ui,sans-serif;font-size:12.5px;box-shadow:0 24px 60px -12px rgba(0,0,0,.8);backdrop-filter:blur(14px)}
.rce.is-light{background:rgba(251,249,244,.98);border-color:rgba(139,131,112,.35);color:#231714}
.rce-head{display:flex;align-items:center;gap:8px;padding:12px 10px 10px 14px;border-bottom:1px solid #221d27;cursor:grab;user-select:none;touch-action:none}
.rce.is-light .rce-head{border-color:rgba(139,131,112,.25)}
.rce-head:active{cursor:grabbing}
.rce-head .ti-grip-horizontal{opacity:.45}
.rce-head b{flex:1;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:20px;line-height:1}
.rce-x{width:30px;height:30px;border-radius:50%;border:0;background:none;color:inherit;opacity:.7;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px}
.rce-x:hover{opacity:1;background:rgba(255,255,255,.06)}
.rce-body{overflow-y:auto;padding:4px 14px 14px;overscroll-behavior:contain}
.rce section{padding:12px 0 6px;border-bottom:1px solid #1c1820}
.rce.is-light section{border-color:rgba(139,131,112,.18)}
.rce h3{margin:0 0 8px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;font-weight:500;opacity:.55}
.rce-hint{margin:-2px 0 8px;opacity:.6;font-size:11.5px}
.rce-seg{display:flex;gap:2px;padding:3px;border:1px solid #2a2430;border-radius:999px;margin:6px 0}
.rce.is-light .rce-seg{border-color:rgba(139,131,112,.3)}
.rce-seg button{flex:1;border:0;background:none;color:inherit;opacity:.75;border-radius:999px;padding:5px 4px;font:inherit;font-size:11.5px;cursor:pointer;white-space:nowrap}
.rce-seg button.on{opacity:1;background:#EDE9E3;color:#040004}
.rce.is-light .rce-seg button.on{background:#231714;color:#fbf9f4}
.rce-row{display:grid;grid-template-columns:72px 1fr 38px;align-items:center;gap:8px;margin:6px 0}
.rce-row span{opacity:.75}
.rce-row output{font-family:'DM Mono',monospace;font-size:11px;opacity:.55;text-align:right}
.rce-row input[type=range]{width:100%;accent-color:#EDE9E3}
.rce.is-light .rce-row input[type=range]{accent-color:#231714}
.rce-row-sel{grid-template-columns:72px 1fr}
.rce-row select{background:transparent;color:inherit;border:1px solid #2a2430;border-radius:8px;padding:5px 6px;font:inherit}
.rce-row select option{color:#111}
.rce-bar{height:5px;border-radius:3px;margin:2px 0 8px}
.rce-signs{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin:8px 0 4px}
.rce-signs span{aspect-ratio:1;border:1px solid;border-radius:8px;display:flex;align-items:center;justify-content:center}
.rce-els{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.rce-el{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer}
.rce-el input{width:100%;height:30px;border:1px solid #2a2430;border-radius:8px;background:none;padding:0;cursor:pointer}
.rce-el span{font-size:11px;opacity:.75}
.rce-link{margin:8px 0 2px;border:0;background:none;color:inherit;opacity:.65;font:inherit;font-size:11.5px;text-decoration:underline;text-underline-offset:3px;cursor:pointer;padding:0}
.rce-chk{display:flex;align-items:center;gap:8px;margin:8px 0 4px;opacity:.8;cursor:pointer}
.rce-reset{margin-top:12px;width:100%;height:34px;border-radius:999px;border:1px solid #2a2430;background:none;color:inherit;font:inherit;cursor:pointer}
.rce-reset:disabled{opacity:.35;cursor:default}
.rce button:focus-visible,.rce input:focus-visible,.rce select:focus-visible{outline:2px solid #D4AF37;outline-offset:2px}
`;
