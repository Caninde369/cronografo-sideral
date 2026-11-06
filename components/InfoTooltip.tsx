/**
 * InfoTooltip — tooltip interativa do Cronógrafo (astros, aspectos, signos, termos, decanatos, casas).
 *
 * • Topo: símbolo na cor do item (sem círculo) + gradiente dessa cor; palavras-chave em tags.
 * • Clique em QUALQUER parte do cartão (ou na faixa "Ver detalhes") abre/fecha os detalhes.
 * • "Manter abertos" (preferência global, salva no navegador) faz todas as
 *   tooltips já abrirem com os detalhes.
 * • Ancorada ao elemento (não persegue o cursor); o mouse pode entrar nela.
 * • Esc fecha. Em telas estreitas (< 640px) vira um painel fixo embaixo.
 * • A espera para abrir/trocar/fechar fica no SiderealClock (hover intent).
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TooltipModel, TooltipPart } from '../lib/astrology/tooltipContent';
import { ZODIAC_ICONS } from './icons';

/** Signo em SVG (nunca o caractere, que em alguns aparelhos vira emoji). */
const SignSvg: React.FC<{ id: string; size: number; color?: string }> = ({ id, size, color }) => {
  const Icon = ZODIAC_ICONS[id as keyof typeof ZODIAC_ICONS];
  if (!Icon) return null;
  return <Icon width={size} height={size} fill={color} style={{ color, display: 'inline-block', verticalAlign: '-0.18em', flex: '0 0 auto' }} />;
};
/** Força a versão em texto (não emoji) dos símbolos de astros. */
const asText = (t: string) => t.replace(/[\u2600-\u26FF\u2640-\u2642]/g, ch => `${ch}\uFE0E`);

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

const GAP = 12;
const W = 300;
const MARGIN = 10;

/** "#RRGGBB" + alfa em hex ("33") — ignora cores que não são hex de 6 dígitos. */
const withAlpha = (c: string, a: string) => (/^#[0-9a-f]{6}$/i.test(c) ? `${c}${a}` : c);

const Part: React.FC<{ p: TooltipPart }> = ({ p }) => {
  if (p.signId) return <SignSvg id={p.signId} size={14} color={p.color} />;
  return (
    <span
      className={`${p.mono ? 'itt-mono' : ''} ${p.muted ? 'itt-muted' : ''} ${p.sym ? 'itt-sym' : ''}`}
      style={p.color ? { color: p.color } : undefined}
    >
      {p.sym ? asText(p.text) : p.text}
    </span>
  );
};

const InfoTooltip: React.FC<InfoTooltipProps> = ({ model, anchor, onPointerInside, onClose, theme = 'dark' }) => {
  const [keepOpen, setKeepOpen] = useTooltipDetailsPref();
  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; arrowX: number; below: boolean } | null>(null);
  const [isSheet, setIsSheet] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const boxRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Cada item novo começa recolhido (a menos que "manter abertos" esteja ligado)
  useEffect(() => { setExpanded(false); }, [model?.key]);
  const hasDetails = !!model && model.rows.length > 0;
  const showDetails = hasDetails && (keepOpen || expanded);

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
    const h = box ? box.offsetHeight : 180;
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
  const accent = model.accent;

  /** Clique em qualquer parte do cartão alterna os detalhes (menos dentro dos próprios detalhes). */
  const onCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasDetails || keepOpen) return;
    if (detailsRef.current?.contains(e.target as Node)) return;
    setExpanded(v => !v);
  };

  const content = (
    <div
      ref={boxRef}
      role="tooltip"
      className={`itt ${light ? 'itt-light' : ''} ${isSheet ? 'itt-sheet' : ''} ${hasDetails && !keepOpen ? 'itt-clickable' : ''}`}
      style={isSheet ? undefined : {
        left: pos?.left ?? -9999, top: pos?.top ?? -9999, width: W,
        visibility: pos ? 'visible' : 'hidden',
      }}
      onMouseEnter={() => onPointerInside?.(true)}
      onMouseLeave={() => onPointerInside?.(false)}
      // A tooltip é desenhada fora do relógio (portal), mas o React repassa os eventos
      // para o relógio. Sem isto, clicar no cartão iniciava o arrastar do relógio.
      onPointerDown={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
      onTouchEnd={e => e.stopPropagation()}
      onDoubleClick={e => e.stopPropagation()}
      onWheel={e => e.stopPropagation()}
      onClick={onCardClick}
    >
      {!isSheet && pos && (
        <span className={`itt-arrow ${pos.below ? 'itt-arrow-top' : ''}`} style={{ left: pos.arrowX }} />
      )}

      <div className="itt-body">
        <div
          className="itt-glow"
          style={{ background: `linear-gradient(180deg, ${withAlpha(accent, light ? '2e' : '38')} 0%, ${withAlpha(accent, light ? '0f' : '12')} 45%, transparent 100%)` }}
        />
        <div className="itt-head">
          <span className="itt-symbol" style={{ color: accent }}>
            {model.signId ? <SignSvg id={model.signId} size={22} color={accent} /> : asText(model.glyph)}
          </span>
          <h4 className="itt-title">{model.title}</h4>
          {isSheet && (
            <button type="button" className="itt-x" aria-label="Fechar" onClick={e => { e.stopPropagation(); onClose(); }}>
              <i className="ti ti-x" />
            </button>
          )}
        </div>

        {model.keywords.length > 0 && (
          <div className="itt-tags">
            {model.keywords.map(k => (
              <span
                key={k}
                className="itt-tag"
                style={{ color: accent, background: withAlpha(accent, light ? '1a' : '1f'), boxShadow: `inset 0 0 0 0.5px ${withAlpha(accent, '66')}` }}
              >
                {k}
              </span>
            ))}
          </div>
        )}
        <p className="itt-text">{model.text}</p>
      </div>

      {hasDetails && !keepOpen && (
        <div className="itt-footer" role="button" aria-expanded={expanded}>
          <i className={`ti ${expanded ? 'ti-chevron-up' : 'ti-list-details'}`} aria-hidden="true" />
          {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
        </div>
      )}

      {showDetails && (
        <div className="itt-details" ref={detailsRef}>
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
                <span
                  key={i}
                  className="itt-seg-item"
                  style={{
                    flexGrow: s.size,
                    ...(s.active ? { color: accent, background: withAlpha(accent, '26'), boxShadow: `inset 0 0 0 0.5px ${withAlpha(accent, '88')}` } : {}),
                  }}
                >
                  {asText(s.label)}
                </span>
              ))}
            </div>
          )}

          <div className="itt-rows">
            {model.rows.map((r, i) => (
              <div key={i} className="itt-row">
                <span className="itt-ic" style={{ color: r.color, background: withAlpha(r.color, '1a') }}>
                  <i className={`ti ${r.icon}`} aria-hidden="true" />
                </span>
                <span className="itt-lb">{r.label}</span>
                <span className="itt-vl">
                  {r.lines.map((line, j) => r.pill ? (
                    <span key={j} className="itt-pill" style={{ color: r.color, background: withAlpha(r.color, '22') }}>
                      {line.map(p => p.text).join('')}
                    </span>
                  ) : (
                    <span key={j} className="itt-line">{line.map((p, k) => <Part key={k} p={p} />)}</span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
};

export default InfoTooltip;

/** CSS da tooltip (injetado uma vez). */
export const INFO_TOOLTIP_CSS = `
.itt{position:fixed;z-index:9999;box-sizing:border-box;border-radius:14px;
  background:rgba(10,8,18,.97);border:1px solid rgba(255,255,255,.10);
  box-shadow:0 18px 50px -12px rgba(0,0,0,.75),0 0 0 1px rgba(0,0,0,.4);
  color:#E8E4DA;font-family:'DM Sans',system-ui,sans-serif;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  animation:itt-in .16s ease-out;pointer-events:auto;text-align:left}
.itt-clickable{cursor:pointer}
@keyframes itt-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.itt-arrow{position:absolute;bottom:-6px;width:12px;height:12px;margin-left:-6px;transform:rotate(45deg);
  background:rgba(10,8,18,.97);border-right:1px solid rgba(255,255,255,.10);border-bottom:1px solid rgba(255,255,255,.10)}
.itt-arrow-top{bottom:auto;top:-6px;border:0;border-left:1px solid rgba(255,255,255,.10);border-top:1px solid rgba(255,255,255,.10)}
.itt-body{position:relative;padding:14px 15px 12px;border-radius:14px 14px 0 0;overflow:hidden}
.itt-glow{position:absolute;left:0;right:0;top:0;height:96px;pointer-events:none}
.itt-head{position:relative;display:flex;align-items:center;gap:9px}
.itt-symbol{flex:0 0 auto;min-width:24px;text-align:center;font-size:22px;line-height:1;
  font-family:'Segoe UI Symbol','Noto Sans Symbols 2','DejaVu Sans',sans-serif}
.itt-title{margin:0;flex:1;min-width:0;font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:17px;line-height:1.2;color:#F5F2EB}
.itt-x{flex:0 0 auto;width:30px;height:30px;border-radius:8px;border:0;background:rgba(255,255,255,.06);color:#cfc9bd;cursor:pointer}
.itt-tags{position:relative;display:flex;flex-wrap:wrap;gap:5px;margin:10px 0 9px}
.itt-tag{font-size:11.5px;font-weight:700;letter-spacing:.01em;line-height:1.3;padding:3px 8px;border-radius:999px}
.itt-text{position:relative;margin:0;font-size:13.5px;line-height:1.55;color:#D9D4C8}
.itt-footer{height:38px;display:flex;align-items:center;justify-content:center;gap:7px;border-top:1px solid rgba(255,255,255,.08);
  color:#F5D98A;font:600 12.5px/1 'DM Sans',sans-serif;user-select:none;transition:background .12s}
.itt-clickable:hover .itt-footer{background:rgba(245,217,138,.07)}
.itt-footer:last-child{border-radius:0 0 14px 14px}
.itt-details{padding:11px 15px 13px;border-top:1px solid rgba(255,255,255,.08);cursor:default}
.itt-details-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;
  font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#9b958a;font-weight:600}
.itt-switch{display:inline-flex;align-items:center;gap:7px;cursor:pointer;letter-spacing:0;text-transform:none;font-size:11.5px;font-weight:500;color:#b7b1a5;white-space:nowrap}
.itt-switch input{position:absolute;opacity:0;width:0;height:0}
.itt-track{position:relative;width:28px;height:16px;border-radius:999px;background:rgba(255,255,255,.14);transition:background .15s}
.itt-thumb{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#e8e4da;transition:transform .15s}
.itt-switch input:checked + .itt-track{background:#D4AF37}
.itt-switch input:checked + .itt-track .itt-thumb{transform:translateX(12px);background:#1a1408}
.itt-switch input:focus-visible + .itt-track{outline:2px solid #F5D98A;outline-offset:2px}
.itt-seg{display:flex;gap:3px;margin:2px 0 8px}
.itt-seg-item{flex-basis:0;min-width:0;height:22px;border-radius:5px;background:rgba(255,255,255,.05);color:#7d776c;
  font:500 10px/22px 'Azeret Mono',ui-monospace,monospace;text-align:center;overflow:hidden;white-space:nowrap;text-overflow:clip}
.itt-rows{display:flex;flex-direction:column}
.itt-row{display:grid;grid-template-columns:22px 84px 1fr;align-items:start;gap:7px;font-size:12.5px;line-height:1.45;padding:5px 0}
.itt-row + .itt-row{border-top:1px solid rgba(255,255,255,.05)}
.itt-ic{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;margin-top:-2px}
.itt-lb{color:#8e887c}
.itt-vl{color:#ECE8DE;display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0}
.itt-pill{display:inline-block;font-size:11px;font-weight:700;padding:1px 8px;border-radius:999px;line-height:1.5}
.itt-sym{font-size:14px;font-family:'Segoe UI Symbol','Noto Sans Symbols 2','DejaVu Sans',sans-serif}
.itt-mono{font-family:'Azeret Mono',ui-monospace,monospace;font-size:11.5px}
.itt-muted{color:#8e887c}
.itt-sheet{left:10px!important;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));top:auto!important;width:auto!important;max-height:70vh;overflow-y:auto}
.itt-light{background:rgba(252,250,245,.98);color:#2a2620;border-color:rgba(0,0,0,.10)}
.itt-light .itt-arrow{background:rgba(252,250,245,.98);border-color:rgba(0,0,0,.10)}
.itt-light .itt-title{color:#1d1a15}.itt-light .itt-text{color:#3b362d}
.itt-light .itt-footer{color:#8a6a12;border-color:rgba(0,0,0,.08)}
.itt-light.itt-clickable:hover .itt-footer{background:rgba(212,175,55,.10)}
.itt-light .itt-details{border-color:rgba(0,0,0,.08)}
.itt-light .itt-row + .itt-row{border-color:rgba(0,0,0,.06)}
.itt-light .itt-lb,.itt-light .itt-details-head,.itt-light .itt-muted{color:#7a7366}.itt-light .itt-vl{color:#25211b}
.itt-light .itt-seg-item{background:rgba(0,0,0,.05);color:#7a7366}
.itt-light .itt-x{background:rgba(0,0,0,.05);color:#4a443a}
`;
