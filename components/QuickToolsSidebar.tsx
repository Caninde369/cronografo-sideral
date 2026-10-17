import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SizeControlContent } from './SizeControlPopover';
import { ExportPDFButton } from './ExportPDFButton';

export type PointerHeadTail = 'arrow' | 'circle' | 'square' | 'none';

export interface QuickToolsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  theme: 'dark' | 'light';

  // Actions from topbar
  onOpenAccount?: () => void;
  isAdmin?: boolean;
  onOpenAdminDashboard?: () => void;
  onSave?: () => void;
  exportData?: any;
  onOpenSettings?: () => void;
  isOptionsRailOpen?: boolean;

  // Configurações Globais / Opções
  isHeliocentricMode?: boolean;
  setIsHeliocentricMode?: (v: boolean) => void;
  showEnergyChart?: boolean;
  setShowEnergyChart?: (v: boolean) => void;
  zodiacColorMode?: 'elements' | 'modalities' | 'polarities' | 'neutral';
  setZodiacColorMode?: (v: any) => void;
  zodiacSystem?: 'tropical' | 'sidereal';
  setZodiacSystem?: (v: any) => void;
  onResetAllLayouts?: () => void;

  // Atmosfera
  showAtmosphere: boolean;
  onToggleAtmosphere: () => void;

  // Agulha (Ponteiro)
  pointerEnabled: boolean;
  setPointerEnabled: (v: boolean) => void;
  pointerStyle: 'solid' | 'dashed' | 'minimal';
  setPointerStyle: (v: 'solid' | 'dashed' | 'minimal') => void;
  pointerThickness: number;
  setPointerThickness: (v: number) => void;
  pointerOpacity: number;
  setPointerOpacity: (v: number) => void;
  pointerHead: PointerHeadTail;
  setPointerHead: (v: PointerHeadTail) => void;
  pointerTail: PointerHeadTail;
  setPointerTail: (v: PointerHeadTail) => void;
  pointerShowGradLine: boolean;
  setPointerShowGradLine: (v: boolean) => void;
  pointerFull: boolean;
  setPointerFull: (v: boolean) => void;

  // Planetas & Órbitas
  showOrbits: boolean;
  setShowOrbits: (v: boolean) => void;
  allPlanetsSameOrbit: boolean;
  setAllPlanetsSameOrbit: (v: boolean) => void;
  showPlanetSpheres?: boolean;
  setShowPlanetSpheres?: (v: boolean) => void;
  planetColorMode?: 'colored' | 'gold';
  setPlanetColorMode?: (v: 'colored' | 'gold') => void;

  // Mapa Natal
  natalTime?: Date | null;
  onSetNatalTime?: (d: Date) => void;
  onClearNatal?: () => void;
  onOpenNatal?: () => void;
  showNatalLines?: boolean;
  setShowNatalLines?: (v: boolean) => void;
  natalColorMode?: 'gold' | 'colored';
  setNatalColorMode?: (v: 'gold' | 'colored') => void;

  // Casas
  showHouseLines: boolean;
  setShowHouseLines: (v: boolean) => void;
  showHouseMarkers: boolean;
  setShowHouseMarkers: (v: boolean) => void;
  houseLineThickness: number;
  setHouseLineThickness: (v: number) => void;
  houseLineOpacity: number;
  setHouseLineOpacity: (v: number) => void;
  houseLineColor?: string;
  setHouseLineColor?: (v: string) => void;
  mainHouseLineThickness?: number;
  setMainHouseLineThickness?: (v: number) => void;
  mainHouseLineOpacity?: number;
  setMainHouseLineOpacity?: (v: number) => void;
  mainHouseLineColor?: string;
  setMainHouseLineColor?: (v: string) => void;
  houseMarkerRingColor?: string;
  setHouseMarkerRingColor?: (v: string) => void;
  houseMarkerRingOpacity?: number;
  setHouseMarkerRingOpacity?: (v: number) => void;
  houseFormat: 'arabic' | 'roman';
  setHouseFormat: (v: 'arabic' | 'roman') => void;
  houseLineFormat: 'solid' | 'dashed';
  setHouseLineFormat: (v: 'solid' | 'dashed') => void;

  // Aspectos
  showAspectLines: boolean;
  setShowAspectLines: (v: boolean) => void;
  aspectSettings: any;
  setAspectSettings: (v: any) => void;
  visibleSecondaryAspects: Record<string, boolean>;
  setVisibleSecondaryAspects: (v: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;

  // Graus
  showDegreeLabels?: boolean;
  setShowDegreeLabels?: (v: boolean) => void;
  degreeLabelSize?: number;
  setDegreeLabelSize?: (v: number) => void;
  degreeLabelPosition?: 'responsive' | 'static' | 'staggered';
  setDegreeLabelPosition?: (v: 'responsive' | 'static' | 'staggered') => void;
  degreeLabelFormat?: 'vertical' | 'horizontal';
  setDegreeLabelFormat?: (v: 'vertical' | 'horizontal') => void;

  // Avançado
  showDecanRing?: boolean;
  setShowDecanRing?: (v: boolean) => void;
  showTermsRing?: boolean;
  setShowTermsRing?: (v: boolean) => void;
  showSeasonsRing?: boolean;
  setShowSeasonsRing?: (v: boolean) => void;
  showTimeRing?: boolean;
  setShowTimeRing?: (v: boolean) => void;
  timeRingScale?: number;
  setTimeRingScale?: (v: number) => void;
  ringLineColor?: string;
  setRingLineColor?: (v: string) => void;
  graduationRingWidth?: number;
  setGraduationRingWidth?: (v: number) => void;
  zodiacRingScale?: number;
  setZodiacRingScale?: (v: number) => void;
  zodiacSignSize?: number;
  setZodiacSignSize?: (v: number) => void;
  seasonsRingScale?: number;
  setSeasonsRingScale?: (v: number) => void;
  decanRingScale?: number;
  setDecanRingScale?: (v: number) => void;
  decanGlyphSize?: number;
  setDecanGlyphSize?: (v: number) => void;
  termsRingScale?: number;
  setTermsRingScale?: (v: number) => void;
  termsGlyphSize?: number;
  setTermsGlyphSize?: (v: number) => void;
  uiScale?: number;
  setUiScale?: (v: number) => void;
  clockScale?: number;
  setClockScale?: (v: number) => void;
  leftPanelScale?: number;
  setLeftPanelScale?: (v: number) => void;
  rightPanelScale?: number;
  setRightPanelScale?: (v: number) => void;
  leftPanelWidth?: number;
  setLeftPanelWidth?: (v: number) => void;
  rightPanelWidth?: number;
  setRightPanelWidth?: (v: number) => void;
  // Céu Estrelado & Fundo
  showStars?: boolean;
  setShowStars?: (v: boolean) => void;
  showConstellations?: boolean;
  setShowConstellations?: (v: boolean) => void;
  starCount?: number;
  setStarCount?: (v: number) => void;
  starTwinkleIntensity?: number;
  setStarTwinkleIntensity?: (v: number) => void;
  starTwinkleSpeed?: number;
  setStarTwinkleSpeed?: (v: number) => void;
  starTwinkleMode?: 'natural' | 'calm' | 'vibrant' | 'subtle';
  setStarTwinkleMode?: (v: 'natural' | 'calm' | 'vibrant' | 'subtle') => void;
  starMeteors?: boolean;
  setStarMeteors?: (v: boolean) => void;
  starMeteorFrequency?: 'none' | 'rare' | 'moderate' | 'frequent';
  setStarMeteorFrequency?: (v: 'none' | 'rare' | 'moderate' | 'frequent') => void;
  starNebulaGlow?: boolean;
  setStarNebulaGlow?: (v: boolean) => void;
  starBrightness?: number;
  setStarBrightness?: (v: number) => void;

  clockPlanetSize?: number;
  setClockPlanetSize?: (v: number) => void;
  setTheme?: (v: 'dark' | 'light') => void;
  onOpenPaymentPlans?: () => void;
  isFreeTier?: boolean;
  visiblePlanets?: Record<string, boolean>;
  onVisibilityChange?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const ALL_ASPECTS = [
  { key: 'conjunction',      label: 'Conjunção',       sym: '☌', color: '#a0ffa0', primary: true },
  { key: 'opposition',       label: 'Oposição',        sym: '☍', color: '#ff8080', primary: true },
  { key: 'trine',            label: 'Trígono',         sym: '△', color: '#a0c4ff', primary: true },
  { key: 'square',           label: 'Quadratura',      sym: '☐', color: '#ffcc44', primary: true },
  { key: 'sextile',          label: 'Sextil',          sym: '✶', color: '#c0c0c0', primary: true },
  { key: 'quincunx',         label: 'Quincúncio',      sym: '⚻', color: '#b0a4ff', primary: false },
  { key: 'semisextile',      label: 'Semissextil',     sym: '⚺', color: '#aaddaa', primary: false },
  { key: 'semisquare',       label: 'Semiquadratura',  sym: '∠', color: '#ffddaa', primary: false },
  { key: 'sesquiquadrate',   label: 'Sesquiquadratura',sym: '⊾', color: '#ffaa88', primary: false },
  { key: 'quintile',         label: 'Quintil',         sym: 'Q', color: '#d4aaff', primary: false },
  { key: 'biquintile',       label: 'Biquintil',       sym: 'bQ', color: '#c4aaff', primary: false },
  { key: 'parallel',         label: 'Paralelo',        sym: '∥', color: '#88bbff', primary: false },
  { key: 'contraparallel',   label: 'Contraparalelo',  sym: '∦', color: '#88bbff', primary: false },
];

const Toggle: React.FC<{ 
  on: boolean; 
  onToggle: () => void; 
  isLight?: boolean;
  activeColor?: string;
}> = ({ on, onToggle, isLight, activeColor = 'bg-amber-500' }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    aria-pressed={on}
    className={`relative w-[34px] h-[19px] rounded-full flex-shrink-0 border transition-colors duration-200 cursor-pointer ${
      on
        ? 'bg-[rgba(212,175,55,0.28)] border-[rgba(212,175,55,0.6)]'
        : (isLight ? 'bg-black/[0.06] border-black/15' : 'bg-white/[0.06] border-white/20')
    }`}
  >
    <span className={`absolute top-[2px] w-[13px] h-[13px] rounded-full shadow-sm transition-all duration-200 ${
      on ? 'left-[17px] bg-[#F5D98A]' : (isLight ? 'left-[2px] bg-black/40' : 'left-[2px] bg-white/55')
    }`} />
  </button>
);

const FreeCustomizationLockBanner: React.FC<{ onOpenPaymentPlans?: () => void; isLight?: boolean }> = ({ onOpenPaymentPlans, isLight }) => (
  <div className="mb-2.5 p-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-between gap-2 shadow-sm font-sans">
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-amber-400 text-xs shrink-0">🔒</span>
      <span className="text-[10px] font-semibold text-amber-200 leading-tight">
        Personalização exclusiva nos Planos Mensal e Vitalício.
      </span>
    </div>
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onOpenPaymentPlans?.(); }}
      className="px-2 py-0.5 rounded-lg bg-amber-500 text-black font-bold text-[9.5px] hover:bg-amber-400 active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm"
    >
      Upgrade
    </button>
  </div>
);

const Stepper: React.FC<{
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  isLight?: boolean;
}> = ({ value, onChange, min, max, step, format, isLight }) => {
  return (
    <div className={`flex items-center rounded-[9px] overflow-hidden flex-shrink-0 border ${
      isLight ? 'bg-black/[0.04] border-black/15' : 'bg-white/[0.04] border-white/12'
    }`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onChange(Math.max(min, +(value - step).toFixed(2))); }}
        className={`w-6 h-[26px] flex items-center justify-center text-sm font-bold transition-colors cursor-pointer ${
          isLight ? 'text-black/50 hover:bg-black/10 hover:text-black' : 'text-white/40 hover:bg-white/10 hover:text-white/80'
        }`}
      >−</button>
      <span
        className={`text-[11px] min-w-[38px] text-center tabular-nums select-none leading-[26px] ${
          isLight ? 'text-[#3B2F14] bg-black/[0.05] border-x border-black/10' : 'text-[#F5F2EB] bg-black/25 border-x border-white/12'
        }`}
        style={{ fontFamily: "'DM Mono', ui-monospace, monospace" }}
      >
        {format(value)}
      </span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onChange(Math.min(max, +(value + step).toFixed(2))); }}
        className={`w-6 h-[26px] flex items-center justify-center text-sm font-bold transition-colors cursor-pointer ${
          isLight ? 'text-black/50 hover:bg-black/10 hover:text-black' : 'text-white/40 hover:bg-white/10 hover:text-white/80'
        }`}
      >+</button>
    </div>
  );
};

const SegSel: React.FC<{
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  isLight?: boolean;
}> = ({ options, value, onChange, isLight }) => (
  <div className={`flex rounded-[9px] p-0.5 gap-0.5 border ${
    isLight ? 'bg-black/[0.05] border-black/12' : 'bg-black/30 border-white/12'
  }`}>
    {options.map((opt) => (
      <button
        type="button"
        key={opt.value}
        onClick={(e) => { e.stopPropagation(); onChange(opt.value); }}
        className={`px-2 py-[5px] rounded-[7px] text-[10.5px] font-medium transition-all cursor-pointer whitespace-nowrap ${
          value === opt.value
            ? (isLight
                ? 'bg-white text-[#231714] shadow-sm font-semibold'
                : 'bg-gradient-to-b from-white/[0.13] to-white/[0.05] text-[#F5F2EB] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,.16),0_1px_3px_rgba(0,0,0,.5)]')
            : (isLight ? 'text-black/50 hover:text-black' : 'text-white/45 hover:text-white/85')
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const LineStyleSel: React.FC<{
  value: 'solid' | 'dashed';
  onChange: (v: 'solid' | 'dashed') => void;
  isLight?: boolean;
}> = ({ value, onChange, isLight }) => (
  <SegSel
    options={[
      { label: 'Sólida', value: 'solid' },
      { label: 'Tracejada', value: 'dashed' },
    ]}
    value={value}
    onChange={(v) => onChange(v as any)}
    isLight={isLight}
  />
);

const CtrlRow: React.FC<{ 
  label: string; 
  icon?: string;
  iconColor?: string;
  badge?: React.ReactNode;
  description?: string;
  children: React.ReactNode; 
  isLight?: boolean 
}> = ({ label, icon, iconColor, badge, description, children, isLight }) => (
  <div className={`flex items-center justify-between gap-3 py-1 px-2 min-h-[32px] rounded-xl transition-colors ${
    isLight ? 'hover:bg-black/[0.04]' : 'hover:bg-white/[0.04]'
  }`}>
    <div className="flex items-center gap-2 min-w-0 pr-2">
      {badge ? (
        <div className="flex-shrink-0">{badge}</div>
      ) : icon ? (
        <i className={`ti ${icon} text-sm flex-shrink-0 ${
          iconColor || (isLight ? 'text-amber-800/80 font-medium' : 'text-amber-400/90')
        }`} />
      ) : null}
      <div className="flex flex-col min-w-0">
        <span className={`text-[12px] font-normal leading-[1.3] truncate ${
          isLight ? 'text-[#231714]' : 'text-white/95'
        }`}>{label}</span>
        {/* Ajuda é subordinada escrita, não tooltip: o que precisa ser lido fica na tela. */}
        {description && (
          <span className={`text-[9.5px] leading-[1.35] mt-[1px] ${
            isLight ? 'text-neutral-600' : 'text-[#5B6478]'
          }`}>{description}</span>
        )}
      </div>
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

const SubSec: React.FC<{ 
  icon?: string; 
  badge?: React.ReactNode;
  color?: string; 
  children: React.ReactNode; 
  isLight?: boolean 
}> = ({ icon, badge, color, children, isLight }) => (
  <div
    className={`px-1.5 pt-3.5 pb-1.5 text-[9.5px] font-bold uppercase flex items-center gap-2 ${color || ''}`}
    style={color ? { letterSpacing: '.13em' } : { letterSpacing: '.13em', color: isLight ? '#8a6d1f' : '#D4AF37', opacity: .92 }}
  >
    {badge ? badge : icon ? <i className={`ti ${icon} text-xs`} /> : null}
    <span className="flex-shrink-0">{children}</span>
    {/* Filete: dá a linha de base horizontal que falta numa lista de controles. */}
    <span
      className="flex-1 h-px"
      style={{ background: `linear-gradient(90deg, ${isLight ? 'rgba(138,109,31,.28)' : 'rgba(212,175,55,.28)'}, transparent)` }}
    />
  </div>
);

const OptionCard: React.FC<{ 
  children: React.ReactNode; 
  isLight?: boolean; 
  className?: string;
  accentBorder?: string;
}> = ({ children, isLight, className = '', accentBorder }) => (
  <div className={`rounded-xl p-1.5 flex flex-col gap-0.5 border transition-all ${
    accentBorder
      ? accentBorder
      : (isLight 
          ? 'bg-black/[0.02] border-black/10 hover:border-black/20' 
          : 'bg-white/[0.02] border-white/10 hover:border-white/20')
  } ${className}`}>
    {children}
  </div>
);

const SDivider: React.FC<{ isLight?: boolean }> = ({ isLight }) => (
  <div className={`my-1.5 border-b ${isLight ? 'border-black/10' : 'border-white/10'}`} />
);

export const QuickToolsSidebar: React.FC<QuickToolsSidebarProps> = (props) => {
  const isLight = props.theme === 'light';
  const isFreeTier = !!props.isFreeTier;
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Local state for Natal Date inputs inside the quick tools sidebar
  const [natalDay, setNatalDay] = useState('');
  const [natalMonth, setNatalMonth] = useState('');
  const [natalYear, setNatalYear] = useState('');
  const [natalHour, setNatalHour] = useState('');
  const [natalMinute, setNatalMinute] = useState('');
  const [continuousNatalInput, setContinuousNatalInput] = useState('');
  const [natalError, setNatalError] = useState<string | null>(null);

  const formatQuickNatalString = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 12);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    if (digits.length <= 10) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)} às ${digits.slice(8)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)} às ${digits.slice(8, 10)}:${digits.slice(10, 12)}`;
  };

  // Sync inputs when props.natalTime changes
  useEffect(() => {
    if (props.natalTime && !isNaN(props.natalTime.getTime())) {
      const d = props.natalTime;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = String(d.getFullYear());
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      setNatalDay(String(d.getDate()));
      setNatalMonth(String(d.getMonth() + 1));
      setNatalYear(yyyy);
      setNatalHour(hh);
      setNatalMinute(min);
      setContinuousNatalInput(`${dd}/${mm}/${yyyy} às ${hh}:${min}`);
    } else {
      setNatalDay('');
      setNatalMonth('');
      setNatalYear('');
      setNatalHour('');
      setNatalMinute('');
      setContinuousNatalInput('');
    }
  }, [props.natalTime]);

  const handleApplyNatalDate = () => {
    setNatalError(null);
    let d: number | null = null;
    let m: number | null = null;
    let y: number | null = null;
    let h: number = 0;
    let min: number = 0;

    const raw = continuousNatalInput.trim();
    const digitsOnly = raw.replace(/\D/g, '');

    if (digitsOnly.length >= 8) {
      d = parseInt(digitsOnly.substring(0, 2), 10);
      m = parseInt(digitsOnly.substring(2, 4), 10);
      y = parseInt(digitsOnly.substring(4, 8), 10);
      if (digitsOnly.length >= 10) {
        h = parseInt(digitsOnly.substring(8, 10), 10);
      }
      if (digitsOnly.length >= 12) {
        min = parseInt(digitsOnly.substring(10, 12), 10);
      }
    } else {
      const parsedD = parseInt(natalDay, 10);
      const parsedM = parseInt(natalMonth, 10);
      const parsedY = parseInt(natalYear, 10);
      const parsedH = natalHour ? parseInt(natalHour, 10) : 0;
      const parsedMin = natalMinute ? parseInt(natalMinute, 10) : 0;

      if (!isNaN(parsedD) && !isNaN(parsedM) && !isNaN(parsedY)) {
        d = parsedD;
        m = parsedM;
        y = parsedY;
        h = isNaN(parsedH) ? 0 : parsedH;
        min = isNaN(parsedMin) ? 0 : parsedMin;
      }
    }

    if (d === null || m === null || y === null || isNaN(d) || isNaN(m) || isNaN(y)) {
      setNatalError('Informe ao menos Dia, Mês e Ano válidos.');
      return;
    }

    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1 || y > 3000 || h < 0 || h > 23 || min < 0 || min > 59) {
      setNatalError('Valores de data ou hora inválidos.');
      return;
    }

    const calculatedDate = new Date(y, m - 1, d, h, min, 0);
    if (isNaN(calculatedDate.getTime())) {
      setNatalError('Data inválida.');
      return;
    }

    props.onSetNatalTime?.(calculatedDate);
    setOpenPopover(null);
  };

  const togglePopover = (key: string) => {
    setOpenPopover(prev => (prev === key ? null : key));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenPopover(null);
      }
    };
    window.addEventListener('pointerdown', handleClickOutside);
    return () => window.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const isAdvancedOn = !!(props.showDecanRing || props.showTermsRing || props.showSeasonsRing || props.showTimeRing);

  return (
    <>
      {/* Botão Flutuante Permanente para Expandir Sidebar quando recolhida (Sempre visível no topo direito) */}
      {!props.isOpen && (
        <button
          onClick={props.onToggle}
          className={`fixed top-3 sm:top-3.5 right-2 z-[9995] w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-xl border active:scale-95 transition-all select-none ${
            isLight
              ? 'bg-white/95 text-neutral-900 border-[#8b8370]/30 shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:bg-white'
              : 'bg-[#06060a]/90 text-amber-400 border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:bg-[#12101e]'
          }`}
          title="Expandir barra de ferramentas"
        >
          <i className="ti ti-layout-sidebar-right-expand text-base" />
        </button>
      )}

      <motion.aside
        ref={containerRef}
        initial={false}
        animate={{
          x: props.isOpen ? 0 : 56,
          opacity: props.isOpen ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        style={{ pointerEvents: props.isOpen ? 'auto' : 'none' }}
        className={`${props.isOpen ? 'w-14' : 'w-0 !p-0 !border-l-0'} shrink-0 flex flex-col items-center justify-between py-2.5 px-1.5 z-[9990] border-l select-none relative overflow-visible ${
          isLight
            ? 'bg-[#f4f1ea]/95 border-[#8b8370]/20 text-[#231714] shadow-[-4px_0_15px_rgba(0,0,0,0.04)] backdrop-blur-xl'
            : 'bg-[#06060a]/85 border-white/10 text-white shadow-[-4px_0_20px_rgba(0,0,0,0.6)] backdrop-blur-2xl'
        }`}
      >
          {/* Top Section: Collapse button, Perfil & Pesquisar Data (+) */}
          <div className="flex flex-col items-center gap-2 w-full">
            {/* 0. Botão de Recolher Barra Lateral */}
            <div className="flex items-center justify-center w-full pb-1 border-b border-black/10 dark:border-white/10">
              <button
                onClick={props.onToggle}
                className={`w-8 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer active:scale-95 ${
                  isLight ? 'text-neutral-500 hover:bg-black/[0.08] hover:text-black' : 'text-white/50 hover:bg-white/[0.1] hover:text-white'
                }`}
                title="Recolher barra lateral"
              >
                <i className="ti ti-chevron-right text-base" />
              </button>
            </div>

            {/* 1. Perfil (Topo da Sidebar) */}
            <div className="group relative flex items-center justify-center">
              <div className="absolute right-full mr-2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out z-50">
                <div className={`px-2.5 h-7 flex items-center rounded-xl backdrop-blur-xl text-xs font-semibold whitespace-nowrap shadow-xl border ${
                  isLight ? 'bg-white/95 text-neutral-900 border-black/15' : 'bg-[#06060a]/95 text-white border-white/20'
                }`}>
                  Perfil / Conta
                </div>
              </div>
              <button
                onClick={() => props.onOpenAccount?.()}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                  isLight
                    ? 'text-neutral-700 hover:text-black hover:bg-black/[0.08]'
                    : 'text-white/80 hover:text-white hover:bg-white/[0.1]'
                }`}
                title="Perfil / Conta"
              >
                <i className="ti ti-user text-base" />
              </button>
            </div>

            {/* 2. Pesquisar Data / Mapa Natal (Botão Dourado com +) */}
            <div className="group relative flex items-center justify-center">
              <div className="absolute right-full mr-2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out z-50">
                <div className={`px-2.5 h-7 flex items-center rounded-xl backdrop-blur-xl text-xs font-semibold whitespace-nowrap shadow-xl border ${
                  isLight ? 'bg-white/95 text-neutral-900 border-black/15' : 'bg-[#06060a]/95 text-white border-white/20'
                }`}>
                  Pesquisar Data / Mapa Natal {props.natalTime ? '✓' : ''}
                </div>
              </div>
              <button
                onClick={() => togglePopover('natal')}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                  props.natalTime || openPopover === 'natal'
                    ? (isLight
                        ? 'bg-amber-500/25 border border-amber-600/50 text-amber-900 shadow-[0_2px_10px_rgba(217,119,6,0.3)]'
                        : 'bg-amber-400/20 border border-amber-400/50 text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.4)]')
                    : (isLight
                        ? 'bg-amber-500/15 border border-amber-600/40 text-amber-800 hover:bg-amber-500/25'
                        : 'bg-amber-400/15 border border-amber-400/30 text-amber-300 hover:bg-amber-400/25')
                }`}
                title="Pesquisar Data / Mapa Natal"
              >
                <i className="ti ti-plus text-base font-bold" />
              </button>

              {/* Popover Pesquisar Data / Mapa Natal */}
              {openPopover === 'natal' && (
                <div
                  data-no-drag="true"
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute top-0 right-full mr-3 w-80 sm:w-[340px] max-h-[calc(100vh-2rem)] rounded-[14px] p-3 pb-5 shadow-[0_20px_56px_rgba(0,0,0,.85),inset_0_1px_1px_rgba(255,255,255,.2)] z-[60] border backdrop-blur-[20px] overflow-y-auto overscroll-contain custom-scrollbar font-sans ${
                    isLight ? 'bg-white/95 border-black/15 text-[#231714]' : 'bg-[#06060a]/[0.975] border-white/20 text-white'
                  }`}
                >
                  <div className="px-1 py-1 border-b border-emerald-500/20 mb-2 flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <i className="ti ti-calendar-time text-sm font-bold" />
                      <span className="ds-pop-title">Pesquisar Data / Mapa Natal</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenPopover(null)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-black/10 text-neutral-600 hover:text-black' : 'hover:bg-white/10 text-white/60 hover:text-white'
                      }`}
                      title="Fechar"
                    >
                      <i className="ti ti-x text-xs" />
                    </button>
                  </div>

                  {/* Status Banner */}
                  <div className={`p-2 rounded-xl mb-2.5 border text-xs flex items-center justify-between ${
                    props.natalTime
                      ? (isLight ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900' : 'bg-emerald-400/10 border-emerald-400/30 text-emerald-200')
                      : (isLight ? 'bg-black/5 border-black/10 text-neutral-600' : 'bg-white/5 border-white/10 text-neutral-400')
                  }`}>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                        {props.natalTime ? 'Mapa Natal Ativo' : 'Nenhum Mapa Ativo'}
                      </div>
                      <div className="font-mono font-semibold text-xs mt-0.5">
                        {props.natalTime
                          ? `${String(props.natalTime.getDate()).padStart(2, '0')}/${String(props.natalTime.getMonth() + 1).padStart(2, '0')}/${props.natalTime.getFullYear()} às ${String(props.natalTime.getHours()).padStart(2, '0')}:${String(props.natalTime.getMinutes()).padStart(2, '0')}`
                          : 'Digite a data para calcular'}
                      </div>
                    </div>
                    {props.natalTime && props.onClearNatal && (
                      <button
                        type="button"
                        onClick={() => {
                          props.onClearNatal?.();
                          setContinuousNatalInput('');
                        }}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all cursor-pointer"
                        title="Remover Mapa Natal"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Digitação Rápida Contínua */}
                  <div className="flex flex-col gap-1 mb-2.5">
                    <div className="flex justify-between items-center px-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-black/60' : 'text-white/60'}`}>
                        Digitação Rápida (DDMMAAAAHHMM)
                      </span>
                      <span className="text-[9px] opacity-50 font-mono">Ex: 291119980805</span>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="29/11/1998 às 08:05"
                        value={continuousNatalInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          const formatted = formatQuickNatalString(val);
                          setContinuousNatalInput(formatted);
                          const digits = val.replace(/\D/g, '');
                          if (digits.length >= 2) setNatalDay(digits.substring(0, 2));
                          if (digits.length >= 4) setNatalMonth(digits.substring(2, 4));
                          if (digits.length >= 8) setNatalYear(digits.substring(4, 8));
                          if (digits.length >= 10) setNatalHour(digits.substring(8, 10));
                          if (digits.length >= 12) setNatalMinute(digits.substring(10, 12));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleApplyNatalDate();
                        }}
                        className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono outline-none ${
                          isLight
                            ? 'bg-black/5 border-black/15 text-black focus:border-emerald-500'
                            : 'bg-white/10 border-white/20 text-white focus:border-emerald-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleApplyNatalDate}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 active:scale-95 transition-all cursor-pointer shadow-sm"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>

                  {/* Campos Individuais */}
                  <div className={`p-2 rounded-xl border mb-2.5 ${isLight ? 'bg-black/[0.02] border-black/10' : 'bg-white/[0.02] border-white/10'}`}>
                    <div className="text-[9px] uppercase font-bold tracking-wider opacity-60 mb-1.5 px-0.5">
                      Campos Individuais
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-center font-mono">
                      <div>
                        <span className="text-[8px] uppercase block opacity-60">Dia</span>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          placeholder="29"
                          value={natalDay}
                          onChange={(e) => setNatalDay(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleApplyNatalDate(); }}
                          className={`w-full px-1 py-1 rounded border text-xs text-center outline-none ${
                            isLight ? 'bg-black/5 border-black/15 text-black' : 'bg-white/10 border-white/20 text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-[8px] uppercase block opacity-60">Mês</span>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          placeholder="11"
                          value={natalMonth}
                          onChange={(e) => setNatalMonth(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleApplyNatalDate(); }}
                          className={`w-full px-1 py-1 rounded border text-xs text-center outline-none ${
                            isLight ? 'bg-black/5 border-black/15 text-black' : 'bg-white/10 border-white/20 text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-[8px] uppercase block opacity-60">Ano</span>
                        <input
                          type="number"
                          placeholder="1998"
                          value={natalYear}
                          onChange={(e) => setNatalYear(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleApplyNatalDate(); }}
                          className={`w-full px-1 py-1 rounded border text-xs text-center outline-none ${
                            isLight ? 'bg-black/5 border-black/15 text-black' : 'bg-white/10 border-white/20 text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-[8px] uppercase block opacity-60">Hora</span>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          placeholder="08"
                          value={natalHour}
                          onChange={(e) => setNatalHour(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleApplyNatalDate(); }}
                          className={`w-full px-1 py-1 rounded border text-xs text-center outline-none ${
                            isLight ? 'bg-black/5 border-black/15 text-black' : 'bg-white/10 border-white/20 text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-[8px] uppercase block opacity-60">Min</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          placeholder="05"
                          value={natalMinute}
                          onChange={(e) => setNatalMinute(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleApplyNatalDate(); }}
                          className={`w-full px-1 py-1 rounded border text-xs text-center outline-none ${
                            isLight ? 'bg-black/5 border-black/15 text-black' : 'bg-white/10 border-white/20 text-white'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Controles de Visualização Natal */}
                  <OptionCard isLight={isLight}>
                    <CtrlRow label="Exibir Linhas Natais" icon="ti-chart-line" iconColor="text-emerald-400" isLight={isLight}>
                      <Toggle on={!!props.showNatalLines} onToggle={() => props.setShowNatalLines?.(!props.showNatalLines)} activeColor="bg-emerald-500" isLight={isLight} />
                    </CtrlRow>
                    <CtrlRow label="Cor dos Planetas Natais" icon="ti-palette" iconColor="text-teal-400" isLight={isLight}>
                      <SegSel
                        options={[
                          { label: 'Dourado', value: 'gold' },
                          { label: 'Colorido', value: 'colored' }
                        ]}
                        value={props.natalColorMode || 'gold'}
                        onChange={(v) => props.setNatalColorMode?.(v as 'gold' | 'colored')}
                        isLight={isLight}
                      />
                    </CtrlRow>
                  </OptionCard>

                  {/* Botão de Configuração Completa */}
                  {props.onOpenNatal && (
                    <div className="pt-2 mt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          props.onOpenNatal?.();
                          setOpenPopover(null);
                        }}
                        className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isLight
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 hover:bg-emerald-500/20'
                            : 'bg-emerald-400/10 border-emerald-400/30 text-emerald-200 hover:bg-emerald-400/20'
                        }`}
                      >
                        <i className="ti ti-adjustments-alt text-xs" />
                        Abrir Configuração Natal Completa
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={`w-6 border-b my-0.5 ${isLight ? 'border-black/10' : 'border-white/10'}`} />
          </div>

          {/* Middle Section: Quick Tools Icon Buttons */}
          <div className="flex flex-col items-center gap-2.5 w-full my-auto">
            {/* 1. Atmosfera */}
            <div className="group relative flex items-center justify-center">
              <div className="absolute right-full mr-2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out z-50">
                <div className={`px-2.5 h-7 flex items-center rounded-xl backdrop-blur-xl text-xs font-semibold whitespace-nowrap shadow-xl border ${
                  isLight ? 'bg-white/95 text-neutral-900 border-black/15' : 'bg-[#06060a]/95 text-white border-white/20'
                }`}>
                  Atmosfera
                </div>
              </div>
              <button
                onClick={props.onToggleAtmosphere}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                  props.showAtmosphere
                    ? (isLight
                        ? 'bg-sky-500/20 border border-sky-600/40 text-sky-900 shadow-[0_2px_8px_rgba(2,132,199,0.2)]'
                        : 'bg-sky-500/20 border border-sky-400/40 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.35)]')
                    : (isLight
                        ? 'text-neutral-600 hover:bg-black/[0.06] hover:text-neutral-900'
                        : 'text-white/60 hover:bg-white/[0.08] hover:text-white')
                }`}
                title="Alternar Atmosfera"
              >
                <i className="ti ti-cloud text-base" />
              </button>
            </div>

            {/* 2. Agulha */}
            <div className="group relative flex items-center justify-center">
              <div className="absolute right-full mr-2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out z-50">
                <div className={`px-2.5 h-7 flex items-center rounded-xl backdrop-blur-xl text-xs font-semibold whitespace-nowrap shadow-xl border ${
                  isLight ? 'bg-white/95 text-neutral-900 border-black/15' : 'bg-[#06060a]/95 text-white border-white/20'
                }`}>
                  Agulha (Clique para opções)
                </div>
              </div>
              <button
                onClick={() => togglePopover('agulha')}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                  props.pointerEnabled || openPopover === 'agulha'
                    ? (isLight
                        ? 'bg-amber-600/20 border border-amber-600/40 text-amber-900 shadow-[0_2px_8px_rgba(217,119,6,0.2)]'
                        : 'bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]')
                    : (isLight
                        ? 'text-neutral-600 hover:bg-black/[0.06] hover:text-neutral-900'
                        : 'text-white/60 hover:bg-white/[0.08] hover:text-white')
                }`}
                title="Agulha & Opções"
              >
                <i className="ti ti-pointer text-base" />
              </button>

              {/* Popover Agulha */}
              {openPopover === 'agulha' && (
                <div
                  data-no-drag="true"
                  onClick={(e) => e.stopPropagation()}
                  className={`fixed right-16 sm:right-20 top-1/2 -translate-y-1/2 max-h-[calc(100vh-2.5rem)] my-auto w-80 sm:w-[340px] rounded-[14px] p-3 pb-5 shadow-[0_20px_56px_rgba(0,0,0,.85),inset_0_1px_1px_rgba(255,255,255,.2)] z-[100] border backdrop-blur-[20px] overflow-y-auto overscroll-contain custom-scrollbar font-sans ${
                    isLight ? 'bg-white/95 border-black/15 text-neutral-900' : 'bg-[#06060a]/[0.975] border-white/20 text-white'
                  }`}
                >
                  <div className="px-1 py-1 border-b border-amber-500/20 mb-2 flex justify-between items-center">
                    <span className="ds-pop-title flex items-center gap-2 [&>i]:text-amber-400">
                      <i className="ti ti-pointer text-sm" />
                      Agulha Sideral
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenPopover(null)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-black/10 text-neutral-600 hover:text-black' : 'hover:bg-white/10 text-white/60 hover:text-white'
                      }`}
                      title="Fechar"
                    >
                      <i className="ti ti-x text-xs" />
                    </button>
                  </div>

                  {isFreeTier && (
                    <FreeCustomizationLockBanner onOpenPaymentPlans={props.onOpenPaymentPlans} isLight={isLight} />
                  )}

                  <OptionCard isLight={isLight}>
                    <CtrlRow label="Exibir Agulha" icon="ti-pointer" iconColor="text-amber-400" isLight={isLight}>
                      <Toggle on={props.pointerEnabled} onToggle={() => props.setPointerEnabled(!props.pointerEnabled)} activeColor="bg-amber-500" isLight={isLight} />
                    </CtrlRow>
                  </OptionCard>

                  <div className={isFreeTier ? 'opacity-40 pointer-events-none select-none' : ''}>
                    <OptionCard isLight={isLight}>
                      <CtrlRow label="Estilo de Linha" icon="ti-line" iconColor="text-amber-300" isLight={isLight}>
                        <LineStyleSel value={props.pointerStyle === 'dashed' ? 'dashed' : 'solid'} onChange={v => props.setPointerStyle(v)} isLight={isLight} />
                      </CtrlRow>
                      <CtrlRow label="Opacidade" icon="ti-eye" iconColor="text-amber-300" isLight={isLight}>
                        <Stepper value={Math.round(props.pointerOpacity * 100)} onChange={v => props.setPointerOpacity(v / 100)} min={0} max={100} step={5} format={v => `${v}%`} isLight={isLight} />
                      </CtrlRow>
                      <CtrlRow label="Espessura" icon="ti-border-width" iconColor="text-amber-300" isLight={isLight}>
                        <Stepper value={props.pointerThickness} onChange={props.setPointerThickness} min={1} max={5} step={0.5} format={v => `${v}px`} isLight={isLight} />
                      </CtrlRow>
                    </OptionCard>

                    <OptionCard isLight={isLight}>
                      <CtrlRow label="Modo Minimalista" icon="ti-sparkles" iconColor="text-yellow-400" isLight={isLight}>
                        <Toggle on={props.pointerShowGradLine} onToggle={() => props.setPointerShowGradLine(!props.pointerShowGradLine)} activeColor="bg-yellow-500" isLight={isLight} />
                      </CtrlRow>
                      <CtrlRow label="Ponteiro Completo" icon="ti-line-height" iconColor="text-yellow-400" isLight={isLight}>
                        <Toggle on={props.pointerFull} onToggle={() => props.setPointerFull(!props.pointerFull)} activeColor="bg-yellow-500" isLight={isLight} />
                      </CtrlRow>
                    </OptionCard>

                    <SubSec icon="ti-arrows-split" color="text-amber-400" isLight={isLight}>Pontas e Terminações</SubSec>
                    <OptionCard isLight={isLight}>
                      <CtrlRow label="Cabeça (Início)" icon="ti-arrow-up-right" iconColor="text-amber-400" isLight={isLight}>
                        <SegSel options={[{label:'Seta', value:'arrow'}, {label:'Círculo', value:'circle'}, {label:'Quadrado', value:'square'}, {label:'Off', value:'none'}]} value={props.pointerHead} onChange={v => props.setPointerHead(v as PointerHeadTail)} isLight={isLight} />
                      </CtrlRow>
                      <CtrlRow label="Cauda (Fim)" icon="ti-arrow-down-left" iconColor="text-amber-400" isLight={isLight}>
                        <SegSel options={[{label:'Seta', value:'arrow'}, {label:'Círculo', value:'circle'}, {label:'Quadrado', value:'square'}, {label:'Off', value:'none'}]} value={props.pointerTail} onChange={v => props.setPointerTail(v as PointerHeadTail)} isLight={isLight} />
                      </CtrlRow>
                    </OptionCard>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Planetas & Órbitas */}
            <div className="group relative flex items-center justify-center">
              <div className="absolute right-full mr-2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out z-50">
                <div className={`px-2.5 h-7 flex items-center rounded-xl backdrop-blur-xl text-xs font-semibold whitespace-nowrap shadow-xl border ${
                  isLight ? 'bg-white/95 text-neutral-900 border-black/15' : 'bg-[#06060a]/95 text-white border-white/20'
                }`}>
                  Planetas & Órbitas
                </div>
              </div>
              <button
                onClick={() => togglePopover('orbitas')}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                  !props.allPlanetsSameOrbit || props.showOrbits || props.planetColorMode === 'gold' || openPopover === 'orbitas'
                    ? (isLight
                        ? 'bg-indigo-600/20 border border-indigo-600/40 text-indigo-900 shadow-[0_2px_8px_rgba(79,70,229,0.2)]'
                        : 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.35)]')
                    : (isLight
                        ? 'text-neutral-600 hover:bg-black/[0.06] hover:text-neutral-900'
                        : 'text-white/60 hover:bg-white/[0.08] hover:text-white')
                }`}
                title="Planetas & Órbitas"
              >
                <i className="ti ti-planet text-base" />
              </button>

              {/* Popover Órbitas & Planetas */}
              {openPopover === 'orbitas' && (
                <div
                  data-no-drag="true"
                  onClick={(e) => e.stopPropagation()}
                  className={`fixed right-16 sm:right-20 top-1/2 -translate-y-1/2 max-h-[calc(100vh-2.5rem)] my-auto w-80 sm:w-[350px] rounded-[14px] p-3 pb-6 shadow-[0_20px_56px_rgba(0,0,0,.85),inset_0_1px_1px_rgba(255,255,255,.2)] z-[100] border backdrop-blur-[20px] overflow-y-auto overscroll-contain custom-scrollbar font-sans ${
                    isLight ? 'bg-white/95 border-black/15 text-[#231714]' : 'bg-[#06060a]/[0.975] border-white/20 text-white'
                  }`}
                >
                  <div className="px-1 py-1 border-b border-indigo-500/20 mb-2 flex justify-between items-center">
                    <span className="ds-pop-title flex items-center gap-2 [&>i]:text-indigo-400">
                      <i className="ti ti-planet text-sm" />
                      Planetas e Astros
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenPopover(null)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-black/10 text-neutral-600 hover:text-black' : 'hover:bg-white/10 text-white/60 hover:text-white'
                      }`}
                      title="Fechar"
                    >
                      <i className="ti ti-x text-xs" />
                    </button>
                  </div>

                  {isFreeTier && (
                    <FreeCustomizationLockBanner onOpenPaymentPlans={props.onOpenPaymentPlans} isLight={isLight} />
                  )}

                  <div className={isFreeTier ? 'opacity-40 pointer-events-none select-none' : ''}>
                    <SubSec icon="ti-adjustments" color="text-indigo-400" isLight={isLight}>Propriedades dos Astros</SubSec>
                    <OptionCard isLight={isLight}>
                      {props.showPlanetSpheres !== undefined && props.setShowPlanetSpheres && (
                        <CtrlRow 
                          label="Representação Visual" 
                          icon="ti-circle-dot" 
                          iconColor="text-indigo-400" 
                          isLight={isLight}
                        >
                          <SegSel
                            options={[
                              { label: 'Esferas 3D', value: 'spheres' },
                              { label: 'Glifos', value: 'glyphs' }
                            ]}
                            value={props.showPlanetSpheres ? 'spheres' : 'glyphs'}
                            onChange={(v) => props.setShowPlanetSpheres?.(v === 'spheres')}
                            isLight={isLight}
                          />
                        </CtrlRow>
                      )}

                      {props.clockPlanetSize !== undefined && props.setClockPlanetSize && (
                        <CtrlRow 
                          label="Tamanho dos Astros" 
                          icon="ti-viewport-wide" 
                          iconColor="text-indigo-300" 
                          isLight={isLight}
                        >
                          <Stepper 
                            value={props.clockPlanetSize} 
                            onChange={v => props.setClockPlanetSize?.(v)} 
                            min={18} 
                            max={70} 
                            step={2} 
                            format={v => `${v}px`} 
                            isLight={isLight} 
                          />
                        </CtrlRow>
                      )}
                    </OptionCard>

                    <SubSec icon="ti-planet" color="text-indigo-400" isLight={isLight}>Órbitas & Trajetórias</SubSec>
                    <OptionCard isLight={isLight}>
                      <CtrlRow 
                        label="Exibir Órbitas" 
                        badge={<span className="font-mono text-[9px] px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">Orb</span>} 
                        isLight={isLight}
                      >
                        <Toggle on={props.showOrbits} onToggle={() => props.setShowOrbits(!props.showOrbits)} activeColor="bg-indigo-500" isLight={isLight} />
                      </CtrlRow>
                      <CtrlRow 
                        label="Órbitas Individuais" 
                        badge={<span className="font-mono text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">1..10</span>} 
                        isLight={isLight}
                      >
                        <Toggle on={!props.allPlanetsSameOrbit} onToggle={() => props.setAllPlanetsSameOrbit(!props.allPlanetsSameOrbit)} activeColor="bg-blue-500" isLight={isLight} />
                      </CtrlRow>
                    </OptionCard>

                    <SubSec icon="ti-palette" color="text-indigo-400" isLight={isLight}>Cores & Estilização</SubSec>
                    <OptionCard isLight={isLight}>
                      <CtrlRow 
                        label="Estilo de Cor" 
                        icon="ti-color-swatch" 
                        iconColor="text-indigo-400" 
                        isLight={isLight}
                      >
                        <SegSel
                          options={[
                            { label: 'Colorido', value: 'colored' },
                            { label: 'Dourado', value: 'gold' }
                          ]}
                          value={props.planetColorMode || 'colored'}
                          onChange={(v) => props.setPlanetColorMode?.(v as 'colored' | 'gold')}
                          isLight={isLight}
                        />
                      </CtrlRow>
                    </OptionCard>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Casas */}
            <div className="group relative flex items-center justify-center">
              <div className="absolute right-full mr-2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out z-50">
                <div className={`px-2.5 h-7 flex items-center rounded-xl backdrop-blur-xl text-xs font-semibold whitespace-nowrap shadow-xl border ${
                  isLight ? 'bg-white/95 text-neutral-900 border-black/15' : 'bg-[#06060a]/95 text-white border-white/20'
                }`}>
                  Casas Astrológicas
                </div>
              </div>
              <button
                onClick={() => togglePopover('casas')}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                  props.showHouseLines || openPopover === 'casas'
                    ? (isLight
                        ? 'bg-purple-600/20 border border-purple-600/40 text-purple-900 shadow-[0_2px_8px_rgba(147,51,234,0.2)]'
                        : 'bg-purple-500/20 border border-purple-400/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.35)]')
                    : (isLight
                        ? 'text-neutral-600 hover:bg-black/[0.06] hover:text-neutral-900'
                        : 'text-white/60 hover:bg-white/[0.08] hover:text-white')
                }`}
                title="Casas Astrológicas"
              >
                <i className="ti ti-home text-base" />
              </button>

              {/* Popover Casas */}
              {openPopover === 'casas' && (
                <div
                  data-no-drag="true"
                  onClick={(e) => e.stopPropagation()}
                  className={`fixed right-16 sm:right-20 top-1/2 -translate-y-1/2 max-h-[calc(100vh-2.5rem)] my-auto w-80 sm:w-[340px] rounded-[14px] p-3 pb-6 shadow-[0_20px_56px_rgba(0,0,0,.85),inset_0_1px_1px_rgba(255,255,255,.2)] z-[100] border backdrop-blur-[20px] overflow-y-auto overscroll-contain custom-scrollbar font-sans ${
                    isLight ? 'bg-white/95 border-black/15 text-[#231714]' : 'bg-[#06060a]/[0.975] border-white/20 text-white'
                  }`}
                >
                  <div className="px-1 py-1 border-b border-purple-500/20 mb-2 flex justify-between items-center">
                    <span className="ds-pop-title flex items-center gap-2 [&>i]:text-purple-400">
                      <i className="ti ti-layout-grid text-sm" />
                      Casas Astrológicas
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenPopover(null)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-black/10 text-neutral-600 hover:text-black' : 'hover:bg-white/10 text-white/60 hover:text-white'
                      }`}
                      title="Fechar"
                    >
                      <i className="ti ti-x text-xs" />
                    </button>
                  </div>

                  {isFreeTier && (
                    <FreeCustomizationLockBanner onOpenPaymentPlans={props.onOpenPaymentPlans} isLight={isLight} />
                  )}

                  <OptionCard isLight={isLight}>
                    <CtrlRow label="Linhas das Casas" icon="ti-layout-grid" iconColor="text-purple-400" isLight={isLight}>
                      <Toggle on={props.showHouseLines} onToggle={() => props.setShowHouseLines(!props.showHouseLines)} activeColor="bg-purple-500" isLight={isLight} />
                    </CtrlRow>
                    <CtrlRow 
                      label="Marcadores Numéricos" 
                      badge={<span className="font-serif font-bold text-[10px] tracking-tight px-1 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">XII / 12</span>}
                      isLight={isLight}
                    >
                      <Toggle on={props.showHouseMarkers} onToggle={() => props.setShowHouseMarkers(!props.showHouseMarkers)} activeColor="bg-purple-500" isLight={isLight} />
                    </CtrlRow>
                  </OptionCard>

                  <div className={isFreeTier ? 'opacity-40 pointer-events-none select-none' : ''}>
                    <SubSec icon="ti-compass" color="text-purple-400" isLight={isLight}>Cúspides Angulares (ASC, DC, IC, MC)</SubSec>
                  <OptionCard isLight={isLight}>
                    <CtrlRow label="Cor Angular" icon="ti-color-swatch" iconColor="text-fuchsia-400" isLight={isLight}>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={props.mainHouseLineColor || (isLight ? "#0f172a" : "#ffffff")}
                          onChange={(e) => props.setMainHouseLineColor?.(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        {props.mainHouseLineColor && (
                          <button
                            onClick={() => props.setMainHouseLineColor?.('')}
                            className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isLight ? 'bg-black/10 hover:bg-black/20 text-[#231714]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </CtrlRow>
                    <CtrlRow label="Espessura Angular" icon="ti-border-width-2" iconColor="text-fuchsia-400" isLight={isLight}>
                      <Stepper value={props.mainHouseLineThickness ?? 2} onChange={v => props.setMainHouseLineThickness?.(v)} min={1} max={6} step={0.5} format={v => `${v}px`} isLight={isLight} />
                    </CtrlRow>
                    <CtrlRow label="Opacidade Angular" icon="ti-eye" iconColor="text-fuchsia-400" isLight={isLight}>
                      <Stepper value={Math.round((props.mainHouseLineOpacity ?? 0.9) * 100)} onChange={v => props.setMainHouseLineOpacity?.(v / 100)} min={0} max={100} step={5} format={v => `${v}%`} isLight={isLight} />
                    </CtrlRow>
                  </OptionCard>

                  <SubSec icon="ti-line-dashed" color="text-violet-400" isLight={isLight}>Linhas Secundárias</SubSec>
                  <OptionCard isLight={isLight}>
                    <CtrlRow label="Cor Secundária" icon="ti-palette" iconColor="text-violet-400" isLight={isLight}>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={props.houseLineColor || (isLight ? "#4b5563" : "#9ca3af")}
                          onChange={(e) => props.setHouseLineColor?.(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        {props.houseLineColor && (
                          <button
                            onClick={() => props.setHouseLineColor?.('')}
                            className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isLight ? 'bg-black/10 hover:bg-black/20 text-[#231714]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </CtrlRow>
                    <CtrlRow label="Espessura Secundária" icon="ti-border-width" iconColor="text-violet-400" isLight={isLight}>
                      <Stepper value={props.houseLineThickness} onChange={props.setHouseLineThickness} min={0.5} max={4} step={0.5} format={v => `${v}px`} isLight={isLight} />
                    </CtrlRow>
                    <CtrlRow label="Opacidade Secundária" icon="ti-eye-check" iconColor="text-violet-400" isLight={isLight}>
                      <Stepper value={Math.round(props.houseLineOpacity * 100)} onChange={v => props.setHouseLineOpacity(v / 100)} min={0} max={100} step={5} format={v => `${v}%`} isLight={isLight} />
                    </CtrlRow>
                  </OptionCard>

                  <SubSec icon="ti-adjustments-alt" color="text-purple-400" isLight={isLight}>Estilização & Numeração</SubSec>
                  <OptionCard isLight={isLight}>
                    <CtrlRow label="Padrão do Traço" icon="ti-border-style" iconColor="text-purple-300" isLight={isLight}>
                      <SegSel options={[{label:'Sólida', value:'solid'}, {label:'Pontilhado', value:'dotted'}, {label:'Tracejado', value:'dashed'}]} value={props.houseLineFormat} onChange={v => props.setHouseLineFormat(v as any)} isLight={isLight} />
                    </CtrlRow>
                    <CtrlRow label="Numeração" icon="ti-numbers" iconColor="text-purple-300" isLight={isLight}>
                      <SegSel options={[{label:'Romano (XII)', value:'roman'}, {label:'Arábico (12)', value:'arabic'}, {label:'Símbolo', value:'symbol'}, {label:'Off', value:'none'}]} value={props.houseFormat} onChange={v => props.setHouseFormat(v as any)} isLight={isLight} />
                    </CtrlRow>
                  </OptionCard>

                  <SubSec icon="ti-circle-dotted" color="text-purple-400" isLight={isLight}>Anel dos Marcadores (Temporário)</SubSec>
                  <OptionCard isLight={isLight}>
                    <CtrlRow label="Cor do Fundo" icon="ti-color-swatch" iconColor="text-purple-400" isLight={isLight}>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={props.houseMarkerRingColor || (isLight ? "#ffffff" : "#060c18")}
                          onChange={(e) => props.setHouseMarkerRingColor?.(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        {props.houseMarkerRingColor && (
                          <button
                            onClick={() => props.setHouseMarkerRingColor?.('')}
                            className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isLight ? 'bg-black/10 hover:bg-black/20 text-[#231714]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </CtrlRow>
                    <CtrlRow label="Transparência" icon="ti-eye" iconColor="text-purple-400" isLight={isLight}>
                      <Stepper 
                        value={Math.round((props.houseMarkerRingOpacity ?? 0.38) * 100)} 
                        onChange={v => props.setHouseMarkerRingOpacity?.(v / 100)} 
                        min={0} 
                        max={100} 
                        step={5} 
                        format={v => `${v}%`} 
                        isLight={isLight} 
                      />
                    </CtrlRow>
                  </OptionCard>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Aspectos */}
            <div className="group relative flex items-center justify-center">
              <div className="absolute right-full mr-2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out z-50">
                <div className={`px-2.5 h-7 flex items-center rounded-xl backdrop-blur-xl text-xs font-semibold whitespace-nowrap shadow-xl border ${
                  isLight ? 'bg-white/95 text-neutral-900 border-black/15' : 'bg-[#06060a]/95 text-white border-white/20'
                }`}>
                  Aspectos
                </div>
              </div>
              <button
                onClick={() => togglePopover('aspectos')}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                  props.showAspectLines || openPopover === 'aspectos'
                    ? (isLight
                        ? 'bg-emerald-600/20 border border-emerald-600/40 text-emerald-900 shadow-[0_2px_8px_rgba(5,150,105,0.2)]'
                        : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]')
                    : (isLight
                        ? 'text-neutral-600 hover:bg-black/[0.06] hover:text-neutral-900'
                        : 'text-white/60 hover:bg-white/[0.08] hover:text-white')
                }`}
                title="Aspectos Astrológicos"
              >
                <i className="ti ti-star text-base" />
              </button>

              {/* Popover Aspectos */}
              {openPopover === 'aspectos' && (
                <div
                  data-no-drag="true"
                  onClick={(e) => e.stopPropagation()}
                  className={`fixed right-16 sm:right-20 top-1/2 -translate-y-1/2 max-h-[calc(100vh-2.5rem)] my-auto w-80 sm:w-[340px] rounded-[14px] p-3 pb-6 shadow-[0_20px_56px_rgba(0,0,0,.85),inset_0_1px_1px_rgba(255,255,255,.2)] z-[100] border backdrop-blur-[20px] overflow-y-auto overscroll-contain custom-scrollbar font-sans ${
                    isLight ? 'bg-white/95 border-black/15 text-[#231714]' : 'bg-[#06060a]/[0.975] border-white/20 text-white'
                  }`}
                >
                  <div className="px-1 py-1 border-b border-emerald-500/20 mb-2 flex justify-between items-center">
                    <span className="ds-pop-title flex items-center gap-2 [&>i]:text-emerald-400">
                      <i className="ti ti-star text-sm" />
                      Aspectos Astrológicos
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenPopover(null)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-black/10 text-neutral-600 hover:text-black' : 'hover:bg-white/10 text-white/60 hover:text-white'
                      }`}
                      title="Fechar"
                    >
                      <i className="ti ti-x text-xs" />
                    </button>
                  </div>

                  {isFreeTier && (
                    <FreeCustomizationLockBanner onOpenPaymentPlans={props.onOpenPaymentPlans} isLight={isLight} />
                  )}

                  <OptionCard isLight={isLight}>
                    <CtrlRow label="Exibir Linhas de Aspectos" icon="ti-star" iconColor="text-emerald-400" isLight={isLight}>
                      <Toggle on={props.showAspectLines} onToggle={() => props.setShowAspectLines(!props.showAspectLines)} activeColor="bg-emerald-500" isLight={isLight} />
                    </CtrlRow>
                  </OptionCard>

                  <div className={isFreeTier ? 'opacity-40 pointer-events-none select-none' : ''}>
                    <SubSec icon="ti-checks" color="text-emerald-400" isLight={isLight}>Aspectos Principais (Majores)</SubSec>
                  <OptionCard isLight={isLight} className="p-1 gap-1">
                    {ALL_ASPECTS.filter(a => a.primary).map(a => {
                      const isChecked = props.aspectSettings[a.key] !== false;
                      return (
                        <div key={a.key} className={`flex items-center px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          isLight ? 'hover:bg-black/[0.05]' : 'hover:bg-white/[0.04]'
                         }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            props.setAspectSettings((prev: any) => ({
                              ...prev,
                              [a.key]: !isChecked
                            }));
                          }}>
                          <span style={{ color: a.color }} className="text-sm w-5 text-center font-bold">{a.sym}</span>
                          <span className={`text-[12px] flex-1 font-medium ${isLight ? 'text-neutral-800' : 'text-neutral-200'}`}>{a.label}</span>
                          <span className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-all flex-shrink-0 ${
                            isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-black font-bold text-[10px]'
                            : (isLight ? 'border-black/30' : 'border-white/20')
                          }`}>
                            {isChecked && '✓'}
                          </span>
                        </div>
                      );
                    })}
                  </OptionCard>

                  <SubSec icon="ti-sparkles" color="text-teal-400" isLight={isLight}>Aspectos Secundários (Minores)</SubSec>
                  <OptionCard isLight={isLight} className="p-1 gap-1">
                    {ALL_ASPECTS.filter(a => !a.primary).map(a => {
                      const isChecked = !!props.visibleSecondaryAspects[a.key];
                      return (
                        <div key={a.key} className={`flex items-center px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          isLight ? 'hover:bg-black/[0.05]' : 'hover:bg-white/[0.04]'
                         }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            props.setVisibleSecondaryAspects(prev => {
                              const v = { ...prev };
                              if (v[a.key]) delete v[a.key];
                              else v[a.key] = true;
                              return v;
                            });
                          }}>
                          <span style={{ color: a.color }} className="text-sm w-5 text-center font-bold">{a.sym}</span>
                          <span className={`text-[12px] flex-1 font-medium ${isLight ? 'text-neutral-800' : 'text-neutral-200'}`}>{a.label}</span>
                          <span className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-all flex-shrink-0 ${
                            isChecked
                            ? 'bg-teal-500 border-teal-500 text-black font-bold text-[10px]'
                            : (isLight ? 'border-black/30' : 'border-white/20')
                          }`}>
                            {isChecked && '✓'}
                          </span>
                        </div>
                      );
                    })}
                  </OptionCard>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Graus */}
            <div className="group relative flex items-center justify-center">
              <div className="absolute right-full mr-2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out z-50">
                <div className={`px-2.5 h-7 flex items-center rounded-xl backdrop-blur-xl text-xs font-semibold whitespace-nowrap shadow-xl border ${
                  isLight ? 'bg-white/95 text-neutral-900 border-black/15' : 'bg-[#06060a]/95 text-white border-white/20'
                }`}>
                  Graus
                </div>
              </div>
              <button
                onClick={() => togglePopover('graus')}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                  props.showDegreeLabels || openPopover === 'graus'
                    ? (isLight
                        ? 'bg-blue-600/20 border border-blue-600/40 text-blue-900 shadow-[0_2px_8px_rgba(37,99,235,0.2)]'
                        : 'bg-blue-500/20 border border-blue-400/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.35)]')
                    : (isLight
                        ? 'text-neutral-600 hover:bg-black/[0.06] hover:text-neutral-900'
                        : 'text-white/60 hover:bg-white/[0.08] hover:text-white')
                }`}
                title="Graus dos Planetas"
              >
                <i className="ti ti-ruler text-base" />
              </button>

              {/* Popover Graus */}
              {openPopover === 'graus' && (
                <div
                  data-no-drag="true"
                  onClick={(e) => e.stopPropagation()}
                  className={`fixed right-16 sm:right-20 top-1/2 -translate-y-1/2 max-h-[calc(100vh-2.5rem)] my-auto w-80 sm:w-[340px] rounded-[14px] p-3 pb-6 shadow-[0_20px_56px_rgba(0,0,0,.85),inset_0_1px_1px_rgba(255,255,255,.2)] z-[100] border backdrop-blur-[20px] overflow-y-auto overscroll-contain custom-scrollbar font-sans ${
                    isLight ? 'bg-white/95 border-black/15 text-[#231714]' : 'bg-[#06060a]/[0.975] border-white/20 text-white'
                  }`}
                >
                  <div className="px-1 py-1 border-b border-blue-500/20 mb-2 flex justify-between items-center">
                    <span className="ds-pop-title flex items-center gap-2 [&>i]:text-blue-400">
                      <i className="ti ti-ruler text-sm" />
                      Graus dos Planetas
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenPopover(null)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-black/10 text-neutral-600 hover:text-black' : 'hover:bg-white/10 text-white/60 hover:text-white'
                      }`}
                      title="Fechar"
                    >
                      <i className="ti ti-x text-xs" />
                    </button>
                  </div>

                  {isFreeTier && (
                    <FreeCustomizationLockBanner onOpenPaymentPlans={props.onOpenPaymentPlans} isLight={isLight} />
                  )}

                  <OptionCard isLight={isLight}>
                    <CtrlRow label="Graus nos Planetas" icon="ti-ruler" iconColor="text-blue-400" isLight={isLight}>
                      <Toggle on={!!props.showDegreeLabels} onToggle={() => props.setShowDegreeLabels?.(!props.showDegreeLabels)} activeColor="bg-blue-500" isLight={isLight} />
                    </CtrlRow>
                  </OptionCard>

                  <div className={isFreeTier ? 'opacity-40 pointer-events-none select-none' : ''}>
                    <OptionCard isLight={isLight}>
                      <CtrlRow label="Formato de Exibição" icon="ti-layout-align-left" iconColor="text-blue-300" isLight={isLight}>
                        <SegSel 
                          options={[
                            { label: 'Vertical', value: 'vertical' },
                            { label: 'Horizontal', value: 'horizontal' },
                          ]} 
                          value={props.degreeLabelFormat || 'vertical'} 
                          onChange={v => props.setDegreeLabelFormat?.(v as any)} 
                          isLight={isLight} 
                        />
                      </CtrlRow>
                      <CtrlRow label="Tamanho da Fonte" icon="ti-text-size" iconColor="text-blue-300" isLight={isLight}>
                        <Stepper value={props.degreeLabelSize || 18} onChange={v => props.setDegreeLabelSize?.(v)} min={10} max={28} step={1} format={v => `${v}px`} isLight={isLight} />
                      </CtrlRow>
                      <CtrlRow label="Anti-Sobreposição" icon="ti-stack-2" iconColor="text-blue-300" isLight={isLight}>
                        <SegSel options={[{label:'Auto', value:'responsive'}, {label:'Estático', value:'static'}, {label:'Escalonado', value:'staggered'}]} value={props.degreeLabelPosition || 'responsive'} onChange={v => props.setDegreeLabelPosition?.(v as any)} isLight={isLight} />
                      </CtrlRow>
                    </OptionCard>
                  </div>
                </div>
              )}
            </div>

            {/* 7. Anéis & Cronógrafo (Decanatos, Termos, Estações, Horas) */}
            <div className="group relative flex items-center justify-center">
              <div className="absolute right-full mr-2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out z-50">
                <div className={`px-2.5 h-7 flex items-center rounded-xl backdrop-blur-xl text-xs font-semibold whitespace-nowrap shadow-xl border ${
                  isLight ? 'bg-white/95 text-neutral-900 border-black/15' : 'bg-[#06060a]/95 text-white border-white/20'
                }`}>
                  Anéis e Cronógrafo
                </div>
              </div>
              <button
                onClick={() => togglePopover('aneis')}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                  isAdvancedOn || openPopover === 'aneis'
                    ? (isLight
                        ? 'bg-rose-600/20 border border-rose-600/40 text-rose-900 shadow-[0_2px_8px_rgba(225,29,72,0.2)]'
                        : 'bg-rose-500/20 border border-rose-400/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.35)]')
                    : (isLight
                        ? 'text-neutral-600 hover:bg-black/[0.06] hover:text-neutral-900'
                        : 'text-white/60 hover:bg-white/[0.08] hover:text-white')
                }`}
                title="Anéis Astrológicos (Decanatos, Termos, Estações, Relógio 24h)"
              >
                <i className="ti ti-disc text-base" />
              </button>

              {/* Popover Anéis & Cronógrafo */}
              {openPopover === 'aneis' && (
                <div
                  data-no-drag="true"
                  onClick={(e) => e.stopPropagation()}
                  className={`fixed right-16 sm:right-20 top-1/2 -translate-y-1/2 max-h-[calc(100vh-2.5rem)] my-auto w-80 sm:w-[350px] rounded-[14px] p-3 pb-6 shadow-[0_20px_56px_rgba(0,0,0,.85),inset_0_1px_1px_rgba(255,255,255,.2)] z-[100] border backdrop-blur-[20px] overflow-y-auto overscroll-contain custom-scrollbar font-sans ${
                    isLight ? 'bg-white/95 border-black/15 text-[#231714]' : 'bg-[#06060a]/[0.975] border-white/20 text-white'
                  }`}
                >
                  <div className="px-1 py-1 border-b border-rose-500/20 mb-2 flex justify-between items-center">
                    <span className="ds-pop-title flex items-center gap-2 [&>i]:text-rose-400">
                      <i className="ti ti-disc text-sm" />
                      Anéis e Camadas Astrológicas
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenPopover(null)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-black/10 text-neutral-600 hover:text-black' : 'hover:bg-white/10 text-white/60 hover:text-white'
                      }`}
                      title="Fechar"
                    >
                      <i className="ti ti-x text-xs" />
                    </button>
                  </div>

                  {isFreeTier && (
                    <FreeCustomizationLockBanner onOpenPaymentPlans={props.onOpenPaymentPlans} isLight={isLight} />
                  )}

                  {/* 1. Decanatos */}
                  <SubSec icon="ti-circle-dotted" color="text-amber-400" isLight={isLight}>Decanatos (Divisão de 10°)</SubSec>
                  <OptionCard isLight={isLight}>
                    <CtrlRow label="Anel de Decanatos" icon="ti-circle-dotted" iconColor="text-amber-400" isLight={isLight}>
                      <Toggle on={!!props.showDecanRing} onToggle={() => props.setShowDecanRing?.(!props.showDecanRing)} activeColor="bg-amber-500" isLight={isLight} />
                    </CtrlRow>
                    {props.showDecanRing && props.decanRingScale !== undefined && (
                      <CtrlRow label="Escala do Anel" icon="ti-scale" iconColor="text-amber-300" isLight={isLight}>
                        <Stepper value={props.decanRingScale} onChange={v => props.setDecanRingScale?.(v)} min={0.5} max={2.5} step={0.05} format={v => `${v.toFixed(2)}x`} isLight={isLight} />
                      </CtrlRow>
                    )}
                    {props.showDecanRing && props.decanGlyphSize !== undefined && (
                      <CtrlRow label="Tamanho Glifos" icon="ti-typography" iconColor="text-amber-300" isLight={isLight}>
                        <Stepper value={props.decanGlyphSize} onChange={v => props.setDecanGlyphSize?.(v)} min={10} max={50} step={1} format={v => `${v}px`} isLight={isLight} />
                      </CtrlRow>
                    )}
                  </OptionCard>

                  {/* 2. Termos Egípcios / Caldeus */}
                  <SubSec icon="ti-file-text" color="text-violet-400" isLight={isLight}>Termos Astrológicos</SubSec>
                  <OptionCard isLight={isLight}>
                    <CtrlRow label="Anel de Termos" icon="ti-file-text" iconColor="text-violet-400" isLight={isLight}>
                      <Toggle on={!!props.showTermsRing} onToggle={() => props.setShowTermsRing?.(!props.showTermsRing)} activeColor="bg-violet-500" isLight={isLight} />
                    </CtrlRow>
                    {props.showTermsRing && props.termsRingScale !== undefined && (
                      <CtrlRow label="Escala do Anel" icon="ti-scale" iconColor="text-violet-300" isLight={isLight}>
                        <Stepper value={props.termsRingScale} onChange={v => props.setTermsRingScale?.(v)} min={0.5} max={2.5} step={0.05} format={v => `${v.toFixed(2)}x`} isLight={isLight} />
                      </CtrlRow>
                    )}
                    {props.showTermsRing && props.termsGlyphSize !== undefined && (
                      <CtrlRow label="Tamanho Glifos" icon="ti-typography" iconColor="text-violet-300" isLight={isLight}>
                        <Stepper value={props.termsGlyphSize} onChange={v => props.setTermsGlyphSize?.(v)} min={10} max={50} step={1} format={v => `${v}px`} isLight={isLight} />
                      </CtrlRow>
                    )}
                  </OptionCard>

                  {/* 3. Estações e Quadrantes */}
                  <SubSec icon="ti-sun-moon" color="text-emerald-400" isLight={isLight}>Estações e Quadrantes Solsticiais</SubSec>
                  <OptionCard isLight={isLight}>
                    <CtrlRow label="Anel de Estações" icon="ti-sun-moon" iconColor="text-emerald-400" isLight={isLight}>
                      <Toggle on={!!props.showSeasonsRing} onToggle={() => props.setShowSeasonsRing?.(!props.showSeasonsRing)} activeColor="bg-emerald-500" isLight={isLight} />
                    </CtrlRow>
                    {props.showSeasonsRing && props.seasonsRingScale !== undefined && (
                      <CtrlRow label="Escala do Anel" icon="ti-scale" iconColor="text-emerald-300" isLight={isLight}>
                        <Stepper value={props.seasonsRingScale} onChange={v => props.setSeasonsRingScale?.(v)} min={0.4} max={1.6} step={0.05} format={v => `${v.toFixed(2)}x`} isLight={isLight} />
                      </CtrlRow>
                    )}
                  </OptionCard>

                  {/* 4. Relógio 24 Horas */}
                  <SubSec icon="ti-clock" color="text-cyan-400" isLight={isLight}>Relógio Diurno / Noturno (24h)</SubSec>
                  <OptionCard isLight={isLight}>
                    <CtrlRow label="Anel 24 Horas" icon="ti-clock" iconColor="text-cyan-400" isLight={isLight}>
                      <Toggle on={!!props.showTimeRing} onToggle={() => props.setShowTimeRing?.(!props.showTimeRing)} activeColor="bg-cyan-500" isLight={isLight} />
                    </CtrlRow>
                    {props.showTimeRing && props.timeRingScale !== undefined && (
                      <CtrlRow label="Escala do Relógio" icon="ti-scale" iconColor="text-cyan-300" isLight={isLight}>
                        <Stepper value={props.timeRingScale} onChange={v => props.setTimeRingScale?.(v)} min={0.5} max={2.5} step={0.1} format={v => `${v.toFixed(1)}x`} isLight={isLight} />
                      </CtrlRow>
                    )}
                  </OptionCard>

                  {/* 5. Personalização da Borda de Graduação e Zodíaco */}
                  <SubSec icon="ti-border-radius" color="text-indigo-400" isLight={isLight}>Graduação e Zodíaco</SubSec>
                  <OptionCard isLight={isLight}>
                    {props.graduationRingWidth !== undefined && (
                      <CtrlRow label="Espessura Borda" icon="ti-border-width" iconColor="text-indigo-300" isLight={isLight}>
                        <Stepper value={props.graduationRingWidth} onChange={v => props.setGraduationRingWidth?.(v)} min={10} max={120} step={2} format={v => `${v}px`} isLight={isLight} />
                      </CtrlRow>
                    )}
                    {props.zodiacRingScale !== undefined && (
                      <CtrlRow label="Escala Anel Zodíaco" icon="ti-scale" iconColor="text-indigo-300" isLight={isLight}>
                        <Stepper value={props.zodiacRingScale} onChange={v => props.setZodiacRingScale?.(v)} min={0.5} max={1.6} step={0.05} format={v => `${v.toFixed(2)}x`} isLight={isLight} />
                      </CtrlRow>
                    )}
                    {props.zodiacSignSize !== undefined && (
                      <CtrlRow label="Tamanho dos Signos" icon="ti-ad-2" iconColor="text-indigo-300" isLight={isLight}>
                        <Stepper value={props.zodiacSignSize} onChange={v => props.setZodiacSignSize?.(v)} min={16} max={70} step={2} format={v => `${v}px`} isLight={isLight} />
                      </CtrlRow>
                    )}
                    {props.setRingLineColor && (
                      <CtrlRow label="Cor das Linhas" icon="ti-palette" iconColor="text-indigo-300" isLight={isLight}>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={props.ringLineColor || (isLight ? '#4b5563' : '#9ca3af')}
                            onChange={(e) => props.setRingLineColor?.(e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                          />
                          {props.ringLineColor && (
                            <button
                              type="button"
                              onClick={() => props.setRingLineColor?.('')}
                              className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isLight ? 'bg-black/10 text-black' : 'bg-white/10 text-white'}`}
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </CtrlRow>
                    )}
                  </OptionCard>
                </div>
              )}
            </div>

            {/* 8. Céu Estrelado & Qualidade Óptica */}
            <div className="group relative flex items-center justify-center">
              <div className="absolute right-full mr-2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out z-50">
                <div className={`px-2.5 h-7 flex items-center rounded-xl backdrop-blur-xl text-xs font-semibold whitespace-nowrap shadow-xl border ${
                  isLight ? 'bg-white/95 text-neutral-900 border-black/15' : 'bg-[#06060a]/95 text-white border-white/20'
                }`}>
                  Céu Estrelado & Fundo
                </div>
              </div>
              <button
                onClick={() => togglePopover('estrelas')}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                  props.showStars || openPopover === 'estrelas'
                    ? (isLight
                        ? 'bg-sky-600/20 border border-sky-600/40 text-sky-900 shadow-[0_2px_8px_rgba(2,132,199,0.2)]'
                        : 'bg-sky-500/20 border border-sky-400/40 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.35)]')
                    : (isLight
                        ? 'text-neutral-600 hover:bg-black/[0.06] hover:text-neutral-900'
                        : 'text-white/60 hover:bg-white/[0.08] hover:text-white')
                }`}
                title="Qualidade do Céu Estrelado & Fundo"
              >
                <i className="ti ti-sparkles text-base" />
              </button>

              {/* Popover Céu Estrelado & Fundo */}
              {openPopover === 'estrelas' && (
                <div
                  data-no-drag="true"
                  onClick={(e) => e.stopPropagation()}
                  className={`fixed right-16 sm:right-20 top-1/2 -translate-y-1/2 max-h-[calc(100vh-2.5rem)] my-auto w-80 sm:w-[350px] rounded-[14px] p-3 pb-6 shadow-[0_20px_56px_rgba(0,0,0,.85),inset_0_1px_1px_rgba(255,255,255,.2)] z-[100] border backdrop-blur-[20px] overflow-y-auto overscroll-contain custom-scrollbar font-sans ${
                    isLight ? 'bg-white/95 border-black/15 text-[#231714]' : 'bg-[#06060a]/[0.975] border-white/20 text-white'
                  }`}
                >
                  <div className="px-1 py-1 border-b border-sky-500/20 mb-2 flex justify-between items-center">
                    <span className="ds-pop-title flex items-center gap-2 [&>i]:text-sky-400">
                      <i className="ti ti-sparkles text-sm" />
                      Céu Estrelado & Fundo
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenPopover(null)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-black/10 text-neutral-600 hover:text-black' : 'hover:bg-white/10 text-white/60 hover:text-white'
                      }`}
                      title="Fechar"
                    >
                      <i className="ti ti-x text-xs" />
                    </button>
                  </div>

                  {isFreeTier && (
                    <FreeCustomizationLockBanner onOpenPaymentPlans={props.onOpenPaymentPlans} isLight={isLight} />
                  )}

                  {/* Ativação & Presets */}
                  <SubSec icon="ti-stars" color="text-sky-400" isLight={isLight}>Densidade & Presets</SubSec>
                  <OptionCard isLight={isLight}>
                    {props.setShowStars && (
                      <CtrlRow label="Exibir Estrelas" icon="ti-star" iconColor="text-sky-400" isLight={isLight}>
                        <Toggle on={!!props.showStars} onToggle={() => props.setShowStars!(!props.showStars)} activeColor="bg-sky-500" isLight={isLight} />
                      </CtrlRow>
                    )}
                    {props.setShowConstellations && (
                      <CtrlRow label="Exibir Constelações" icon="ti-stars" iconColor="text-cyan-400" isLight={isLight}>
                        <Toggle on={!!props.showConstellations} onToggle={() => props.setShowConstellations!(!props.showConstellations)} activeColor="bg-cyan-500" isLight={isLight} />
                      </CtrlRow>
                    )}
                  </OptionCard>

                  <div className={isFreeTier ? 'opacity-40 pointer-events-none select-none' : ''}>
                    <OptionCard isLight={isLight}>
                      {props.setStarCount && (
                        <>
                          <CtrlRow label="Preset de Densidade" icon="ti-sparkles" iconColor="text-sky-300" isLight={isLight}>
                          <SegSel
                            options={[
                              { label: 'Sutil', value: '750' },
                              { label: 'Elegante', value: '1400' },
                              { label: 'Rico', value: '2100' },
                              { label: 'Cosmo', value: '2800' },
                            ]}
                            value={String(props.starCount || 1400)}
                            onChange={(v) => props.setStarCount!(parseInt(v, 10))}
                            isLight={isLight}
                          />
                        </CtrlRow>
                        <CtrlRow label="Qtd. de Estrelas" icon="ti-numbers" iconColor="text-sky-300" isLight={isLight}>
                          <Stepper
                            value={props.starCount || 1400}
                            onChange={(v) => props.setStarCount!(v)}
                            min={400}
                            max={3600}
                            step={100}
                            format={(v) => `${v}`}
                            isLight={isLight}
                          />
                        </CtrlRow>
                      </>
                    )}
                    {props.setStarBrightness && (
                      <CtrlRow label="Brilho / Luminosidade" icon="ti-sun-high" iconColor="text-sky-300" isLight={isLight}>
                        <Stepper
                          value={Math.round((props.starBrightness ?? 1.0) * 100)}
                          onChange={(v) => props.setStarBrightness!(v / 100)}
                          min={20}
                          max={150}
                          step={5}
                          format={(v) => `${v}%`}
                          isLight={isLight}
                        />
                      </CtrlRow>
                    )}
                  </OptionCard>

                  {/* Cintilação Óptica (Twinkle) */}
                  <SubSec icon="ti-flare" color="text-amber-400" isLight={isLight}>Cintilação Óptica (Twinkle)</SubSec>
                  <OptionCard isLight={isLight}>
                    {props.setStarTwinkleMode && (
                      <CtrlRow label="Modo de Cintilação" icon="ti-wave-sine" iconColor="text-amber-300" isLight={isLight}>
                        <SegSel
                          options={[
                            { label: 'Natural', value: 'natural' },
                            { label: 'Calma', value: 'calm' },
                            { label: 'Vibrante', value: 'vibrant' },
                            { label: 'Suave', value: 'subtle' },
                          ]}
                          value={props.starTwinkleMode || 'natural'}
                          onChange={(v) => props.setStarTwinkleMode!(v as any)}
                          isLight={isLight}
                        />
                      </CtrlRow>
                    )}
                    {props.setStarTwinkleIntensity && (
                      <CtrlRow label="Intensidade do Shimmer" icon="ti-adjustments-spark" iconColor="text-amber-300" isLight={isLight}>
                        <Stepper
                          value={Math.round((props.starTwinkleIntensity ?? 0.75) * 100)}
                          onChange={(v) => props.setStarTwinkleIntensity!(v / 100)}
                          min={0}
                          max={150}
                          step={5}
                          format={(v) => `${v}%`}
                          isLight={isLight}
                        />
                      </CtrlRow>
                    )}
                    {props.setStarTwinkleSpeed && (
                      <CtrlRow label="Velocidade da Cintilação" icon="ti-bolt" iconColor="text-amber-300" isLight={isLight}>
                        <Stepper
                          value={Math.round((props.starTwinkleSpeed ?? 1.0) * 100)}
                          onChange={(v) => props.setStarTwinkleSpeed!(v / 100)}
                          min={30}
                          max={200}
                          step={10}
                          format={(v) => `${v}%`}
                          isLight={isLight}
                        />
                      </CtrlRow>
                    )}
                  </OptionCard>

                  {/* Fenômenos Celestes */}
                  <SubSec icon="ti-meteor" color="text-violet-400" isLight={isLight}>Fenômenos Celestes</SubSec>
                  <OptionCard isLight={isLight}>
                    {props.setStarMeteorFrequency && (
                      <CtrlRow label="Estrelas Cadentes" icon="ti-meteor" iconColor="text-violet-400" isLight={isLight}>
                        <SegSel
                          options={[
                            { label: 'Off', value: 'none' },
                            { label: 'Raras', value: 'rare' },
                            { label: 'Moderadas', value: 'moderate' },
                            { label: 'Frequentes', value: 'frequent' },
                          ]}
                          value={props.starMeteorFrequency || 'moderate'}
                          onChange={(v) => {
                            props.setStarMeteorFrequency!(v as any);
                            props.setStarMeteors?.(v !== 'none');
                          }}
                          isLight={isLight}
                        />
                      </CtrlRow>
                    )}
                    {props.setStarNebulaGlow && (
                      <CtrlRow label="Glow da Nebulosa" icon="ti-blur" iconColor="text-violet-400" isLight={isLight}>
                        <Toggle
                          on={props.starNebulaGlow ?? true}
                          onToggle={() => props.setStarNebulaGlow!(!(props.starNebulaGlow ?? true))}
                          activeColor="bg-violet-500"
                          isLight={isLight}
                        />
                      </CtrlRow>
                    )}
                  </OptionCard>
                  </div>
                </div>
              )}
            </div>

            {/* 9. Tamanho e Escala (Migrado e Unificado) */}
            <div className="group relative flex items-center justify-center">
              <div className="absolute right-full mr-2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out z-50">
                <div className={`px-2.5 h-7 flex items-center rounded-xl backdrop-blur-xl text-xs font-semibold whitespace-nowrap shadow-xl border ${
                  isLight ? 'bg-white/95 text-neutral-900 border-black/15' : 'bg-[#06060a]/95 text-white border-white/20'
                }`}>
                  Tamanho & Escala
                </div>
              </div>
              <button
                onClick={() => togglePopover('avancado')}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                  isAdvancedOn || openPopover === 'avancado'
                    ? (isLight
                        ? 'bg-amber-600/20 border border-amber-600/40 text-amber-900 shadow-[0_2px_8px_rgba(217,119,6,0.2)]'
                        : 'bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]')
                    : (isLight
                        ? 'text-neutral-600 hover:bg-black/[0.06] hover:text-neutral-900'
                        : 'text-white/60 hover:bg-white/[0.08] hover:text-white')
                }`}
                title="Tamanho e Escala (Zoom / Notebook / Apresentação / Projeção)"
              >
                <i className="ti ti-viewport-wide text-base" />
              </button>

              {/* Popover Tamanho & Escala */}
              {openPopover === 'avancado' && (
                <div
                  data-no-drag="true"
                  onClick={(e) => e.stopPropagation()}
                  className={`fixed right-16 sm:right-20 top-1/2 -translate-y-1/2 max-h-[calc(100vh-2.5rem)] my-auto w-[340px] sm:w-[380px] rounded-[14px] p-3 pb-6 shadow-[0_20px_56px_rgba(0,0,0,.85),inset_0_1px_1px_rgba(255,255,255,.2)] z-[100] border backdrop-blur-[20px] overflow-y-auto overscroll-contain custom-scrollbar font-sans ${
                    isLight ? 'bg-white/95 border-black/15 text-[#231714]' : 'bg-[#06060a]/[0.975] border-white/20 text-white'
                  }`}
                >
                  <div className="px-1 py-1 border-b border-amber-500/20 mb-2 flex justify-between items-center">
                    <span className="ds-pop-title flex items-center gap-2 [&>i]:text-amber-400">
                      <i className="ti ti-viewport-wide text-sm" />
                      Tamanho e Escala
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenPopover(null)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-black/10 text-neutral-600 hover:text-black' : 'hover:bg-white/10 text-white/60 hover:text-white'
                      }`}
                      title="Fechar"
                    >
                      <i className="ti ti-x text-xs" />
                    </button>
                  </div>

                  {isFreeTier && (
                    <FreeCustomizationLockBanner onOpenPaymentPlans={props.onOpenPaymentPlans} isLight={isLight} />
                  )}

                  <div className={isFreeTier ? 'opacity-40 pointer-events-none select-none' : ''}>
                    <SizeControlContent
                      theme={props.theme}
                      uiScale={props.uiScale ?? 1.0}
                      setUiScale={props.setUiScale ?? (() => {})}
                      clockScale={props.clockScale ?? 1.15}
                      setClockScale={props.setClockScale ?? (() => {})}
                      leftPanelScale={props.leftPanelScale ?? 1.0}
                      setLeftPanelScale={props.setLeftPanelScale ?? (() => {})}
                      rightPanelScale={props.rightPanelScale ?? 1.0}
                      setRightPanelScale={props.setRightPanelScale ?? (() => {})}
                      leftPanelWidth={props.leftPanelWidth}
                      setLeftPanelWidth={props.setLeftPanelWidth}
                      rightPanelWidth={props.rightPanelWidth}
                      setRightPanelWidth={props.setRightPanelWidth}
                      clockPlanetSize={props.clockPlanetSize}
                      setClockPlanetSize={props.setClockPlanetSize}
                      degreeLabelSize={props.degreeLabelSize}
                      setDegreeLabelSize={props.setDegreeLabelSize}
                      graduationRingWidth={props.graduationRingWidth}
                      setGraduationRingWidth={props.setGraduationRingWidth}
                      zodiacRingScale={props.zodiacRingScale}
                      setZodiacRingScale={props.setZodiacRingScale}
                      zodiacSignSize={props.zodiacSignSize}
                      setZodiacSignSize={props.setZodiacSignSize}
                      showSeasonsRing={props.showSeasonsRing}
                      setShowSeasonsRing={props.setShowSeasonsRing}
                      seasonsRingScale={props.seasonsRingScale}
                      setSeasonsRingScale={props.setSeasonsRingScale}
                      showDecanRing={props.showDecanRing}
                      setShowDecanRing={props.setShowDecanRing}
                      decanRingScale={props.decanRingScale}
                      setDecanRingScale={props.setDecanRingScale}
                      decanGlyphSize={props.decanGlyphSize}
                      setDecanGlyphSize={props.setDecanGlyphSize}
                      showTermsRing={props.showTermsRing}
                      setShowTermsRing={props.setShowTermsRing}
                      termsRingScale={props.termsRingScale}
                      setTermsRingScale={props.setTermsRingScale}
                      termsGlyphSize={props.termsGlyphSize}
                      setTermsGlyphSize={props.setTermsGlyphSize}
                      showTimeRing={props.showTimeRing}
                      setShowTimeRing={props.setShowTimeRing}
                      timeRingScale={props.timeRingScale}
                      setTimeRingScale={props.setTimeRingScale}
                      ringLineColor={props.ringLineColor}
                      setRingLineColor={props.setRingLineColor}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section: Settings, Save, Share */}
          <div className="flex flex-col items-center gap-2 w-full pt-1">
            <div className={`w-6 border-b my-0.5 ${isLight ? 'border-black/10' : 'border-white/10'}`} />

            {/* Opções / Configurações */}
            <div className="group relative flex items-center justify-center">
              <div className="absolute right-full mr-2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out z-50">
                <div className={`px-2.5 h-7 flex items-center rounded-xl backdrop-blur-xl text-xs font-semibold whitespace-nowrap shadow-xl border ${
                  isLight ? 'bg-white/95 text-neutral-900 border-black/15' : 'bg-[#06060a]/95 text-white border-white/20'
                }`}>
                  Opções e Configurações
                </div>
              </div>
              <button
                onClick={() => togglePopover('opcoes')}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 relative ${
                  openPopover === 'opcoes'
                    ? (isLight ? 'text-amber-700 bg-amber-500/15 border border-amber-500/30' : 'text-amber-400 bg-amber-500/20 border border-amber-500/30')
                    : (isLight ? 'text-neutral-600 hover:bg-black/[0.06] hover:text-neutral-900' : 'text-white/60 hover:bg-white/[0.08] hover:text-white')
                }`}
                title={isFreeTier ? "Opções e Configurações (Recurso Pro)" : "Menu de Opções e Configurações"}
              >
                <i className={`ti ti-settings text-base ${openPopover === 'opcoes' ? 'rotate-90 text-amber-400' : ''} transition-transform duration-300`} />
                {isFreeTier && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500/90 text-[8px] flex items-center justify-center text-black font-bold shadow-xs">
                    🔒
                  </span>
                )}
              </button>

              {/* Flyout Window: Opções e Configurações */}
              {openPopover === 'opcoes' && (
                <div
                  data-no-drag="true"
                  onClick={(e) => e.stopPropagation()}
                  className={`fixed right-16 sm:right-20 top-1/2 -translate-y-1/2 max-h-[calc(100vh-2.5rem)] my-auto w-80 sm:w-[340px] rounded-[14px] p-3 pb-6 shadow-[0_20px_56px_rgba(0,0,0,.85),inset_0_1px_1px_rgba(255,255,255,.2)] z-[100] border backdrop-blur-[20px] overflow-y-auto overscroll-contain custom-scrollbar font-sans ${
                    isLight ? 'bg-white/95 border-black/15 text-[#231714]' : 'bg-[#06060a]/[0.975] border-white/20 text-white'
                  }`}
                >
                  <div className="px-1 py-1 border-b border-white/10 mb-2 flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <i className="ti ti-settings text-sm" />
                      <span className="ds-pop-title">Opções Globais</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenPopover(null)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-black/10 text-neutral-600 hover:text-black' : 'hover:bg-white/10 text-white/60 hover:text-white'
                      }`}
                      title="Fechar"
                    >
                      <i className="ti ti-x text-xs" />
                    </button>
                  </div>

                  {isFreeTier && (
                    <FreeCustomizationLockBanner onOpenPaymentPlans={props.onOpenPaymentPlans} isLight={isLight} />
                  )}

                  <div className={isFreeTier ? 'opacity-40 pointer-events-none select-none' : ''}>
                    {/* Sistema e Perspectiva */}
                    <SubSec icon="ti-sun" color="text-amber-400" isLight={isLight}>Sistema & Perspectiva</SubSec>
                    <OptionCard isLight={isLight}>
                      {props.setIsHeliocentricMode && (
                        <CtrlRow label="Modo Heliocêntrico (Sol)" icon="ti-sun" iconColor="text-amber-400" isLight={isLight}>
                          <Toggle on={!!props.isHeliocentricMode} onToggle={() => props.setIsHeliocentricMode!(!props.isHeliocentricMode)} activeColor="bg-amber-500" isLight={isLight} />
                        </CtrlRow>
                      )}
                      {props.setZodiacSystem && (
                        <CtrlRow label="Sistema Zodíaco" icon="ti-compass" iconColor="text-amber-300" isLight={isLight}>
                          <SegSel
                            options={[
                              { label: 'Tropical', value: 'tropical' },
                              { label: 'Sideral', value: 'sidereal' },
                            ]}
                            value={props.zodiacSystem || 'tropical'}
                            onChange={(v) => props.setZodiacSystem!(v as any)}
                            isLight={isLight}
                          />
                        </CtrlRow>
                      )}
                      {props.setZodiacColorMode && (
                        <CtrlRow label="Cores do Zodíaco" icon="ti-palette" iconColor="text-amber-300" isLight={isLight}>
                          <SegSel
                            options={[
                              { label: 'Elem.', value: 'elements' },
                              { label: 'Mod.', value: 'modalities' },
                              { label: 'Pol.', value: 'polarities' },
                              { label: 'Neutro', value: 'neutral' },
                            ]}
                            value={props.zodiacColorMode || 'elements'}
                            onChange={(v) => props.setZodiacColorMode!(v as any)}
                            isLight={isLight}
                          />
                        </CtrlRow>
                      )}
                    </OptionCard>

                    {/* Exibições e Layout */}
                    <SubSec icon="ti-layout" color="text-sky-400" isLight={isLight}>Exibições e Visualização</SubSec>
                    <OptionCard isLight={isLight}>
                      {props.setShowEnergyChart && (
                        <CtrlRow label="Gráfico de Trânsitos" icon="ti-chart-dots" iconColor="text-sky-400" isLight={isLight}>
                          <Toggle on={!!props.showEnergyChart} onToggle={() => props.setShowEnergyChart!(!props.showEnergyChart)} activeColor="bg-sky-500" isLight={isLight} />
                        </CtrlRow>
                      )}
                    </OptionCard>

                    {props.onResetAllLayouts && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            props.onResetAllLayouts?.();
                            setOpenPopover(null);
                          }}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isLight
                              ? 'bg-black/5 hover:bg-black/10 text-neutral-800 border border-black/10 active:scale-98'
                              : 'bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 active:scale-98'
                          }`}
                        >
                          <i className="ti ti-rotate text-sm text-amber-400" />
                          <span>Restaurar Painéis ao Padrão</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Planos de Acesso */}
            {props.onOpenPaymentPlans && (
              <div className="group relative flex items-center justify-center">
                <div className="absolute right-full mr-2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out z-50">
                  <div className={`px-2.5 h-7 flex items-center rounded-xl backdrop-blur-xl text-xs font-semibold whitespace-nowrap shadow-xl border ${
                    isLight ? 'bg-white/95 text-neutral-900 border-black/15' : 'bg-[#06060a]/95 text-white border-white/20'
                  }`}>
                    Planos de Acesso
                  </div>
                </div>
                <button
                  onClick={props.onOpenPaymentPlans}
                  className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                    isLight
                      ? 'text-amber-800 hover:bg-amber-100 hover:text-amber-900'
                      : 'text-[#D4AF37] hover:bg-[#D4AF37]/15 hover:text-[#F5D98A]'
                  }`}
                  title="Planos de Acesso ao Cronógrafo"
                >
                  <i className="ti ti-crown text-base" />
                </button>
              </div>
            )}

            {/* Alternar Tema: Modo Claro / Modo Escuro (Botão Nativo) */}
            {props.setTheme && (
              <div className="group relative flex items-center justify-center">
                <div className="absolute right-full mr-2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out z-50">
                  <div className={`px-2.5 h-7 flex items-center rounded-xl backdrop-blur-xl text-xs font-semibold whitespace-nowrap shadow-xl border ${
                    isLight ? 'bg-white/95 text-neutral-900 border-black/15' : 'bg-[#06060a]/95 text-white border-white/20'
                  }`}>
                    {isLight ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
                  </div>
                </div>
                <button
                  onClick={() => props.setTheme!(isLight ? 'dark' : 'light')}
                  className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                    isLight
                      ? 'text-neutral-700 hover:bg-black/[0.08] hover:text-black'
                      : 'text-amber-400 hover:bg-amber-400/15 hover:text-amber-300'
                  }`}
                  title={isLight ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
                >
                  <i className={`ti ${isLight ? 'ti-moon' : 'ti-sun'} text-base transition-transform duration-300 hover:rotate-12`} />
                </button>
              </div>
            )}

            {/* Salvar Mapa */}
            {props.onSave && (
              <div className="group relative flex items-center justify-center">
                <div className="absolute right-full mr-2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out z-50">
                  <div className={`px-2.5 h-7 flex items-center rounded-xl backdrop-blur-xl text-xs font-semibold whitespace-nowrap shadow-xl border ${
                    isLight ? 'bg-white/95 text-neutral-900 border-black/15' : 'bg-[#06060a]/95 text-white border-white/20'
                  }`}>
                    Salvar Mapa
                  </div>
                </div>
                <button
                  onClick={props.onSave}
                  className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                    isLight ? 'text-neutral-600 hover:bg-black/[0.06] hover:text-neutral-900' : 'text-white/60 hover:bg-white/[0.08] hover:text-amber-400'
                  }`}
                  title="Salvar Mapa"
                >
                  <i className="ti ti-bookmark text-base" />
                </button>
              </div>
            )}

            {/* Compartilhar / Exportar */}
            {props.exportData && (
              <ExportPDFButton {...props.exportData} variant="sidebar" />
            )}
          </div>
        </motion.aside>
    </>
  );
};
