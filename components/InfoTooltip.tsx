/**
 * InfoTooltip — tooltip interativa do Cronógrafo (astros, aspectos, signos, termos, decanatos, casas).
 *
 * • Primeira vista: só o item + descrição simples.
 * • "Ver mais" abre os detalhes técnicos.
 * • "Manter abertos" (preferência global, salva no navegador) faz todas as
 *   tooltips já abrirem com os detalhes, sem precisar clicar toda vez.
 * • Ancorada ao elemento (não persegue o cursor); o mouse pode entrar nela.
 * • Esc fecha. Em telas estreitas (< 640px) vira um painel fixo embaixo.
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TooltipModel } from '../lib/astrology/tooltipContent';

const PREF_KEY = 'cronografo_tooltip_details_open';
const PREF_EVENT = 'cronografo:tooltip-details-pref';

const readPref = (): boolean => {
  try { return localStorage.getItem(PREF_KEY) === '1'; } catch { return false; }
};
const writePref = (v: boolean) => {
  try { localStorage.setItem(PREF_KEY, v ? '1' : '0'); } catch { /* sem armazenamento */ }
  try { window.dispatchEvent(new CustomEvent(PREF_EVENT, { detail: v })); } catch { /* noop */ }
};

/** Preferência global "manter detalhes abertos", sincronizada entre tooltips. */
export const useTooltipDetailsPref = (): [boolean, (v: boolean) => void] => {
  const [pref, setPref] = useState<boolean>(readPref);
  useEffect(() => {
    const onPref = (e: Event) => setPref(!!(e as CustomEvent).detail);
    const onStorage = (e: StorageEvent) => { if (e.key === PREF_KEY) setPref(e.newValue === '1'); };
    window.addEventListener(PREF_EVENT, onPref);
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener(PREF_EVENT, onPref); window.removeEventListener('storage', onStorage); };
  }, []);
  const set = useCallback((v: boolean) => { setPref(v); writePref(v); }, []);
  return [pref, set];
};

/** Retângulo (em coordenadas da janela) do elemento a que a tooltip se prende. */
export interface AnchorRect { left: number; top: number; width: number; height: number }

export const anchorFromElement = (el: Element): AnchorRect => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};
export const anchorFromPoint = (x: number, y: number, pad = 6): AnchorRect =>
  ({ left: x - pad, top: y - pad, width: pad * 2, height: pad * 2 });

interface InfoTooltipProps {
  model: TooltipModel | null;
  anchor: AnchorRect | null;
  /** chamado quando o mouse entra/sai da própria tooltip (para cancelar/agendar o fechamento) */
  onPointerInside?: (inside: boolean) => void;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

const GAP = 10;
const W = 296;
const MARGIN = 10;

const Glyph: React.FC<{ model: TooltipModel }> = ({ model }) => {
  if (model.planetId) {
    const c = model.accent || '#e8e4da';
    const bg = `radial-gradient(circle at 32% 28%, #ffffff 0%, ${c} 42%, ${c}88 75%, #0b0910 100%)`;
    return (
      <span className="itt-glyph" style={{ background: bg, color: '#0b0910', borderColor: `${c}66`, boxShadow: `0 0 12px ${c}40` }}>
        <span style={{ textShadow: '0 0 3px rgba(255,255,255,.6)', fontWeight: 700 }}>{model.glyph}</span>
      </span>
    );
  }
  return (
    <span className="itt-glyph" style={{ color: model.accent, borderColor: model.accent, background: `${model.accent}14` }}>
      {model.glyph}
    </span>
  );
};

const InfoTooltip: React.FC<InfoTooltipProps> = ({ model, anchor, onPointerInside, onClose, theme = 'dark' }) => {
  const [keepOpen, setKeepOpen] = useTooltipDetailsPref();
  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; arrowX: number; below: boolean } | null>(null);
  const [isSheet, setIsSheet] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const boxRef = useRef<HTMLDivElement>(null);

  // Cada item novo começa recolhido (a menos que "manter abertos" esteja ligado)
  useEffect(() => { setExpanded(false); }, [model?.key]);
  const showDetails = keepOpen || expanded;

  useEffect(() => {
    const onResize = () => setIsSheet(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!model) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [model, onClose]);

  // Posicionamento medido: prefere acima do item; se não couber, vai para baixo; sempre dentro da tela.
  useLayoutEffect(() => {
    if (!model || !anchor || isSheet) { setPos(null); return; }
    const box = boxRef.current;
    const h = box ? box.offsetHeight : 160;
    const vw = window.innerWidth, vh = window.innerHeight;
    const cx = anchor.left + anchor.width / 2;
    let left = Math.round(cx - W / 2);
    left = Math.max(MARGIN, Math.min(left, vw - W - MARGIN));
    const spaceAbove = anchor.top - GAP - MARGIN;
    const spaceBelow = vh - (anchor.top + anchor.height) - GAP - MARGIN;
    const below = spaceAbove < h && spaceBelow > spaceAbove;
    let top = below ? anchor.top + anchor.height + GAP : anchor.top - GAP - h;
    top = Math.max(MARGIN, Math.min(top, vh - h - MARGIN));
    const arrowX = Math.max(16, Math.min(W - 16, cx - left));
    setPos({ left, top, arrowX, below });
  }, [model, anchor, isSheet, showDetails]);

  if (!model || !anchor || typeof document === 'undefined') return null;

  const light = theme === 'light';
  const content = (
    <div
      ref={boxRef}
      role="tooltip"
      className={`itt ${light ? 'itt-light' : ''} ${isSheet ? 'itt-sheet' : ''}`}
      style={isSheet ? undefined : {
        left: pos?.left ?? -9999, top: pos?.top ?? -9999, width: W,
        visibility: pos ? 'visible' : 'hidden',
      }}
      onMouseEnter={() => onPointerInside?.(true)}
      onMouseLeave={() => onPointerInside?.(false)}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      {!isSheet && pos && (
        <span className={`itt-arrow ${pos.below ? 'itt-arrow-top' : ''}`} style={{ left: pos.arrowX }} />
      )}

      <div className="itt-head">
        <Glyph model={model} />
        <h4 className="itt-title">{model.title}</h4>
        {isSheet && (
          <button type="button" className="itt-x" aria-label="Fechar" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        )}
      </div>

      <p className="itt-text">{model.text}</p>

      {!keepOpen && model.rows.length > 0 && (
        <button type="button" className="itt-more" onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>
          {expanded ? 'Ver menos' : 'Ver mais'}
          <i className={`ti ti-chevron-${expanded ? 'up' : 'down'}`} />
        </button>
      )}

      {showDetails && model.rows.length > 0 && (
        <div className="itt-details">
          <div className="itt-details-head">
            <span>Detalhes</span>
            <label className="itt-switch" title="Abrir os detalhes automaticamente em todas as dicas">
              <span>Manter abertos</span>
              <input type="checkbox" checked={keepOpen} onChange={e => setKeepOpen(e.target.checked)} />
              <span className="itt-track"><span className="itt-thumb" /></span>
            </label>
          </div>

          {model.segments && (
            <div className="itt-seg">
              {model.segments.map((s, i) => (
                <span key={i} className={`itt-seg-item ${s.active ? 'on' : ''}`} style={{ flexGrow: s.size }}>
                  {s.label}
                </span>
              ))}
            </div>
          )}

          <dl className="itt-rows">
            {model.rows.map((r, i) => (
              <div key={i} className="itt-row">
                <dt>{r.label}</dt>
                <dd className={`${r.mono ? 'itt-mono' : ''} ${r.tone ? `itt-${r.tone}` : ''}`}>
                  {r.value.split('\n').map((line, j) => <span key={j}>{line}</span>)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
};

export default InfoTooltip;

/** CSS da tooltip (injetado uma vez). */
export const INFO_TOOLTIP_CSS = `
.itt{position:fixed;z-index:9999;box-sizing:border-box;padding:14px 15px 13px;border-radius:14px;
  background:rgba(10,8,18,.97);border:1px solid rgba(255,255,255,.10);
  box-shadow:0 18px 50px -12px rgba(0,0,0,.75),0 0 0 1px rgba(0,0,0,.4);
  color:#E8E4DA;font-family:'DM Sans',system-ui,sans-serif;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  animation:itt-in .14s ease-out;pointer-events:auto;text-align:left}
@keyframes itt-in{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
.itt-arrow{position:absolute;bottom:-6px;width:12px;height:12px;margin-left:-6px;transform:rotate(45deg);
  background:rgba(10,8,18,.97);border-right:1px solid rgba(255,255,255,.10);border-bottom:1px solid rgba(255,255,255,.10)}
.itt-arrow-top{bottom:auto;top:-6px;border:0;border-left:1px solid rgba(255,255,255,.10);border-top:1px solid rgba(255,255,255,.10)}
.itt-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.itt-glyph{flex:0 0 auto;width:30px;height:30px;border-radius:50%;border:1.5px solid;display:flex;align-items:center;justify-content:center;
  font-size:16px;line-height:1;font-family:'Segoe UI Symbol','Noto Sans Symbols 2','DejaVu Sans',sans-serif}
.itt-title{margin:0;flex:1;min-width:0;font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:17px;line-height:1.2;color:#F5F2EB}
.itt-x{flex:0 0 auto;width:30px;height:30px;border-radius:8px;border:0;background:rgba(255,255,255,.06);color:#cfc9bd;cursor:pointer}
.itt-text{margin:0;font-size:13.5px;line-height:1.55;color:#D9D4C8}
.itt-more{margin-top:10px;height:30px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);
  color:#F5D98A;font:600 12px/1 'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap}
.itt-more:hover{background:rgba(245,217,138,.08);border-color:rgba(245,217,138,.35)}
.itt-details{margin-top:12px;padding-top:11px;border-top:1px solid rgba(255,255,255,.08)}
.itt-details-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;
  font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#9b958a;font-weight:600}
.itt-switch{display:inline-flex;align-items:center;gap:7px;cursor:pointer;letter-spacing:0;text-transform:none;font-size:11.5px;font-weight:500;color:#b7b1a5;white-space:nowrap}
.itt-switch input{position:absolute;opacity:0;width:0;height:0}
.itt-track{position:relative;width:28px;height:16px;border-radius:999px;background:rgba(255,255,255,.14);transition:background .15s}
.itt-thumb{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#e8e4da;transition:transform .15s}
.itt-switch input:checked + .itt-track{background:#D4AF37}
.itt-switch input:checked + .itt-track .itt-thumb{transform:translateX(12px);background:#1a1408}
.itt-switch input:focus-visible + .itt-track{outline:2px solid #F5D98A;outline-offset:2px}
.itt-seg{display:flex;gap:3px;margin-bottom:10px}
.itt-seg-item{flex-basis:0;min-width:0;height:22px;border-radius:5px;background:rgba(255,255,255,.05);color:#8e887c;
  font:500 10px/22px 'Azeret Mono',ui-monospace,monospace;text-align:center;overflow:hidden;white-space:nowrap;text-overflow:clip}
.itt-seg-item.on{background:rgba(245,217,138,.16);color:#F5D98A;box-shadow:inset 0 0 0 1px rgba(245,217,138,.45)}
.itt-rows{margin:0;display:flex;flex-direction:column;gap:6px}
.itt-row{display:grid;grid-template-columns:96px 1fr;gap:10px;font-size:12.5px;line-height:1.4}
.itt-row dt{color:#8e887c}
.itt-row dd{margin:0;color:#ECE8DE;display:flex;flex-direction:column}
.itt-mono{font-family:'Azeret Mono',ui-monospace,monospace;font-size:11.5px}
.itt-good{color:#86efac!important}.itt-bad{color:#fca5a5!important}.itt-accent{color:#F5D98A!important}
.itt-sheet{left:10px!important;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));top:auto!important;width:auto!important;max-height:70vh;overflow-y:auto}
.itt-light{background:rgba(252,250,245,.98);color:#2a2620;border-color:rgba(0,0,0,.10)}
.itt-light .itt-arrow{background:rgba(252,250,245,.98);border-color:rgba(0,0,0,.10)}
.itt-light .itt-title{color:#1d1a15}.itt-light .itt-text{color:#3b362d}
.itt-light .itt-more{color:#8a6a12;border-color:rgba(0,0,0,.14);background:rgba(0,0,0,.03)}
.itt-light .itt-details{border-color:rgba(0,0,0,.08)}
.itt-light .itt-row dt,.itt-light .itt-details-head{color:#7a7366}.itt-light .itt-row dd{color:#25211b}
.itt-light .itt-seg-item{background:rgba(0,0,0,.05);color:#7a7366}
.itt-light .itt-seg-item.on{background:rgba(212,175,55,.18);color:#6b520c}
.itt-light .itt-good{color:#15803d!important}.itt-light .itt-bad{color:#b91c1c!important}.itt-light .itt-accent{color:#8a6a12!important}
.itt-light .itt-x{background:rgba(0,0,0,.05);color:#4a443a}
`;
