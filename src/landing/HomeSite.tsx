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
import { LANDING, waLink } from './config';
import { Starfield } from './Starfield';
import { auth, googleProvider, signInWithPopup, syncUserProfile } from '../../lib/firebase';

const HeroClock = lazy(() => import('./HeroClock'));
const PlansPanel = lazy(() => import('../plans/PlansPanel'));
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
// Conteúdo e preços em src/plans (fonte única, também usada no app).
const PlansDialog: React.FC<{ open: boolean; onClose: () => void; onFree: () => void }> = ({ open, onClose, onFree }) => {
  useEscape(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="hs-overlay hs-plans-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}>
          <div className="hs-plans" role="dialog" aria-modal="true" aria-label="Planos do Cronógrafo">
            <button className="hs-x hs-x-fixed" onClick={onClose} aria-label="Fechar planos"><i className="ti ti-x" aria-hidden="true" /></button>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
              <div className="hs-plans-logo"><Logo /></div>
              <Suspense fallback={null}><PlansPanel onFree={onFree} /></Suspense>
            </motion.div>
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

      <header className="hs-top">
        <span className="hs-top-logo"><CometLogo /></span>
        <button className="hs-enter" onClick={() => setLogin(true)}>Entrar</button>
      </header>

      <main className="hs-main">
        <section className="hs-panel" aria-labelledby="hs-h1">
          <div className="hs-col">
          <span className="hs-panel-logo"><CometLogo /></span>
          <motion.div className="hs-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
            <p className="hs-over">Novo leitor de mapas astrais</p>
            <h1 id="hs-h1" className="hs-serif hs-h1"><span>A ferramenta</span> <span>essencial para</span> <span>Astrologia</span></h1>
            <p className="hs-lead">Controle o tempo minuto a minuto, visualize aspectos e trânsitos se formando. Acompanhe a fase da Lua em tempo real.</p>
            <div className="hs-ctas">
              <button className="hs-pill hs-pill-solid" onClick={() => setLogin(true)}>Testar gratuitamente <i className="ti ti-arrow-right" aria-hidden="true" /></button>
              <button className="hs-pill hs-pill-goldfill" onClick={() => setPlans(true)}>Quero ser membro fundador</button>
            </div>
            <Social />
          </motion.div>
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

/** Logo com a linha espectral passando só por baixo dele (8px abaixo). */
const CometLogo: React.FC = () => (
  <span className="hs-logo-wrap">
    <Logo />
    <span className="hs-comet" aria-hidden="true"><span className="hs-comet-run"><span className="hs-comet-tail" /></span></span>
  </span>
);

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

.hs-logo{display:inline-flex;align-items:baseline;gap:2px;color:var(--fg);white-space:nowrap}
.hs-logo-a{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:27px;letter-spacing:-.01em}
.hs-logo-b{font-family:'Syne','DM Sans',sans-serif;font-weight:700;font-size:18px;letter-spacing:.02em}

.hs-top{position:absolute;top:0;left:0;right:0;z-index:5;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));align-items:center;padding-top:40px;pointer-events:none}
.hs-enter{grid-column:6;justify-self:start}
.hs-top>*{pointer-events:auto}
.hs-top-logo{display:none}
.hs-panel-logo,.hs-top-logo .hs-logo{height:36px;display:flex;align-items:center}
.hs-logo-wrap{position:relative;display:inline-flex}
.hs-comet{position:absolute;left:0;right:0;top:calc(100% + 4px);height:9px;overflow:hidden;pointer-events:none}
.hs-comet-run{position:absolute;top:0;left:0;width:60%;height:9px;transform:translateX(-100%);animation:hs-comet 9s cubic-bezier(.45,.05,.55,.95) 1.2s infinite;will-change:transform}
.hs-comet-tail{position:absolute;inset:4px 0 auto 0;height:1px;background:linear-gradient(90deg,transparent,#4870FF 35%,#22D3EE 58%,#FACC15 76%,#FB923C 88%,#EF4444 96%,#fff)}
.hs-comet-tail::after{content:'';position:absolute;right:-2px;top:-2px;width:5px;height:5px;border-radius:50%;background:#fff;box-shadow:0 0 8px 2px rgba(255,255,255,.75),0 0 18px 4px rgba(250,204,21,.35)}
@keyframes hs-comet{0%{transform:translateX(-100%)}30%,100%{transform:translateX(170%)}}
.hs-enter{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 26px;border:1px solid var(--fg);border-radius:999px;background:transparent;color:var(--fg);font-size:12px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;transition:background .45s var(--ease),color .45s var(--ease)}
.hs-enter:hover{background:var(--fg);color:#040004}

.hs-main{position:relative;z-index:1;height:100vh;height:100svh;min-height:600px;display:grid;grid-template-columns:repeat(6,minmax(0,1fr))}
.hs-panel{position:relative;grid-column:2;display:flex;padding:40px 0 32px;min-width:0}
.hs-col{width:100%;display:flex;flex-direction:column}
.hs-copy{margin:auto 0}
.hs-over{margin:0;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--fg)}
.hs-h1{margin:14px 0 0;font-size:clamp(34px,3.2vw,50px);line-height:1.04}
.hs-h1 span{display:block;white-space:nowrap}
.hs-lead{margin:16px 0 0;font-size:14px;line-height:1.6;color:var(--fg);text-wrap:pretty}
.hs-ctas{display:flex;flex-direction:column;align-items:stretch;gap:10px;margin-top:24px}
.hs-ctas .hs-pill{min-height:44px;padding:10px 18px;letter-spacing:.12em}
.hs-copy .hs-social{margin-top:22px}

.hs-pill{display:inline-flex;align-items:center;justify-content:center;gap:12px;min-height:46px;padding:12px 26px;border:1px solid var(--fg);border-radius:999px;background:transparent;color:var(--fg)!important;font-size:12px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;cursor:pointer;white-space:nowrap;transition:background .45s var(--ease),color .45s var(--ease),border-color .45s var(--ease)}
.hs-pill .ti{font-size:18px}
.hs-pill:hover{background:var(--fg);color:#040004!important}
.hs-pill-gold{border-color:var(--gold);color:var(--gold2)!important}
.hs-pill-gold:hover{background:var(--gold);color:#040004!important}
.hs-pill:focus-visible,.hs-enter:focus-visible,.hs-social a:focus-visible,.hs-x:focus-visible,.hs-google:focus-visible{outline:2px solid var(--fg);outline-offset:3px}

.hs-social{display:flex;gap:6px;margin-left:-10px}
.hs-social a{width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:var(--mut)!important;font-size:22px;text-decoration:none;transition:color .4s var(--ease),background .4s var(--ease)}
.hs-social a:hover{color:var(--fg)!important;background:rgba(237,233,227,.06)}

.hs-clock{position:relative;grid-column:3 / 6;display:flex;align-items:center;justify-content:center;padding:32px 0;min-width:0}
.hs-clock-box{width:min(88vh,100%,900px);width:min(88svh,100%,900px)}
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
.hs-plans-logo{display:flex;justify-content:center;margin-bottom:22px}
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
.hs-pill-goldfill{background:var(--gold);border-color:var(--gold);color:#040004!important;font-weight:600;transition:none}
.hs-pill-goldfill:hover{background:var(--gold2);border-color:var(--gold2)}
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
  .hs-main,.hs-top{grid-template-columns:minmax(24px,.6fr) minmax(250px,2.2fr) 5fr minmax(24px,.6fr)}
  .hs-enter{grid-column:3;justify-self:end}
  .hs-clock{grid-column:3}
  .hs-cards{grid-template-columns:1fr 1fr}
  .hs-card-founder{grid-column:1 / -1;order:-1}
}
@media (max-width:900px){
  .hs-top{position:relative;display:flex;justify-content:space-between;padding:20px 20px 0}
  .hs-top-logo{display:inline}
  .hs-panel-logo{display:none}
  .hs-logo-a{font-size:23px}.hs-logo-b{font-size:15px}
  .hs-main{display:flex;flex-direction:column;height:auto;min-height:0}
  .hs-clock{order:-1;padding:12px 8px 0}
  .hs-clock-box{width:min(100%,560px)}
  .hs-panel{padding:8px 24px 40px;align-items:stretch}
  .hs-copy{width:100%;margin:0}
  .hs-h1{margin-top:16px;font-size:clamp(38px,10.5vw,52px)}
  .hs-over{font-size:12px;white-space:normal}
  .hs-lead{margin-top:18px;font-size:16px;max-width:none}
  .hs-ctas{align-items:stretch;margin-top:28px}
  .hs-ctas .hs-pill{width:100%;min-height:52px}
  .hs-col{height:auto;max-width:560px;margin:0 auto}
  .hs-copy .hs-social{justify-content:center;margin:32px auto 0}
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
