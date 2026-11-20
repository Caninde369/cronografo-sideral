/**
 * Pílula do teste de 7 horas (barra do topo) + popover com o uso.
 * Identidade LP: DM Sans na interface, DM Mono nos números, dourado só para o Fundador.
 */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TrialUsage } from '../hooks/useTrialUsage';
import { formatHM } from '../hooks/useTrialUsage';
import { PLANOS } from '../src/plans/plans';

const fmtDate = (d: Date | null) => d ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—';

export const TrialPill: React.FC<{ trial: TrialUsage; isLight?: boolean; onUpgrade: () => void }> = ({ trial, isLight, onUpgrade }) => {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number }>({ top: 56, right: 16 });

  useEffect(() => {
    if (!open) return;
    const place = () => { const r = btn.current?.getBoundingClientRect(); if (r) setPos({ top: r.bottom + 8, right: Math.max(12, window.innerWidth - r.right) }); };
    place();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('resize', place); window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('keydown', esc); };
  }, [open]);

  const frac = trial.limitSeconds ? trial.remainingSeconds / trial.limitSeconds : 0;
  const low = trial.remainingSeconds < 3600;
  const R = 6.5, C = 2 * Math.PI * R;
  const ink = isLight ? '#231714' : '#EDE9E3';

  return (
    <>
      <style>{CSS}</style>
      <div className={`trp ${isLight ? 'is-light' : ''}`}>
        <button ref={btn} type="button" className="trp-main" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="dialog"
          title={trial.counting ? 'Contando agora' : 'Pausado'}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <circle cx="9" cy="9" r={R} fill="none" stroke={isLight ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.14)'} strokeWidth="2" />
            <circle cx="9" cy="9" r={R} fill="none" stroke={low ? '#FB923C' : ink} strokeWidth="2" strokeLinecap="round"
              strokeDasharray={`${C * frac} ${C}`} transform="rotate(-90 9 9)" />
            {trial.counting && <circle cx="9" cy="9" r="1.6" fill={low ? '#FB923C' : ink} className="trp-dot" />}
          </svg>
          <span className="trp-txt">Teste · <b>{formatHM(trial.remainingSeconds)}</b> restantes</span>
        </button>
        <button type="button" className="trp-up" onClick={onUpgrade}>Fazer upgrade</button>
      </div>
      {open && createPortal(
        <>
          <div className="trp-scrim" onClick={() => setOpen(false)} />
          <div className={`trp-pop ${isLight ? 'is-light' : ''}`} role="dialog" aria-label="Seu teste" style={{ top: pos.top, right: pos.right }}>
            <style>{CSS}</style>
            <p className="trp-eye">Teste grátis · tudo liberado</p>
            <p className="trp-big">{formatHM(trial.remainingSeconds)}<small> restantes</small></p>
            <div className="trp-bar"><i style={{ width: `${(1 - frac) * 100}%` }} /></div>
            <dl className="trp-dl">
              <div><dt>Usado</dt><dd>{formatHM(trial.usedSeconds)} de {formatHM(trial.limitSeconds)}</dd></div>
              <div><dt>Hoje</dt><dd>{formatHM(trial.todaySeconds)}</dd></div>
              <div><dt>Vale até</dt><dd>{fmtDate(trial.endsAt)}</dd></div>
            </dl>
            <p className="trp-note">Só conta com a aba aberta e em uso. Parado por 5 minutos, o relógio pausa sozinho.</p>
            <button type="button" className="trp-gold" onClick={() => { setOpen(false); onUpgrade(); }}>Garantir minha vaga de Fundador</button>
            <button type="button" className="trp-ghost" onClick={() => { setOpen(false); onUpgrade(); }}>Ver os planos</button>
          </div>
        </>, document.body)}
    </>
  );
};

/** Tela de fim do teste. */
export const TrialEndModal: React.FC<{ endedByDate: boolean; onUpgrade: () => void; onClose: () => void }> = ({ endedByDate, onUpgrade, onClose }) =>
  createPortal(
    <div className="tre-root" role="dialog" aria-modal="true" aria-labelledby="tre-title">
      <style>{CSS}</style>
      <div className="tre-card">
        <p className="trp-eye">Teste grátis</p>
        <h2 id="tre-title">{endedByDate ? `Seus ${PLANOS.teste.diasValidade} dias de teste acabaram` : `Suas ${PLANOS.teste.horas} horas acabaram`}</h2>
        <p>Para continuar com tudo liberado, garanta sua vaga de Fundador enquanto ela existe.</p>
        <button type="button" className="trp-gold" onClick={() => { onClose(); onUpgrade(); }}>Quero minha vaga</button>
        <button type="button" className="trp-ghost" onClick={onClose}>Seguir no Grátis</button>
      </div>
    </div>, document.body);

const CSS = `
.trp{display:flex;align-items:center;gap:6px;flex-shrink:0}
.trp-main{display:flex;align-items:center;gap:8px;height:30px;padding:0 12px 0 8px;border-radius:999px;border:1px solid rgba(255,255,255,.15);background:rgba(6,6,10,.95);color:#EDE9E3;cursor:pointer;font:500 12px 'DM Sans',sans-serif;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.5);backdrop-filter:blur(16px)}
.trp-main b{font-family:'DM Mono',monospace;font-weight:500;font-variant-numeric:tabular-nums}
.trp-txt{color:rgba(237,233,227,.75)}.trp-txt b{color:#EDE9E3}
.trp-up{height:30px;padding:0 14px;border-radius:999px;border:1px solid rgba(212,175,55,.75);background:rgba(6,6,10,.95);color:#F5D98A;font:500 12px 'DM Sans',sans-serif;cursor:pointer;white-space:nowrap}
.trp-up:hover{background:rgba(212,175,55,.12)}
.trp.is-light .trp-main{background:rgba(255,255,255,.95);border-color:rgba(139,131,112,.35);color:#231714;box-shadow:0 3px 10px -1px rgba(110,98,75,.16)}
.trp.is-light .trp-txt{color:#6b6253}.trp.is-light .trp-txt b{color:#231714}
.trp.is-light .trp-up{background:#fff;color:#8a6a12;border-color:#b08a1e}
.trp-main:focus-visible,.trp-up:focus-visible,.trp-gold:focus-visible,.trp-ghost:focus-visible{outline:2px solid #D4AF37;outline-offset:2px}
.trp-dot{animation:trp-b 2s ease-in-out infinite}@keyframes trp-b{50%{opacity:.25}}
.trp-scrim{position:fixed;inset:0;z-index:13990}
.trp-pop{position:fixed;z-index:14000;width:300px;max-width:calc(100vw - 24px);padding:18px;border-radius:18px;border:1px solid #2a2430;background:#0a070c;color:#EDE9E3;font-family:'DM Sans',sans-serif;box-shadow:0 24px 60px -12px rgba(0,0,0,.8)}
.trp-pop.is-light{background:#fbf9f4;border-color:rgba(139,131,112,.35);color:#231714}
.trp-eye{margin:0;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:#8a8590}
.trp-big{margin:8px 0 10px;font:500 30px/1 'DM Mono',monospace;letter-spacing:-.02em}
.trp-big small{font:400 13px 'DM Sans',sans-serif;color:#8a8590;letter-spacing:0}
.trp-bar{height:4px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden}
.trp-pop.is-light .trp-bar{background:rgba(0,0,0,.08)}
.trp-bar i{display:block;height:100%;background:currentColor;border-radius:2px}
.trp-dl{margin:14px 0 0;display:grid;gap:6px;font-size:13px}
.trp-dl div{display:flex;justify-content:space-between;gap:12px}
.trp-dl dt{color:#8a8590}.trp-dl dd{margin:0;font-family:'DM Mono',monospace;font-size:12.5px}
.trp-note{margin:14px 0 16px;font-size:12.5px;line-height:1.5;color:#8a8590}
.trp-gold{width:100%;height:40px;border-radius:999px;border:1px solid #D4AF37;background:#D4AF37;color:#040004;font:500 13.5px 'DM Sans',sans-serif;cursor:pointer}
.trp-gold:hover{filter:brightness(1.08)}
.trp-ghost{width:100%;height:36px;margin-top:6px;border-radius:999px;border:0;background:none;color:inherit;opacity:.75;font:500 13px 'DM Sans',sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:4px}
.tre-root{position:fixed;inset:0;z-index:14500;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(4,0,4,.72);backdrop-filter:blur(6px)}
.tre-card{width:100%;max-width:400px;padding:28px 24px 20px;border-radius:22px;border:1px solid rgba(212,175,55,.45);background:radial-gradient(120% 60% at 50% 0%,rgba(212,175,55,.10),#0a070c 62%);color:#EDE9E3;font-family:'DM Sans',sans-serif;text-align:center}
.tre-card h2{margin:10px 0 8px;font:italic 500 30px/1.1 'Cormorant Garamond',serif;color:#F5D98A;text-wrap:balance}
.tre-card>p:not(.trp-eye){margin:0 0 22px;font-size:14.5px;color:#B9B4BE}
@media (prefers-reduced-motion:reduce){.trp-dot{animation:none}}
`;
