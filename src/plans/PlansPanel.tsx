/**
 * Página de planos + checkout do Fundador (mockup aprovado em 20/11/2026).
 * Usada na landing (HomeSite) e no app (PaymentPlansModal). Valores vêm de ./plans.
 *
 * Os cards se arrumam pela largura do próprio painel (container queries):
 *   > 900px  três colunas, linhas internas alinhadas (subgrid)
 *   600–900  Fundador na linha de cima; Grátis e Pro lado a lado
 *   < 600    uma coluna, Fundador primeiro
 */
import React, { useEffect, useState } from 'react';
import {
  PLANOS, faseAtual, vendidasManual, simulacao, parcelaFundador, anualPorMes, economiaAnual, economiaAnualPct,
  brl, waLink, LICENCA, MSG, FAQ, type Fase,
} from './plans';
import { PAYMENT_CONFIG } from '../../lib/paymentConfig';
import { getLifetimeSoldCount } from '../../lib/firebase';

type Pay = 'pix' | 'card' | 'wa';

export const PlansPanel: React.FC<{
  /** Botão do Grátis (landing: abre o login; app: fecha a janela). */
  onFree: () => void;
  freeLabel?: string;
  /** Mostra o título "Escolha seu acesso" e o subtítulo. */
  showHeader?: boolean;
  title?: string;
}> = ({ onFree, freeLabel = 'Começar grátis', showHeader = true, title = 'Escolha seu acesso' }) => {
  const sim = simulacao();
  const [firestoreSold, setFirestoreSold] = useState<number | null>(null);
  const [bill, setBill] = useState<'m' | 'a'>('m');
  const [openQ, setOpenQ] = useState(-1);
  const [co, setCo] = useState(false);
  const [pay, setPay] = useState<Pay>('pix');
  const [pixStep, setPixStep] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    getLifetimeSoldCount().then(n => { if (alive) setFirestoreSold(n); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!co) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setCo(false); } };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [co]);

  const total = PLANOS.fundador.vagas;
  const sold = Math.min(total, sim.vendidas ?? Math.max(vendidasManual, firestoreSold ?? 0));
  const left = total - sold;
  const fase: Fase = faseAtual(sim.agora ?? new Date(), sold);
  const an = bill === 'a';

  const Ic: React.FC<{ n: string }> = ({ n }) => <i className={`ti ${n}`} aria-hidden="true" />;
  const Li: React.FC<{ i: string; t: string; s?: string }> = ({ i, t, s }) => (
    <li><Ic n={i} /><span>{t}{s && <small>{s}</small>}</span></li>
  );
  const Price: React.FC<{ eyebrow: string; v: string; sub: React.ReactNode }> = ({ eyebrow, v, sub }) => (
    <div className="pp-r-price">
      <div className="pp-eyebrow">{eyebrow}</div>
      <div className="pp-price"><small>R$</small>{v}</div>
      <p className="pp-sub">{sub}</p>
    </div>
  );

  const free = (
    <article className="pp-card" key="free" data-plan="free">
      <div className="pp-r-head"><span className="pp-ico"><Ic n="ti-sun-moon" /></span><h2>Grátis</h2></div>
      <p className="pp-desc">O céu de agora e os ciclos lunares,<br />sempre abertos.</p>
      <div className="pp-r-ctrl" />
      <Price eyebrow="Para sempre" v="0" sub={fase === 1 ? <><b>+ {PLANOS.teste.horas} horas</b> com tudo liberado</> : 'Sem cartão de crédito'} />
      <div className="pp-r-cta"><button type="button" className="pp-pill" onClick={onFree}>{freeLabel}</button></div>
      <div className="pp-r-feat"><p className="pp-inc">Inclui</p><ul className="pp-fl">
        <Li i="ti-clock-hour-4" t="Relógio do céu ao vivo" />
        <Li i="ti-moon" t="Calendário de ciclos lunares" />
        <Li i="ti-download" t="Exportação com marca d'água" />
        {fase === 1 && <Li i="ti-hourglass-high" t={`${PLANOS.teste.horas} horas de teste profissional`} s={`Em até ${PLANOS.teste.diasValidade} dias, enquanto houver vagas de Fundador`} />}
      </ul></div>
      <div className="pp-r-foot" /><div />
    </article>
  );

  const proLocked = fase === 1;
  const pro = (
    <article className={`pp-card ${proLocked ? 'is-lock' : ''}`} key="pro" data-plan="pro">
      {proLocked && <span className="pp-ribbon"><Ic n="ti-lock" /> Abre depois das vagas</span>}
      <div className="pp-r-head"><span className="pp-ico"><Ic n="ti-planet" /></span><h2>Plano Pro</h2></div>
      <p className="pp-desc">Tudo liberado para atender,<br />salvar e exportar mapas.</p>
      <div className="pp-r-ctrl">
        <div className="pp-toggle" role="radiogroup" aria-label="Forma de assinatura">
          <button type="button" role="radio" aria-checked={!an} className={!an ? 'is-on' : ''} onClick={() => setBill('m')}>Mensal</button>
          <button type="button" role="radio" aria-checked={an} className={an ? 'is-on' : ''} onClick={() => setBill('a')}>
            Anual <span className="pp-save">−{economiaAnualPct}% · R$ {brl(economiaAnual)}</span>
          </button>
        </div>
      </div>
      <Price eyebrow={an ? 'Por ano' : 'Por mês'} v={brl(an ? PLANOS.proAnual : PLANOS.proMensal)}
        sub={an ? <>R$ {brl(anualPorMes)} por mês · <b>economize {economiaAnualPct}% (R$ {brl(economiaAnual)})</b></> : 'Cancele quando quiser'} />
      <div className="pp-r-cta">
        {proLocked
          ? <button type="button" className="pp-pill" disabled>Disponível depois das vagas</button>
          : <a className="pp-pill pp-solid" href={waLink(an ? MSG.proAnual : MSG.proMensal)} target="_blank" rel="noopener noreferrer">{an ? 'Assinar o anual' : 'Assinar o mensal'}</a>}
      </div>
      <div className="pp-r-feat"><p className="pp-inc">Tudo do Grátis, mais</p><ul className="pp-fl">
        <Li i="ti-lock-open" t="Todas as ferramentas" />
        <Li i="ti-users" t="Mapas de clientes salvos" />
        <Li i="ti-file-type-pdf" t="PDF sem marca d'água" />
        {an ? <Li i="ti-cash" t={`Pix ou ${PLANOS.fundador.parcelas}x sem juros`} s="Aviso 30 dias antes de renovar" />
            : <Li i="ti-credit-card" t="Cartão ou Pix Automático" s="Sem fidelidade" />}
      </ul></div>
      <div className="pp-r-foot">{proLocked && (
        <p className="pp-sub">Depois das {total} vagas de Fundador:<br /><b>R$ {brl(PLANOS.proMensal)} por mês</b> ou <b>R$ {brl(PLANOS.proAnual)} por ano</b>.</p>
      )}</div><div />
    </article>
  );

  const founder = (
    <article className="pp-card pp-f" key="founder" data-plan="founder">
      <span className="pp-flag">{left > 0 ? `Só ${total} vagas` : 'Esgotado'}</span>
      <div className="pp-r-head pp-col-a"><span className="pp-ico"><Ic n="ti-crown" /></span><h2>Fundador</h2></div>
      <p className="pp-desc pp-col-a">O preço de um ano,<br />para sempre.</p>
      <div className="pp-r-ctrl pp-col-a">
        <div className="pp-seats">
          <div className="pp-seatbar" role="img" aria-label={`${sold} de ${total} vagas preenchidas`}>
            {Array.from({ length: total }, (_, k) => <i key={k} className={k < sold ? 'is-on' : ''} />)}
          </div>
          <div className="pp-seatl"><span>{sold} preenchidas</span><b>{left} restantes</b></div>
        </div>
      </div>
      <div className="pp-col-a">
        <Price eyebrow="Uma vez" v={brl(PLANOS.fundador.preco)} sub={<>ou <b>{PLANOS.fundador.parcelas}x de R$ {brl(parcelaFundador)}</b> sem juros</>} />
      </div>
      <div className="pp-r-cta pp-col-a">
        <button type="button" className="pp-pill pp-gold" disabled={left <= 0} onClick={() => { setCo(true); setPixStep(false); setPay('pix'); }}>
          {left > 0 ? <>Quero minha vaga <Ic n="ti-arrow-right" /></> : 'Vagas encerradas'}
        </button>
      </div>
      <div className="pp-r-feat pp-col-b"><p className="pp-inc">Tudo do Pro, mais</p><ul className="pp-fl">
        <Li i="ti-infinity" t="Licença vitalícia" s="Sem mensalidade, nunca" />
        <Li i="ti-sparkles" t="Todas as versões futuras" />
        <Li i="ti-school" t="Cursos exclusivos" />
        <Li i="ti-messages" t="Clube de Membros" s="Vocês sugerem as próximas ferramentas" />
        <Li i="ti-signature" t="Seu nome na página dos fundadores" />
      </ul></div>
      <div className="pp-r-foot pp-col-a"><p className="pp-lic">{LICENCA}</p></div><div />
    </article>
  );

  const estud = (
    <article className="pp-card" key="estud" data-plan="estudante">
      <div className="pp-r-head"><span className="pp-ico"><Ic n="ti-school" /></span><h2>Estudante</h2></div>
      <p className="pp-desc">Para alunos de um professor<br />com plano anual.</p>
      <div className="pp-r-ctrl" />
      <Price eyebrow="Por mês" v={brl(PLANOS.estudante.preco)} sub={`Por ${PLANOS.estudante.meses} meses, depois vira Pro`} />
      <div className="pp-r-cta"><a className="pp-pill" href={waLink(MSG.estudante)} target="_blank" rel="noopener noreferrer">Tenho um cupom</a></div>
      <div className="pp-r-feat"><p className="pp-inc">Inclui</p><ul className="pp-fl">
        <Li i="ti-lock-open" t="Tudo do Pro" />
        <Li i="ti-download" t="Exportação com marca d'água" />
        <Li i="ti-ticket" t="Só com cupom de professor" />
      </ul></div>
      <div className="pp-r-foot" /><div />
    </article>
  );

  // Fase 1: Grátis · Pro · Fundador (o Fundador vem primeiro no HTML para o celular; a ordem visual vem do CSS)
  const cards = fase === 1 ? [founder, free, pro] : [pro, free, ...(fase === 3 ? [estud] : [])];

  const cardUrl = PLANOS.fundador.cartaoPeloLink ? PAYMENT_CONFIG.checkoutUrlLifetime : '';
  const totalTxt = `R$ ${brl(PLANOS.fundador.preco)}`;
  const go = () => {
    if (pay === 'pix') {
      if (PAYMENT_CONFIG.pixKey) { setPixStep(true); return; }
      window.open(waLink(MSG.fundadorPix), '_blank', 'noopener,noreferrer'); return;
    }
    if (pay === 'card') { window.open(cardUrl || waLink(MSG.fundadorCartao), '_blank', 'noopener,noreferrer'); return; }
    window.open(waLink(MSG.fundadorDuvida), '_blank', 'noopener,noreferrer');
  };
  const copyPix = () => {
    try { navigator.clipboard.writeText(PAYMENT_CONFIG.pixKey).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); }).catch(() => {}); } catch {}
  };

  return (
    <div className={`pp pp-fase-${fase}`}>
      <style>{PP_CSS}</style>
      <div className="pp-page">
        {showHeader && (
          <header className="pp-hd">
            <h1>{title}</h1>
            <p>Um projeto independente, em desenvolvimento.<b>Lançamento no {PLANOS.lancamento}.</b></p>
          </header>
        )}
        <section className={`pp-plans pp-n${cards.length}`}>{cards}</section>
        <section className="pp-faq">
          <h3>Perguntas frequentes</h3>
          {FAQ(fase).map(([q, a], i) => (
            <div key={q} className={`pp-q ${openQ === i ? 'is-open' : ''}`}>
              <button type="button" aria-expanded={openQ === i} onClick={() => setOpenQ(openQ === i ? -1 : i)}>{q}<Ic n="ti-plus" /></button>
              {openQ === i && <p>{a}</p>}
            </div>
          ))}
        </section>
        <p className="pp-help">Ficou com dúvida? <a href={waLink(MSG.geral)} target="_blank" rel="noopener noreferrer">Fale com o criador do Cronógrafo</a></p>
      </div>

      {co && (
        <div className="pp-ov" onMouseDown={e => { if (e.target === e.currentTarget) setCo(false); }}>
          <div className="pp-co" role="dialog" aria-modal="true" aria-label={pixStep ? 'Pagar com Pix' : 'Checkout do Fundador'}>
            <button type="button" className="pp-x" onClick={() => setCo(false)} aria-label="Fechar"><Ic n="ti-x" /></button>
            {pixStep ? (
              <>
                <span className="pp-step">Passo 2 de 2</span>
                <h4>Pague com Pix</h4>
                <div className="pp-pix">
                  <div className="pp-price" style={{ fontSize: 26, color: '#EDE9E3' }}><small>R$</small>{brl(PLANOS.fundador.preco)}</div>
                  <p className="pp-sub">Copie a chave Pix e pague no app do seu banco.</p>
                  <code className="pp-key">{PAYMENT_CONFIG.pixKey}</code>
                </div>
                <button type="button" className="pp-pill" onClick={copyPix}><Ic n={copied ? 'ti-check' : 'ti-copy'} /> {copied ? 'Chave copiada' : 'Copiar chave Pix'}</button>
                <a className="pp-pill pp-gold" href={waLink(MSG.fundadorComprovante)} target="_blank" rel="noopener noreferrer"><Ic n="ti-brand-whatsapp" /> Enviar comprovante</a>
                <p className="pp-note"><Ic n="ti-circle-check" /><span>Depois da confirmação, sua vaga é liberada em até {PLANOS.liberacao} na conta Google que você usa no Cronógrafo.</span></p>
              </>
            ) : (
              <>
                <span className="pp-step">Passo 1 de 2</span>
                <h4>Sua vaga de Fundador</h4>
                <button type="button" className={`pp-opt ${pay === 'pix' ? 'is-on' : ''}`} onClick={() => setPay('pix')}>
                  <Ic n="ti-qrcode" /><span><b>Pix à vista</b><span className="pp-s">Liberação na confirmação</span></span><span className="pp-val">{totalTxt}</span>
                </button>
                <button type="button" className={`pp-opt ${pay === 'card' ? 'is-on' : ''}`} onClick={() => setPay('card')}>
                  <Ic n="ti-credit-card" /><span><b>Cartão de crédito</b><span className="pp-s">{PLANOS.fundador.parcelas}x sem juros</span></span><span className="pp-val">{PLANOS.fundador.parcelas}× {brl(parcelaFundador)}</span>
                </button>
                <button type="button" className={`pp-opt ${pay === 'wa' ? 'is-on' : ''}`} onClick={() => setPay('wa')}>
                  <Ic n="ti-brand-whatsapp" /><span><b>Falar no WhatsApp</b><span className="pp-s">Tire dúvidas antes</span></span><span className="pp-val" />
                </button>
                <div className="pp-sum">
                  <div><span>Licença vitalícia de Fundador</span><span>{totalTxt}</span></div>
                  {pay === 'card' && <div><span>Parcelas</span><span>{PLANOS.fundador.parcelas}× R$ {brl(parcelaFundador)}</span></div>}
                  <div className="pp-t"><span>Total</span><span>{totalTxt}</span></div>
                </div>
                <button type="button" className="pp-pill pp-gold" onClick={go}>
                  {pay === 'pix' ? (PAYMENT_CONFIG.pixKey ? 'Pagar com Pix' : 'Pedir o Pix no WhatsApp') : pay === 'card' ? (cardUrl ? 'Pagar no cartão' : 'Pedir o link do cartão') : 'Abrir o WhatsApp'} <Ic n="ti-arrow-right" />
                </button>
                <p className="pp-note"><Ic n="ti-user-circle" /><span>A vaga fica no nome da conta Google que você usa no Cronógrafo.</span></p>
                <p className="pp-note"><Ic n="ti-shield-check" /><span>7 dias para desistir, como garante o Código de Defesa do Consumidor.</span></p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansPanel;

const PP_CSS = `
.pp{--bg:#040004;--card:#0a070c;--line:#221d27;--line2:#2a2430;--fg:#EDE9E3;--mut:#B9B4BE;--dim:#8a8590;--faint:#6f6a76;--gold:#D4AF37;--gold-l:#F5D98A;--ok:#86EFAC;
  --serif:'Cormorant Garamond',Georgia,serif;--sans:'DM Sans',system-ui,sans-serif;--mono:'DM Mono',ui-monospace,monospace;
  container-type:inline-size;color:var(--fg);font-family:var(--sans);text-align:left}
.pp *{box-sizing:border-box}
.pp .ti{font-size:18px;line-height:1}
.pp-page{padding:8px 0 8px;max-width:1240px;margin:0 auto}
.pp-hd{text-align:center;margin-bottom:44px}
.pp-hd h1{font-family:var(--serif);font-style:italic;font-weight:500;font-size:48px;line-height:1;margin:0;letter-spacing:-.01em;text-wrap:balance;color:var(--fg)}
.pp-hd p{margin:14px auto 0;font-size:15px;line-height:1.55;color:var(--mut)}
.pp-hd p b{display:block;color:var(--fg);font-weight:500}
.pp-plans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:stretch}
.pp-plans.pp-n2{grid-template-columns:repeat(2,minmax(0,1fr));max-width:820px;margin:0 auto}
.pp-card{position:relative;display:grid;grid-template-rows:subgrid;grid-row:span 8;row-gap:0;border:1px solid var(--line);border-radius:22px;padding:28px 24px 24px;background:var(--card);min-width:0}
.pp-fase-1 .pp-card[data-plan="free"]{order:1}.pp-fase-1 .pp-card[data-plan="pro"]{order:2}.pp-fase-1 .pp-card[data-plan="founder"]{order:3}
.pp:not(.pp-fase-1) .pp-card[data-plan="free"]{order:1}.pp:not(.pp-fase-1) .pp-card[data-plan="pro"]{order:2}.pp:not(.pp-fase-1) .pp-card[data-plan="estudante"]{order:3}
.pp-r-head{display:flex;align-items:center;gap:12px}
.pp-ico{width:40px;height:40px;flex:none;border-radius:12px;border:1px solid var(--line2);display:flex;align-items:center;justify-content:center}
.pp-ico .ti{font-size:21px}
.pp-card h2{font-family:var(--serif);font-style:italic;font-weight:500;font-size:30px;line-height:1;margin:0;white-space:nowrap;color:var(--fg)}
.pp-desc{margin:12px 0 0;font-size:13.5px;line-height:1.5;color:var(--dim);text-wrap:pretty}
.pp-r-ctrl{margin-top:20px;min-height:38px;display:flex;align-items:center}
.pp-r-price{margin-top:18px}
.pp-eyebrow{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--faint);white-space:nowrap}
.pp-price{font-family:var(--mono);font-weight:500;font-size:38px;line-height:1.1;letter-spacing:-.02em;white-space:nowrap;margin-top:4px}
.pp-price small{font-size:.5em;letter-spacing:0;margin-right:4px;vertical-align:.55em;color:var(--mut);font-weight:400}
.pp-sub{margin:6px 0 0;font-size:12.5px;line-height:1.45;color:var(--mut);text-wrap:pretty}
.pp-sub b{color:var(--fg);font-weight:500}
.pp-r-cta{margin-top:20px}
.pp-pill{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:46px;border-radius:999px;border:1px solid var(--fg);background:transparent;color:var(--fg);font:500 13.5px/1 var(--sans);letter-spacing:.02em;cursor:pointer;white-space:nowrap;text-decoration:none;transition:background .2s,filter .2s}
.pp-pill:hover:not(:disabled){background:rgba(237,233,227,.08)}
.pp-pill.pp-solid{background:var(--fg);color:var(--bg)}
.pp-pill.pp-solid:hover{filter:brightness(.92);background:var(--fg)}
.pp-pill.pp-gold{background:var(--gold);border-color:var(--gold);color:var(--bg)}
.pp-pill.pp-gold:hover:not(:disabled){filter:brightness(1.08);background:var(--gold)}
.pp-pill:disabled{cursor:default;opacity:.45}
.pp-card.is-lock .pp-pill:disabled{opacity:1;background:#1a161d;border-color:var(--line2);color:var(--faint)}
.pp-pill:focus-visible,.pp-toggle button:focus-visible,.pp-q button:focus-visible,.pp-opt:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
.pp-r-feat{margin-top:22px;padding-top:18px;border-top:1px solid #1c1820}
.pp-inc{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--faint);margin:0 0 12px}
.pp-fl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}
.pp-fl li{display:grid;grid-template-columns:20px minmax(0,1fr);gap:10px;font-size:13.5px;line-height:1.4}
.pp-fl li .ti{color:var(--mut);margin-top:1px}
.pp-fl li small{display:block;margin-top:2px;font-size:12px;color:var(--dim);line-height:1.4;text-wrap:pretty}
.pp-r-foot{margin-top:18px}
.pp-toggle{display:grid;grid-template-columns:1fr 1fr;width:100%;border:1px solid var(--line2);border-radius:999px;padding:3px;gap:2px}
.pp-toggle button{border:0;background:transparent;color:var(--dim);font:13px/1 var(--sans);height:32px;border-radius:999px;cursor:pointer;white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:6px}
.pp-toggle button.is-on{background:var(--fg);color:var(--bg)}
.pp-save{font-family:var(--mono);font-size:10.5px;color:var(--ok);white-space:nowrap;letter-spacing:-.01em}
.pp-toggle button.is-on .pp-save{color:#15803d}
.pp-ribbon{position:absolute;top:-12px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:6px;background:#17131a;border:1px solid #3A3440;color:var(--mut);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;padding:5px 13px;border-radius:999px;white-space:nowrap}
.pp-ribbon .ti{font-size:14px}
.pp-f{border-color:rgba(212,175,55,.6);background:radial-gradient(120% 55% at 50% 0%,rgba(212,175,55,.10),var(--card) 62%)}
.pp-f .pp-ico{border-color:rgba(212,175,55,.55);color:var(--gold-l)}
.pp-f h2,.pp-f .pp-price{color:var(--gold-l)}
.pp-f .pp-fl li .ti{color:var(--gold)}
.pp-flag{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--gold);color:var(--bg);font-size:10.5px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;padding:5px 13px;border-radius:999px;white-space:nowrap}
.pp-seats{width:100%}
.pp-seatbar{display:grid;grid-template-columns:repeat(21,1fr);gap:3px}
.pp-seatbar i{height:6px;border-radius:2px;background:var(--line2)}
.pp-seatbar i.is-on{background:var(--gold)}
.pp-seatl{display:flex;justify-content:space-between;margin-top:7px;font-size:11.5px;color:var(--dim);white-space:nowrap}
.pp-seatl b{color:var(--gold-l);font-weight:500}
.pp-lic{margin:0;font-size:12px;line-height:1.6;color:var(--mut);border-top:1px solid var(--line);padding-top:14px;text-wrap:pretty}
.pp-faq{max-width:680px;margin:56px auto 0}
.pp-faq h3{font-family:var(--serif);font-style:italic;font-weight:500;font-size:30px;text-align:center;margin:0 0 10px;color:var(--fg)}
.pp-q{border-bottom:1px solid #1c1820}
.pp-q button{width:100%;display:flex;justify-content:space-between;align-items:center;gap:14px;padding:16px 2px;background:none;border:0;color:var(--fg);font:14.5px/1.4 var(--sans);text-align:left;cursor:pointer}
.pp-q button .ti{color:var(--dim);transition:transform .2s;flex:none}
.pp-q.is-open button .ti{transform:rotate(45deg)}
.pp-q p{margin:0 2px 16px;font-size:13.5px;line-height:1.6;color:var(--mut);text-wrap:pretty}
.pp-help{text-align:center;margin:22px 0 0;font-size:13px;color:var(--dim)}
.pp-help a{color:var(--fg);text-decoration:underline;text-underline-offset:3px}
.pp-ov{position:fixed;inset:0;z-index:13000;background:rgba(4,0,4,.86);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;justify-content:center;align-items:flex-start;padding:64px 16px;overflow:auto}
.pp-co{position:relative;width:460px;max-width:100%;background:var(--card);border:1px solid rgba(212,175,55,.45);border-radius:24px;padding:26px;display:flex;flex-direction:column;gap:14px;color:var(--fg);font-family:var(--sans)}
.pp-co h4{font-family:var(--serif);font-style:italic;font-weight:500;font-size:30px;line-height:1;margin:0;color:var(--gold-l)}
.pp-step{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
.pp-x{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:50%;border:1px solid var(--line2);background:transparent;color:var(--mut);cursor:pointer;display:flex;align-items:center;justify-content:center}
.pp-opt{display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:12px;align-items:center;border:1px solid var(--line);border-radius:16px;padding:12px 14px;cursor:pointer;background:none;color:var(--fg);text-align:left;font:inherit;width:100%}
.pp-opt.is-on{border-color:var(--gold);background:rgba(212,175,55,.06)}
.pp-opt>.ti{width:36px;height:36px;border-radius:11px;border:1px solid var(--line2);display:flex;align-items:center;justify-content:center;font-size:19px}
.pp-opt.is-on>.ti{border-color:rgba(212,175,55,.6);color:var(--gold-l)}
.pp-opt b{display:block;font-weight:500;font-size:14px;white-space:nowrap}
.pp-s{font-size:12px;color:var(--dim)}
.pp-val{font-family:var(--mono);font-size:13.5px;white-space:nowrap}
.pp-sum{border-top:1px solid var(--line);padding-top:12px;display:flex;flex-direction:column;gap:7px;font-size:13px;color:var(--mut)}
.pp-sum div{display:flex;justify-content:space-between;gap:12px}
.pp-sum span:last-child{font-family:var(--mono);white-space:nowrap}
.pp-sum .pp-t{color:var(--fg);font-size:15px}
.pp-note{margin:0;display:grid;grid-template-columns:18px 1fr;gap:8px;font-size:12px;line-height:1.5;color:var(--dim)}
.pp-note .ti{font-size:16px}
.pp-pix{border:1px solid var(--line);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:6px}
.pp-key{display:block;margin-top:6px;padding:10px 12px;border-radius:10px;background:#100c13;border:1px solid var(--line2);font-family:var(--mono);font-size:12px;word-break:break-all;color:var(--fg)}
@container (max-width:1180px){.pp-plans{gap:12px}.pp-card{padding:26px 20px 20px}.pp-price{font-size:34px}}
@container (max-width:900px){
  .pp-hd h1{font-size:42px}
  .pp-plans,.pp-plans.pp-n2{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;max-width:none}
  .pp-card{display:flex;flex-direction:column;grid-row:auto}
  .pp-fase-1 .pp-card.pp-f{grid-column:1/-1;order:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:28px;grid-template-rows:none}
  .pp-f>.pp-col-a{grid-column:1}
  .pp-f>.pp-col-b{grid-column:2;grid-row:1/span 8}
  .pp-f .pp-r-feat{margin-top:0;padding-top:0;border-top:0}
  .pp-card:not(.pp-f) .pp-r-foot{margin-top:auto;padding-top:16px}
  .pp-card .pp-r-foot:empty{display:none}
  .pp:not(.pp-fase-1) .pp-card[data-plan="estudante"]{grid-column:1/-1}
}
@container (max-width:600px){
  .pp-hd{margin-bottom:34px}
  .pp-hd h1{font-size:36px}
  .pp-hd p{font-size:14px}
  .pp-plans,.pp-plans.pp-n2{grid-template-columns:1fr;gap:24px}
  .pp-card{padding:26px 20px 20px}
  .pp-fase-1 .pp-card.pp-f{display:flex;flex-direction:column}
  .pp-f .pp-r-feat{margin-top:22px;padding-top:18px;border-top:1px solid #1c1820}
  .pp-card .pp-r-ctrl:empty{display:none}
  .pp-price{font-size:36px}
  .pp-faq{margin-top:44px}
}
@media (max-width:600px){.pp-co{padding:22px 18px}.pp-ov{padding:28px 12px}}
@media (prefers-reduced-motion:reduce){.pp *{transition:none!important}}
`;
