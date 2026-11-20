/**
 * Painel admin · aba Aparência: escolhe o estilo do zodíaco para todo mundo.
 * Dois cards com o anel desenhado pelo mesmo componente do relógio (ZodiacRing).
 */
import React, { useState } from 'react';
import { ZodiacRing } from './ZodiacRing';
import { useZodiacStyle, saveZodiacStyle, MODERN_RING, STAR_PATH, type ZodiacStyle } from '../lib/appearance';

const CX = 500, CY = 500, OUTER = 505;

/** Mesmos degradês do relógio (cores em index.css), para o anel tradicional desenhar igual. */
const STOPS: Record<string, number> = { fire: 40, earth: 50, air: 60, water: 50 };
const TraditionalDefs = () => (
  <defs>
    {Object.entries(STOPS).flatMap(([el, mid]) => ['', 'icon-'].map(k => (
      <linearGradient key={k + el} id={`zodiac-${k}${el}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={`var(--color-zodiac-${k}${el}-1)`} />
        <stop offset={`${mid}%`} stopColor={`var(--color-zodiac-${k}${el}-2)`} />
        <stop offset="100%" stopColor={`var(--color-zodiac-${k}${el}-3)`} />
      </linearGradient>
    )))}
  </defs>
);

const Preview: React.FC<{ mode: ZodiacStyle }> = ({ mode }) => {
  const modern = mode === 'modern';
  const inner = OUTER - (modern ? MODERN_RING.width : 40);
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const wd = now.toLocaleDateString('pt-BR', { weekday: 'long' });
  const date = `${String(now.getDate()).padStart(2, '0')} · ${now.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()} · ${now.getFullYear()}`;
  const fs = modern ? MODERN_RING.hourSize : 46;
  const hourStyle: React.CSSProperties = { fill: '#FAF8F5', fontFamily: "'Cormorant Infant', 'Cormorant Garamond', Georgia, serif", fontWeight: 600, fontSize: `${fs}px`, letterSpacing: '0.02em' };
  const half = MODERN_RING.starSize + MODERN_RING.starGap;
  return (
    <svg viewBox="-50 -50 1100 1100" aria-hidden="true">
      {!modern && <TraditionalDefs />}
      <ZodiacRing cx={CX} cy={CY} innerRadius={inner} outerRadius={OUTER} rotation={0} onHover={() => {}} onLeave={() => {}}
        iconSize={46} colorMode="element" styleMode={mode} />
      <text x={CX} y={modern ? CY - 52 : CY - 42} textAnchor="middle" style={{ fill: 'rgba(255,255,255,.7)', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase' }}>{wd}</text>
      {modern ? (
        <g>
          <defs>
            <filter id="adm-star-glow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation={1 + MODERN_RING.starGlow * 6} result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <text x={CX - half} y={CY - 8} textAnchor="end" dominantBaseline="central" style={hourStyle}>{hh}</text>
          <text x={CX + half} y={CY - 8} textAnchor="start" dominantBaseline="central" style={hourStyle}>{mm}</text>
          <g transform={`translate(${CX}, ${CY - 8 + fs * 0.04}) scale(${MODERN_RING.starSize / 10})`}><path d={STAR_PATH} fill="#fff" filter="url(#adm-star-glow)" /></g>
        </g>
      ) : (
        <text x={CX} y={CY - 8} textAnchor="middle" dominantBaseline="central" style={hourStyle}>{hh}:{mm}</text>
      )}
      <text x={CX} y={modern ? CY + 40 : CY + 31} textAnchor="middle" style={{ fill: '#E5E7EB', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15, letterSpacing: '.04em' }}>{date}</text>
    </svg>
  );
};

const OPTIONS: { id: ZodiacStyle; title: string; text: string; cta: string }[] = [
  { id: 'traditional', title: 'Sistema tradicional', text: 'Cada signo na cor do seu elemento: fogo, terra, ar e água. O relógio central com os dois pontos.', cta: 'Usar Sistema Tradicional' },
  { id: 'modern', title: 'Cores modernas', text: 'O zodíaco na linha espectral da marca, de um signo para o outro. A estrela do logo no lugar dos dois pontos.', cta: 'Usar cores modernas' },
];

export const AdminAppearance: React.FC = () => {
  const current = useZodiacStyle();
  const [saving, setSaving] = useState<ZodiacStyle | null>(null);
  const [error, setError] = useState('');
  const choose = async (s: ZodiacStyle) => {
    if (s === current || saving) return;
    setSaving(s); setError('');
    const ok = await saveZodiacStyle(s);
    setSaving(null);
    if (!ok) setError('Não foi possível salvar. Confira se as regras novas do Firebase já foram publicadas.');
  };
  return (
    <section className="apr-root" aria-labelledby="apr-title">
      <style>{CSS}</style>
      <p className="apr-eyebrow">Aparência</p>
      <h3 id="apr-title" className="apr-title">Cores do zodíaco</h3>
      <p className="apr-lead">Vale para todo mundo que abrir o Cronógrafo. A troca aparece na próxima vez que a pessoa abrir ou recarregar o app.</p>
      {error && <p className="apr-error"><i className="ti ti-alert-circle" aria-hidden="true" /> {error}</p>}
      <div className="apr-cards">
        {OPTIONS.map(o => {
          const on = current === o.id;
          return (
            <article key={o.id} className={`apr-card ${on ? 'is-on' : ''}`}>
              {on && <span className="apr-badge">Em uso</span>}
              <div className="apr-ring"><Preview mode={o.id} /></div>
              <div><h4>{o.title}</h4><p>{o.text}</p></div>
              <button type="button" className="apr-btn" disabled={on || !!saving} onClick={() => choose(o.id)}>
                {saving === o.id ? 'Salvando…' : o.cta}
              </button>
            </article>
          );
        })}
      </div>
      <p className="apr-note">Casas, graus, termos e decanatos não mudam. Só as cores do anel e o relógio central.</p>
    </section>
  );
};

const CSS = `
.apr-root{margin-top:20px}
.apr-eyebrow{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:#6f6a76;margin:0}
.apr-title{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:500;font-size:28px;margin:6px 0 4px;color:#EDE9E3}
.apr-lead{color:#B9B4BE;font-size:14px;margin:0 0 20px;max-width:44em}
.apr-error{color:#fca5a5;font-size:13px;margin:0 0 14px}
.apr-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.apr-card{position:relative;border:1px solid #221d27;border-radius:22px;background:#0a070c;padding:18px;display:flex;flex-direction:column;gap:14px;transition:border-color .2s}
.apr-card.is-on{border-color:#EDE9E3}
.apr-ring{background:#040004;border:1px solid #221d27;border-radius:16px;aspect-ratio:1;overflow:hidden}
.apr-ring svg{width:100%;height:100%;display:block}
.apr-card h4{margin:0;font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:500;font-size:24px;color:#EDE9E3}
.apr-card p{margin:4px 0 0;color:#B9B4BE;font-size:13.5px}
.apr-badge{position:absolute;top:30px;right:30px;z-index:1;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;padding:5px 11px;border-radius:999px;background:#EDE9E3;color:#040004;font-weight:500}
.apr-btn{height:42px;border-radius:999px;border:1px solid #EDE9E3;background:transparent;color:#EDE9E3;font:500 14px 'DM Sans',sans-serif;cursor:pointer;width:100%}
.apr-btn:hover:not(:disabled){background:rgba(237,233,227,.08)}
.apr-btn:disabled{background:#1a161d;border-color:#2a2430;color:#6f6a76;cursor:default}
.apr-btn:focus-visible{outline:2px solid #EDE9E3;outline-offset:3px}
.apr-note{margin-top:16px;font-size:13px;color:#6f6a76}
@media (max-width:700px){.apr-cards{grid-template-columns:1fr}}
`;
