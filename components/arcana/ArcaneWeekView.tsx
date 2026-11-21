/**
 * Visão de calendário (aba antes chamada Baralho).
 * Os 22 arcanos montados como uma semana 4 × 3: Causa (4 colunas), Lei (2) e Efeito (1),
 * separados por linhas contínuas do topo até a base. Três linhas (α, μ, Ω) de 1 a 21, com o 0 à parte.
 * A linha dos dias da semana é móvel: a coluna do arcano do dia recebe o dia da semana da data lida.
 * Marcas de Jornada, Ano, Mês e Dia ligam e desligam, com cores de raridade (como itens de jogo).
 * Desenho técnico enviado pelo Rafa em 21/11/2026.
 */
import React, { useEffect, useRef, useState } from 'react';
import type { Arcanum } from './tarot';

type Mark = 'dia' | 'mes' | 'ano' | 'jornada';

interface Props {
  getArcano: (id: number) => Arcanum;
  /** data lida (AAAA-MM-DD): define o dia da semana de cada coluna */
  readDate?: string;
  /** arcanos do consulente na data lida */
  highlight?: Record<Mark, number>;
  onSelectCard: (arcano: Arcanum) => void;
}

// Domingo = 0 (como Date.getDay)
const WEEK = [
  { glyph: '☉', day: 'Dom' }, { glyph: '☽', day: 'Seg' }, { glyph: '♂', day: 'Ter' }, { glyph: '☿', day: 'Qua' },
  { glyph: '♃', day: 'Qui' }, { glyph: '♀', day: 'Sex' }, { glyph: '♄', day: 'Sáb' },
];

const KEYWORD: Record<number, string> = {
  0: 'Recomeço',
  1: 'Habilidade', 2: 'Intuição', 3: 'Abundância', 4: 'Autoridade', 5: 'Tradição', 6: 'Escolha', 7: 'Avanço',
  8: 'Equilíbrio', 9: 'Reflexão', 10: 'Mudança', 11: 'Coragem', 12: 'Sacrifício', 13: 'Transformação', 14: 'Equilíbrio',
  15: 'Tentação', 16: 'Destruição', 17: 'Esperança', 18: 'Ilusão', 19: 'Vitalidade', 20: 'Renascimento', 21: 'Realização',
};
/** número pequeno no canto (do desenho): do 14 ao 21 */
const EXTRA: Record<number, number> = { 14: 18, 15: 19, 16: 20, 17: 21, 18: 22, 19: 23, 20: 24, 21: 25 };

// α início, μ meio (a letra do meio do alfabeto grego), Ω fim
const ROWS = [
  { sym: 'α', start: 1, mark: 'full', words: ['Fácil', 'Esperança', 'Físico'] },
  { sym: 'μ', start: 8, mark: 'dot', words: ['Força', 'Caminhada', 'Mental'] },
  { sym: 'Ω', start: 15, mark: 'ring', words: ['Desafios', 'Medo', 'Espiritual'] },
] as const;

const COLUMNS = [
  { name: 'Ego', glyph: '♂', words: ['Poder', 'Autocontrole', 'Transformação'] },
  { name: 'Ordem', glyph: '♀', words: ['Sabedoria', 'Exploração', 'Mistério'] },
  { name: 'Estrutura', glyph: '♀', words: ['Fluxo', 'Abundância', 'Otimismo'] },
  { name: 'Mutável', glyph: '⚥', words: ['Poder', 'Equilíbrio', 'Desafios'] },
  { name: 'Santo', glyph: '♀♂', words: ['Transcendência', 'Aceitação', 'Iluminação'] },
  { name: 'Karma', glyph: '♂♀', words: ['Mudança', 'Escolhas', 'Renovação'] },
  { name: 'Paz', glyph: '○', words: ['Conquista', 'Superação', 'Avanço'] },
];

/** Marcas com cores de raridade: Dia incomum (verde), Mês raro (azul), Jornada épica (violeta), Ano lendário (amarelo). */
const MARKS: { id: Mark; label: string; tier: string; color: string }[] = [
  { id: 'dia', label: 'Dia', tier: 'Incomum', color: '#4ADE80' },
  { id: 'mes', label: 'Mês', tier: 'Raro', color: '#3B9BFF' },
  { id: 'ano', label: 'Ano', tier: 'Lendário', color: '#FACC15' },
  { id: 'jornada', label: 'Jornada', tier: 'Épico', color: '#A855F7' },
];

/** Partículas brancas subindo pelas bordas (união quádrupla). Desliga com "reduzir movimento". */
const Particles: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const g = cv.getContext('2d'); if (!g) return;
    const dpr = window.devicePixelRatio || 1;
    let W = 0, H = 0, raf = 0;
    const size = () => { const r = cv.getBoundingClientRect(); W = cv.width = Math.max(1, r.width * dpr); H = cv.height = Math.max(1, r.height * dpr); };
    size();
    const m = 14 * dpr;
    const spawn = (init = false) => {
      const side = Math.random();
      const x = side < 0.5 ? m + Math.random() * (W - 2 * m) : (Math.random() < 0.5 ? m : W - m);
      const y = side < 0.5 ? H - m - (init ? Math.random() * (H - 2 * m) : 0) : m + Math.random() * (H - 2 * m);
      return { x, y, r: (Math.random() * 1.2 + 0.4) * dpr, v: (Math.random() * 0.45 + 0.2) * dpr, a: Math.random() * 0.6 + 0.4, t: Math.random() * 6 };
    };
    const P = Array.from({ length: 26 }, () => spawn(true));
    const tick = () => {
      g.clearRect(0, 0, W, H);
      for (const p of P) {
        p.y -= p.v; p.x += Math.sin((p.t += 0.03)) * 0.25 * dpr; p.a -= 0.004;
        if (p.a <= 0 || p.y < 0) Object.assign(p, spawn());
        g.globalAlpha = Math.max(0, p.a); g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 5 * dpr;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    const ro = new ResizeObserver(size); ro.observe(cv);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} className="awv-parts" aria-hidden="true" />;
};

export const ArcaneWeekView: React.FC<Props> = ({ getArcano, readDate, highlight, onSelectCard }) => {
  const [on, setOn] = useState<Record<Mark, boolean>>({ dia: true, mes: true, ano: true, jornada: true });

  // Dia da semana de cada coluna: a coluna do arcano do dia recebe o dia da semana da data lida
  const ref = readDate ? new Date(`${readDate}T12:00:00`) : new Date();
  const weekday = isNaN(ref.getTime()) ? new Date().getDay() : ref.getDay();
  const diaN = highlight?.dia ?? 1;
  const diaCol = diaN === 0 ? -1 : (diaN - 1) % 7; // 0 fica antes da primeira coluna
  const dayOfCol = (c: number) => WEEK[(((weekday + c - diaCol) % 7) + 7) % 7];

  const marksFor = (n: number) => MARKS.filter(m => on[m.id] && highlight && highlight[m.id] === n);

  const Card: React.FC<{ n: number; zero?: boolean }> = ({ n, zero }) => {
    const a = getArcano(n);
    const ms = marksFor(n);
    const u = ms.length; // 0 a 4: nível da união
    const style: React.CSSProperties = {};
    if (u === 1) (style as any)['--mk'] = ms[0].color;
    if (u >= 2) {
      const seg = 360 / u;
      (style as any)['--stops'] = ms.map((m, i) => `${m.color} ${i * seg}deg ${(i + 1) * seg}deg`).join(',');
    }
    const label = `${a.fullName}${u ? ` · ${ms.map(m => m.label).join(', ')}` : ''}${u >= 3 ? ` · ${u === 4 ? 'Grande portal' : 'Portal'}` : ''}`;
    return (
      <button type="button" className={`awv-card u${u} ${zero ? 'is-zero' : ''}`} style={style} onClick={() => onSelectCard(a)} title={label} aria-label={label}>
        {u >= 2 && <span className="awv-glow" aria-hidden="true" />}
        <span className="awv-face">
          <img src={a.image} alt="" referrerPolicy="no-referrer" crossOrigin="anonymous" decoding="async" loading="lazy"
            onError={e => { if (a.backupImage && e.currentTarget.src !== a.backupImage) e.currentTarget.src = a.backupImage; }} />
          <span className="awv-shade" aria-hidden="true" />
          {!zero && <span className="awv-kw">{KEYWORD[n]}</span>}
          <span className="awv-num">{n}</span>
          {EXTRA[n] && <span className="awv-extra">{EXTRA[n]}</span>}
          {u > 0 && (
            <span className="awv-tags">{ms.map(m => <span key={m.id} className="awv-tag" style={{ background: m.color }}>{m.label}</span>)}</span>
          )}
        </span>
        {u >= 2 && <span className="awv-ring" aria-hidden="true" />}
        {u === 4 && <Particles />}
        {u >= 3 && <span className="awv-portal">{u === 4 ? 'Grande portal' : 'Portal'}</span>}
      </button>
    );
  };

  // linhas contínuas: antes da 5ª coluna (Lei) e antes da 7ª (Efeito)
  const cuts = [6, 8];

  return (
    <div className="awv">
      <style>{CSS}</style>
      <div className="awv-grid" role="grid" aria-label="Os 22 arcanos numa semana: Causa, Lei e Efeito">
        {cuts.map(c => <span key={c} className="awv-line" style={{ gridColumn: c, gridRow: '1 / -1' }} aria-hidden="true" />)}

        {/* Grupos da semana 4 × 3, sem caixas */}
        <div className="awv-group" style={{ gridColumn: '2 / span 4', gridRow: 1 }}><b>Causa</b><small>Trabalho</small></div>
        <div className="awv-group" style={{ gridColumn: '6 / span 2', gridRow: 1 }}><b>Lei</b><small>Sagrado</small></div>
        <div className="awv-group" style={{ gridColumn: '8 / span 1', gridRow: 1 }}><b>Efeito</b><small>Realização</small></div>

        {/* Marcas: ligar e desligar */}
        <div className="awv-toggles" style={{ gridColumn: 9, gridRow: 1 }} role="group" aria-label="Marcas no calendário">
          {MARKS.map(m => (
            <button key={m.id} type="button" role="switch" aria-checked={on[m.id]} className={on[m.id] ? 'on' : ''}
              style={{ '--mk': m.color } as React.CSSProperties} onClick={() => setOn(o => ({ ...o, [m.id]: !o[m.id] }))}
              title={`${m.label} · ${m.tier}`}>
              <i aria-hidden="true" />{m.label}
            </button>
          ))}
        </div>

        {/* O 0, à parte */}
        {/* O 0 numa linha acima do Mago (1), com o mesmo tamanho das outras cartas */}
        <div className="awv-cell" style={{ gridColumn: 1, gridRow: 1 }} title="0 · Recomeço, Alteração, Decisão">
          <Card n={0} />
        </div>

        {/* Dias da semana (móveis) */}
        {Array.from({ length: 7 }, (_, c) => {
          const d = dayOfCol(c);
          const today = c === diaCol;
          return (
            <div key={c} className={`awv-day ${today ? 'is-today' : ''}`} style={{ gridColumn: c + 2, gridRow: 1 }}>
              <span className="g">{d.glyph}</span><span className="d">{d.day}</span>
            </div>
          );
        })}

        {/* α, μ, Ω */}
        {ROWS.map((r, ri) => (
          <React.Fragment key={r.sym}>
            <div className="awv-sym" style={{ gridColumn: 1, gridRow: ri + 2 }}>{r.sym}</div>
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="awv-cell" style={{ gridColumn: i + 2, gridRow: ri + 2 }}>
                <Card n={r.start + i} />
              </div>
            ))}
            <div className="awv-legend" style={{ gridColumn: 9, gridRow: ri + 2 }}>
              <span className={`awv-mark ${r.mark}`} aria-hidden="true" />
              <span>{r.words.map(w => <span key={w}>{w}</span>)}</span>
            </div>
          </React.Fragment>
        ))}

        {/* Qualidades de cada coluna */}
        {COLUMNS.map((c, i) => (
          <div key={c.name} className="awv-col" style={{ gridColumn: i + 2, gridRow: 5 }}>
            <b>{c.name} <span className="g" aria-hidden="true">{c.glyph}</span></b>
            {c.words.map(w => <span key={w} className="w">{w}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
};

const CSS = `
/* Tudo cabe na área visível, sem rolagem: as cartas se ajustam à altura disponível */
.awv{height:100%;min-height:0;padding:2px 0 0;overflow:hidden}
.awv-grid{position:relative;height:100%;display:grid;grid-template-columns:repeat(8,minmax(0,1fr)) 88px;grid-template-rows:repeat(4,minmax(0,1fr)) auto;column-gap:10px;row-gap:6px;align-items:center}
.awv-line{justify-self:start;align-self:stretch;width:1px;margin-left:-6px;background:var(--a-line3,#3a3340);pointer-events:none}
.awv-group{align-self:start;display:flex;flex-direction:column;align-items:center;gap:2px;padding:0}
.awv-group b{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:19px;line-height:1;color:var(--a-hi,#FAF6EE)}
.awv-group small{font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--a-faint,#6f6a76)}
.awv-toggles{display:flex;flex-direction:column;gap:3px;align-self:center;padding-left:2px}
.awv-toggles button{display:flex;align-items:center;gap:6px;height:19px;padding:0 8px 0 5px;border-radius:999px;border:1px solid var(--a-line2,#2a2430);background:none;color:var(--a-dim,#8a8590);font:500 10px 'DM Sans',sans-serif;cursor:pointer;white-space:nowrap}
.awv-toggles button i{width:18px;height:10px;border-radius:999px;background:#2a2430;position:relative;flex:none}
.awv-toggles button i::after{content:"";position:absolute;top:2px;left:2px;width:6px;height:6px;border-radius:50%;background:#8a8590;transition:transform .15s}
.awv-toggles button.on{color:var(--a-hi,#FAF6EE);border-color:color-mix(in srgb,var(--mk) 55%,transparent)}
.awv-toggles button.on i{background:color-mix(in srgb,var(--mk) 35%,#0a070c)}
.awv-toggles button.on i::after{background:var(--mk);transform:translateX(8px)}
.awv-toggles button:focus-visible{outline:2px solid var(--a-fg,#EDE9E3);outline-offset:2px}
.awv-day{align-self:end;display:flex;align-items:center;justify-content:center;gap:5px;padding:3px 0;border-radius:8px}
.awv-day .g{font-family:'Noto Sans Symbols 2','Segoe UI Symbol',serif;font-size:16px;line-height:1;color:var(--a-fg,#EDE9E3)}
.awv-day .d{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--a-dim,#8a8590);font-weight:600}
.awv-day.is-today{background:rgba(237,233,227,.1)}
.awv-day.is-today .d{color:var(--a-hi,#FAF6EE)}
.awv-sym{display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:26px;color:var(--a-hi,#FAF6EE)}
.awv-zero{display:flex;flex-direction:column;align-items:center;gap:3px;align-self:stretch;justify-content:center;min-height:0}
.awv-zero .awv-card{height:52px;width:auto}
.awv-zero-words{align-self:end;justify-self:center;text-align:center;font-size:8.5px;line-height:1.3;color:var(--a-dim,#8a8590)}
.awv-cell{height:100%;min-height:0;min-width:0;display:flex;align-items:center;justify-content:center}
.awv-card{position:relative;display:block;height:100%;width:auto;max-width:100%;aspect-ratio:2/3.15;padding:0;border:0;border-radius:10px;background:none;cursor:pointer;isolation:isolate}
.awv-face{position:absolute;inset:0;border-radius:inherit;overflow:hidden;border:1px solid var(--a-line2,#2a2430);background:#000;z-index:1}
.awv-face img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.awv-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,0,4,.82) 0%,rgba(4,0,4,0) 24%,rgba(4,0,4,0) 60%,rgba(4,0,4,.88) 100%)}
.awv-kw{position:absolute;left:0;right:0;top:4px;text-align:center;font-size:7px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--a-fg,#EDE9E3);padding:0 3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.awv-num{position:absolute;left:0;right:0;bottom:3px;text-align:center;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:22px;line-height:1;color:var(--a-hi,#FAF6EE);text-shadow:0 1px 8px rgba(0,0,0,.7)}
.awv-zero .awv-num{font-size:16px}
.awv-extra{position:absolute;right:4px;bottom:4px;font-family:'DM Mono',monospace;font-size:8.5px;color:var(--a-dim,#8a8590)}
.awv-card:hover .awv-face{border-color:var(--a-fg,#EDE9E3)}
.awv-card:focus-visible{outline:2px solid var(--a-fg,#EDE9E3);outline-offset:2px}
.awv-card.u1 .awv-face{border:2px solid var(--mk);box-shadow:0 0 12px -2px color-mix(in srgb,var(--mk) 70%,transparent)}
/* Dias de Portal: borda com as cores de cada marca, girando; brilho por nível de união */
@property --awv-spin{syntax:'<angle>';inherits:false;initial-value:0deg}
.awv-ring,.awv-glow{position:absolute;inset:-2px;border-radius:12px;pointer-events:none;background:conic-gradient(from var(--awv-spin),var(--stops));animation:awv-spin 6s linear infinite}
.awv-ring{z-index:2;padding:2px;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.awv-glow{z-index:0;filter:blur(12px)}
.u2 .awv-face,.u3 .awv-face,.u4 .awv-face{border-color:transparent}
.u2 .awv-glow{opacity:.5}
.u3 .awv-glow{opacity:1;filter:blur(16px);animation:awv-spin 4s linear infinite,awv-pulse 2.4s ease-in-out infinite}
.u4 .awv-ring{background:conic-gradient(from var(--awv-spin),#fff,#F5F2EB,#fff,#d9d4ff,#fff)}
.u4 .awv-glow{background:#fff;filter:blur(18px);animation:awv-pulse4 2.2s ease-in-out infinite}
.u4 .awv-face{box-shadow:inset 0 0 24px rgba(255,255,255,.25)}
@keyframes awv-spin{to{--awv-spin:360deg}}
@keyframes awv-pulse{50%{filter:blur(22px);opacity:.75}}
@keyframes awv-pulse4{0%,100%{opacity:.95}50%{opacity:.55}}
.awv-parts{position:absolute;inset:-14px;width:calc(100% + 28px);height:calc(100% + 28px);z-index:3;pointer-events:none}
.awv-portal{position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);z-index:4;padding:2px 7px;border-radius:999px;background:var(--a-hi,#FAF6EE);color:#040004;font-size:7.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}
@media (prefers-reduced-motion:reduce){.awv-ring,.awv-glow{animation:none!important}}
.awv-tags{position:absolute;left:0;right:0;top:15px;display:flex;flex-wrap:wrap;justify-content:center;gap:2px;padding:0 3px}
.awv-tag{padding:1px 5px;border-radius:999px;color:#040004;font-size:7px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.awv-legend{display:flex;align-items:center;gap:7px;padding-left:2px}
.awv-legend>span:last-child{display:flex;flex-direction:column;font-size:10px;line-height:1.3;color:var(--a-mut,#B9B4BE)}
.awv-mark{flex:none;width:14px;height:14px;border-radius:50%;border:1.5px solid var(--a-fg,#EDE9E3)}
.awv-mark.full{background:var(--a-fg,#EDE9E3)}
.awv-mark.dot{background:radial-gradient(circle,var(--a-fg,#EDE9E3) 0 3px,transparent 3.5px)}
.awv-col{display:flex;flex-direction:column;align-items:center;gap:0;padding-top:2px;text-align:center;min-width:0}
.awv-col b{font-size:11px;font-weight:600;color:var(--a-hi,#FAF6EE);display:flex;align-items:center;gap:4px}
.awv-col .g{font-family:'Noto Sans Symbols 2','Segoe UI Symbol',serif;font-size:13px;line-height:1.2;color:var(--a-fg,#EDE9E3)}
.awv-col .w{font-size:9px;color:var(--a-dim,#8a8590);line-height:1.35;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
`;
