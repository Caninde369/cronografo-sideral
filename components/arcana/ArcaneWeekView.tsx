/**
 * Visão de calendário (aba antes chamada Baralho).
 * Os 22 arcanos montados como uma semana 4 × 3: Causa (seg a qui), Lei (sex e sáb) e Efeito (dom).
 * Três linhas (α, Σ, Ω) de 1 a 21, com o 0 à parte. Desenho técnico enviado pelo Rafa em 21/11/2026.
 * Cartas com a imagem do tarô e a identidade do Cronógrafo (escopo .arc-skin).
 */
import React from 'react';
import type { Arcanum } from './tarot';

interface Props {
  getArcano: (id: number) => Arcanum;
  /** arcanos do consulente na data escolhida (ficam marcados) */
  highlight?: { dia: number; mes: number; ano: number; jornada: number };
  onSelectCard: (arcano: Arcanum) => void;
}

const DAYS = [
  { glyph: '☽', day: 'Seg' }, { glyph: '♂', day: 'Ter' }, { glyph: '☿', day: 'Qua' }, { glyph: '♃', day: 'Qui' },
  { glyph: '♀', day: 'Sex' }, { glyph: '♄', day: 'Sáb' }, { glyph: '☉', day: 'Dom' },
];

const KEYWORD: Record<number, string> = {
  1: 'Habilidade', 2: 'Intuição', 3: 'Abundância', 4: 'Autoridade', 5: 'Tradição', 6: 'Escolha', 7: 'Avanço',
  8: 'Equilíbrio', 9: 'Reflexão', 10: 'Mudança', 11: 'Coragem', 12: 'Sacrifício', 13: 'Transformação', 14: 'Equilíbrio',
  15: 'Tentação', 16: 'Destruição', 17: 'Esperança', 18: 'Ilusão', 19: 'Vitalidade', 20: 'Renascimento', 21: 'Realização',
};
/** número pequeno no canto (do desenho): do 14 ao 21 */
const EXTRA: Record<number, number> = { 14: 18, 15: 19, 16: 20, 17: 21, 18: 22, 19: 23, 20: 24, 21: 25 };

const ROWS = [
  { sym: 'α', start: 1, mark: 'full', words: ['Fácil', 'Esperança', 'Físico'] },
  { sym: 'Σ', start: 8, mark: 'dot', words: ['Força', 'Caminhada', 'Mental'] },
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

const HL_LABEL: Record<string, string> = { dia: 'Dia', mes: 'Mês', ano: 'Ano', jornada: 'Jornada' };

export const ArcaneWeekView: React.FC<Props> = ({ getArcano, highlight, onSelectCard }) => {
  const tagsFor = (n: number) => highlight ? (Object.keys(HL_LABEL) as (keyof typeof highlight)[]).filter(k => highlight[k] === n).map(k => HL_LABEL[k]) : [];

  const Card: React.FC<{ n: number; zero?: boolean }> = ({ n, zero }) => {
    const a = getArcano(n);
    const tags = tagsFor(n);
    return (
      <button type="button" className={`awv-card ${tags.length ? 'is-on' : ''} ${zero ? 'is-zero' : ''}`} onClick={() => onSelectCard(a)}
        title={`${a.fullName}${tags.length ? ` · ${tags.join(', ')}` : ''}`} aria-label={`${a.fullName}${tags.length ? `, arcano do ${tags.join(', ')}` : ''}`}>
        <img src={a.image} alt="" referrerPolicy="no-referrer" crossOrigin="anonymous" decoding="async" loading="lazy"
          onError={e => { if (a.backupImage && e.currentTarget.src !== a.backupImage) e.currentTarget.src = a.backupImage; }} />
        <span className="awv-shade" aria-hidden="true" />
        {!zero && <span className="awv-kw">{KEYWORD[n]}</span>}
        <span className="awv-num">{n}</span>
        {EXTRA[n] && <span className="awv-extra">{EXTRA[n]}</span>}
        {tags.length > 0 && <span className="awv-tag">{tags.join(' · ')}</span>}
      </button>
    );
  };

  return (
    <div className="awv h-full overflow-auto">
      <style>{CSS}</style>
      <div className="awv-grid" role="grid" aria-label="Os 22 arcanos numa semana: Causa, Lei e Efeito">
        {/* Grupos da semana: 4 × 3 */}
        <div className="awv-group" style={{ gridColumn: '2 / span 4' }}><b>Causa</b><small>Trabalho</small></div>
        <div className="awv-group" style={{ gridColumn: '6 / span 2' }}><b>Lei</b><small>Sagrado</small></div>
        <div className="awv-group" style={{ gridColumn: '8 / span 1' }}><b>Efeito</b><small>Realização</small></div>

        {/* O 0, à parte */}
        <div className="awv-zero" style={{ gridColumn: 1, gridRow: '2 / span 1' }}>
          <Card n={0} zero />
          <span className="awv-zero-words">Recomeço<br />Alteração<br />Decisão</span>
        </div>

        {/* Dias e planetas */}
        {DAYS.map((d, i) => (
          <div key={d.day} className={`awv-day ${i === 4 || i === 6 ? 'awv-cut' : ''}`} style={{ gridColumn: i + 2, gridRow: 2 }}>
            <span className="g">{d.glyph}</span><span className="d">{d.day}</span>
          </div>
        ))}

        {/* α, Σ, Ω */}
        {ROWS.map((r, ri) => (
          <React.Fragment key={r.sym}>
            <div className="awv-sym" style={{ gridColumn: 1, gridRow: ri + 3 }}>{r.sym}</div>
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className={`awv-cell ${i === 4 || i === 6 ? 'awv-cut' : ''}`} style={{ gridColumn: i + 2, gridRow: ri + 3 }}>
                <Card n={r.start + i} />
              </div>
            ))}
            <div className="awv-legend" style={{ gridColumn: 9, gridRow: ri + 3 }}>
              <span className={`awv-mark ${r.mark}`} aria-hidden="true" />
              <span>{r.words.map(w => <span key={w}>{w}</span>)}</span>
            </div>
          </React.Fragment>
        ))}

        {/* Qualidades de cada coluna */}
        {COLUMNS.map((c, i) => (
          <div key={c.name} className={`awv-col ${i === 4 || i === 6 ? 'awv-cut' : ''}`} style={{ gridColumn: i + 2, gridRow: 6 }}>
            <b>{c.name}</b>
            <span className="g" aria-hidden="true">{c.glyph}</span>
            {c.words.map(w => <span key={w} className="w">{w}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
};

const CSS = `
.awv{padding:4px 2px 8px}
.awv-grid{display:grid;grid-template-columns:72px repeat(7,minmax(74px,1fr)) 120px;grid-template-rows:auto auto repeat(3,auto) auto;column-gap:10px;row-gap:10px;min-width:820px;max-width:1080px;margin:0 auto;align-items:center}
.awv-group{grid-row:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 0 7px;border:1px solid var(--a-line2,#2a2430);border-radius:14px}
.awv-group b{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:22px;line-height:1;color:var(--a-hi,#FAF6EE)}
.awv-group small{font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--a-faint,#6f6a76)}
.awv-day{display:flex;flex-direction:column;align-items:center;gap:2px;padding-bottom:2px}
.awv-day .g{font-family:'Noto Sans Symbols 2','Segoe UI Symbol',serif;font-size:22px;line-height:1;color:var(--a-fg,#EDE9E3)}
.awv-day .d{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--a-dim,#8a8590);font-weight:600}
/* divisões da semana 4 × 3 */
.awv-cut{position:relative}
.awv-cut::before{content:"";position:absolute;left:-6px;top:-6px;bottom:-6px;width:1px;background:var(--a-line3,#3a3340)}
.awv-sym{display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:34px;color:var(--a-hi,#FAF6EE)}
.awv-zero{display:flex;flex-direction:column;align-items:center;gap:6px;grid-row:2}
.awv-zero .awv-card{width:56px}
.awv-zero-words{font-size:9.5px;line-height:1.35;text-align:center;color:var(--a-dim,#8a8590)}
.awv-cell{min-width:0}
.awv-card{position:relative;display:block;width:100%;aspect-ratio:2/3.15;padding:0;border-radius:12px;overflow:hidden;border:1px solid var(--a-line2,#2a2430);background:#000;cursor:pointer;contain:layout paint}
.awv-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.awv-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,0,4,.82) 0%,rgba(4,0,4,0) 26%,rgba(4,0,4,0) 58%,rgba(4,0,4,.88) 100%)}
.awv-kw{position:absolute;left:0;right:0;top:6px;text-align:center;font-size:8px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--a-fg,#EDE9E3);padding:0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.awv-num{position:absolute;left:0;right:0;bottom:4px;text-align:center;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:28px;line-height:1;color:var(--a-hi,#FAF6EE);text-shadow:0 1px 8px rgba(0,0,0,.7)}
.awv-zero .awv-num{font-size:22px}
.awv-extra{position:absolute;right:6px;bottom:6px;font-family:'DM Mono',monospace;font-size:9.5px;color:var(--a-dim,#8a8590)}
.awv-card:hover{border-color:var(--a-fg,#EDE9E3)}
.awv-card:focus-visible{outline:2px solid var(--a-fg,#EDE9E3);outline-offset:2px}
.awv-card.is-on{border-color:var(--a-fg,#EDE9E3);box-shadow:0 0 0 1px var(--a-fg,#EDE9E3)}
.awv-tag{position:absolute;left:50%;top:22px;transform:translateX(-50%);padding:2px 7px;border-radius:999px;background:var(--a-fg,#EDE9E3);color:var(--a-bg,#040004);font-size:8.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.awv-legend{display:flex;align-items:center;gap:10px;padding-left:4px}
.awv-legend>span:last-child{display:flex;flex-direction:column;font-size:11.5px;line-height:1.35;color:var(--a-mut,#B9B4BE)}
.awv-mark{flex:none;width:18px;height:18px;border-radius:50%;border:1.5px solid var(--a-fg,#EDE9E3)}
.awv-mark.full{background:var(--a-fg,#EDE9E3)}
.awv-mark.dot{background:radial-gradient(circle,var(--a-fg,#EDE9E3) 0 4px,transparent 4.5px)}
.awv-col{display:flex;flex-direction:column;align-items:center;gap:2px;padding-top:6px;text-align:center}
.awv-col b{font-size:12.5px;font-weight:600;color:var(--a-hi,#FAF6EE)}
.awv-col .g{font-family:'Noto Sans Symbols 2','Segoe UI Symbol',serif;font-size:22px;line-height:1.1;margin:2px 0 4px;color:var(--a-fg,#EDE9E3)}
.awv-col .w{font-size:10.5px;color:var(--a-dim,#8a8590);line-height:1.45}
`;
