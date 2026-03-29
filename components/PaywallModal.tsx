import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { LeadCheckoutModal } from './LeadCheckoutModal';

const SUPERNOVA = 'linear-gradient(135deg, #6366F1 0%, #22D3EE 25%, #818cf8 45%, #f472b6 65%, #fb923c 80%, #EF4444 100%)';

interface PaywallModalProps {
  onLoginClick:    () => void;
  onBackToLanding: () => void;
  onFounderClick?: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ onBackToLanding }) => {
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: 'rgba(3,3,10,0.92)', backdropFilter: 'blur(14px)' }}
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

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '100%', maxWidth: '460px',
            margin: '0 16px', borderRadius: '20px',
            padding: '1.5px', background: SUPERNOVA,
            position: 'relative', zIndex: 2,
          }}
        >
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

            <img src="/logo.svg" alt="Cronógrafo Sideral"
                 style={{ width: 'clamp(180px, 55%, 240px)', height: 'auto', objectFit: 'contain', marginBottom: '1.25rem', opacity: 0.92, position: 'relative' }}
                 onError={e => { e.currentTarget.style.display = 'none'; }} />

            <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '1.5rem', position: 'relative' }} />

            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', fontWeight: 300, fontStyle: 'italic', color: '#F5F2EB', lineHeight: 1.2, margin: '0 0 1rem', position: 'relative' }}>
              Sentiu a diferença?
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, margin: '0 0 2rem', maxWidth: '340px', position: 'relative' }}>
              Seus 10 minutos revelaram o que uma ferramenta séria pode fazer.
              Faça parte desse projeto desde o início.
            </p>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
              <button onClick={() => setShowCheckout(true)} style={{
                width: '100%', background: '#D4AF37', color: '#000', border: 'none',
                borderRadius: '10px', padding: '17px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
                fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', boxSizing: 'border-box',
                transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.09-1.01L12 2z" fill="#000"/>
                </svg>
                Garantir cota de Fundador(a)
                <ArrowRight size={14} />
              </button>

              <button onClick={onBackToLanding} style={{
                width: '100%', background: 'transparent',
                color: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '13px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '12px',
                fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                Voltar ao início
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <LeadCheckoutModal isOpen={showCheckout} onClose={() => setShowCheckout(false)} />
    </>
  );
};