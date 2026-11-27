/**
 * Catálogo de atendimentos v2 (aprovado pelo Rafa em 27/11/2026).
 * Cards: nome do atendimento como etiqueta, frase de reconhecimento como título, detalhe, preço.
 * O card inteiro abre o WhatsApp com o nome e o preço; o rodapé fixo leva ao WhatsApp direto.
 * A linha espectral aparece uma vez só, no topo do painel. Destaque único: "mais solicitado".
 */
import React, { useEffect } from 'react';
import { waLink } from './config';

type Svc = { id: string; nm: string; h: string; d: string; fmt: string; p: number; old?: number; top?: boolean };

const SERVICES: Svc[] = [
  { id: 'agenda', nm: 'Suas leituras no Google Agenda', h: 'Quero organizar a rotina', d: 'Cada dia já chega com a energia dele. Você abre o celular e sabe se é dia de agir ou de segurar.', fmt: 'agenda + áudio', p: 250, top: true },
  { id: 'perguntas', nm: '3 perguntas', h: 'Tem coisa que não sai da minha cabeça', d: 'Aprofunde em até três áreas da sua vida, à sua escolha.', fmt: 'áudio', p: 80 },
  { id: 'momento', nm: 'Onde você está', h: 'Estou num ciclo repetitivo', d: 'A gente descobre que fase é essa e quando ela termina.', fmt: 'vídeo · 40 min', p: 180 },
  { id: 'mes', nm: 'O próximo mês', h: 'Um mês tenso chegando', d: 'Dia a dia: quando agir, quando esperar.', fmt: 'vídeo', p: 200 },
  { id: 'ano', nm: 'O próximo ano', h: 'Datas importantes pro meu projeto', d: 'Doze meses lidos, com as datas boas já marcadas.', fmt: 'vídeo', p: 250, old: 300 },
  { id: 'mapa', nm: 'Mapa natal', h: 'Por que eu sou assim?', d: 'Noventa minutos sobre o que veio com você e a fase que você vive agora.', fmt: 'vídeo · 90 min', p: 270, old: 330 },
];

export const CatalogDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="cg-wrap" onClick={onClose}>
      <style>{CG_CSS}</style>
      <div className="cg" role="dialog" aria-modal="true" aria-labelledby="cg-title" onClick={e => e.stopPropagation()}>
        <div className="cg-grab" aria-hidden="true" />
        <div className="cg-h">
          <div>
            <h2 id="cg-title">O seu tempo tem padrão.</h2>
            <p>Sem religião e sem achismo. É o céu e a matemática da sua data de nascimento. Escolha pelo que você está vivendo agora.</p>
          </div>
          <button type="button" className="cg-x" onClick={onClose} aria-label="Fechar"><i className="ti ti-x" aria-hidden="true" /></button>
        </div>
        <div className="cg-list">
          {SERVICES.map(s => (
            <a key={s.id} className={`cg-c ${s.top ? 'top' : ''}`} target="_blank" rel="noopener noreferrer"
              href={waLink(`Olá! Vim pelo site do Cronógrafo Sideral e quero o atendimento "${s.nm}" (R$${s.p}).`)}
              aria-label={`${s.nm}, R$${s.p}. Abrir no WhatsApp`}>
              {s.top && <span className="cg-most">mais solicitado</span>}
              <span className="cg-nm">{s.nm}</span>
              <h3>{s.h}</h3>
              <p>{s.d}</p>
              <span className="cg-ft">
                <span className="cg-pr">{s.old && <s>R${s.old}</s>}<small>R$</small>{s.p}</span>
                <span className="cg-fm">{s.fmt}</span>
              </span>
            </a>
          ))}
        </div>
        <div className="cg-f">
          <p><b>Ficou entre dois?</b> Me conta o que está vivendo que eu te digo qual faz mais sentido.</p>
          <a className="cg-wa" href={waLink('Olá! Vim pelo site do Cronógrafo Sideral e quero ajuda para escolher um atendimento.')} target="_blank" rel="noopener noreferrer">
            <i className="ti ti-brand-whatsapp" aria-hidden="true" />Falar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

const CG_CSS = `
.cg-wrap{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:32px 16px;background:rgba(2,0,4,.72);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);--fg:#EDE9E3;--hi:#FAF6EE;--mut:#B9B4BE;--dim:#8a8590;--line:#221D27;--line2:#2a2430;--line3:#3A3440;--panel:#0a070c;--card:#13111B;--spec:linear-gradient(90deg,#B0215A,#EF4444,#FB923C,#FACC15,#4ADE80,#22D3EE,#8B5CF6)}
.cg{position:relative;width:100%;max-width:900px;max-height:100%;display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line2);border-radius:26px;overflow:hidden;color:var(--fg);font-family:'DM Sans',system-ui,sans-serif;box-shadow:0 40px 90px -40px #000}
.cg::before{content:"";position:absolute;inset:0 0 auto;height:1px;background:var(--spec);opacity:.7;z-index:1}
.cg *{box-sizing:border-box}
.cg-grab{display:none}
.cg-h{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:30px 32px 8px}
.cg-h h2{margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:40px;line-height:1.05;color:var(--hi);text-wrap:balance}
.cg-h p{margin:12px 0 0;font-size:14.5px;color:var(--mut);line-height:1.5;max-width:46ch}
.cg-x{width:42px;height:42px;flex:none;border-radius:50%;border:1px solid var(--line3);background:none;color:var(--hi);display:flex;align-items:center;justify-content:center;font-size:19px;cursor:pointer}
.cg-x:hover{background:rgba(237,233,227,.1);border-color:var(--fg)}
.cg-list{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;padding:28px 32px 12px;scrollbar-width:thin;align-content:start;grid-auto-rows:max-content}
.cg-c{position:relative;display:flex;flex-direction:column;align-items:flex-start;min-height:250px;padding:22px 22px 20px;border-radius:20px;background:var(--card);border:1px solid var(--line);color:inherit!important;text-decoration:none;transition:border-color .2s,background .2s,transform .2s}
.cg-c:hover{border-color:var(--line3);background:#17141f;transform:translateY(-2px)}
.cg-c:hover h3{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px}
.cg-c.top{border-color:var(--hi)}
.cg-most{position:absolute;top:-9px;left:18px;padding:0 8px;background:var(--panel);font:500 11px/18px 'DM Sans',sans-serif;letter-spacing:.06em;color:var(--hi);white-space:nowrap}
.cg-nm{flex:none;display:inline-flex;align-items:center;height:26px;padding:0 11px;border-radius:999px;border:1px solid var(--line3);font:500 11.5px 'DM Sans',sans-serif;color:var(--mut);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.cg-c h3{flex:none;margin:22px 0 10px;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:600;font-size:27px;line-height:1.08;color:var(--hi)}
.cg-c p{margin:0;font-size:14px;line-height:1.55;color:var(--mut);max-width:30ch}
.cg-ft{margin-top:auto;padding-top:22px;width:100%;display:flex;align-items:flex-end;justify-content:space-between;gap:8px}
.cg-pr{font:600 34px/1 'Cormorant Infant','Cormorant Garamond',Georgia,serif;color:var(--hi)}
.cg-pr small{font:500 11px 'DM Sans',sans-serif;color:var(--dim);margin-right:3px;vertical-align:14px}
.cg-pr s{display:block;font:12px 'DM Mono',ui-monospace,monospace;color:var(--dim);margin-bottom:3px}
.cg-fm{font:11.5px 'DM Mono',ui-monospace,monospace;color:var(--dim);text-align:right;white-space:nowrap}
.cg-f{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:12px 32px 28px;padding:16px 18px;border-radius:16px;border:1px dashed var(--line3)}
.cg-f p{margin:0;font-size:14px;color:var(--mut);line-height:1.4}
.cg-f p b{color:var(--hi);font-weight:600}
.cg-wa{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:46px;padding:0 20px;border-radius:999px;background:var(--fg);color:#040004!important;font:600 14px 'DM Sans',sans-serif;text-decoration:none;white-space:nowrap}
.cg-wa i{font-size:20px;color:#16a34a}
.cg-wa:hover{background:#fff}
.cg a:focus-visible,.cg button:focus-visible{outline:2px solid var(--fg);outline-offset:3px}
@media (max-width:860px){.cg-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:640px){
  .cg-wrap{padding:0;align-items:flex-end}
  .cg{max-width:none;height:calc(100% - 40px);max-height:none;border-radius:24px 24px 0 0;border-bottom:0}
  .cg-grab{display:block;width:40px;height:4px;border-radius:4px;background:var(--line3);margin:10px auto 0}
  .cg-h{padding:16px 18px 0}
  .cg-h h2{font-size:30px}
  .cg-h p{font-size:13px;margin-top:8px}
  .cg-x{width:38px;height:38px}
  .cg-list{grid-template-columns:1fr;gap:14px;padding:22px 16px 14px}
  .cg-c{min-height:auto;padding:18px 18px 16px;border-radius:18px}
  .cg-c h3{margin:14px 0 6px;font-size:23px}
  .cg-c p{font-size:13px;line-height:1.5;max-width:none}
  .cg-ft{padding-top:14px}
  .cg-pr{font-size:28px}
  .cg-pr small{vertical-align:11px}
  .cg-f{margin:0;border:0;border-top:1px solid var(--line);border-radius:0;padding:12px 14px calc(14px + env(safe-area-inset-bottom,0px));flex-direction:column;align-items:stretch;gap:8px}
  .cg-f p{text-align:center;font-size:12.5px;color:var(--dim)}
  .cg-f p b{color:var(--dim);font-weight:500}
}
`;

export default CatalogDialog;
