/**
 * Catálogo de atendimentos (aprovado pelo Rafa em 23/11/2026).
 * Conteúdo do catálogo do Claude Design. Cada atendimento abre o WhatsApp com o nome dele na mensagem;
 * o rodapé fixo leva ao WhatsApp direto.
 */
import React, { useEffect, useRef, useState } from 'react';
import { waLink } from './config';

type Svc = { id: string; q: string; d: string; nm: string; fmt: string; p: number; old?: number; tip: string };

const SERVICES: Svc[] = [
  { id: 'pergunta', q: 'Tem uma decisão que não sai da sua cabeça.', d: 'Aceitar a proposta? Mandar a mensagem? Esperar mais um pouco? Você me manda a pergunta, eu olho o seu tempo arcano e o céu do período, e te respondo em áudio.', nm: 'Pergunta específica', fmt: 'áudio no WhatsApp', p: 80, tip: 'pra quem tem uma dúvida só, mas ela não deixa dormir.' },
  { id: 'momento', q: 'Você sente que está num ciclo, mas não sabe qual.', d: 'Abro o Cronógrafo e o Calendário Arcano com você e mostro em que fase está, o que ela pede e quando ela muda. 40 minutos olhando a tela junto.', nm: 'Onde você está no tempo', fmt: 'vídeo · cerca de 40 min', p: 180, tip: 'é o "você está aqui" do seu tempo.' },
  { id: 'mes', q: 'Tem um mês decisivo pela frente.', d: 'Leio o mês dia a dia: onde a energia sobe, onde cai, quais datas pedem ação e quais pedem recuo. Em vídeo, pra você rever quando precisar.', nm: 'Seu próximo mês', fmt: 'vídeo', p: 200, tip: 'bom pra quem tem entrega, viagem ou mudança marcada.' },
  { id: 'agenda', q: 'Saber não adianta se você esquece na hora.', d: 'A leitura vira eventos na sua agenda do Google, com a energia de cada dia e orientação nos dias mais importantes. Você abre o celular e já sabe.', nm: 'A energia dos seus dias na agenda', fmt: 'Google Agenda + áudio', p: 250, tip: 'a diferença: a agenda te lembra.' },
  { id: 'ano', q: 'Quer saber onde colocar o seu ano.', d: 'Os 12 meses lidos: os períodos de abertura, os de travamento e as datas que já valem marcar. Pra quem vai lançar, mudar ou recomeçar algo.', nm: 'Seu próximo ano', fmt: 'vídeo', p: 250, old: 300, tip: 'valor de retorno dos atendimentos.' },
  { id: 'mapa', q: 'Quer entender por que você é assim.', d: '90 minutos olhando o seu mapa comigo: o que veio de berço, o que se repete na sua vida e o que o seu tempo arcano diz sobre a fase que você vive agora.', nm: 'Mapa natal', fmt: 'vídeo · cerca de 90 min', p: 270, old: 330, tip: 'o mais completo. comece por aqui se nunca fez.' },
];

const FILTERS: Array<[string, string]> = [
  ['mapa', 'Nunca fiz nada disso'],
  ['pergunta', 'Tenho uma pergunta só'],
  ['agenda', 'Quero organizar a rotina'],
  ['mes', 'Um mês pesado chegando'],
  ['momento', 'Estou num ciclo e não entendo'],
];

export const CatalogDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [hl, setHl] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [open, onClose]);

  useEffect(() => {
    if (!hl) return;
    const el = listRef.current?.querySelector(`[data-svc="${hl}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [hl]);

  if (!open) return null;
  return (
    <div className="cg-wrap" onClick={onClose}>
      <style>{CG_CSS}</style>
      <div className="cg" role="dialog" aria-modal="true" aria-labelledby="cg-title" onClick={e => e.stopPropagation()}>
        <div className="cg-grab" aria-hidden="true" />
        <div className="cg-h">
          <div>
            <small>Cronógrafo Sideral · atendimentos</small>
            <h2 id="cg-title">Escolha pelo que você precisa agora</h2>
            <p>6 atendimentos, de R$80 a R$270. Cada um resolve uma situação diferente.</p>
          </div>
          <button type="button" className="cg-x" onClick={onClose} aria-label="Fechar"><i className="ti ti-x" aria-hidden="true" /></button>
        </div>
        <div className="cg-chips" role="group" aria-label="Qual é o seu momento">
          <span>Você…</span>
          {FILTERS.map(([id, label]) => (
            <button key={id} type="button" className={hl === id ? 'on' : ''} aria-pressed={hl === id} onClick={() => setHl(h => (h === id ? null : id))}>{label}</button>
          ))}
        </div>
        <div className="cg-list" ref={listRef}>
          {SERVICES.map(s => (
            <article key={s.id} data-svc={s.id} className={`cg-svc ${hl === s.id ? 'hl' : ''}`}>
              <h3>{s.q}</h3>
              <div className="cg-body">
                <p>{s.d}</p>
                <div className="cg-meta"><b>{s.nm}</b><span>{s.fmt}</span></div>
                <p className="cg-tip">{s.tip}</p>
              </div>
              <div className="cg-side">
                <span className="cg-price">{s.old && <s>R${s.old}</s>}<small>R$</small><b>{s.p}</b></span>
                <a className="cg-want" href={waLink(`Olá! Vim pelo site do Cronógrafo Sideral e quero o atendimento "${s.nm}" (R$${s.p}).`)} target="_blank" rel="noopener noreferrer">
                  <i className="ti ti-brand-whatsapp" aria-hidden="true" />Quero este
                </a>
              </div>
            </article>
          ))}
        </div>
        <div className="cg-f">
          <p><b>Ainda em dúvida?</b> Me chama que eu te ajudo a escolher. Às vezes é o mais barato da lista.</p>
          <a className="cg-wa" href={waLink('Olá! Vim pelo site do Cronógrafo Sideral e quero ajuda para escolher um atendimento.')} target="_blank" rel="noopener noreferrer">
            <i className="ti ti-brand-whatsapp" aria-hidden="true" />Falar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

const CG_CSS = `
.cg-wrap{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:32px 16px;background:rgba(2,0,4,.72);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);--fg:#EDE9E3;--hi:#FAF6EE;--mut:#B9B4BE;--dim:#8a8590;--line:#221D27;--line2:#3A3440;--card:#0a070c}
.cg{width:100%;max-width:760px;max-height:100%;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line2);border-radius:24px;color:var(--fg);font-family:'DM Sans',system-ui,sans-serif;box-shadow:0 30px 80px -20px rgba(0,0,0,.9)}
.cg *{box-sizing:border-box}
.cg-grab{display:none}
.cg-h{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:26px 28px 18px}
.cg-h small{display:block;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);margin-bottom:8px}
.cg-h h2{margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:40px;line-height:1;color:var(--hi);text-wrap:balance}
.cg-h p{margin:8px 0 0;font-size:14px;color:var(--mut);line-height:1.5}
.cg-x{width:42px;height:42px;flex:none;border-radius:50%;border:1px solid rgba(237,233,227,.32);background:rgba(237,233,227,.08);color:var(--hi);display:flex;align-items:center;justify-content:center;font-size:19px;cursor:pointer}
.cg-x:hover{background:rgba(237,233,227,.16);border-color:var(--fg)}
.cg-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 28px 14px;border-bottom:1px solid var(--line)}
.cg-chips span{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);align-self:center;margin-right:4px}
.cg-chips button{height:34px;padding:0 13px;border-radius:999px;border:1px solid var(--line2);background:none;color:var(--fg);font:500 12.5px 'DM Sans',sans-serif;cursor:pointer;white-space:nowrap}
.cg-chips button.on{background:var(--fg);color:#040004;border-color:var(--fg)}
.cg-list{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:8px 28px;scrollbar-width:thin}
.cg-svc{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 24px;padding:22px 0;border-bottom:1px solid var(--line);scroll-margin:8px}
.cg-svc:last-child{border-bottom:0}
.cg-svc.hl{background:linear-gradient(90deg,rgba(237,233,227,.06),transparent);margin:0 -28px;padding-left:28px;padding-right:28px}
.cg-svc h3{grid-column:1/-1;margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:25px;line-height:1.15;color:var(--hi)}
.cg-body p{margin:0;font-size:14px;line-height:1.6;color:var(--mut);max-width:52ch}
.cg-meta{display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap}
.cg-meta b{font-size:13.5px;font-weight:600;color:var(--hi)}
.cg-meta span{font-size:12px;color:var(--dim);border:1px solid var(--line2);border-radius:999px;padding:3px 10px}
.cg-body .cg-tip{margin-top:8px;font-size:12px;color:var(--dim)}
.cg-side{grid-column:2;grid-row:2;display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;gap:12px}
.cg-price{display:flex;align-items:baseline;gap:6px;white-space:nowrap}
.cg-price s{font:13px 'DM Mono',ui-monospace,monospace;color:var(--dim);margin-right:2px}
.cg-price small{font-size:12px;color:var(--dim)}
.cg-price b{font-family:'Cormorant Infant','Cormorant Garamond',Georgia,serif;font-weight:600;font-size:34px;line-height:1;color:var(--hi)}
.cg-want{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 15px;border-radius:999px;border:1px solid var(--line2);color:var(--fg)!important;font:500 12.5px 'DM Sans',sans-serif;text-decoration:none;white-space:nowrap}
.cg-want:hover{border-color:var(--fg)}
.cg-want i{font-size:17px;color:#25D366}
.cg-f{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 28px 20px;border-top:1px solid var(--line)}
.cg-f p{margin:0;font-size:13px;color:var(--mut);line-height:1.4}
.cg-f p b{color:var(--hi);font-weight:500}
.cg-wa{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:0 22px;border-radius:999px;background:var(--fg);color:#040004!important;font:600 13px 'DM Sans',sans-serif;text-decoration:none;white-space:nowrap}
.cg-wa i{font-size:20px;color:#128C4A}
.cg-wa:hover{background:#fff}
.cg a:focus-visible,.cg button:focus-visible{outline:2px solid var(--fg);outline-offset:3px}
@media (max-width:640px){
  .cg-wrap{padding:0;align-items:flex-end}
  .cg{max-width:none;height:calc(100% - 40px);max-height:none;border-radius:24px 24px 0 0;border-bottom:0}
  .cg-grab{display:block;width:38px;height:4px;border-radius:2px;background:var(--line2);margin:8px auto 0}
  .cg-h{padding:16px 18px 12px}
  .cg-h h2{font-size:32px}
  .cg-chips{padding:0 18px 12px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}
  .cg-chips span{display:none}
  .cg-list{padding:4px 18px}
  .cg-svc{grid-template-columns:1fr}
  .cg-svc.hl{margin:0 -18px;padding-left:18px;padding-right:18px}
  .cg-svc h3{font-size:23px}
  .cg-side{grid-column:1;grid-row:auto;flex-direction:row;align-items:center;margin-top:8px}
  .cg-f{padding:12px 18px calc(14px + env(safe-area-inset-bottom,0px));flex-direction:column;align-items:stretch;gap:10px}
}
`;

export default CatalogDialog;
