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

// ── Constelações (desenho fixo, bem discreto) ───────────────────────────────
type Figure = { at: [number, number]; pts: [number, number][]; lines: number[][] };
const FIGURES: Figure[] = [
  // Ursa Maior
  { at: [70, 520], pts: [[0, 0], [62, 18], [112, 14], [152, 42], [160, 98], [232, 112], [244, 58]], lines: [[0, 1, 2, 3, 4, 5, 6, 3]] },
  // Cisne
  { at: [330, 120], pts: [[60, 0], [60, 60], [60, 130], [60, 190], [0, 70], [120, 52]], lines: [[0, 1, 2, 3], [4, 1, 5]] },
  // Cassiopeia
  { at: [1150, 50], pts: [[0, 40], [44, 0], [86, 52], [128, 12], [176, 44]], lines: [[0, 1, 2, 3, 4]] },
  // Leão
  { at: [560, 30], pts: [[0, 60], [30, 20], [70, 0], [100, 30], [90, 70], [190, 90], [200, 40]], lines: [[0, 1, 2, 3, 4, 0], [4, 5, 6, 3]] },
  // Órion
  { at: [1420, 600], pts: [[0, 0], [110, 10], [42, 110], [55, 116], [68, 122], [10, 230], [120, 220]], lines: [[0, 2, 3, 4, 1], [2, 5], [4, 6]] },
  // Escorpião
  { at: [1130, 720], pts: [[0, 0], [30, 30], [70, 40], [110, 70], [130, 120], [110, 160], [70, 170], [50, 150]], lines: [[0, 1, 2, 3, 4, 5, 6, 7]] },
  // Lira
  { at: [180, 780], pts: [[0, 0], [30, 30], [20, 80], [60, 90], [70, 40]], lines: [[0, 1, 2, 3, 4, 1]] },
];

const Constellations: React.FC = () => (
  <svg className="hs-const" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    {FIGURES.map((f, i) => (
      <g key={i} transform={`translate(${f.at[0]} ${f.at[1]})`}>
        {f.lines.map((ln, j) => (
          <polyline key={j} points={ln.map(k => f.pts[k].join(',')).join(' ')} fill="none" stroke="#B9B4BE" strokeWidth="0.8" strokeOpacity="0.28" />
        ))}
        {f.pts.map(([x, y], k) => (
          <circle key={k} cx={x} cy={y} r={k % 3 === 0 ? 2.4 : 1.7} fill="#EDE9E3" className="hs-twinkle" style={{ animationDelay: `${(i * 0.9 + k * 0.7) % 6}s` }} />
        ))}
      </g>
    ))}
  </svg>
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
const FOUNDER_VISIBLE = 5;

type Pay = 'pix' | 'pixParc' | 'card' | 'entrada';
const PRICE_F = `R$ ${brl(LANDING.precoFundador)}`;
const PAY_OPTIONS: { id: Pay; icon: string; title: string; sub: string; msg: string }[] = [
  { id: 'pix', icon: 'ti-qrcode', title: 'Pix à vista', sub: `${PRICE_F} de uma vez`,
    msg: `Olá, Rafael! Quero a vaga de Fundador do Cronógrafo pagando com Pix à vista (${PRICE_F}).` },
  { id: 'pixParc', icon: 'ti-calendar-repeat', title: 'Pix Parcelado', sub: 'Se o seu banco oferece, você parcela no app dele',
    msg: `Olá, Rafael! Quero a vaga de Fundador do Cronógrafo pagando com Pix Parcelado pelo meu banco (${PRICE_F}).` },
  { id: 'card', icon: 'ti-credit-card', title: 'Cartão de crédito', sub: 'Parcelado, pelo link seguro do Nubank',
    msg: `Olá, Rafael! Quero a vaga de Fundador do Cronógrafo pagando no cartão de crédito (${PRICE_F}).` },
  { id: 'entrada', icon: 'ti-coins', title: 'Entrada + Pix mensal', sub: 'Combinamos a entrada e as parcelas no WhatsApp',
    msg: `Olá, Rafael! Quero a vaga de Fundador do Cronógrafo com entrada e o restante em Pix mensal. Podemos combinar?` },
];

const LICENCA = 'A vaga de Fundador é a compra de uma licença de uso vitalícia. Não é investimento e não dá participação na empresa.';

const Check: React.FC<{ gold?: boolean }> = ({ gold }) => <i className={`ti ti-check ${gold ? 'hs-gold' : ''}`} aria-hidden="true" />;

const PlansDialog: React.FC<{ open: boolean; onClose: () => void; onFree: () => void }> = ({ open, onClose, onFree }) => {
  const [pay, setPay] = useState<Pay>('pix');
  const [allF, setAllF] = useState(false);
  useEscape(open, onClose);

  const total = LANDING.vagasFundador;
  const sold = Math.min(total, Math.max(LANDING.vagasVendidas, PAYMENT_CONFIG.lifetimeSoldManual));
  const left = total - sold;
  const opt = PAY_OPTIONS.find(o => o.id === pay)!;
  const cardUrl = PAYMENT_CONFIG.checkoutUrlLifetime;
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
            </motion.header>

            <div className="hs-cards">
              {/* Gratuito */}
              <motion.article className="hs-card hs-card-free" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05, ease: EASE }}>
                <h3 className="hs-serif hs-card-t">Gratuito</h3>
                <p className="hs-price"><span className="hs-mono">R$ 0</span></p>
                <p className="hs-card-lead">Acesso limitado até {LANDING.gratuitoAte}. Depois, segue gratuito com menos recursos.</p>
                <ul className="hs-list">{FREE_FEATURES.map(f => <li key={f}><Check />{f}</li>)}</ul>
                <button className="hs-pill hs-card-cta" onClick={onFree}>Testar gratuitamente</button>
              </motion.article>

              {/* Mensal */}
              <motion.article className="hs-card hs-card-month" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: EASE }}>
                <h3 className="hs-serif hs-card-t">Mensal</h3>
                <p className="hs-price">
                  <s className="hs-mono hs-old">R$ {brl(LANDING.precoMensalLancamento)}</s>
                  <span className="hs-mono">R$ {brl(LANDING.precoMensal)}</span><span className="hs-per">/mês</span>
                </p>
                <p className="hs-card-lead">Preço promocional de pré-lançamento. No lançamento, o Mensal passa a R$ {brl(LANDING.precoMensalLancamento)}.</p>
                <ul className="hs-list">{MONTHLY_FEATURES.map(f => <li key={f}><Check />{f}</li>)}</ul>
                <div className="hs-howpay">
                  <p className="hs-howpay-t">Como pagar</p>
                  <p className="hs-howpay-p"><i className="ti ti-qrcode" aria-hidden="true" /> Pix todo mês. Acesso liberado em até {PAYMENT_CONFIG.activationDeadline}.</p>
                </div>
                <a className="hs-pill hs-card-cta" href={waLink(LANDING.msgMensal)} target="_blank" rel="noopener noreferrer">
                  <i className="ti ti-brand-whatsapp" aria-hidden="true" /> Assinar o Mensal
                </a>
              </motion.article>

              {/* Vitalício · Fundador */}
              <motion.article className="hs-card hs-card-founder" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: EASE }}>
                <h3 className="hs-serif hs-card-t hs-gold">Vitalício · Fundador</h3>
                <p className="hs-price hs-gold"><span className="hs-mono">{PRICE_F}</span><span className="hs-per">uma vez</span></p>
                <p className="hs-card-lead">
                  Pague uma vez, use para sempre. {left > 0 ? (sold > 0 ? `Restam ${left} de ${total} vagas.` : `${total} vagas.`) : 'Vagas esgotadas.'}
                </p>
                <ul className="hs-list">
                  {(allF ? FOUNDER_FEATURES : FOUNDER_FEATURES.slice(0, FOUNDER_VISIBLE)).map(f => <li key={f}><Check gold />{f}</li>)}
                </ul>
                <button className="hs-more" onClick={() => setAllF(v => !v)} aria-expanded={allF}>
                  {allF ? 'Mostrar menos' : `+ ${FOUNDER_FEATURES.length - FOUNDER_VISIBLE} benefícios de Fundador`}
                </button>
                <fieldset className="hs-howpay hs-pay">
                  <legend className="hs-howpay-t">Como pagar</legend>
                  {PAY_OPTIONS.map(o => (
                    <label key={o.id} className={`hs-opt ${pay === o.id ? 'is-on' : ''}`}>
                      <input type="radio" name="hs-pay" value={o.id} checked={pay === o.id} onChange={() => setPay(o.id)} />
                      <i className={`ti ${o.icon}`} aria-hidden="true" />
                      <span><b>{o.title}</b><small>{o.sub}</small></span>
                    </label>
                  ))}
                </fieldset>
                <a className="hs-pill hs-pill-gold hs-card-cta" href={founderHref} target="_blank" rel="noopener noreferrer">
                  {founderCta} <i className="ti ti-arrow-right" aria-hidden="true" />
                </a>
                <p className="hs-founder-note">Acesso liberado em até {PAYMENT_CONFIG.activationDeadline} após o pagamento.</p>
              </motion.article>
            </div>

            <p className="hs-licenca">{LICENCA}</p>
            <p className="hs-help">Dúvidas? <a href={waLink(LANDING.msgFundador)} target="_blank" rel="noopener noreferrer">Fale com o Rafael no WhatsApp</a></p>
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
      <Constellations />

      <header className="hs-top">
        <Logo />
        <button className="hs-enter" onClick={() => setLogin(true)}>Entrar</button>
      </header>

      <main className="hs-main">
        <section className="hs-panel" aria-labelledby="hs-h1">
          <motion.div className="hs-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
            <p className="hs-over">Novo leitor de mapas astrais</p>
            <h1 id="hs-h1" className="hs-serif hs-h1">A ferramenta essencial para Astrologia</h1>
            <p className="hs-lead">Controle o tempo minuto a minuto, visualize aspectos e trânsitos se formando. Acompanhe a fase da Lua em tempo real.</p>
            <div className="hs-ctas">
              <button className="hs-pill" onClick={() => setLogin(true)}>Testar gratuitamente <i className="ti ti-arrow-right" aria-hidden="true" /></button>
              <button className="hs-pill hs-pill-gold" onClick={() => setPlans(true)}>Quero ser membro fundador</button>
            </div>
          </motion.div>
          <Social />
        </section>

        <motion.div className="hs-clock" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, ease: EASE, delay: 0.2 }} aria-label="Cronógrafo mostrando o céu de agora em São Paulo" role="img">
          <Suspense fallback={<div className="hs-clock-ph" />}>
            <HeroClock />
          </Suspense>
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
.hs{--bg:#040004;--fg:#EDE9E3;--mut:#B9B4BE;--dim:#8a8590;--line:#221D27;--line2:#3A3440;--gold:#D4AF37;--gold2:#F5D98A;--ease:cubic-bezier(.32,.72,0,1);
  position:relative;min-height:100vh;min-height:100svh;background:var(--bg);color:var(--fg);font-family:'DM Sans',system-ui,sans-serif;overflow-x:clip}
.hs *{box-sizing:border-box}
.hs a{color:inherit}
.hs button{font-family:inherit}
.hs-serif{font-family:'Cormorant Garamond','Cormorant Infant',Georgia,serif;font-style:italic;font-weight:600;letter-spacing:-.01em}
.hs-mono{font-family:'DM Mono',ui-monospace,monospace}
.hs-gold{color:var(--gold2)}
.hs-const{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}
.hs-twinkle{animation:hs-tw 6s ease-in-out infinite}
@keyframes hs-tw{0%,100%{opacity:.85}50%{opacity:.3}}

.hs-logo{display:inline-flex;align-items:baseline;gap:2px;color:var(--fg);white-space:nowrap}
.hs-logo-a{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:27px;letter-spacing:-.01em}
.hs-logo-b{font-family:'Syne','DM Sans',sans-serif;font-weight:700;font-size:18px;letter-spacing:.02em}

.hs-top{position:absolute;top:0;left:0;right:0;z-index:5;display:flex;justify-content:space-between;align-items:center;padding:56px 64px 0 88px}
.hs-enter{background:none;border:0;color:var(--fg);font-size:14px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;cursor:pointer;padding:12px 0;min-height:44px;transition:opacity .4s var(--ease)}
.hs-enter:hover{opacity:.7}

.hs-main{position:relative;z-index:1;min-height:100vh;min-height:100svh;display:grid;grid-template-columns:minmax(440px,31%) 1fr}
.hs-panel{position:relative;background:rgba(9,7,11,.82);display:flex;flex-direction:column;justify-content:center;padding:140px 44px 40px 88px}
.hs-copy{max-width:400px}
.hs-over{margin:0;font-size:13px;white-space:nowrap;letter-spacing:.2em;text-transform:uppercase;color:var(--fg)}
.hs-h1{margin:36px 0 0;font-size:clamp(42px,3.9vw,58px);line-height:1.04;text-wrap:balance}
.hs-lead{margin:30px 0 0;font-size:15px;line-height:1.75;color:var(--fg);max-width:330px;text-wrap:pretty}
.hs-ctas{display:flex;flex-direction:column;align-items:flex-start;gap:14px;margin-top:34px}

.hs-pill{display:inline-flex;align-items:center;justify-content:center;gap:12px;min-height:46px;padding:12px 26px;border:1px solid var(--fg);border-radius:999px;background:transparent;color:var(--fg)!important;font-size:12px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;cursor:pointer;white-space:nowrap;transition:background .45s var(--ease),color .45s var(--ease),border-color .45s var(--ease)}
.hs-pill .ti{font-size:18px}
.hs-pill:hover{background:var(--fg);color:#040004!important}
.hs-pill-gold{border-color:var(--gold);color:var(--gold2)!important}
.hs-pill-gold:hover{background:var(--gold);color:#040004!important}
.hs-pill:focus-visible,.hs-enter:focus-visible,.hs-social a:focus-visible,.hs-x:focus-visible,.hs-google:focus-visible{outline:2px solid var(--fg);outline-offset:3px}

.hs-social{display:flex;gap:6px;margin-top:44px;margin-left:-10px}
.hs-social a{width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:var(--mut)!important;font-size:22px;text-decoration:none;transition:color .4s var(--ease),background .4s var(--ease)}
.hs-social a:hover{color:var(--fg)!important;background:rgba(237,233,227,.06)}

.hs-clock{position:relative;display:flex;align-items:center;justify-content:center;padding:24px 40px}
.hs-clock>div{width:min(92vh,100%)}
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
.hs-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:52px;align-items:start}
.hs-card{position:relative;display:flex;flex-direction:column;border:1px solid var(--line2);border-radius:22px;padding:30px 26px 26px;background:rgba(10,7,12,.85)}
.hs-card-month{border-color:#5a5466}
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
.hs-opt{display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:1px solid var(--line2);border-radius:14px;cursor:pointer;transition:border-color .3s,background .3s}
.hs-opt input{position:absolute;opacity:0;pointer-events:none}
.hs-opt .ti{font-size:20px;color:var(--mut);margin-top:1px}
.hs-opt span{display:flex;flex-direction:column;gap:2px}
.hs-opt b{font-weight:500;font-size:15px;color:var(--fg)}
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
  .hs-top{padding:40px 40px 0 56px}
  .hs-panel{padding:140px 36px 44px 56px}
  .hs-cards{grid-template-columns:1fr 1fr}
  .hs-card-founder{grid-column:1 / -1;order:-1}
}
@media (max-width:900px){
  .hs-top{position:relative;padding:20px 20px 0}
  .hs-logo-a{font-size:23px}.hs-logo-b{font-size:15px}
  .hs-main{display:flex;flex-direction:column;min-height:0}
  .hs-clock{order:-1;padding:12px 8px 0}
  .hs-clock>div{width:min(100%,560px)}
  .hs-panel{background:transparent;padding:8px 24px 40px;align-items:stretch}
  .hs-copy{max-width:560px;margin:0 auto;width:100%}
  .hs-h1{margin-top:18px;font-size:clamp(40px,11vw,54px)}
  .hs-over{font-size:12px;white-space:normal}
  .hs-lead{margin-top:18px;font-size:16px;max-width:none}
  .hs-ctas{align-items:stretch;margin-top:28px}
  .hs-ctas .hs-pill{width:100%;min-height:52px}
  .hs-social{justify-content:center;margin:40px auto 0}
  .hs-plans{padding:68px 16px 48px}
  .hs-plans-t{margin-top:22px}
  .hs-plans-p{font-size:15px}
  .hs-cards{grid-template-columns:1fr;gap:16px;margin-top:36px}
  .hs-card{padding:26px 20px 22px}
  .hs-card-month{order:0}
  .hs-card-free{order:1}
  .hs-card-lead{min-height:0}
  .hs-login{padding:44px 22px 28px}
  .hs-login-t{font-size:32px}
}
@media (prefers-reduced-motion:reduce){
  .hs-twinkle,.hs-spin{animation:none}
}
`;
