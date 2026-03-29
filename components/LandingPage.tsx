import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { UI_ICONS, ZODIAC_ICONS, CELESTIAL_GLYPHS } from './icons';
import {
  Check, X, ChevronDown, Plus,
  ArrowRight, Camera, Zap, Globe, Monitor,
  Shield, Clock, Layers,
  Facebook, Instagram, Twitter
} from 'lucide-react';
import { useLanguage } from '../i18n';
import { LeadCheckoutModal } from './LeadCheckoutModal';

interface LandingPageProps {
  onEnter: () => void;
  onRegister?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN SYSTEM v1.0 — Cronógrafo Sideral
// Vega Noir · aprovado por Rafael · março 2026
// ─────────────────────────────────────────────────────────────────────────────
const DS = {
  // BASE — estrutura (aparecem em 100% das telas)
  bgBase:       '#03030a',
  surface1:     'rgba(255,255,255,0.02)',
  surface2:     'rgba(255,255,255,0.05)',
  surface3:     'rgba(255,255,255,0.12)',
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderActive: 'rgba(255,255,255,0.12)',
  cream:        '#F5F2EB',
  gray1:        '#D1D5DB',
  gray2:        '#9CA3AF',
  gray3:        '#6B7280',
  ghost:        '#374151',

  // OURO — exclusivo Fundador, não contaminar
  gold:         '#D4AF37',
  goldDeep:     '#B8962A',
  goldLight:    '#F5D98A',

  // PLANETAS — acentos cirúrgicos (máx. 2 por tela)
  sun:          '#FDE047',   // Sol     — CTA principal, hero
  moon:         '#F1F5F9',   // Lua     — texto prateado
  mars:         '#EF4444',   // Marte   — alerta, urgência
  jupiter:      '#FB923C',   // Júpiter — destaque quente, Fogo
  saturn:       '#FACC15',   // Saturno — acento secundário
  uranus:       '#22D3EE',   // Urano   — Ar, tempo real
  neptune:      '#6366F1',   // Netuno  — links, info, ação fria
  pluto:        '#94A3B8',   // Plutão  — elementos discretos

  // ELEMENTOS ZODIACAIS — só no contexto do anel
  fire:         '#FB923C',
  earth:        '#34D399',
  air:          '#FEF3C7',
  water:        '#60A5FA',

  // UI — ação e foco (brand-purple, separado dos planetas)
  action:       '#8B5CF6',

  // GRADIENTE ESPECTRAL — máx. 4 usos por tela, 1px apenas
  // Netuno → Urano → Sol → Júpiter → Marte
  // Fenômeno sideral, não decoração
  spectral: 'linear-gradient(to right, transparent 0%, #6366F1 15%, #22D3EE 35%, #FDE047 55%, #FB923C 75%, #EF4444 90%, transparent 100%)',

  // GRADIENTE CTA — Sol → Júpiter (2 tons, não arco-íris)
  cta: 'linear-gradient(135deg, #FDE047 0%, #FB923C 100%)',

  // LAYOUT
  rSm:  '8px',
  rMd:  '12px',
  rLg:  '16px',
  lift: -6,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ANIMAÇÕES
// ─────────────────────────────────────────────────────────────────────────────
const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const fadeUp  = { hidden: { opacity: 0, y: 32 }, visible: (d=0) => ({ opacity: 1, y: 0, transition: { duration: 0.72, delay: d, ease: EASE } }) };
const fadeIn  = { hidden: { opacity: 0 }, visible: (d=0) => ({ opacity: 1, transition: { duration: 0.6, delay: d } }) };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } } };
const sItem   = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } };

// ─────────────────────────────────────────────────────────────────────────────
// ATOMS — hierarquia tipográfica
// ─────────────────────────────────────────────────────────────────────────────

// Tag de seção — DM Sans
const SectionTag = ({ children, color = '#9CA3AF', className = '', style = {} }: {
  children: string; color?: string; className?: string; style?: React.CSSProperties
}) => (
  <p className={`font-sans font-medium uppercase leading-none mb-4 tracking-[0.10em] ${className}`}
     style={{ fontSize: '13px', color, ...style }}>{children}</p>
);

// Tag de card — DM Sans
const CardTag = ({ children, color = DS.gray2, className = '', style = {} }: {
  children: string; color?: string; className?: string; style?: React.CSSProperties
}) => (
  <p className={`font-sans font-medium uppercase leading-none mb-2 tracking-[0.08em] ${className}`}
     style={{ fontSize: '13px', color, ...style }}>{children}</p>
);

// Título de seção — Playfair Display
const SectionTitle = ({ children, className = '', style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) => (
  <h2 className={`font-display font-normal italic leading-[1.1] ${className}`}
      style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', color: DS.cream, ...style }}>{children}</h2>
);

// Título de card — DM Sans
const HCard = ({ children, color = DS.cream, className = '', style = {} }: {
  children: React.ReactNode; color?: string; className?: string; style?: React.CSSProperties
}) => (
  <h3 className={`font-michroma font-medium uppercase leading-tight ${className}`}
      style={{ fontSize: '18px', letterSpacing: '0.04em', color, ...style }}>{children}</h3>
);

// Corpo principal — Playfair Display Editorial
const BodyMartel = ({ children, className = '', style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) => (
  <p className={`font-display italic font-light leading-[1.75] ${className}`}
     style={{ fontSize: '17px', color: '#9CA3AF', ...style }}>{children}</p>
);

// Corpo de card — DM Sans
const BodySm = ({ children, className = '', style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) => (
  <p className={`font-sans font-light leading-[1.78] ${className}`}
     style={{ fontSize: '16px', color: DS.gray1, ...style }}>{children}</p>
);

// Corpo padrão — DM Sans
const BodyLg = ({ children, className = '', style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) => (
  <p className={`font-sans font-light leading-[1.82] ${className}`}
     style={{ fontSize: '17px', color: '#D1D5DB', ...style }}>{children}</p>
);

// Placeholder de mockup
const MockupPlaceholder = ({ label, className = '' }: { label: string; className?: string }) => (
  <div className={`flex items-center justify-center ${className}`}
       style={{ background: DS.surface1, border: `1px solid ${DS.borderSubtle}`, borderRadius: DS.rMd }}>
    <div className="text-center select-none py-8">
      <Camera className="w-5 h-5 mx-auto mb-2" strokeWidth={1} style={{ color: 'rgba(255,255,255,0.10)' }} />
      <p className="font-sans uppercase tracking-widest" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.10)' }}>{label}</p>
    </div>
  </div>
);

const VideoPlayer = ({ src, playbackRate = 1, accent }: { src: string; playbackRate?: number; accent: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);
  return (
    <div className="w-full overflow-hidden aspect-[16/10]"
         style={{ borderRadius: DS.rMd, background: DS.surface2, border: `1px solid ${accent}18` }}>
      <video ref={videoRef} autoPlay loop muted playsInline className="w-full h-full object-cover">
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
};

const PricingRow = ({ included, text }: { included: boolean; text: string }) => (
  <li className="flex items-start gap-3">
    {included
      ? <Check className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2.5} style={{ color: DS.action }} />
      : <X    className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2}   style={{ color: DS.gray3 }} />}
    <span className="font-sans text-sm leading-relaxed"
          style={{ color: included ? DS.gray1 : DS.gray3 }}>{text}</span>
  </li>
);

const FaqItem = ({ question, answer }: { question: string; answer: string; key?: React.Key }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden transition-colors duration-300"
         style={{ border: `1px solid ${open ? DS.borderActive : DS.borderSubtle}`, background: open ? DS.surface2 : DS.surface1, borderRadius: DS.rMd }}>
      <button onClick={() => setOpen(!open)}
              className="w-full flex items-center justify-between px-7 py-5 text-left gap-6">
        <span className="font-sans text-sm font-medium leading-relaxed" style={{ color: DS.cream }}>{question}</span>
        <div className="w-6 h-6 flex items-center justify-center shrink-0 rounded-full border transition-all duration-300"
             style={{ background: open ? DS.action : 'transparent', borderColor: open ? DS.action : DS.borderActive, transform: open ? 'rotate(45deg)' : 'none' }}>
          <Plus className="w-3 h-3" strokeWidth={2.5} style={{ color: DS.cream }} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="c" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: EASE }} className="overflow-hidden">
            <div className="px-7 pb-5 pt-0">
              <div className="pt-4" style={{ borderTop: `1px solid ${DS.borderSubtle}` }}>
                <BodySm>{answer}</BodySm>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BOTÕES
// ─────────────────────────────────────────────────────────────────────────────

// Botão primário — gradiente CTA Sol → Júpiter, fundo escuro
const BtnPrimary = ({ onClick, children, className = '', disabled = false }: {
  onClick?: () => void; children: React.ReactNode; className?: string; disabled?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`relative inline-flex items-center gap-2.5 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    style={{ padding: '13px 36px', background: DS.cta, borderRadius: '4px', border: 'none' }}
  >
    <span className="relative z-10 font-sans font-medium tracking-[0.12em] uppercase whitespace-nowrap flex items-center gap-2"
          style={{ fontSize: '13px', color: DS.bgBase }}>
      {children}
    </span>
  </button>
);

// Botão secundário — borda espectral 1px, fundo transparente
const BtnSpectral = ({ onClick, children, className = '', disabled = false }: {
  onClick?: () => void; children: React.ReactNode; className?: string; disabled?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`relative inline-flex items-center gap-2.5 transition-all duration-300 hover:bg-white/5 active:scale-[0.98] ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    style={{ padding: '12px 32px', background: 'transparent', borderRadius: '4px', border: 'none', position: 'relative' }}
  >
    {/* Borda espectral 1px — fenômeno sideral */}
    <span aria-hidden style={{
      position: 'absolute', inset: 0, borderRadius: '4px', padding: '1px',
      background: 'linear-gradient(to right, #6366F1, #22D3EE, #FDE047, #FB923C, #EF4444)',
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor', maskComposite: 'exclude', pointerEvents: 'none',
    }} />
    <span className="relative z-10 font-sans font-medium tracking-[0.12em] uppercase whitespace-nowrap flex items-center gap-2"
          style={{ fontSize: '13px', color: DS.gray1 }}>
      {children}
    </span>
  </button>
);

// Botão fantasma — borda simples, para ação secundária sem peso
const BtnGhost = ({ onClick, children, className = '', disabled = false }: {
  onClick?: () => void; children: React.ReactNode; className?: string; disabled?: boolean
}) => (
  <button onClick={onClick} disabled={disabled}
          className={`font-sans font-medium tracking-[0.12em] uppercase transition-all duration-300 hover:bg-white/5 active:scale-[0.98] inline-flex items-center justify-center ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ fontSize: '13px', padding: '12px 32px', border: `1px solid ${DS.borderActive}`, borderRadius: '4px', color: DS.gray1, background: 'transparent' }}>
    {children}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// STARFIELD — fundo sideral calibrado
// ─────────────────────────────────────────────────────────────────────────────
const StarField: React.FC = () => {
  const stars = useMemo(() => {
    const rng = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    return Array.from({ length: 150 }, (_, i) => ({
      cx: rng(i) * 100, cy: rng(i * 2) * 88,
      r: rng(i * 3) * 1.1 + 0.25,
      opacity: rng(i * 4) * 0.45 + 0.12,
      dur: rng(i * 5) * 3.5 + 2.0,
      delay: rng(i * 6) * 5.0,
    }));
  }, []);
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ background: DS.bgBase }}>
        <defs>
          <style>{`@keyframes twinkle{0%,100%{opacity:var(--lo)}50%{opacity:var(--hi)}}`}</style>
          {/* Névoa calibrada — Netuno e profundidade sideral, sem roxo sintético */}
          <radialGradient id="nb1" cx="25%" cy="40%" r="35%">
            <stop offset="0%" stopColor="#0a0f2e" stopOpacity="0.22" />
            <stop offset="100%" stopColor={DS.bgBase} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nb2" cx="75%" cy="30%" r="28%">
            <stop offset="0%" stopColor="#06091f" stopOpacity="0.18" />
            <stop offset="100%" stopColor={DS.bgBase} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#nb1)" />
        <rect width="100%" height="100%" fill="url(#nb2)" />
        {stars.map((s, i) => (
          <circle key={i} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white"
                  style={{ '--lo': s.opacity * 0.35, '--hi': s.opacity, animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite` } as React.CSSProperties} />
        ))}
      </svg>
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 55%, ${DS.bgBase} 100%)` }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CÉU ATUAL — seção nova, amada pelo Rafael
// ─────────────────────────────────────────────────────────────────────────────

// ─── Mapeamento signo unicode → chave ZODIAC_ICONS ───────────
// ─── Cores elementais ─────────────────────────────────────────
const SIGN_ELEMENT_COLOR: Record<string, string> = {
  '♈': DS.jupiter, '♌': DS.jupiter, '♐': DS.jupiter,
  '♉': DS.earth,   '♍': DS.earth,   '♑': DS.earth,
  '♊': DS.air,     '♎': DS.air,     '♒': DS.air,
  '♋': DS.water,   '♏': DS.water,   '♓': DS.water,
};

// ─── Signo → ZODIAC_ICONS ────────────────────────────────────
const SIGN_KEY: Record<string, keyof typeof ZODIAC_ICONS> = {
  '♈': 'aries',     '♉': 'taurus',      '♊': 'gemini',
  '♋': 'cancer',    '♌': 'leo',         '♍': 'virgo',
  '♎': 'libra',     '♏': 'scorpio',     '♐': 'sagittarius',
  '♑': 'capricorn', '♒': 'aquarius',    '♓': 'pisces',
};

// ─── Fase da Lua ──────────────────────────────────────────────
const LUNAR_CYCLE = 29.530588;
const LUNAR_REF   = new Date('2025-01-29T12:36:00Z').getTime();
function getMoonPhaseEmoji(): string {
  const elapsed = (Date.now() - LUNAR_REF) / (1000 * 60 * 60 * 24);
  const phase   = ((elapsed % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
  if (phase < 1.85)  return '🌑';
  if (phase < 7.38)  return '🌒';
  if (phase < 9.22)  return '🌓';
  if (phase < 14.77) return '🌔';
  if (phase < 16.61) return '🌕';
  if (phase < 22.15) return '🌖';
  if (phase < 23.99) return '🌗';
  return '🌘';
}

// ─── Planeta → CELESTIAL_GLYPHS ──────────────────────────────
const PLANET_GLYPH_KEY: Record<string, string> = {
  sol: 'sun', lua: 'moon', mercurio: 'mercury', venus: 'venus',
  marte: 'mars', jupiter: 'jupiter', saturno: 'saturn',
  urano: 'uranus', netuno: 'neptune', plutao: 'pluto',
  lilith: 'lilith', nodoNorte: 'northNode', nodoSul: 'southNode',
  quiron: 'chiron', ceres: 'ceres', juno: 'juno',
  vesta: 'vesta', pallas: 'pallas',
};

// ─── Interface ────────────────────────────────────────────────
interface PlanetDatum {
  key: string; label: string; sign: string;
  house: string; deg: string; color: string; gradient: string;
}

// ─── Dados placeholder ────────────────────────────────────────
const PLANET_DATA_PLACEHOLDER: PlanetDatum[] = [
  { key: 'sol',       label: 'SOL',      sign: '♈', house: 'IV',   deg: "06°26'", color: DS.sun,     gradient: 'radial-gradient(circle at 35% 30%, #FFFACD, #FFD700, #FF8C00)' },
  { key: 'lua',       label: 'LUA',      sign: '♓', house: 'VII',  deg: "23°10'", color: DS.moon,    gradient: 'radial-gradient(circle at 35% 30%, #F5F5F5, #D3D3D3, #808080)' },
  { key: 'mercurio',  label: 'MERCÚRIO', sign: '♓', house: 'III',  deg: "10°20'", color: DS.pluto,   gradient: 'radial-gradient(circle at 35% 30%, #E0E0E0, #A9A9A9, #757575)' },
  { key: 'venus',     label: 'VÊNUS',    sign: '♈', house: 'IV',   deg: "25°28'", color: '#FDA4AF',  gradient: 'radial-gradient(circle at 35% 30%, #E9D5FF, #C084FC, #9333EA)' },
  { key: 'marte',     label: 'MARTE',    sign: '♓', house: 'III',  deg: "19°03'", color: DS.mars,    gradient: 'radial-gradient(circle at 35% 30%, #FF7F50, #CD5C5C, #8B0000)' },
  { key: 'jupiter',   label: 'JÚPITER',  sign: '♊', house: 'VII',  deg: "15°07'", color: DS.jupiter, gradient: 'radial-gradient(circle at 35% 30%, #FFF8DC, #CD853F, #D2691E)' },
  { key: 'saturno',   label: 'SATURNO',  sign: '♈', house: 'IV',   deg: "04°36'", color: DS.saturn,  gradient: 'radial-gradient(circle at 35% 30%, #F0E68C, #DAA520, #B8860B)' },
  { key: 'urano',     label: 'URANO',    sign: '♈', house: 'V',    deg: "28°34'", color: DS.uranus,  gradient: 'radial-gradient(circle at 35% 30%, #AFEEEE, #00CED1, #005A6A)' },
  { key: 'netuno',    label: 'NETUNO',   sign: '♈', house: 'IV',   deg: "01°48'", color: DS.neptune, gradient: 'radial-gradient(circle at 35% 30%, #8B8BFF, #4169E1, #00008B)' },
  { key: 'plutao',    label: 'PLUTÃO',   sign: '♒', house: 'II',   deg: "04°42'", color: DS.pluto,   gradient: 'radial-gradient(circle at 35% 30%, #8B0000, #708090, #2F4F4F)' },
  // Pontos lunares e asteroides
  { key: 'lilith',    label: 'LILITH',   sign: '♓', house: 'VII',  deg: "12°08'", color: '#C084FC',  gradient: 'radial-gradient(circle at 35% 30%, #1a0030, #4B0082, #2d0050)' },
  { key: 'nodoNorte', label: 'N.NORTE',  sign: '♈', house: 'X',    deg: "11°22'", color: DS.uranus,  gradient: 'radial-gradient(circle at 35% 30%, #e0f7fa, #80deea, #00acc1)' },
  { key: 'nodoSul',   label: 'N.SUL',    sign: '♎', house: 'IV',   deg: "11°22'", color: DS.mars,    gradient: 'radial-gradient(circle at 35% 30%, #fbe9e7, #ff8a65, #e64a19)' },
  { key: 'quiron',    label: 'QUÍRON',   sign: '♓', house: 'VII',  deg: "24°55'", color: DS.earth,   gradient: 'radial-gradient(circle at 35% 30%, #e8f5e9, #81c784, #388e3c)' },
  { key: 'ceres',     label: 'CERES',    sign: '♊', house: 'VIII', deg: "03°14'", color: DS.sun,     gradient: 'radial-gradient(circle at 35% 30%, #fffde7, #fff176, #f9a825)' },
  { key: 'juno',      label: 'JUNO',     sign: '♋', house: 'IX',   deg: "17°40'", color: '#FDA4AF',  gradient: 'radial-gradient(circle at 35% 30%, #fce4ec, #f48fb1, #c2185b)' },
  { key: 'vesta',     label: 'VESTA',    sign: '♓', house: 'VI',   deg: "08°31'", color: DS.jupiter, gradient: 'radial-gradient(circle at 35% 30%, #fff3e0, #ffb74d, #e65100)' },
  { key: 'pallas',    label: 'PALLAS',   sign: '♑', house: 'III',  deg: "29°47'", color: DS.neptune, gradient: 'radial-gradient(circle at 35% 30%, #ede7f6, #9575cd, #4527a0)' },
];

// ─── Card individual ──────────────────────────────────────────
const PlanetCard: React.FC<{ p: PlanetDatum; moonEmoji: string }> = ({ p, moonEmoji }) => {
  const glyph     = CELESTIAL_GLYPHS[PLANET_GLYPH_KEY[p.key] ?? ''] ?? '';
  const signKey   = SIGN_KEY[p.sign];
  const SignIcon  = signKey ? ZODIAC_ICONS[signKey] : null;
  const signColor = SIGN_ELEMENT_COLOR[p.sign] ?? DS.gray2;
  const isLua     = p.key === 'lua';

  return (
    <div
      className="flex flex-col items-center gap-2 py-4 px-2 transition-all duration-300 relative overflow-hidden"
      style={{ background: DS.surface1, borderRadius: DS.rMd, border: `0.5px solid ${DS.borderSubtle}`, cursor: 'default' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = DS.surface2; e.currentTarget.style.borderColor = `${p.color}40`; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = DS.surface1; e.currentTarget.style.borderColor = DS.borderSubtle; }}
    >
      {/* Linha de cor no topo */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: p.color, opacity: 0.5 }} />

      {/* Esfera / emoji lunar */}
      {isLua ? (
        <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', lineHeight: 1 }}>
          {moonEmoji}
        </div>
      ) : (
        <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: p.gradient }} />
          {glyph && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'serif', fontSize: '13px', color: 'rgba(255,255,255,0.9)',
              textShadow: '0 1px 4px rgba(0,0,0,0.9)', lineHeight: 1, userSelect: 'none',
            }}>
              {glyph}
            </div>
          )}
        </div>
      )}

      {/* Label */}
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 500, color: DS.gray2, letterSpacing: '0.10em', textAlign: 'center', textTransform: 'uppercase' }}>
        {p.label}
      </div>

      {/* Grau */}
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', fontWeight: 500, color: p.color, fontVariantNumeric: 'tabular-nums' }}>
        {p.deg}
      </div>

      {/* Signo elemental + Casa */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
        {SignIcon && <SignIcon style={{ width: '13px', height: '13px', color: signColor, opacity: 0.9 }} />}
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 500, color: DS.gray2, letterSpacing: '0.06em', textAlign: 'center' }}>
          CASA {p.house}
        </div>
      </div>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────
const CeuAtual: React.FC<{ planetData?: PlanetDatum[] }> = ({ planetData = PLANET_DATA_PLACEHOLDER }) => {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr   = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr   = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const moonEmoji = getMoonPhaseEmoji();

  const planetas   = planetData.slice(0, 10);
  const asteroides = planetData.slice(10);

  return (
    <section
      ref={ref}
      className="w-full max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20 py-20"
      style={{ borderTop: `1px solid ${DS.borderSubtle}` }}
    >
      <motion.div initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={stagger}>

        {/* Cabeçalho */}
        <motion.div variants={sItem} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <SectionTag>Ao vivo</SectionTag>
            <SectionTitle>O céu agora</SectionTitle>
          </div>
          <div className="text-right">
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '28px', color: DS.cream, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em', lineHeight: 1 }}>
              {timeStr}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', fontWeight: 500, color: DS.gray3, letterSpacing: '0.1em', marginTop: '4px', textTransform: 'uppercase' }}>
              {dateStr} · SÃO PAULO, BR
            </div>
          </div>
        </motion.div>

        {/* Separador espectral */}
        <motion.div variants={sItem}
          style={{ height: '1px', background: DS.spectral, opacity: 0.4, marginBottom: '24px' }} />

        {/* Planetas */}
        <motion.div variants={sItem}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3 mb-6">
          {planetas.map((p) => <PlanetCard key={p.key} p={p} moonEmoji={moonEmoji} />)}
        </motion.div>

        {/* Divisor asteroides */}
        <motion.div variants={sItem} className="flex items-center gap-3 mb-5">
          <div style={{ height: '1px', flex: 1, background: DS.borderSubtle }} />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 500, color: DS.gray3, letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0 }}>
            Pontos lunares e asteroides
          </p>
          <div style={{ height: '1px', flex: 1, background: DS.borderSubtle }} />
        </motion.div>

        {/* Asteroides */}
        <motion.div variants={sItem}
          className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {asteroides.map((p) => <PlanetCard key={p.key} p={p} moonEmoji={moonEmoji} />)}
        </motion.div>

        {/* Rodapé */}
        <motion.div variants={sItem} className="flex items-center justify-between mt-6">
          <div style={{ height: '1px', flex: 1, background: DS.borderSubtle }} />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 500, color: DS.gray3, letterSpacing: '0.15em', padding: '0 16px', textTransform: 'uppercase' }}>
            SWISS EPHEMERIS · POSIÇÕES SIDERAIS EM TEMPO REAL
          </p>
          <div style={{ height: '1px', flex: 1, background: DS.borderSubtle }} />
        </motion.div>

      </motion.div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onRegister }) => {
  const { language, setLanguage, t } = useLanguage();
  const [isLangOpen, setIsLangOpen]  = useState(false);
  const [billing, setBilling]        = useState<'monthly' | 'yearly'>('monthly');
  const handleRegister               = onRegister ?? onEnter;

  const getPrice = (baseBrl: number) => {
    const rates: Record<string, { sym: string; rate: number }> = {
      'PT-BR': { sym: 'R$', rate: 1 }, EN: { sym: '$', rate: 0.2 },
      ES: { sym: '€', rate: 0.18 }, FR: { sym: '€', rate: 0.18 }, ZH: { sym: '¥', rate: 1.4 },
    };
    const { sym, rate } = rates[language] ?? rates['PT-BR'];
    const raw = (baseBrl * rate).toFixed(2);
    const val = ['PT-BR', 'ES', 'FR'].includes(language) ? raw.replace('.', ',') : raw;
    return { sym, val };
  };
  const proBrl  = billing === 'monthly' ? 39.9  : 39.9  * 10;
  const premBrl = billing === 'monthly' ? 89.9  : 89.9  * 10;
  const { sym: proSym,  val: proVal  } = getPrice(proBrl);
  const { sym: premSym, val: premVal } = getPrice(premBrl);
  const { sym: fSym,    val: fOldVal } = getPrice(1497);
  const { val: fNewVal }               = getPrice(897);

  const heroRef    = useRef(null);
  const trioRef    = useRef(null); const trioIn   = useInView(trioRef,   { once: true, margin: '-80px' });
  const diffRef    = useRef(null); const diffIn   = useInView(diffRef,   { once: true, margin: '-80px' });
  const featRef    = useRef(null); const featIn   = useInView(featRef,   { once: true, margin: '-80px' });
  const pubRef     = useRef(null); const pubIn    = useInView(pubRef,    { once: true, margin: '-80px' });
  const provaRef   = useRef(null); const provaIn  = useInView(provaRef,  { once: true, margin: '-80px' });
  const precoRef   = useRef(null); const precoIn  = useInView(precoRef,  { once: true, margin: '-80px' });
  const specsRef   = useRef(null); const specsIn  = useInView(specsRef,  { once: true, margin: '-80px' });
  const faqRef     = useRef(null); const faqIn    = useInView(faqRef,    { once: true, margin: '-80px' });

  const [showLeadCheckout, setShowLeadCheckout] = useState(false);

  const marqueeItems = [
    'Relógio Sideral em Tempo Real', '·', 'Controle de Tempo', '·',
    'Horóscopo / Mapa Natal', '·', 'Planetas, Pontos Lunares e Asteroides', '·',
    'Formação de Linhas de Aspectos', '·', 'Anel Relógio 24h', '·',
    'Ponteiro / Agulha', '·', 'Órbitas Planetárias', '·',
    'Campo Magnético', '·', 'Constelações', '·',
    'Fixar Zodíaco', '·', 'Temas Claro/Escuro', '·',
    'Calendário Lunar', '·', 'Estações do Ano', '·',
    'Escala dos Painéis', '·', 'Evidenciar Aspecto', '·',
    'Personalização do Anel Zodiacal', '·',
    'Seleção de Planetas e Casas e Aspectos', '·',
  ];

  const faqData = [
    { q: 'Os cálculos são confiáveis para uso profissional?',  a: 'Sim. O Cronógrafo utiliza a biblioteca Swiss Ephemeris, o padrão de referência em precisão astrológica, com acurácia de grau e minuto para todos os corpos celestes.' },
    { q: 'Funciona no tablet ou celular durante uma consulta?', a: 'Sim. A aplicação é totalmente responsiva. Funciona em qualquer dispositivo moderno sem instalação e sem licença por máquina.' },
    { q: 'Qual a diferença entre o plano Grátis e o Mestre?',  a: 'O plano Grátis permite explorar o cronógrafo ao vivo com funcionalidades básicas. O Mestre libera todos os recursos: mapa natal, PDF, asteroides, calendário lunar, datas distantes e personalização completa.' },
    { q: 'Os meus dados e configurações ficam salvos?',         a: 'Sim. Seu mapa natal e preferências ficam vinculados à conta e acessíveis de qualquer dispositivo, sem precisar reconfigurar a cada acesso.' },
    { q: 'O que acontece se eu cancelar a assinatura?',         a: 'Você mantém acesso completo até o fim do período pago. Cancelamento sem multa, sem burocracia. Seus dados ficam preservados por 30 dias.' },
    { q: 'Existe suporte em português?',                        a: 'Sim. Todo o suporte é feito em português por email e chat, com equipe que conhece tanto a ferramenta quanto o universo da astrologia.' },
  ];

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden text-white flex flex-col font-sans scroll-smooth"
         style={{ background: DS.bgBase }}>

      <StarField />

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Header */}
        <header className="flex items-center justify-between px-8 lg:px-20 py-5 w-full max-w-[1280px] mx-auto">
          <div className="flex-shrink-0">
            <img src="/logo.svg" alt="Cronógrafo Sideral" className="object-contain"
                 style={{ width: 'clamp(140px, 40vw, 226px)', height: 'clamp(68px, 18vw, 124px)' }}
                 onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>

          <nav className="hidden lg:flex items-center justify-center gap-10 mx-6 flex-1">
            {[
              { href: '#funciona',     label: 'Como funciona' },
              { href: '#recursos',     label: 'Recursos'      },
              { href: '#diferenciais', label: 'Diferenciais'  },
              { href: '#planos',       label: 'Planos'        },
            ].map(({ href, label }) => (
              <a key={href} href={href}
                 onClick={(e) => { e.preventDefault(); document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }); }}
                 className="font-sans font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-colors cursor-pointer"
                 style={{ fontSize: '12px', color: DS.gray2 }}
                 onMouseEnter={(e) => (e.currentTarget.style.color = DS.cream)}
                 onMouseLeave={(e) => (e.currentTarget.style.color = DS.gray2)}>
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-5 flex-shrink-0">
            <BtnGhost onClick={onEnter}>ENTRAR</BtnGhost>
            <div className="relative">
              <button onClick={() => setIsLangOpen(!isLangOpen)}
                      className="font-sans font-medium tracking-wider flex items-center gap-1 transition-colors"
                      style={{ fontSize: '12px', color: DS.gray2 }}>
                {language}<ChevronDown className="w-3 h-3" />
              </button>
              {isLangOpen && (
                <div className="absolute top-full mt-2 right-0 shadow-2xl overflow-hidden z-50 min-w-[96px]"
                     style={{ background: '#0e0e18', border: `1px solid ${DS.borderSubtle}`, borderRadius: DS.rSm }}>
                  {(['PT-BR', 'EN', 'ES', 'FR', 'ZH'] as const).map((lang) => (
                    <button key={lang} onClick={() => { setLanguage(lang); setIsLangOpen(false); }}
                            className="block w-full text-left px-4 py-2.5 font-sans tracking-wider transition-colors hover:bg-white/5"
                            style={{ fontSize: '12px', color: DS.gray1 }}>
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Cometa espectral — fenômeno sideral */}
       <div
          style={{
            width: '100%',
            height: '1px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '200%',
              height: '1px',
              background: 'linear-gradient(to right, transparent 0%, transparent 20%, #EF4444 30%, #FB923C 38%, #FDE047 46%, #22D3EE 56%, #6366F1 65%, transparent 75%, transparent 100%)',
              animation: 'spectralComet 20s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
        </div>
        {/* Hero Body */}
        <main className="flex-1 flex flex-col items-center w-full max-w-[1280px] mx-auto px-8 lg:px-20 pt-4">

          <motion.p initial="hidden" animate="visible" custom={0.15} variants={fadeIn}
                    className="font-display font-normal tracking-wide text-center mb-4"
                    style={{ fontSize: '22px', color: DS.cream, letterSpacing: '0.06em', opacity: 0.7 }}>
            Nova ferramenta astrológica.
          </motion.p>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0.28}
            variants={fadeUp}
            className="font-display text-center leading-[1.05] mb-4"
            style={{ fontSize: 'clamp(2.6rem, 8vw, 72px)', color: DS.cream, fontStyle: 'italic', fontWeight: 500 }}
          >
            Veja o céu se movendo
          </motion.h1>

          <motion.p initial="hidden" animate="visible" custom={0.42} variants={fadeIn}
                    className="font-body font-normal text-center mb-10"
                    style={{ fontSize: 'clamp(15px, 4vw, 17px)', color: DS.gray2, lineHeight: 1.75, maxWidth: '520px', paddingLeft: '1rem', paddingRight: '1rem' }}>
            Controle o tempo minuto a minuto e acompanhe aspectos e trânsitos se formando em tempo real.
          </motion.p>

          <motion.div initial="hidden" animate="visible" custom={0.55} variants={fadeIn}
                      className="flex items-center gap-4 mb-10">
            <BtnPrimary onClick={handleRegister}>
              EXPLORAR AGORA <ArrowRight className="w-4 h-4" />
            </BtnPrimary>
            <a href="#funciona"
               onClick={(e) => { e.preventDefault(); document.querySelector('#funciona')?.scrollIntoView({ behavior: 'smooth' }); }}
               className="font-sans font-medium tracking-[0.14em] uppercase transition-colors cursor-pointer whitespace-nowrap hidden sm:inline"
               style={{ fontSize: '12px', color: DS.gray3 }}
               onMouseEnter={(e) => (e.currentTarget.style.color = DS.cream)}
               onMouseLeave={(e) => (e.currentTarget.style.color = DS.gray3)}>
              Ver recursos
            </a>
          </motion.div>

          {/* Grid 3 colunas */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] xl:grid-cols-[240px_1fr_240px] items-start">

            {/* Labels laterais — cores planetárias corretas */}
            <motion.div initial="hidden" animate="visible" custom={0.65} variants={fadeIn}
                        className="hidden lg:flex flex-col pt-6 pr-8 gap-5">
              <div>
                <p className="font-sans font-medium uppercase tracking-[0.18em] mb-2"
                   style={{ fontSize: '12px', color: DS.jupiter }}>Precisão</p>
                <BodySm style={{ fontSize: '15px' }}>Swiss Ephemeris, o padrão de referência internacional. Grau e minuto para todos os corpos celestes.</BodySm>
              </div>
              <div>
                <p className="font-sans font-medium uppercase tracking-[0.18em] mb-2"
                   style={{ fontSize: '12px', color: DS.uranus }}>Tempo real</p>
                <BodySm style={{ fontSize: '15px' }}>O céu se move enquanto você trabalha. Não uma fotografia, o mapa vivo.</BodySm>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 52 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.0, delay: 0.45, ease: EASE }} className="relative flex justify-center">
              {/* Glow calibrado — Netuno, profundo e frio */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
                   style={{ width: '70%', height: '120px', background: `radial-gradient(ellipse, ${DS.neptune}20 0%, transparent 70%)`, filter: 'blur(28px)' }} />
              <img src="/mockup-notebook.png" alt="Interface do Cronógrafo Sideral"
                   className="w-full object-contain object-bottom relative z-10"
                   style={{ maxHeight: '72vh', filter: 'drop-shadow(0 32px 64px rgba(0,0,0,0.9))' }}
                   onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </motion.div>

            <motion.div initial="hidden" animate="visible" custom={0.65} variants={fadeIn}
                        className="hidden lg:flex flex-col pt-6 pl-8 gap-5">
              <div>
                <p className="font-sans font-medium uppercase tracking-[0.18em] mb-2"
                   style={{ fontSize: '12px', color: DS.neptune }}>Sem instalação</p>
                <BodySm style={{ fontSize: '15px' }}>Browser, tablet, celular. Online. Sem licença por máquina.</BodySm>
              </div>
              <div>
                <p className="font-sans font-medium uppercase tracking-[0.18em] mb-2"
                   style={{ fontSize: '12px', color: DS.pluto }}>V2.9.13</p>
                <BodySm style={{ fontSize: '15px' }}>Em desenvolvimento ativo. Atualizado semanalmente.</BodySm>
              </div>
              <a href="#funciona"
                 onClick={(e) => { e.preventDefault(); document.querySelector('#funciona')?.scrollIntoView({ behavior: 'smooth' }); }}
                 className="flex flex-col items-start gap-2 group mt-1">
                <span className="font-sans font-medium tracking-[0.2em] uppercase group-hover:text-white transition-colors"
                      style={{ fontSize: '12px', color: DS.gray3 }}>Ver recursos</span>
                <div style={{ color: DS.gray3, marginLeft: '40px' }}>
                  <UI_ICONS.ChevronDownIcon className="w-4 h-4 animate-bounce" />
                </div>
              </a>
            </motion.div>

            {/* Mobile */}
            <motion.div initial="hidden" animate="visible" custom={0.65} variants={fadeIn}
                        className="lg:hidden col-span-1 flex flex-col items-center gap-4 pt-6 pb-10 text-center">
              <BodySm className="max-w-xs">Precisão astronômica em tempo real, em qualquer dispositivo.</BodySm>
            </motion.div>
          </div>
        </main>
      </div>

      {/* CONTEÚDO SCROLLADO */}
      <div className="relative z-10" style={{ background: `${DS.bgBase}f5`, backdropFilter: 'blur(2px)' }}>

        {/* MARQUEE */}
        <div className="py-4 overflow-hidden"
             style={{ borderTop: `1px solid ${DS.borderSubtle}`, borderBottom: `1px solid ${DS.borderSubtle}`, background: DS.surface1 }}>
          <motion.div className="flex gap-10 whitespace-nowrap"
                      animate={{ x: ['0%', '-50%'] }} transition={{ duration: 52, repeat: Infinity, ease: 'linear' }}>
            {[0, 1].map((rep) => (
              <div key={rep} className="flex gap-10 shrink-0">
                {marqueeItems.map((item, i) => (
                  <span key={i} className="font-sans font-medium uppercase tracking-[0.18em] shrink-0"
                        style={{ fontSize: '12px', color: item === '·' ? `${DS.neptune}40` : DS.gray2 }}>
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </motion.div>
        </div>

        {/* ══════════════════════════════════════════════════════
            CÉU ATUAL — nova seção
        ══════════════════════════════════════════════════════ */}
        <CeuAtual />

        {/* ══════════════════════════════════════════════════════
            TRIO DE RECURSOS PRINCIPAIS
        ══════════════════════════════════════════════════════ */}
        <section id="recursos" ref={trioRef} className="w-full max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20 py-24"
                 style={{ borderTop: `1px solid ${DS.borderSubtle}` }}>
          <motion.div initial="hidden" animate={trioIn ? 'visible' : 'hidden'} variants={stagger}
                      className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { tag: 'Vivo',        title: 'TEMPO REAL',     body: 'Navegue pelo tempo com precisão astronômica. Avance ou recue dias, meses e anos. Observe como os trânsitos de hoje se relacionam com o mapa natal, tudo sem sair da tela.', video: 'tempo-real.mp4', accent: DS.jupiter },
              { tag: 'Imersivo',    title: 'ATMOSFERA',      body: 'Veja o céu exatamente como ele está agora, com horizonte, estações e a posição real do Sol no momento. Uma perspectiva que nenhuma efeméride impressa pode te dar.', video: 'atmosfera.mp4', accent: DS.neptune },
              { tag: 'Preferência', title: 'PERSONALIZÁVEL', body: 'Modo claro ou escuro, painéis que se recolhem, cards enxutos ou completos. Você controla o que aparece, o tamanho, as cores e o que fica em evidência.', video: 'personalização.mp4', playbackRate: 1.5, accent: DS.gold },
            ].map((item, i) => (
              <motion.div key={i} variants={sItem}
                          whileHover={{ scale: 1.02, transition: { duration: 0.2, ease: 'easeOut' } }}
                          className="flex flex-col p-6 transition-all duration-300"
                          style={{ background: DS.surface1, border: `1px solid ${item.accent}20`, borderRadius: DS.rLg, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = item.accent; e.currentTarget.style.boxShadow = `0 0 25px ${item.accent}25`; e.currentTarget.style.background = DS.surface2; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${item.accent}20`; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'; e.currentTarget.style.background = DS.surface1; }}>
                <CardTag color={item.accent} className="mb-3">{item.tag}</CardTag>
                <HCard className="mb-3" style={{ fontSize: '24px', letterSpacing: '-0.02em' }}>{item.title}</HCard>
                <BodyLg className="mb-6 flex-1">{item.body}</BodyLg>
                <VideoPlayer src={`/${item.video}`} playbackRate={(item as any).playbackRate} accent={item.accent} />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            DIFERENCIAIS
        ══════════════════════════════════════════════════════ */}
        <section id="diferenciais" ref={diffRef} className="w-full max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20 py-24"
                 style={{ borderTop: `1px solid ${DS.borderSubtle}` }}>
          <motion.div initial="hidden" animate={diffIn ? 'visible' : 'hidden'} variants={stagger}>
            <motion.div variants={sItem} className="mb-14 text-center">
              <SectionTag>O que nos move</SectionTag>
              <SectionTitle className="max-w-2xl mx-auto">
                Ferramentas que respeitam<br />a profundidade da astrologia
              </SectionTitle>
              <BodyMartel className="mt-4 max-w-xl mx-auto">
                Não se trata apenas de cálculos. É sobre oferecer uma experiência à altura do que você sabe e do que seus clientes merecem.
              </BodyMartel>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { Icon: Monitor, tag: 'Interface',   title: 'ESTÉTICA',         accent: DS.jupiter, text: 'Uma experiência visual inesquecível. Uma ferramenta que comunica seriedade, para você e para quem você atende.' },
                { Icon: Zap,     tag: 'Visualização', title: 'DINÂMICA',         accent: DS.uranus,  text: 'Os planetas se movem enquanto você trabalha. Cada aspecto se forma diante dos seus olhos.' },
                { Icon: Globe,   tag: 'Mobilidade',  title: 'EM QUALQUER TELA', accent: DS.gold,    text: 'Sem instalação. Sem licença por máquina. Utilize no notebook, no computador ou celular.' },
              ].map(({ Icon, tag, title, text, accent }, i) => (
                <motion.div key={i} variants={sItem}
                            whileHover={{ y: DS.lift, transition: { duration: 0.22 } }}
                            className="flex flex-col p-7 transition-colors duration-300"
                            style={{ background: DS.surface1, border: `1px solid ${accent}18`, borderRadius: DS.rMd }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = DS.surface2)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = DS.surface1)}>
                  <div className="w-10 h-10 flex items-center justify-center mb-5"
                       style={{ background: `${accent}10`, border: `1px solid ${accent}22`, borderRadius: DS.rSm }}>
                    <Icon className="w-5 h-5" strokeWidth={1.5} style={{ color: accent }} />
                  </div>
                  <CardTag color={accent} style={{ fontSize: '12px' }}>{tag}</CardTag>
                  <HCard className="mb-3">{title}</HCard>
                  <BodySm style={{ fontSize: '15px' }}>{text}</BodySm>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FEATURES — grid 6 cards
        ══════════════════════════════════════════════════════ */}
        <section ref={featRef} className="w-full max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20 py-24"
                 style={{ borderTop: `1px solid ${DS.borderSubtle}` }}>
          <motion.div initial="hidden" animate={featIn ? 'visible' : 'hidden'} variants={stagger}>
            <motion.div variants={sItem} className="mb-16 text-center">
              <SectionTag>Recursos</SectionTag>
              <SectionTitle>Cada detalhe que <br />uma prática séria exige</SectionTitle>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { tag: 'Tempo',          title: 'Datas Extremas',    body: 'Navegue de Antes de Cristo até +3000 anos no futuro. Faça previsões, estude batalhas, nascimentos históricos, ciclos civilizatórios e eventos que moldaram o mundo.', image: 'data.png',             accent: DS.jupiter, beta: false },
                { tag: 'Interpretação',  title: 'Leitura Contextual',body: 'Passe o cursor sobre qualquer planeta, signo ou casa e veja uma breve descrição.', image: 'jupiter.png',          accent: DS.neptune, beta: false },
                { tag: 'Calendário',     title: 'Calendário Lunar',  body: 'Fases, eclipses e ingresso da Lua em cada signo. Planeje consultas, posts e práticas com antecedência.', image: 'calendario-lunar.png', accent: DS.gold,    beta: false },
                { tag: 'Asteroides',     title: 'Corpos Celestes',   body: 'Quíron, Lilith, Ceres, Vesta e outros. Configure os corpos que fazem sentido para você.', image: 'pontos-asteroides.png',accent: DS.jupiter, beta: false },
                { tag: 'Exportação',     title: 'Gerar PDF',         body: 'Exporte o mapa do momento com um clique. Para o cliente, para a aula, para o conteúdo.', image: 'pdf.png',              accent: DS.neptune, beta: true  },
                { tag: 'Novas possibilidades', title: 'Campo Magnético', body: 'Visualize as linhas de força e influência planetária de forma nunca vista.', image: 'magnetico.png',         accent: DS.mars,    beta: true  },
              ].map((item, i) => (
                <motion.div key={i} variants={sItem}
                            whileHover={{ y: -3, transition: { duration: 0.22 } }}
                            className="flex flex-col p-6 transition-colors duration-300"
                            style={{ background: DS.surface1, border: `1px solid ${DS.borderSubtle}`, borderRadius: DS.rMd }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = DS.surface2; e.currentTarget.style.borderColor = `${item.accent}45`; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = DS.surface1; e.currentTarget.style.borderColor = DS.borderSubtle; }}>
                  <div className="w-full mb-5 overflow-hidden"
                       style={{ aspectRatio: '16/9', borderRadius: DS.rSm, background: `${item.accent}08`, border: `1px solid ${item.accent}15` }}>
                    <img src={`/${item.image}`} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <CardTag color={`${item.accent}cc`}>{item.tag}</CardTag>
                    {item.beta && (
                      <span className="font-sans font-medium tracking-widest uppercase"
                            style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '999px', background: `${DS.gold}12`, border: `1px solid ${DS.gold}28`, color: `${DS.gold}cc` }}>
                        Em desenvolvimento
                      </span>
                    )}
                  </div>
                  <HCard className="mb-2">{item.title}</HCard>
                  <BodySm className="flex-1">{item.body}</BodySm>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            PÚBLICO-ALVO
        ══════════════════════════════════════════════════════ */}
        <section id="publico" ref={pubRef} className="w-full max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20 py-24"
                 style={{ borderTop: `1px solid ${DS.borderSubtle}` }}>
          <motion.div initial="hidden" animate={pubIn ? 'visible' : 'hidden'} variants={stagger}>
            <motion.div variants={sItem} className="mb-16 text-center">
              <SectionTag>Para quem é</SectionTag>
              <SectionTitle>Feito para quem leva<br />a astrologia a sério</SectionTitle>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {[
                { accent: DS.jupiter, tag: 'Se você cobra por consulta',     title: 'Astrologia',   desc: 'Você investe anos no estudo, constrói uma reputação e merece uma ferramenta à altura. O Cronógrafo é a interface que você usa com orgulho na frente da cliente.', quote: 'Minha forma de trabalhar mudou completamente. Mostro os trânsitos em movimento durante a consulta.', cta: 'Começar agora' },
                { accent: DS.neptune, tag: 'Se você estuda com profundidade', title: 'Pesquisa',     desc: 'Dados precisos, visualizações em tempo real e uma interface que não simplifica o que não deve ser simplificado. Para quem pesquisa de verdade.', quote: 'Finalmente consigo cruzar trânsitos siderais com eventos históricos sem recorrer a três ferramentas diferentes.', cta: 'Explorar recursos' },
                { accent: DS.gold,    tag: 'Se você ensina para uma audiência',title: 'Divulgação',  desc: 'Visuais limpos, dados em tempo real e exportação para quem precisa transformar conhecimento em conteúdo que engaja e ensina.', quote: 'Uso ao vivo nas transmissões. A audiência vê o céu se movendo enquanto explico. É outro nível de conexão.', cta: 'Ver funcionalidades' },
              ].map((card, i) => (
                <motion.div key={i} variants={sItem}
                            whileHover={{ y: DS.lift, transition: { duration: 0.25 } }}
                            className="flex flex-col p-8 transition-all duration-300 relative overflow-hidden"
                            style={{ background: `linear-gradient(145deg, ${card.accent}14 0%, ${card.accent}06 70%, transparent 100%)`, border: `1px solid ${card.accent}40`, borderRadius: DS.rLg }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${card.accent}80`; e.currentTarget.style.background = `linear-gradient(145deg, ${card.accent}20 0%, ${card.accent}10 70%, transparent 100%)`; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${card.accent}40`; e.currentTarget.style.background = `linear-gradient(145deg, ${card.accent}14 0%, ${card.accent}06 70%, transparent 100%)`; }}>
                  <div className="inline-flex self-start mb-5 font-sans font-medium uppercase tracking-[0.08em]"
                       style={{ fontSize: '12px', padding: '5px 12px', background: `${card.accent}18`, border: `1px solid ${card.accent}50`, borderRadius: DS.rSm, color: card.accent }}>
                    {card.tag}
                  </div>
                  <HCard className="mb-4" style={{ fontSize: '20px', letterSpacing: '-0.02em' }}>{card.title}</HCard>
                  <BodyLg className="mb-6 flex-1">{card.desc}</BodyLg>
                  <div className="p-5 mb-5 rounded-xl" style={{ background: `${card.accent}08`, border: `1px solid ${card.accent}20` }}>
                    <p className="font-display italic leading-relaxed" style={{ fontSize: '15px', color: DS.gray1, fontWeight: 300 }}>"{card.quote}"</p>
                  </div>
                  <button onClick={onEnter}
                          className="font-mono uppercase tracking-[0.14em] transition-all duration-300 flex items-center gap-2 self-start group"
                          style={{ fontSize: '12px', color: card.accent, background: 'transparent', padding: '6px 0', borderBottom: `1px solid ${card.accent}35` }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderBottomColor = card.accent; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderBottomColor = `${card.accent}35`; }}>
                    {card.cta}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            PROVA SOCIAL
        ══════════════════════════════════════════════════════ */}
        <section ref={provaRef} className="w-full max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20 py-24"
                 style={{ borderTop: `1px solid ${DS.borderSubtle}` }}>
          <motion.div initial="hidden" animate={provaIn ? 'visible' : 'hidden'} variants={stagger}>
            <motion.div variants={sItem} className="text-center mb-14">
              <SectionTag color={`${DS.gold}99`}>Quem já usa</SectionTag>
              <SectionTitle>As primeiras impressões<br />ficam aqui.</SectionTitle>
              <BodyMartel className="mt-4 max-w-lg mx-auto">
                Deixe sua impressão e seja visto(a) pelos próximos interessados que passarem por aqui.
              </BodyMartel>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {[
                { accent: DS.jupiter, badge: 'Astrólogo(a) · Fundador(a)' },
                { accent: DS.neptune, badge: 'Pesquisador(a) · Fundador(a)' },
                { accent: DS.gold,    badge: 'Criador(a) de conteúdo · Fundador(a)' },
              ].map((p, i) => (
                <motion.div key={i} variants={sItem}
                            className="flex flex-col p-7 transition-colors duration-300 items-center text-center"
                            style={{ background: DS.surface1, border: `1px solid ${DS.borderSubtle}`, borderRadius: DS.rMd, minHeight: '320px' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = DS.surface2)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = DS.surface1)}>
                  <div className="inline-flex self-center mb-5 font-mono uppercase tracking-[0.16em]"
                       style={{ fontSize: '12px', padding: '4px 12px', background: `${p.accent}10`, border: `1px solid ${p.accent}28`, borderRadius: '999px', color: `${p.accent}e0` }}>
                    {p.badge}
                  </div>
                  <div className="mb-4">
                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.09-1.01L12 2z" fill={`${p.accent}22`} stroke={`${p.accent}50`} strokeWidth="1" />
                    </svg>
                  </div>
                  <p className="font-display italic mb-2" style={{ fontSize: '20px', color: DS.cream, fontWeight: 400, lineHeight: 1.3 }}>Este espaço é seu.</p>
                  <p className="font-sans mb-5 flex-1" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
                    Fundadores(as) que entrarem primeiro registram aqui sua impressão sobre o Cronógrafo.
                  </p>
                  <p className="font-sans mb-4" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '13px' }}>Seu nome</span>
                    <br />
                    <span style={{ fontSize: '12px' }}>Sua escola ou especialidade · desde ano</span>
                  </p>
                  <div className="flex gap-2 mb-4">
                    <Facebook className="w-4 h-4 transition-colors cursor-pointer" style={{ color: `${p.accent}80` }} onMouseEnter={(e) => e.currentTarget.style.color = p.accent} onMouseLeave={(e) => e.currentTarget.style.color = `${p.accent}80`} />
                    <Instagram className="w-4 h-4 transition-colors cursor-pointer" style={{ color: `${p.accent}80` }} onMouseEnter={(e) => e.currentTarget.style.color = p.accent} onMouseLeave={(e) => e.currentTarget.style.color = `${p.accent}80`} />
                    <Twitter className="w-4 h-4 transition-colors cursor-pointer" style={{ color: `${p.accent}80` }} onMouseEnter={(e) => e.currentTarget.style.color = p.accent} onMouseLeave={(e) => e.currentTarget.style.color = `${p.accent}80`} />
                  </div>
                  <div className="flex gap-1">
                    {[0,1,2,3,4].map(s => (
                      <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.09-1.01L12 2z" fill={`${p.accent}30`} stroke={`${p.accent}55`} strokeWidth="1" />
                      </svg>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            PREÇOS
        ══════════════════════════════════════════════════════ */}
        <section id="planos" ref={precoRef} className="w-full max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20 py-24"
                 style={{ borderTop: `1px solid ${DS.borderSubtle}` }}>
          <motion.div initial="hidden" animate={precoIn ? 'visible' : 'hidden'} variants={stagger}>
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              <motion.div variants={sItem} className="text-center mb-12">
                <SectionTag>Planos</SectionTag>
                <SectionTitle className="mb-5">Acesso vitalício ao Cronógrafo</SectionTitle>
                <p className="font-body font-normal" style={{ fontSize: '16px', color: DS.gray2, lineHeight: 1.8, fontStyle: 'italic' }}>
                  Quem entra agora garante acesso a tudo que o Cronógrafo é e virá a ser.
                </p>
              </motion.div>

              <motion.div variants={sItem}
                          style={{ border: `1px solid rgba(212,175,55,0.2)`, borderTop: `2px solid ${DS.gold}`, borderRadius: DS.rLg, overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>

                {/* Bloco 1 — Identidade + Preço */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', borderBottom: `1px solid ${DS.borderSubtle}` }}>
                  <div style={{ padding: '2rem 2rem 2rem 2.5rem', borderRight: `1px solid ${DS.borderSubtle}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
                    <div className="inline-flex items-center gap-1.5"
                         style={{ alignSelf: 'flex-start', background: `${DS.gold}08`, border: `1px solid ${DS.gold}20`, borderRadius: '999px', padding: '5px 14px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: DS.gold }} />
                      <span className="font-sans font-medium uppercase tracking-[0.16em]" style={{ fontSize: '12px', color: `${DS.gold}cc` }}>21 cotas restantes</span>
                    </div>
                    <div>
                      <p className="font-sans font-medium uppercase tracking-[0.12em] mb-1.5" style={{ fontSize: '12px', color: DS.gray2 }}>Fundador Vitalício</p>
                      <p className="font-sans" style={{ fontSize: '13px', color: DS.gray3, lineHeight: 1.7 }}>Um pagamento. Acesso vitalício.<br/>Sem renovação, sem surpresas.</p>
                    </div>
                  </div>
                  <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: '0.5rem', borderTop: `1px solid ${DS.borderSubtle}` }}>
                    <p className="font-sans font-medium uppercase tracking-[0.12em]" style={{ fontSize: '12px', color: DS.gray3, margin: 0 }}>À vista no Pix</p>
                    <div className="flex items-baseline gap-1">
                      <span className="font-sans font-medium" style={{ fontSize: '16px', color: DS.gray2 }}>R$</span>
                      <span className="font-sans font-extrabold" style={{ fontSize: 'clamp(44px, 12vw, 60px)', color: DS.cream, lineHeight: 1, letterSpacing: '-0.03em' }}>897</span>
                    </div>
                    <p className="font-sans" style={{ fontSize: '13px', color: `${DS.gold}99`, margin: 0 }}>ou 12x de R$ 89,56</p>
                    <p className="font-sans" style={{ fontSize: '12px', color: DS.gray3, margin: 0 }}>via Nu Checkout · com juros</p>
                  </div>
                </div>

                {/* Bloco 2 — Benefícios */}
                <div style={{ padding: '2rem 2.5rem', borderBottom: `1px solid ${DS.borderSubtle}` }}>
                  <div className="flex items-center gap-3 mb-5">
                    <div style={{ flex: 1, height: '1px', background: DS.borderSubtle }} />
                    <p className="font-sans font-medium uppercase tracking-[0.2em] flex-shrink-0" style={{ fontSize: '12px', color: DS.gray3, margin: 0 }}>Recursos incluídos</p>
                    <div style={{ flex: 1, height: '1px', background: DS.borderSubtle }} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-7">
                    {['Mapa sideral em tempo real', 'Trânsitos e progressões', 'Mapa natal ilimitado', 'Viagem no tempo irrestrita', 'Asteroides e pontos árabes', 'Calendário lunar e estações'].map((text, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center flex-shrink-0"
                             style={{ width: '18px', height: '18px', borderRadius: '50%', border: `1px solid ${DS.action}35` }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={DS.action} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className="font-sans" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>{text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mb-5">
                    <div style={{ flex: 1, height: '1px', background: `rgba(212,175,55,0.12)` }} />
                    <p className="font-sans font-medium uppercase tracking-[0.2em] flex-shrink-0" style={{ fontSize: '12px', color: `${DS.gold}50`, margin: 0 }}>Exclusivo Fundador</p>
                    <div style={{ flex: 1, height: '1px', background: `rgba(212,175,55,0.12)` }} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {['Configuração e personalização', 'Co-criação do PDF profissional', 'Comunidade de Fundadores', 'Voto nas próximas funcionalidades', 'Acesso antecipado a recursos beta', 'Insígnia de Fundador no perfil'].map((text, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.09-1.01L12 2z" fill={`${DS.gold}25`} stroke={`${DS.gold}80`} strokeWidth="1.2" />
                        </svg>
                        <span className="font-sans" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bloco 3 — CTA */}
                <div style={{ padding: '2rem 2.5rem' }}>
                  <button onClick={() => setShowLeadCheckout(true)}
                          className="w-full flex items-center justify-center gap-2.5 font-mono uppercase tracking-[0.16em] transition-all hover:opacity-90 active:scale-[0.98]"
                          style={{ background: DS.gold, color: '#000', border: 'none', borderRadius: '6px', padding: '18px', fontSize: '12px', cursor: 'pointer' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.09-1.01L12 2z" fill="#000" stroke="#000" strokeWidth="1" />
                    </svg>
                    Garantir minha cota de Fundador
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-3 my-3">
                    <div style={{ flex: 1, height: '1px', background: DS.borderSubtle }} />
                    <span className="font-sans uppercase tracking-[0.14em]" style={{ fontSize: '12px', color: DS.gray3 }}>ou</span>
                    <div style={{ flex: 1, height: '1px', background: DS.borderSubtle }} />
                  </div>
                  <button onClick={handleRegister}
                          className="w-full flex items-center justify-center gap-2 font-sans font-medium uppercase tracking-[0.14em] transition-all hover:bg-white/5 active:scale-[0.98]"
                          style={{ background: 'transparent', color: 'rgba(255,255,255,0.65)', border: `1px solid ${DS.borderActive}`, borderRadius: '6px', padding: '15px', fontSize: '12px', cursor: 'pointer' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    Explorar grátis por 10 minutos — sem cadastro
                  </button>
                  <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
                    {['Pix ou cartão em até 12x', 'Nu Checkout', 'Acesso em até 2h'].map((t, i, a) => (
                      <React.Fragment key={t}>
                        <span className="font-sans" style={{ fontSize: '12px', color: DS.gray3 }}>{t}</span>
                        {i < a.length - 1 && <span style={{ color: DS.ghost }}>·</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div variants={sItem} className="flex items-center justify-center gap-2 mt-6">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: DS.mars }} />
                <p className="font-sans font-medium uppercase tracking-[0.1em]"
                   style={{ fontSize: '12px', color: `${DS.mars}90`, margin: 0 }}>
                  Oferta encerra quando as cotas forem preenchidas
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            SPECS TÉCNICAS
        ══════════════════════════════════════════════════════ */}
        <section ref={specsRef} className="w-full max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20 py-24"
                 style={{ borderTop: `1px solid ${DS.borderSubtle}` }}>
          <motion.div initial="hidden" animate={specsIn ? 'visible' : 'hidden'} variants={stagger}>
            <motion.div variants={sItem} className="mb-14 text-center">
              <SectionTag>Construído para profissionais</SectionTag>
              <SectionTitle>As escolhas técnicas<br />por trás do produto</SectionTitle>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
              {[
                { Icon: Shield, accent: DS.jupiter, title: 'Swiss Ephemeris',     desc: 'Biblioteca de efemérides utilizada como padrão por softwares profissionais de astrologia em todo o mundo. Precisão de grau e minuto para todos os corpos celestes.' },
                { Icon: Clock,  accent: DS.uranus,  title: 'Cálculo em tempo real',desc: 'Posições planetárias recalculadas continuamente, não pré-computadas e armazenadas. O que você vê é o estado exato do céu no momento atual.' },
                { Icon: Layers, accent: DS.gold,    title: 'Sistemas múltiplos',   desc: 'Placidus, Koch, Whole Sign, Porphyry, Equal, Campanus e outros. O método é seu. A ferramenta se adapta.' },
                { Icon: Globe,  accent: DS.neptune, title: 'Qualquer localização', desc: 'Cálculo preciso para qualquer coordenada geográfica do planeta, com ajuste de horário de verão histórico e fusos personalizados.' },
                { Icon: Zap,    accent: DS.uranus,  title: 'Sem instalação',       desc: 'Aplicação web progressiva, funciona em qualquer dispositivo moderno com acesso à internet. Nenhuma licença por máquina, nenhum download.' },
                { Icon: Monitor,accent: DS.jupiter, title: 'Desenvolvido no Brasil',desc: 'Suporte, documentação e roadmap em português. Uma equipe que conhece a prática astrológica e o astrólogo brasileiro.' },
              ].map(({ Icon, accent, title, desc }, i) => (
                <motion.div key={i} variants={sItem}
                            className="flex gap-4 p-6 transition-colors duration-300"
                            style={{ background: DS.surface1, border: `1px solid ${DS.borderSubtle}`, borderRadius: DS.rMd }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = DS.surface2)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = DS.surface1)}>
                  <div className="w-9 h-9 flex items-center justify-center shrink-0 mt-0.5"
                       style={{ background: `${accent}10`, border: `1px solid ${accent}20`, borderRadius: DS.rSm }}>
                    <Icon className="w-4 h-4" strokeWidth={1.5} style={{ color: accent }} />
                  </div>
                  <div>
                    <HCard className="mb-1.5" style={{ fontSize: '14px' }}>{title}</HCard>
                    <BodySm>{desc}</BodySm>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════════════════ */}
        <section ref={faqRef} className="w-full max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20 pb-24"
                 style={{ borderTop: `1px solid ${DS.borderSubtle}`, paddingTop: '0' }}>
          <motion.div initial="hidden" animate={faqIn ? 'visible' : 'hidden'} variants={stagger}>
            <motion.div variants={sItem} className="grid grid-cols-1 lg:grid-cols-[1fr_580px] gap-16 items-start pt-24">
              <div className="lg:sticky lg:top-24">
                <SectionTag>Dúvidas frequentes</SectionTag>
                <SectionTitle className="mb-5">Perguntas<br />que importam</SectionTitle>
                <BodyLg>Respondemos as dúvidas mais frequentes entre astrólogos avaliando uma mudança de ferramenta.</BodyLg>
              </div>
              <motion.div variants={sItem} className="flex flex-col gap-3">
                {faqData.map((item, i) => <FaqItem key={i} question={item.q} answer={item.a} />)}
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            CTA FINAL
        ══════════════════════════════════════════════════════ */}
        <section className="w-full relative overflow-hidden" style={{ borderTop: `1px solid ${DS.borderSubtle}` }}>
          {/* Glow fundo — Netuno */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: `radial-gradient(ellipse at 50% 50%, ${DS.neptune}06 0%, transparent 70%)` }} />

          <div className="w-full max-w-[1280px] mx-auto px-6 py-16 md:py-32 flex flex-col items-center text-center relative z-10">

            <motion.p initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                      className="font-sans font-medium uppercase tracking-[0.22em] mb-5"
                      style={{ fontSize: '12px', color: DS.gray3 }}>
              Fase Inaugural
            </motion.p>

            {/* Separador espectral */}
            <motion.div initial={{ opacity: 0, scaleX: 0 }} whileInView={{ opacity: 1, scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-8" style={{ width: '120px', height: '1px', background: DS.spectral, opacity: 0.5 }} />

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.7, ease: EASE }}
              className="font-display mb-6"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', color: DS.cream, lineHeight: 1.12, maxWidth: '640px', fontStyle: 'italic', fontWeight: 500 }}
            >
              Construído para quem estuda o céu com seriedade.
            </motion.h2>

            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.6 }}
                      className="font-sans font-normal leading-relaxed mb-8"
                      style={{ fontSize: 'clamp(14px, 4vw, 15px)', color: DS.gray1, maxWidth: '400px' }}>
              <span style={{ color: DS.cream, fontWeight: 500 }}>Acesso vitalício. Um pagamento único.</span>{' '}
              Quem entra agora co-cria o produto e nunca mais paga.
            </motion.p>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.38, duration: 0.6 }}
                        className="flex items-center gap-2 mb-10"
                        style={{ padding: '8px 16px', borderRadius: '999px', border: `1px solid ${DS.mars}28`, background: `${DS.mars}06`, whiteSpace: 'nowrap' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: DS.mars }} />
              <span className="font-sans font-medium uppercase tracking-[0.12em]" style={{ fontSize: '12px', color: `${DS.mars}90` }}>
                Vagas limitadas · encerra sem aviso prévio
              </span>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.45, duration: 0.6, ease: EASE }}
                        className="flex flex-col items-center gap-3 w-full" style={{ maxWidth: '360px' }}>
              <BtnPrimary onClick={() => setShowLeadCheckout(true)} className="w-full justify-center">
                Garantir cota de Fundador <ArrowRight className="w-4 h-4" />
              </BtnPrimary>
              <BtnGhost onClick={handleRegister} className="w-full">
                Explorar gratuitamente
              </BtnGhost>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6, duration: 0.6 }}
                      className="font-sans tracking-wide mt-6 text-center"
                      style={{ fontSize: '12px', color: DS.ghost, lineHeight: 1.8 }}>
              Pix ou cartão · Nu Checkout · Acesso em até 2h
            </motion.p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="w-full py-14 px-6 md:px-12"
                style={{ background: 'rgba(0,0,0,0.35)', borderTop: `1px solid ${DS.borderSubtle}` }}>
          {/* Separador espectral no topo do footer */}
          <div style={{ height: '1px', background: DS.spectral, opacity: 0.2, marginBottom: '40px' }} />
          <div className="max-w-[1280px] mx-auto">
            <p className="text-center font-display italic mb-10" style={{ fontSize: '18px', color: `${DS.cream}12` }}>
              O céu se move. Você também pode.
            </p>
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <img src="/logo.svg" alt="Cronógrafo Sideral" className="h-[32px] w-auto object-contain"
                   onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <div className="flex gap-8 font-sans tracking-wide" style={{ fontSize: '12px' }}>
                {['Termos de Uso', 'Privacidade', 'Contato'].map(l => (
                  <a key={l} href="#" className="transition-colors" style={{ color: DS.gray3 }}
                     onMouseEnter={(e) => (e.currentTarget.style.color = DS.cream)}
                     onMouseLeave={(e) => (e.currentTarget.style.color = DS.gray3)}>{l}</a>
                ))}
              </div>
              <div className="font-sans text-center md:text-right" style={{ fontSize: '12px', color: DS.gray3 }}>
                <p>&copy; {new Date().getFullYear()} Cronógrafo Sideral. Todos os direitos reservados.</p>
                <p className="mt-1">Criado por Rafael C. Medeiros</p>
              </div>
            </div>
          </div>
        </footer>

        <LeadCheckoutModal isOpen={showLeadCheckout} onClose={() => setShowLeadCheckout(false)} />
      </div>
    </div>
  );
};