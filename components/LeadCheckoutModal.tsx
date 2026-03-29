import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE;
const EMAILJS_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE;
const EMAILJS_KEY      = import.meta.env.VITE_EMAILJS_KEY;
const NU_CHECKOUT_URL  = 'https://checkout.nubank.com.br/WYxT1HYG5fay6s65';
const WA_DUVIDAS_URL   = 'https://wa.me/55SEUNUMERO?text=Ol%C3%A1%2C%20tenho%20uma%20d%C3%BAvida%20antes%20de%20garantir%20minha%20cota%20de%20Fundador.';

const SUPERNOVA = 'linear-gradient(135deg, #6366F1 0%, #22D3EE 25%, #818cf8 45%, #f472b6 65%, #fb923c 80%, #EF4444 100%)';

interface LeadCheckoutModalProps {
  isOpen:  boolean;
  onClose: () => void;
}

export const LeadCheckoutModal: React.FC<LeadCheckoutModalProps> = ({ isOpen, onClose }) => {
  const [nome,    setNome]    = useState('');
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) { setError('Preencha nome e email para continuar.'); return; }
    setLoading(true); setError('');
    try {
      await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
        nome, email,
        horario: new Date().toLocaleString('pt-BR'),
        origem:  'Landing Page — Botão Fundador',
      }, EMAILJS_KEY);
    } catch (_) {}
    finally {
      setLoading(false);
      window.open(NU_CHECKOUT_URL, '_blank');
      onClose();
    }
  };

  const handleClose = () => { setNome(''); setEmail(''); setError(''); setLoading(false); onClose(); };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
    padding: '14px 16px', fontSize: '14px', color: '#fff',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: "'DM Sans', sans-serif",
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '6px',
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 99998,
              background: 'rgba(3,3,10,0.92)', backdropFilter: 'blur(14px)',
            }}
          >
            {/* Névoa supernova no overlay */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `
                radial-gradient(ellipse at 15% 50%, rgba(99,102,241,0.07) 0%, transparent 55%),
                radial-gradient(ellipse at 85% 50%, rgba(239,68,68,0.06) 0%, transparent 55%),
                radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.03) 0%, transparent 70%)
              `,
            }} />
          </motion.div>

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 99999,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: '1.5rem',
              pointerEvents: 'none',
            }}
          >
            {/* Borda supernova */}
            <div style={{
              width: '100%', maxWidth: '440px',
              borderRadius: '20px', padding: '1.5px',
              background: SUPERNOVA,
              pointerEvents: 'auto',
            }}>
              <div style={{
                background: '#080810', borderRadius: '19px',
                padding: '2.5rem 2rem',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', textAlign: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Névoa interna */}
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: `
                    radial-gradient(ellipse at 0% 50%, rgba(99,102,241,0.06) 0%, transparent 60%),
                    radial-gradient(ellipse at 100% 50%, rgba(239,68,68,0.05) 0%, transparent 60%)
                  `,
                }} />

                {/* Logo */}
                <img src="/logo.svg" alt="Cronógrafo Sideral"
                     style={{ width: 'clamp(180px, 55%, 240px)', height: 'auto', objectFit: 'contain', marginBottom: '1.25rem', opacity: 0.92, position: 'relative' }}
                     onError={e => { e.currentTarget.style.display = 'none'; }} />

                <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '1.5rem', position: 'relative' }} />

                <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 300, fontStyle: 'italic', color: '#F5F2EB', lineHeight: 1.2, margin: '0 0 0.5rem', position: 'relative' }}>
                  Faça parte desse projeto.
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: '0 0 2rem', position: 'relative' }}>
                  Preencha abaixo para garantir seu acesso vitalício.
                  <br />O checkout abre em seguida — Pix ou cartão.
                </p>

                <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
                  <div style={{ textAlign: 'left' }}>
                    <label style={labelStyle}>Nome</label>
                    <input type="text" required value={nome} onChange={e => setNome(e.target.value)}
                           placeholder="Como prefere ser chamado(a)?" style={inputStyle}
                           onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                           onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <label style={labelStyle}>Email</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                           placeholder="seu@email.com" style={inputStyle}
                           onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                           onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')} />
                  </div>

                  {error && (
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(248,113,113,0.9)', margin: 0, textAlign: 'left' }}>{error}</p>
                  )}

                  <button type="submit" disabled={loading} style={{
                    width: '100%', background: '#D4AF37', color: '#000', border: 'none',
                    borderRadius: '10px', padding: '17px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
                    fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxSizing: 'border-box', marginTop: '4px',
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.09-1.01L12 2z" fill="#000"/>
                    </svg>
                    {loading ? 'Aguarde...' : 'Garantir minha cota de Fundador(a)'}
                    {!loading && <ArrowRight size={14} />}
                  </button>

                  <button type="button" onClick={handleClose} style={{
                    width: '100%', background: 'transparent', color: 'rgba(255,255,255,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '13px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '12px',
                    letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>
                    Voltar
                  </button>
                </form>

                <div style={{
                  width: '100%', background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px',
                  padding: '14px 16px', margin: '1.25rem 0 0', textAlign: 'left', position: 'relative',
                }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>
                    {'O pagamento é processado por Rafael C. Medeiros — criador do Cronógrafo Sideral. Dúvidas antes de pagar? '}
                    <a href={WA_DUVIDAS_URL} target="_blank" rel="noopener noreferrer"
                       style={{ color: 'rgba(212,175,55,0.8)', textDecoration: 'none' }}>
                      {'Fale diretamente comigo.'}
                    </a>
                  </p>
                </div>

                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: '0.75rem 0 0', lineHeight: 1.6, textAlign: 'center', position: 'relative' }}>
                  Seus dados não serão compartilhados. Usados apenas para entrega do acesso.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};