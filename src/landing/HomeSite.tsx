/**
 * Tela inicial do Cronógrafo (cronografosideral.com/).
 * Direção do Rafa (17/11/2026): texto à esquerda, cronógrafo grande à direita,
 * céu com constelações ao fundo. Sem outras seções por enquanto.
 *
 * - "Testar gratuitamente" e "Entrar" abrem o login com Google no centro da tela.
 * - "Quero ser membro fundador" abre a tela de planos.
 * - A página longa antiga continua em LandingSite.tsx (guardada, sem uso).
 */
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LANDING, waLink, brl } from './config';
import { Starfield } from './Starfield';
import { auth, googleProvider, signInWithPopup, syncUserProfile } from '../../lib/firebase';
import { PAYMENT_CONFIG } from '../../lib/paymentConfig';

const HeroClock = lazy(() => import('./HeroClock'));
const EASE = [0.32, 0.72, 0, 1] as const;

// ── Redes ───────────────────────────────────────────────────────────────────
const SOCIAL = [
  { label: 'WhatsApp', icon: 'ti-brand-whatsapp', href: waLink(LANDING.msgGeral) },
  { label: 'Instagram', icon: 'ti-brand-instagram', href: LANDING.instagram },
  { label: 'YouTube', icon: 'ti-brand-youtube', href: LANDING.youtube },
  { label: 'TikTok', icon: 'ti-brand-tiktok', href: LANDING.tiktok },
];

const Social: React.FC<{ className?: string }> = ({ className }) => (
  <nav className={`hs-social ${className || ''}`} aria-label="Redes sociais">
    {SOCIAL.map(s => (
      <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>
        <i className={`ti ${s.icon}`} aria-hidden="true" />
      </a>
    ))}
  </nav>
);

const Logo: React.FC = () => (
  <span className="hs-logo" aria-label="Cronógrafo Sideral">
    <span className="hs-logo-a">Cronógrafo</span><span className="hs-logo-b">SIDERAL</span>
  </span>
);

// ── Janela genérica (login e planos) ────────────────────────────────────────
const useEscape = (open: boolean, onClose: () => void) => {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [open, onClose]);
};

// ── Login com Google ────────────────────────────────────────────────────────
const LoginDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEscape(open, onClose);
  useEffect(() => { if (open) { setError(''); setLoading(false); } }, [open]);

  const login = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(res.user);
      window.location.replace(LANDING.appUrl);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') setError('');
      else if (code === 'auth/popup-blocked') setError('O navegador bloqueou a janela do Google. Libere pop-ups para este site e tente de novo.');
      else setError('Não deu para entrar com o Google agora. Tente de novo em instantes.');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="hs-overlay hs-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} onClick={onClose}>
          <motion.div
            role="dialog" aria-modal="true" aria-labelledby="hs-login-t"
            className="hs-login"
            initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.45, ease: EASE }}
            onClick={e => e.stopPropagation()}
          >
            <button className="hs-x" onClick={onClose} aria-label="Fechar"><i className="ti ti-x" aria-hidden="true" /></button>
            <h2 id="hs-login-t" className="hs-serif hs-login-t">Comece pelo céu de agora</h2>
            <p className="hs-login-p">Entre com sua conta Google. Leva um clique.</p>
            <button className="hs-google" onClick={login} disabled={loading}>
              {loading ? <i className="ti ti-loader-2 hs-spin" aria-hidden="true" /> : <GoogleMark />}
              {loading ? 'Entrando…' : 'Entrar com Google'}
            </button>
            {error && <p className="hs-err" role="alert">{error}</p>}
            <p className="hs-login-note">Depois do login você vai direto para o Cronógrafo.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const GoogleMark: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

// ── Planos ──────────────────────────────────────────────────────────────────
const FREE_FEATURES = ['Relógio do céu ao vivo', 'Termos e decanatos', 'Navegação em 2026', 'Até 2 mapas natais salvos'];
const MONTHLY_FEATURES = ['Qualquer ano e século, sem limites', "PDF ilimitado, sem marca d'água", 'Calendários lunar e solar completos', 'Mapas salvos na nuvem', 'Personalização completa e orbes'];
const FOUNDER_FEATURES = [
  'Tudo do Mensal, para sempre',
  'Sem mensalidade e sem reajuste',
  '20% de desconto nos atendimentos',
  'Grupo exclusivo de Fundadores',
  'Acesso antecipado a novos recursos',
  'Curso de utilização do Cronógrafo',
  'Aula de onboarding ao vivo',
  'Selo de Fundador no seu perfil',
  'PDF em 300 DPI para impressão',
  'Suporte prioritário',
];
const FOUNDER_VISIBLE = 4;
type Billing = 'mensal' | 'anual';
const ANUAL_CHEIO = LANDING.precoMensal * 12;                        // 12 meses no Mensal
const ANUAL_ECONOMIA = ANUAL_CHEIO - LANDING.precoAnual;
const ANUAL_MES = Math.round((LANDING.precoAnual / 12) * 100) / 100;
const MESES_GRATIS = Math.round(ANUAL_ECONOMIA / LANDING.precoMensal);

type Pay = 'pix' | 'pixParc' | 'card' | 'entrada';
const PRICE_F = `R$ ${brl(LANDING.precoFundador)}`;
const PAY_OPTIONS: { id: Pay; icon: string; title: string; sub: string; msg: string }[] = [
  { id: 'pix', icon: 'ti-qrcode', title: 'Pix à vista', sub: `${PRICE_F} de uma vez`,
    msg: `Olá! Quero a vaga de Fundador do Cronógrafo pagando com Pix à vista (${PRICE_F}).` },
  { id: 'pixParc', icon: 'ti-calendar-repeat', title: 'Pix Parcelado', sub: 'Se o seu banco oferece, você parcela no app dele',
    msg: `Olá! Quero a vaga de Fundador do Cronógrafo pagando com Pix Parcelado pelo meu banco (${PRICE_F}).` },
  { id: 'card', icon: 'ti-credit-card', title: 'Cartão de crédito', sub: 'Parcelado, pelo link seguro do Nubank',
    msg: `Olá! Quero a vaga de Fundador do Cronógrafo pagando no cartão de crédito (${PRICE_F}).` },
  { id: 'entrada', icon: 'ti-coins', title: 'Entrada + Pix mensal', sub: 'Combinamos a entrada e as parcelas no WhatsApp',
    msg: `Olá! Quero a vaga de Fundador do Cronógrafo com entrada e o restante em Pix mensal. Podemos combinar?` },
];

const LICENCA = 'A vaga de Fundador é a compra de uma licença de uso vitalícia. Não é investimento e não dá participação na empresa.';

const Check: React.FC<{ gold?: boolean }> = ({ gold }) => <i className={`ti ti-check ${gold ? 'hs-gold' : ''}`} aria-hidden="true" />;

const PlansDialog: React.FC<{ open: boolean; onClose: () => void; onFree: () => void }> = ({ open, onClose, onFree }) => {
  const [pay, setPay] = useState<Pay>('pix');
  const [allF, setAllF] = useState(false);
  const [billing, setBilling] = useState<Billing>('mensal');
  const anual = billing === 'anual';
  useEscape(open, onClose);

  const total = LANDING.vagasFundador;
  const sold = Math.min(total, Math.max(LANDING.vagasVendidas, PAYMENT_CONFIG.lifetimeSoldManual));
  const left = total - sold;
  const opt = PAY_OPTIONS.find(o => o.id === pay)!;
  const cardUrl = LANDING.cartaoPeloLink ? PAYMENT_CONFIG.checkoutUrlLifetime : '';
  const founderHref = pay === 'card' && cardUrl ? cardUrl : waLink(opt.msg);
  const founderCta = left <= 0 ? 'Entrar na lista de espera' : pay === 'card' && cardUrl ? 'Pagar com cartão' : 'Quero minha vaga';

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="hs-overlay hs-plans-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}>
          <div className="hs-plans" role="dialog" aria-modal="true" aria-labelledby="hs-plans-t">
            <button className="hs-x hs-x-fixed" onClick={onClose} aria-label="Fechar planos"><i className="ti ti-x" aria-hidden="true" /></button>
            <motion.header className="hs-plans-head" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
              <Logo />
              <h2 id="hs-plans-t" className="hs-serif hs-plans-t">Escolha seu acesso</h2>
              <p className="hs-plans-p">Valores de pré-lançamento. O Cronógrafo segue em desenvolvimento contínuo.</p>
              <div className="hs-bill" role="radiogroup" aria-label="Forma de assinatura">
                <span className="hs-bill-knob" style={{ transform: anual ? 'translateX(100%)' : 'none' }} aria-hidden="true" />
                <button role="radio" aria-checked={!anual} className={!anual ? 'is-on' : ''} onClick={() => setBilling('mensal')}>Mensal</button>
                <button role="radio" aria-checked={anual} className={anual ? 'is-on' : ''} onClick={() => setBilling('anual')}>
                  Anual{MESES_GRATIS > 0 && <em>{MESES_GRATIS} meses grátis</em>}
                </button>
              </div>
            </motion.header>

            <div className="hs-cards">
              {/* Gratuito */}
              <motion.article className="hs-card hs-card-free" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05, ease: EASE }}>
                <h3 className="hs-serif hs-card-t">Gratuito</h3>
                <p className="hs-price"><span className="hs-mono">R$ 0</span></p>
                <p className="hs-card-lead">Acesso limitado até {LANDING.gratuitoAte}. Depois, segue gratuito com menos recursos.</p>
                <ul className="hs-list">{FREE_FEATURES.map(f => <li key={f}><Check />{f}</li>)}</ul>
                <div className="hs-howpay hs-push">
                  <p className="hs-howpay-t">Como começar</p>
                  <p className="hs-howpay-p"><i className="ti ti-brand-google" aria-hidden="true" /> Entre com sua conta Google. Não pede cartão.</p>
                </div>
                <button className="hs-pill hs-card-cta" onClick={onFree}>Testar gratuitamente</button>
              </motion.article>

              {/* Mensal / Anual (chave no topo) */}
              <motion.article className="hs-card hs-card-month" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: EASE }}>
                <div className="hs-card-top">
                  <h3 className="hs-serif hs-card-t">{anual ? 'Anual' : 'Mensal'}</h3>
                  {anual && ANUAL_ECONOMIA > 0 && <span className="hs-tag">Economize R$ {brl(ANUAL_ECONOMIA)}</span>}
                </div>
                {anual ? (
                  <>
                    <p className="hs-price">
                      <s className="hs-mono hs-old">R$ {brl(ANUAL_CHEIO)}</s>
                      <span className="hs-mono">R$ {brl(LANDING.precoAnual)}</span><span className="hs-per">/ano</span>
                    </p>
                    <p className="hs-card-lead">Um ano inteiro de acesso, o que dá R$ {brl(ANUAL_MES)} por mês. No lançamento, o Mensal passa a R$ {brl(LANDING.precoMensalLancamento)}.</p>
                  </>
                ) : (
                  <>
                    <p className="hs-price">
                      <s className="hs-mono hs-old">R$ {brl(LANDING.precoMensalLancamento)}</s>
                      <span className="hs-mono">R$ {brl(LANDING.precoMensal)}</span><span className="hs-per">/mês</span>
                    </p>
                    <p className="hs-card-lead">Preço promocional de pré-lançamento. No lançamento, o Mensal passa a R$ {brl(LANDING.precoMensalLancamento)}.</p>
                  </>
                )}
                <ul className="hs-list">{MONTHLY_FEATURES.map(f => <li key={f}><Check />{f}</li>)}</ul>
                <div className="hs-howpay hs-push">
                  <p className="hs-howpay-t">Como pagar</p>
                  {anual ? (
                    <p className="hs-howpay-p"><i className="ti ti-qrcode" aria-hidden="true" /> Pix à vista ou Pix Parcelado pelo seu banco. Acesso liberado em até {PAYMENT_CONFIG.activationDeadline}.</p>
                  ) : (
                    <p className="hs-howpay-p"><i className="ti ti-qrcode" aria-hidden="true" /> Pix todo mês. Acesso liberado em até {PAYMENT_CONFIG.activationDeadline}.</p>
                  )}
                </div>
                <a className="hs-pill hs-pill-solid hs-card-cta" href={waLink(anual ? LANDING.msgAnual : LANDING.msgMensal)} target="_blank" rel="noopener noreferrer">
                  {anual ? 'Assinar o Anual' : 'Assinar o Mensal'} <i className="ti ti-arrow-right" aria-hidden="true" />
                </a>
              </motion.article>

              {/* Vitalício · Fundador */}
              <motion.article className="hs-card hs-card-founder" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: EASE }}>
                <div className="hs-card-top">
                  <h3 className="hs-serif hs-card-t hs-gold">Vitalício · Fundador</h3>
                  <span className="hs-tag hs-tag-gold">{left > 0 ? `${left} de ${total} vagas` : 'Esgotado'}</span>
                </div>
                <p className="hs-price hs-gold"><span className="hs-mono">{PRICE_F}</span><span className="hs-per">uma vez</span></p>
                <p className="hs-card-lead">
                  Pague uma vez e use para sempre, sem mensalidade.
                </p>
                <ul className="hs-list">
                  {(allF ? FOUNDER_FEATURES : FOUNDER_FEATURES.slice(0, FOUNDER_VISIBLE)).map(f => <li key={f}><Check gold />{f}</li>)}
                </ul>
                <button className="hs-more" onClick={() => setAllF(v => !v)} aria-expanded={allF}>
                  {allF ? 'Mostrar menos' : `+ ${FOUNDER_FEATURES.length - FOUNDER_VISIBLE} benefícios de Fundador`}
                </button>
                <fieldset className="hs-howpay hs-pay">
                  <legend className="hs-howpay-t">Como pagar</legend>
                  <div className="hs-opts">
                    {PAY_OPTIONS.map(o => (
                      <label key={o.id} className={`hs-opt ${pay === o.id ? 'is-on' : ''}`}>
                        <input type="radio" name="hs-pay" value={o.id} checked={pay === o.id} onChange={() => setPay(o.id)} />
                        <i className={`ti ${o.icon}`} aria-hidden="true" />
                        <b>{o.title}</b>
                      </label>
                    ))}
                  </div>
                  <p className="hs-opt-sub" aria-live="polite">{opt.sub}</p>
                </fieldset>
                <a className="hs-pill hs-pill-gold hs-card-cta" href={founderHref} target="_blank" rel="noopener noreferrer">
                  {founderCta} <i className="ti ti-arrow-right" aria-hidden="true" />
                </a>
                <p className="hs-founder-note">Acesso liberado em até {PAYMENT_CONFIG.activationDeadline} após o pagamento.</p>
              </motion.article>
            </div>

            <p className="hs-licenca">{LICENCA}</p>
            <p className="hs-help">Ficou com alguma dúvida? <a href={waLink(LANDING.msgGeral)} target="_blank" rel="noopener noreferrer">Converse com o criador do Cronógrafo</a></p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ── Página ──────────────────────────────────────────────────────────────────
export const HomeSite: React.FC = () => {
  const [login, setLogin] = useState(false);
  const [plans, setPlans] = useState(false);

  // Quem já está logado vai direto ao app
  useEffect(() => {
    const un = auth.onAuthStateChanged(u => { if (u) window.location.replace(LANDING.appUrl); });
    return () => un();
  }, []);

  useEffect(() => {
    document.title = 'Cronógrafo Sideral · A ferramenta essencial para Astrologia';
    document.documentElement.style.background = '#040004';
    document.body.dataset.tourView = 'locked';
    // #planos abre direto a tela de planos (link para divulgar)
    if (window.location.hash === '#planos') setPlans(true);
    return () => { delete document.body.dataset.tourView; };
  }, []);

  const openFree = () => { setPlans(false); setLogin(true); };

  return (
    <div className="hs">
      <style>{HOME_CSS}</style>
      <Starfield />
      <div className="hs-comet" aria-hidden="true"><span className="hs-comet-run"><span className="hs-comet-tail" /></span></div>

      <header className="hs-top">
        <span className="hs-top-logo"><Logo /></span>
        <button className="hs-enter" onClick={() => setLogin(true)}>Entrar</button>
      </header>

      <main className="hs-main">
        <section className="hs-panel" aria-labelledby="hs-h1">
          <div className="hs-col">
          <span className="hs-panel-logo"><Logo /></span>
          <motion.div className="hs-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
            <p className="hs-over">Novo leitor de mapas astrais</p>
            <h1 id="hs-h1" className="hs-serif hs-h1"><span>A ferramenta</span> <span>essencial para</span> <span>Astrologia</span></h1>
            <p className="hs-lead">Controle o tempo minuto a minuto, visualize aspectos e trânsitos se formando. Acompanhe a fase da Lua em tempo real.</p>
            <div className="hs-ctas">
              <button className="hs-pill" onClick={() => setLogin(true)}>Testar gratuitamente <i className="ti ti-arrow-right" aria-hidden="true" /></button>
              <button className="hs-pill hs-pill-gold" onClick={() => setPlans(true)}>Quero ser membro fundador</button>
            </div>
          </motion.div>
          <Social />
          </div>
        </section>

        <motion.div className="hs-clock" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, ease: EASE, delay: 0.2 }} aria-label="Cronógrafo mostrando o céu de agora em São Paulo" role="img">
          <div className="hs-clock-box">
            <Suspense fallback={<div className="hs-clock-ph" />}>
              <HeroClock />
            </Suspense>
          </div>
        </motion.div>
      </main>

      <LoginDialog open={login} onClose={() => setLogin(false)} />
      <PlansDialog open={plans} onClose={() => setPlans(false)} onFree={openFree} />
    </div>
  );
};

export default HomeSite;

// ── Estilos ─────────────────────────────────────────────────────────────────
const HOME_CSS = `
html,body{background:#040004;margin:0}
.hs{--comet-top:88px;--bg:#040004;--fg:#EDE9E3;--mut:#B9B4BE;--dim:#8a8590;--line:#221D27;--line2:#3A3440;--gold:#D4AF37;--gold2:#F5D98A;--ease:cubic-bezier(.32,.72,0,1);
  position:relative;min-height:100vh;min-height:100svh;background:var(--bg);color:var(--fg);font-family:'DM Sans',system-ui,sans-serif;overflow-x:clip}
.hs *{box-sizing:border-box}
.hs a{color:inherit}
.hs button{font-family:inherit}
.hs-serif{font-family:'Cormorant Garamond','Cormorant Infant',Georgia,serif;font-style:italic;font-weight:600;letter-spacing:-.01em}
.hs-mono{font-family:'DM Mono',ui-monospace,monospace}
.hs-gold{color:var(--gold2)}

.hs-logo{display:inline-flex;align-items:baseline;gap:2px;color:var(--fg);white-space:nowrap}
.hs-logo-a{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:27px;letter-spacing:-.01em}
.hs-logo-b{font-family:'Syne','DM Sans',sans-serif;font-weight:700;font-size:18px;letter-spacing:.02em}

.hs-top{position:absolute;top:0;left:0;right:0;z-index:5;display:flex;justify-content:flex-end;align-items:center;padding:44px 56px 0;pointer-events:none}
.hs-top>*{pointer-events:auto}
.hs-top-logo{display:none}
.hs-panel-logo,.hs-top-logo .hs-logo{height:36px;display:flex;align-items:center}
.hs-comet{position:absolute;left:0;right:0;top:var(--comet-top);height:9px;margin-top:-4px;z-index:3;overflow:hidden;pointer-events:none}
.hs-comet-run{position:absolute;top:0;left:0;width:50vw;height:9px;transform:translateX(-100%);animation:hs-comet 12s cubic-bezier(.45,.05,.55,.95) 1.2s infinite;will-change:transform}
.hs-comet-tail{position:absolute;inset:4px 0 auto 0;height:1px;background:linear-gradient(90deg,transparent,#4870FF 35%,#22D3EE 58%,#FACC15 76%,#FB923C 88%,#EF4444 96%,#fff)}
.hs-comet-tail::after{content:'';position:absolute;right:-2px;top:-2px;width:5px;height:5px;border-radius:50%;background:#fff;box-shadow:0 0 8px 2px rgba(255,255,255,.75),0 0 18px 4px rgba(250,204,21,.35)}
@keyframes hs-comet{0%{transform:translateX(-100%)}33.4%,100%{transform:translateX(200%)}}
.hs-enter{background:none;border:0;color:var(--fg);font-size:14px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;cursor:pointer;padding:12px 0;min-height:44px;transition:opacity .4s var(--ease)}
.hs-enter:hover{opacity:.7}

.hs-main{position:relative;z-index:1;height:100vh;height:100svh;min-height:640px;display:grid;grid-template-columns:minmax(540px,36%) 1fr}
.hs-panel{position:relative;background:rgba(9,7,11,.5);display:flex;justify-content:flex-start;padding:44px 40px 32px clamp(136px,calc(8vw + 64px),224px)}
.hs-col{width:100%;max-width:400px;height:100%;display:flex;flex-direction:column}
.hs-copy{margin:auto 0}
.hs-over{margin:0;font-size:13px;white-space:nowrap;letter-spacing:.2em;text-transform:uppercase;color:var(--fg)}
.hs-h1{margin:28px 0 0;font-size:clamp(42px,3.9vw,58px);line-height:1.04}
.hs-h1 span{display:block;white-space:nowrap}
.hs-lead{margin:30px 0 0;font-size:15px;line-height:1.75;color:var(--fg);max-width:330px;text-wrap:pretty}
.hs-ctas{display:flex;flex-direction:column;align-items:flex-start;gap:14px;margin-top:34px}

.hs-pill{display:inline-flex;align-items:center;justify-content:center;gap:12px;min-height:46px;padding:12px 26px;border:1px solid var(--fg);border-radius:999px;background:transparent;color:var(--fg)!important;font-size:12px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;cursor:pointer;white-space:nowrap;transition:background .45s var(--ease),color .45s var(--ease),border-color .45s var(--ease)}
.hs-pill .ti{font-size:18px}
.hs-pill:hover{background:var(--fg);color:#040004!important}
.hs-pill-gold{border-color:var(--gold);color:var(--gold2)!important}
.hs-pill-gold:hover{background:var(--gold);color:#040004!important}
.hs-pill:focus-visible,.hs-enter:focus-visible,.hs-social a:focus-visible,.hs-x:focus-visible,.hs-google:focus-visible{outline:2px solid var(--fg);outline-offset:3px}

.hs-social{display:flex;gap:6px;margin-left:-10px}
.hs-social a{width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:var(--mut)!important;font-size:22px;text-decoration:none;transition:color .4s var(--ease),background .4s var(--ease)}
.hs-social a:hover{color:var(--fg)!important;background:rgba(237,233,227,.06)}

.hs-clock{position:relative;display:flex;align-items:center;justify-content:center;padding:32px 48px;min-width:0}
.hs-clock-box{width:min(82vh,100%,880px);width:min(82svh,100%,880px)}
.hs-clock-ph{width:100%;aspect-ratio:1/1}

/* janelas */
.hs-overlay{position:fixed;inset:0;z-index:50;background:rgba(4,0,4,.78);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.hs-center{display:flex;align-items:center;justify-content:center;padding:20px}
.hs-x{position:absolute;top:14px;right:14px;width:44px;height:44px;border-radius:50%;border:0;background:transparent;color:var(--mut);font-size:20px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:color .3s,background .3s}
.hs-x:hover{color:var(--fg);background:rgba(237,233,227,.07)}
.hs-login{position:relative;width:100%;max-width:420px;background:#0a070c;border:1px solid var(--line2);border-radius:24px;padding:48px 36px 36px;text-align:center;box-shadow:0 40px 120px -30px rgba(0,0,0,.9)}
.hs-login-t{margin:0;font-size:36px;line-height:1.1}
.hs-login-p{margin:14px 0 30px;color:var(--mut);font-size:15px}
.hs-google{width:100%;min-height:52px;display:inline-flex;align-items:center;justify-content:center;gap:12px;border:0;border-radius:999px;background:var(--fg);color:#040004;font-size:15px;font-weight:500;cursor:pointer;transition:background .3s}
.hs-google:hover{background:#fff}
.hs-google:disabled{opacity:.7;cursor:wait}
.hs-spin{animation:hs-spin 1s linear infinite;font-size:18px}
@keyframes hs-spin{to{transform:rotate(360deg)}}
.hs-err{margin:16px 0 0;color:#FCA5A5;font-size:14px;line-height:1.5}
.hs-login-note{margin:20px 0 0;color:var(--dim);font-size:13px}

.hs-plans-wrap{overflow-y:auto;overscroll-behavior:contain;background:rgba(4,0,4,.94)}
.hs-plans{position:relative;max-width:1180px;margin:0 auto;padding:72px 32px 64px}
.hs-x-fixed{position:fixed;top:18px;right:18px;z-index:2;background:rgba(10,7,12,.8)}
.hs-plans-head{text-align:center;display:flex;flex-direction:column;align-items:center}
.hs-plans-t{margin:28px 0 0;font-size:clamp(40px,5vw,60px);line-height:1.05}
.hs-plans-p{margin:14px 0 0;color:var(--mut);font-size:16px;max-width:520px}
.hs-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:44px;align-items:stretch}
.hs-bill{position:relative;display:inline-grid;grid-template-columns:1fr 1fr;margin-top:30px;padding:4px;border:1px solid var(--line2);border-radius:999px;background:rgba(10,7,12,.8)}
.hs-bill-knob{position:absolute;top:4px;bottom:4px;left:4px;width:calc(50% - 4px);border-radius:999px;background:var(--fg);transition:transform .45s var(--ease)}
.hs-bill button{position:relative;z-index:1;min-height:44px;min-width:150px;padding:0 22px;border:0;background:none;border-radius:999px;color:var(--mut);font-size:13px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:color .45s var(--ease)}
.hs-bill button.is-on{color:#040004}
.hs-bill em{font-style:normal;font-size:11px;letter-spacing:.04em;text-transform:none;color:#4ADE80}
.hs-bill button.is-on em{color:#0f5132}
.hs-bill button:focus-visible{outline:2px solid var(--fg);outline-offset:2px}
.hs-card-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.hs-tag{font-size:12px;line-height:1;padding:7px 10px;border-radius:999px;border:1px solid rgba(74,222,128,.4);color:#86EFAC;white-space:nowrap}
.hs-tag-gold{border-color:rgba(212,175,55,.5);color:var(--gold2)}
.hs-push{margin-top:auto!important}
.hs-card-free .hs-list{margin-bottom:22px}
.hs-card-month .hs-list{margin-bottom:22px}
.hs-pill-solid{background:var(--fg);color:#040004!important}
.hs-pill-solid:hover{background:#fff}
.hs-card{position:relative;display:flex;flex-direction:column;border:1px solid var(--line2);border-radius:22px;padding:30px 26px 26px;background:rgba(10,7,12,.85)}
.hs-card-month{border-color:#6b6478;background:rgba(16,12,20,.9)}
.hs-card-founder{border-color:var(--gold);background:linear-gradient(180deg,rgba(212,175,55,.07),rgba(10,7,12,.9) 40%)}
.hs-card-t{margin:0;font-size:30px;line-height:1.1}
.hs-price{margin:14px 0 0;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.hs-price .hs-mono{font-size:34px;letter-spacing:-.01em}
.hs-price .hs-old{font-size:17px;color:var(--dim)}
.hs-per{font-size:14px;color:var(--mut)}
.hs-card-lead{margin:12px 0 0;font-size:15px;line-height:1.55;color:var(--fg);min-height:3.1em}
.hs-list{list-style:none;margin:20px 0 0;padding:0;display:flex;flex-direction:column;gap:10px}
.hs-list li{display:flex;gap:10px;font-size:15px;line-height:1.45;color:var(--mut)}
.hs-list .ti{font-size:17px;margin-top:2px;color:var(--fg)}
.hs-list .ti.hs-gold{color:var(--gold)}
.hs-more{align-self:flex-start;margin-top:12px;background:none;border:0;padding:6px 0;color:var(--gold2);font-size:14px;cursor:pointer;text-decoration:underline;text-underline-offset:5px;text-decoration-color:rgba(212,175,55,.4)}
.hs-howpay{margin:22px 0 0;padding:18px 0 0;border:0;border-top:1px solid var(--line2);min-width:0}
.hs-card-founder .hs-howpay{border-top-color:rgba(212,175,55,.3)}
.hs-howpay-t{margin:0 0 10px;padding:0;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--fg)}
.hs-howpay-p{margin:0;font-size:14px;line-height:1.55;color:var(--mut);display:flex;gap:8px}
.hs-howpay-p .ti{font-size:18px;color:var(--fg)}
.hs-pay{display:flex;flex-direction:column;gap:8px;border-top:0!important;padding-top:0}
.hs-pay legend{float:left;width:100%;margin:0 0 4px;padding-top:18px;border-top:1px solid rgba(212,175,55,.3)}
.hs-opts{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.hs-opt-sub{margin:4px 2px 0;font-size:13px;line-height:1.45;color:var(--dim);min-height:2.9em}
.hs-opt{display:flex;align-items:center;gap:10px;min-height:48px;padding:10px 12px;border:1px solid var(--line2);border-radius:14px;cursor:pointer;transition:border-color .3s,background .3s}
.hs-opt input{position:absolute;opacity:0;pointer-events:none}
.hs-opt .ti{font-size:20px;color:var(--mut);margin-top:1px}
.hs-opt span{display:flex;flex-direction:column;gap:2px}
.hs-opt b{font-weight:500;font-size:14px;line-height:1.25;color:var(--fg)}
.hs-opt small{font-size:13px;line-height:1.4;color:var(--dim)}
.hs-opt:hover{border-color:#5a5466}
.hs-opt.is-on{border-color:var(--gold);background:rgba(212,175,55,.08)}
.hs-opt.is-on .ti{color:var(--gold2)}
.hs-opt:has(input:focus-visible){outline:2px solid var(--gold2);outline-offset:2px}
.hs-card-cta{margin-top:22px;width:100%}
.hs-founder-note{margin:12px 0 0;font-size:13px;color:var(--dim);text-align:center}
.hs-licenca{margin:40px auto 0;max-width:640px;text-align:center;font-size:14px;line-height:1.6;color:var(--dim)}
.hs-help{margin:14px 0 0;text-align:center;font-size:15px;color:var(--mut)}
.hs-help a{color:var(--fg)!important;text-underline-offset:5px}

@media (max-width:1180px){
  .hs{--comet-top:80px}
  .hs-top{padding:36px 36px 0}
  .hs-main{grid-template-columns:minmax(440px,44%) 1fr}
  .hs-panel{padding:36px 28px 28px 96px}
  .hs-cards{grid-template-columns:1fr 1fr}
  .hs-card-founder{grid-column:1 / -1;order:-1}
}
@media (max-width:900px){
  .hs-top{position:relative;justify-content:space-between;padding:20px 20px 0}
  .hs{--comet-top:68px}
  .hs-top-logo{display:inline}
  .hs-panel-logo{display:none}
  .hs-logo-a{font-size:23px}.hs-logo-b{font-size:15px}
  .hs-main{display:flex;flex-direction:column;height:auto;min-height:0}
  .hs-clock{order:-1;padding:12px 8px 0}
  .hs-clock-box{width:min(100%,560px)}
  .hs-panel{background:transparent;padding:8px 24px 40px;align-items:stretch}
  .hs-copy{width:100%;margin:0}
  .hs-h1{margin-top:18px;font-size:clamp(40px,11vw,54px)}
  .hs-over{font-size:12px;white-space:normal}
  .hs-lead{margin-top:18px;font-size:16px;max-width:none}
  .hs-ctas{align-items:stretch;margin-top:28px}
  .hs-ctas .hs-pill{width:100%;min-height:52px}
  .hs-col{height:auto;max-width:560px;margin:0 auto}
  .hs-social{justify-content:center;margin:40px auto 0}
  .hs-plans{padding:68px 16px 48px}
  .hs-plans-t{margin-top:22px}
  .hs-plans-p{font-size:15px}
  .hs-cards{grid-template-columns:1fr;gap:16px;margin-top:36px}
  .hs-bill{width:100%;max-width:360px}
  .hs-bill button{min-width:0;padding:0 10px;letter-spacing:.08em}
  .hs-bill em{white-space:nowrap}
  .hs-card{padding:26px 20px 22px}
  .hs-card-month{order:0}
  .hs-card-free{order:1}
  .hs-card-lead{min-height:0}
  .hs-login{padding:44px 22px 28px}
  .hs-login-t{font-size:32px}
}
@media (prefers-reduced-motion:reduce){
  .hs-comet-run{display:none}
  .hs-spin{animation:none}
}
`;
