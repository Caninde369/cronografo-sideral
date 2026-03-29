import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import emailjs from '@emailjs/browser';

const DS = {
  bg: '#050505',
  surface1: '#0a0a0a',
  surface2: '#141414',
  borderSubtle: 'rgba(255,255,255,0.08)',
  borderActive: 'rgba(255,255,255,0.2)',
  textMain: '#ffffff',
  textMuted: 'rgba(255,255,255,0.6)',
  gold: '#D4AF37',
  purple: '#9B6BFF',
  rSm: '8px',
  rMd: '12px',
};

interface LeadGateProps {
  onComplete: () => void;
  onBack?: () => void;
}

export const LeadGate: React.FC<LeadGateProps> = ({ onComplete, onBack }) => {
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [experience, setExperience] = useState('');
  const [loading,    setLoading]    = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setLoading(true);

    emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE,
      import.meta.env.VITE_EMAILJS_TEMPLATE,
      {
        nome:    name,
        email:   email,
        horario: new Date().toLocaleString('pt-BR'),
        origem:  `Trial 10min — Perfil: ${experience || 'não informado'}`,
      },
      import.meta.env.VITE_EMAILJS_KEY
    ).catch(() => {}).finally(() => {
      localStorage.setItem('cronografo_lead', JSON.stringify({ name, email, experience }));
      setLoading(false);
      onComplete();
    });
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: DS.bg, color: DS.textMain }}
    >
      {/* Botão voltar */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-50 hover:text-white flex items-center gap-2 transition-colors font-manrope text-sm"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar
        </button>
      )}

      {/* Glow de fundo */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(155,107,255,0.12) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md flex flex-col items-center"
        style={{ padding: '2px' }}
      >
        {/* Wrapper com borda gradiente espectral */}
        <div
          style={{
            width: '100%',
            borderRadius: '20px',
            padding: '2px',
            background: 'linear-gradient(to right, #6B8FFF, #A07BFF, #CC6FFF, #FF5580, #FFA04D)',
          }}
        >
          <div
            style={{
              background: DS.bg,
              borderRadius: '18px',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Logo da marca */}
            <img
              src="/logo.svg"
              alt="Cronógrafo Sideral"
              style={{
                width: 'clamp(140px, 40vw, 180px)',
                height: 'auto',
                objectFit: 'contain',
                marginBottom: '1.5rem',
              }}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />

            {/* Título */}
            <h1 className="text-center mb-3" style={{ fontWeight: 300 }}>
              <span
                className="font-michroma uppercase block"
                style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', color: '#ffffff', letterSpacing: '0.08em' }}
              >
                EXPLORE
              </span>
              <span
                className="font-cormorant block"
                style={{
                  fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                  color: '#ffffff',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  marginTop: '-20px',
                }}
              >
                por 10 minutos
              </span>
            </h1>

            <p
              className="font-manrope text-center mb-8"
              style={{ color: DS.textMuted, fontSize: '14px', lineHeight: 1.7 }}
            >
              Sem cartão. Sem compromisso. Só você e o céu.
            </p>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">

              <div className="flex flex-col gap-1.5">
                <label
                  className="font-manrope text-xs tracking-widest uppercase"
                  style={{ color: DS.textMuted }}
                >
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-transparent outline-none font-manrope transition-colors"
                  style={{
                    border: `1px solid ${DS.borderSubtle}`,
                    borderRadius: DS.rSm,
                    padding: '12px 16px',
                    color: DS.textMain,
                    background: DS.surface1,
                  }}
                  onFocus={e  => (e.target.style.borderColor = DS.borderActive)}
                  onBlur={e   => (e.target.style.borderColor = DS.borderSubtle)}
                  placeholder="Como prefere ser chamado(a)?"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="font-manrope text-xs tracking-widest uppercase"
                  style={{ color: DS.textMuted }}
                >
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none font-manrope transition-colors"
                  style={{
                    border: `1px solid ${DS.borderSubtle}`,
                    borderRadius: DS.rSm,
                    padding: '12px 16px',
                    color: DS.textMain,
                    background: DS.surface1,
                  }}
                  onFocus={e  => (e.target.style.borderColor = DS.borderActive)}
                  onBlur={e   => (e.target.style.borderColor = DS.borderSubtle)}
                  placeholder="seu@email.com"
                />
              </div>

              <div className="flex flex-col gap-1.5 mb-2">
                <label
                  className="font-manrope text-xs tracking-widest uppercase"
                  style={{ color: DS.textMuted }}
                >
                  Nível de Experiência (Opcional)
                </label>
                <select
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  className="w-full outline-none font-manrope transition-colors appearance-none"
                  style={{
                    border: `1px solid ${DS.borderSubtle}`,
                    borderRadius: DS.rSm,
                    padding: '12px 16px',
                    color: experience ? DS.textMain : DS.textMuted,
                    background: DS.surface1,
                  }}
                  onFocus={e  => (e.target.style.borderColor = DS.borderActive)}
                  onBlur={e   => (e.target.style.borderColor = DS.borderSubtle)}
                >
                  <option value="" disabled>Selecione seu perfil...</option>
                  <option value="amador">Amador / Curioso</option>
                  <option value="estudante">Estudante de Astrologia</option>
                  <option value="profissional">Astrólogo(a) Profissional</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full font-manrope font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
                style={{
                  background: DS.textMain,
                  color: DS.bg,
                  padding: '16px',
                  borderRadius: DS.rSm,
                  fontSize: '13px',
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  border: 'none',
                }}
              >
                {loading ? 'Acessando...' : 'Explorar agora'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

            </form>

            <div className="mt-6 flex items-center gap-2" style={{ opacity: 0.45 }}>
              <Star className="w-3 h-3" style={{ color: DS.gold }} />
              <span className="font-manrope text-xs tracking-wider uppercase">
                Acesso liberado por 10 minutos
              </span>
              <Star className="w-3 h-3" style={{ color: DS.gold }} />
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};