import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UI_ICONS } from './icons';
import { ExportPDFButton } from './ExportPDFButton';
import { motion, AnimatePresence } from 'framer-motion';
import { SizeControlContent } from './SizeControlPopover';

// ... (Tipos e Props mantidos como estavam, extraídos da interface)
type PointerHeadTail = 'arrow' | 'circle' | 'square' | 'none';
type PointerStyle = 'solid' | 'dashed';
type ThickLevel = 'thin' | 'medium' | 'thick';

interface OptionsRailProps {
  // PONTEIRO — estados existentes no App.tsx
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

  // ANÉIS E GRAUS — estados existentes
  showSignLines: boolean;
  setShowSignLines: (v: boolean) => void;
  showSeasonsRing: boolean;
  setShowSeasonsRing: (v: boolean) => void;
  showOrbits: boolean;
  setShowOrbits: (v: boolean) => void;
  allPlanetsSameOrbit: boolean;
  setAllPlanetsSameOrbit: (v: boolean) => void;
  showTimeRing: boolean;
  setShowTimeRing: (v: boolean) => void;
  timeRingScale: number;
  setTimeRingScale: (v: number) => void;
  showDecanRing: boolean;
  setShowDecanRing: (v: boolean) => void;
  showTermsRing: boolean;
  setShowTermsRing: (v: boolean) => void;
  decanGlyphSize: number;
  setDecanGlyphSize: (v: number) => void;
  termsGlyphSize: number;
  setTermsGlyphSize: (v: number) => void;
  graduationRingWidth: number;
  setGraduationRingWidth: (v: number) => void;
  zodiacRingScale: number;
  setZodiacRingScale: (v: number) => void;
  seasonsRingScale: number;
  setSeasonsRingScale: (v: number) => void;
  decanRingScale: number;
  setDecanRingScale: (v: number) => void;
  termsRingScale: number;
  setTermsRingScale: (v: number) => void;
  zodiacSignSize: number;
  setZodiacSignSize: (v: number) => void;

  // PLANETAS — estados existentes
  showPlanetSpheres: boolean;
  setShowPlanetSpheres: (v: boolean) => void;
  showSignColors: boolean;
  setShowSignColors: (v: boolean) => void;
  clockPlanetSize: number;
  setClockPlanetSize: (v: number) => void;

  // CASAS — estados existentes
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
  houseCuspsColumns?: '1col' | '2col';
  setHouseCuspsColumns?: (v: '1col' | '2col') => void;

  // ASPECTOS — estados existentes
  showAspectLines: boolean;
  setShowAspectLines: (v: boolean) => void;
  aspectSettings: {
    aspects: {
      symbols: boolean;
      types: {
        conjunction: boolean;
        opposition: boolean;
        trine: boolean;
        square: boolean;
        sextile: boolean;
      };
    };
  };
  setAspectSettings: (v: any) => void;
  
  // ASPECTOS SECUNDÁRIOS
  visibleSecondaryAspects: Record<string, boolean>;
  setVisibleSecondaryAspects: (v: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;

  // CAMPO MAGNÉTICO — estados existentes
  showMagneticField: boolean;
  setShowMagneticField: (v: boolean) => void;
  magneticFieldSize: number;
  setMagneticFieldSize: (v: number) => void;
  magneticFieldOpacity: number;
  setMagneticFieldOpacity: (v: number) => void;

  // SISTEMA ZODIACAL — estado existente
  zodiacSystem: 'sidereal' | 'tropical';
  setZodiacSystem: (v: 'sidereal' | 'tropical') => void;
  zodiacColorMode: 'none' | 'element' | 'modality' | 'polarity';
  setZodiacColorMode: (v: 'none' | 'element' | 'modality' | 'polarity') => void;

  // FUNDO — estados existentes
  showStars: boolean;
  setShowStars: (v: boolean) => void;
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
  showAtmosphere: boolean;
  setShowAtmosphere: (v: boolean) => void;
  showConstellations: boolean;
  setShowConstellations: (v: boolean) => void;
  customBackgroundImage: string | null;
  setCustomBackgroundImage: (v: string | null) => void;
  backgroundBrightness: number;
  setBackgroundBrightness: (v: number) => void;
  backgroundImageOpacity: number;
  setBackgroundImageOpacity: (v: number) => void;

  // TEMA — estado existente
  theme: 'dark' | 'light';
  setTheme: (v: 'dark' | 'light') => void;

  // PAINÉIS & ESCALAS — estados existentes
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
  ringLineColor?: string;
  setRingLineColor?: (v: string) => void;
  isLeftPanelVisible: boolean;
  setIsLeftPanelVisible: (v: boolean) => void;
  isRightPanelVisible: boolean;
  setIsRightPanelVisible: (v: boolean) => void;
  celestialSettings: any;
  setCelestialSettings: (v: any) => void;
  houseCuspsLayout: 'minimal' | 'complete';
  setHouseCuspsLayout: (v: 'minimal' | 'complete') => void;
  statsLayout: 'minimal' | 'complete' | 'ultraslim';
  setStatsLayout: (v: 'minimal' | 'complete' | 'ultraslim') => void;
  
  showEnergyChart: boolean;
  setShowEnergyChart: (v: boolean) => void;

  isHeliocentricMode: boolean;
  setIsHeliocentricMode: (v: boolean) => void;

  // Graus
  showDegreeLabels?: boolean;
  setShowDegreeLabels?: (v: boolean) => void;
  degreeLabelFormat?: 'vertical' | 'horizontal';
  setDegreeLabelFormat?: (v: 'vertical' | 'horizontal') => void;
  degreeLabelSize?: number;
  setDegreeLabelSize?: (v: number) => void;
  degreeLabelPosition?: 'responsive' | 'static' | 'staggered';
  setDegreeLabelPosition?: (v: 'responsive' | 'static' | 'staggered') => void;

  // External control of open state
  isOpen?: boolean;
  setIsOpen?: (v: boolean) => void;
  onOpenNatal?: () => void;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

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

const Toggle: React.FC<{ on: boolean; onToggle: () => void; isLight?: boolean }> = ({ on, onToggle, isLight }) => (
  <button
    onClick={(e) => {
        e.stopPropagation();
        onToggle();
    }}
    aria-pressed={on}
    className={`relative w-8 h-[18px] rounded-full flex-shrink-0 transition-colors duration-200 pointer-events-auto z-10 ${
      on ? 'bg-[#D4AF37]' : (isLight ? 'bg-black/15' : 'bg-white/10')
    }`}
  >
    <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-200 ${
      on ? 'left-[14px]' : 'left-0.5 bg-white/70'
    }`} />
  </button>
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
  const valRef = useRef(value);
  valRef.current = value;

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const next = e.deltaY < 0
      ? Math.min(max, +(valRef.current + step).toFixed(2))
      : Math.max(min, +(valRef.current - step).toFixed(2));
    onChange(next);
  }, [min, max, step, onChange]);

  return (
    <div className={`flex items-center rounded-[7px] overflow-hidden flex-shrink-0 ${
      isLight ? 'bg-black/[0.06]' : 'bg-white/[0.06]'
    }`}>
      <button
        onClick={(e) => { e.stopPropagation(); onChange(Math.max(min, +(value - step).toFixed(2))); }}
        className={`w-6 h-[26px] flex items-center justify-center text-sm font-bold transition-colors ${
          isLight ? 'text-black/50 hover:bg-black/10 hover:text-black' : 'text-white/40 hover:bg-white/10 hover:text-white/80'
        }`}
      >−</button>
      <span
        onWheel={handleWheel}
        className={`text-[13px] font-medium min-w-[36px] text-center font-medium tabular-nums cursor-ns-resize hover:text-[#D4AF37] select-none ${
          isLight ? 'text-black/80' : 'text-white/65'
        }`}
        title="Role para ajustar"
      >
        {format(value)}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onChange(Math.min(max, +(value + step).toFixed(2))); }}
        className={`w-6 h-[26px] flex items-center justify-center text-sm font-bold transition-colors ${
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
  <div className={`flex gap-1 rounded-full p-1 ${isLight ? 'bg-black/[0.06]' : 'bg-white/[0.05]'}`}>
    {options.map(o => (
      <button key={o.value} onClick={(e) => { e.stopPropagation(); onChange(o.value); }}
        className={`px-2.5 py-1 text-[12px] rounded-full font-medium transition-all cursor-pointer ${
          value === o.value
            ? 'btn-3d-glow btn-3d-amber font-semibold'
            : (isLight ? 'text-black/60 hover:text-black hover:bg-black/[0.08]' : 'text-white/40 hover:text-white/80 hover:bg-white/[0.07]')
        }`}
      >{o.label}</button>
    ))}
  </div>
);

const LineStyleSel: React.FC<{
  value: 'solid' | 'dashed';
  onChange: (v: 'solid' | 'dashed') => void;
  isLight?: boolean;
}> = ({ value, onChange, isLight }) => (
  <div className="flex gap-1.5">
    {(['solid', 'dashed'] as const).map(s => (
      <button
        key={s}
        onClick={(e) => { e.stopPropagation(); onChange(s); }}
        title={s === 'solid' ? 'Sólida' : 'Tracejada'}
        className={`w-7 h-7 rounded-[6px] border flex items-center justify-center transition-all ${
          value === s
            ? (isLight ? 'bg-[rgba(212,175,55,0.25)] border-[#D4AF37]/60' : 'bg-[rgba(212,175,55,0.22)] border-[rgba(212,175,55,0.5)]')
            : (isLight ? 'bg-black/[0.04] border-black/15 hover:bg-black/[0.08]' : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]')
        }`}
      >
        <svg width="18" height="6">
          <line x1="0" y1="3" x2="18" y2="3"
            stroke={value === s ? '#D4AF37' : (isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.38)')}
            strokeWidth="2"
            strokeDasharray={s === 'dashed' ? '4 2' : undefined}
          />
        </svg>
      </button>
    ))}
  </div>
);

const Scrubber: React.FC<{
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  isLight?: boolean;
}> = ({ value, onChange, min, max, step, format, isLight }) => (
  <div className="flex items-center gap-2 flex-1 min-w-[110px] justify-end">
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-24 h-1.5 rounded-lg appearance-none cursor-pointer accent-[#D4AF37] bg-white/20"
    />
    <span className={`text-[12px] font-mono tabular-nums min-w-[28px] text-right ${isLight ? 'text-black/80 font-medium' : 'text-white/80'}`}>
      {format(value)}
    </span>
  </div>
);

const CtrlRow: React.FC<{ label: string; dim?: boolean; isLight?: boolean; children: React.ReactNode }> = ({ label, dim, isLight, children }) => (
  <div className={`flex items-center justify-between px-[14px] py-[6px] gap-2.5 ${isLight ? 'hover:bg-black/[0.03]' : 'hover:bg-white/[0.02]'}`}>
    <span className={`text-[13px] font-normal flex-1 whitespace-nowrap ${
      dim 
        ? (isLight ? 'text-black/40' : 'text-white/30') 
        : (isLight ? 'text-black/80 font-medium' : 'text-white/60')
    }`}>{label}</span>
    {children}
  </div>
);

const SubSec: React.FC<{ children: React.ReactNode; isLight?: boolean }> = ({ children, isLight }) => (
  <div className={`text-[11px] font-semibold uppercase tracking-[0.08em] px-[14px] pt-3 pb-1 ${
    isLight ? 'text-black/50' : 'text-white/30'
  }`}>{children}</div>
);

const SDivider: React.FC<{ isLight?: boolean }> = ({ isLight }) => (
  <div className={`h-px my-1 mx-2 ${isLight ? 'bg-black/[0.08]' : 'bg-white/[0.06]'}`} />
);

// ─── OPTIONS RAIL ─────────────────────────────────────────────
export const OptionsRail: React.FC<OptionsRailProps> = (props) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = props.isOpen !== undefined ? props.isOpen : internalIsOpen;
  const setIsOpen = (v: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof v === 'function' ? v(isOpen) : v;
    if (props.setIsOpen) props.setIsOpen(nextVal);
    else setInternalIsOpen(nextVal);
  };
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close popup if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        // Keep active popup state managed cleanly
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePopup = (id: string) => {
    if (!isOpen) setIsOpen(true);
    setActivePopup(prev => prev === id ? null : id);
  };

  const menuItems: Array<{ id: string; label: string; icon: string; isAction?: boolean; onClick?: () => void }> = [
    { id: 'paineis', label: 'Tamanho dos Painéis', icon: 'ti-adjustments-horizontal' },
    { id: 'signos', label: 'Signos', icon: 'ti-circle-dotted' },
    { id: 'fundo', label: 'Plano de Fundo', icon: 'ti-photo' },
  ];

  const secondaryItems = [
    { 
      id: 'grafico', 
      label: 'Gráfico Emocional', 
      icon: 'ti-chart-dots', 
      isToggle: true, 
      active: props.showEnergyChart, 
      onToggle: () => props.setShowEnergyChart(!props.showEnergyChart) 
    },
    { 
      id: 'heliocentrico', 
      label: 'Heliocêntrico', 
      icon: 'ti-sun', 
      isToggle: true, 
      active: props.isHeliocentricMode, 
      onToggle: () => props.setIsHeliocentricMode(!props.isHeliocentricMode) 
    },
    {
      id: 'tema',
      label: props.theme === 'light' ? 'Modo Claro' : 'Modo Escuro',
      icon: props.theme === 'light' ? 'ti-sun' : 'ti-moon',
      isToggle: true,
      active: props.theme === 'light',
      onToggle: () => props.setTheme(props.theme === 'light' ? 'dark' : 'light')
    },
    { 
      id: 'outros', 
      label: 'Outros', 
      icon: 'ti-dots',
      isToggle: false
    },
  ];

  const allMenuItems = [...menuItems, ...secondaryItems.filter(i => !i.isToggle)];
  const activeItem = allMenuItems.find(item => item.id === activePopup);

  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const dragRef = useRef<{ 
    startX: number; 
    startY: number; 
    startLeft: number; 
    startTop: number; 
    isDragging: boolean;
  } | null>(null);

  const handlePointerDownHeader = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, select, svg, path')) return;

    const rect = toolbarRef.current?.getBoundingClientRect();
    const currentWidth = toolbarRef.current?.offsetWidth || (isOpen ? 192 : 56);
    const currentLeft = rect ? rect.left : (window.innerWidth - (props.isRightPanelVisible ? 330 : 16) - currentWidth);
    const currentTop = rect ? rect.top : 56;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: currentLeft,
      startTop: currentTop,
      isDragging: false
    };

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMoveHeader = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    // Movement threshold of >5px before engaging drag state
    if (Math.hypot(dx, dy) > 5) {
      dragRef.current.isDragging = true;
    }

    if (dragRef.current.isDragging) {
      const toolbarWidth = toolbarRef.current?.offsetWidth || (isOpen ? 192 : 56);
      const toolbarHeight = toolbarRef.current?.offsetHeight || 300;

      const newLeft = dragRef.current.startLeft + dx;
      const newTop = dragRef.current.startTop + dy;

      // Strict clamping inside viewport bounds with margin
      const clampedLeft = Math.max(12, Math.min(newLeft, window.innerWidth - toolbarWidth - 12));
      const clampedTop = Math.max(12, Math.min(newTop, window.innerHeight - Math.min(toolbarHeight, 100) - 12));

      setPos({ left: clampedLeft, top: clampedTop });
    }
  };

  const handlePointerUpHeader = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const wasDragging = dragRef.current.isDragging;
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (!wasDragging) {
      setIsOpen(prev => !prev);
    }
  };

  // Re-clamp position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (!pos || !toolbarRef.current) return;
      const rect = toolbarRef.current.getBoundingClientRect();
      const clampedLeft = Math.max(12, Math.min(pos.left, window.innerWidth - rect.width - 12));
      const clampedTop = Math.max(12, Math.min(pos.top, window.innerHeight - Math.min(rect.height, 100) - 12));
      if (clampedLeft !== pos.left || clampedTop !== pos.top) {
        setPos({ left: clampedLeft, top: clampedTop });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pos]);

  // Determine toolbar positions & popup placement
  const toolbarWidth = isOpen ? 192 : 56;
  const toolbarLeft = pos ? pos.left : (window.innerWidth - (props.isRightPanelVisible ? 330 : 16) - toolbarWidth);
  const toolbarTop = pos ? pos.top : 56;

  const isLeftPlacement = toolbarLeft < 360;
  const isBottomPlacement = toolbarTop > window.innerHeight - 450;

  const isLight = props.theme === 'light';

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      ref={toolbarRef}
      style={pos ? { position: 'fixed', left: `${pos.left}px`, top: `${pos.top}px`, right: 'auto', bottom: 'auto', zIndex: 9995 } : { zIndex: 9995 }}
      className={`fixed top-14 z-[9995] flex flex-col liquid-glass rounded-2xl transition-[width] duration-200 font-sans w-56 shadow-2xl overflow-hidden border ${
        isLight ? 'bg-white/95 border-black/15 text-neutral-900' : 'bg-[#06060a]/95 border-white/15 text-white'
      } ${pos ? '' : 'right-4 sm:right-16'}`}
    >
      {/* Header Options (com Arraste) */}
      <div 
        className={`h-10 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing border-b select-none rounded-t-2xl transition-colors ${
          isLight ? 'border-black/[0.08] bg-black/[0.02] hover:bg-black/[0.05]' : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]'
        }`}
        onPointerDown={handlePointerDownHeader}
        onPointerMove={handlePointerMoveHeader}
        onPointerUp={handlePointerUpHeader}
        title="Arrastar Barra de Ferramentas"
      >
        {/* Grip Icon */}
        <div className={`mr-2 shrink-0 ${isLight ? 'text-black/40 hover:text-black/70' : 'text-white/30 hover:text-white/60'}`}>
          <svg className="w-3 h-4" viewBox="0 0 10 16" fill="currentColor">
            <circle cx="2" cy="3" r="1.2" />
            <circle cx="8" cy="3" r="1.2" />
            <circle cx="2" cy="8" r="1.2" />
            <circle cx="8" cy="8" r="1.2" />
            <circle cx="2" cy="13" r="1.2" />
            <circle cx="8" cy="13" r="1.2" />
          </svg>
        </div>

        <span className={`text-xs font-bold uppercase tracking-wider select-none mr-auto font-sans ${isLight ? 'text-black/80' : 'text-white/80'}`}>Menu de Opções</span>

        {/* Botão Switch Rápido Tema Claro/Escuro */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            props.setTheme(props.theme === 'light' ? 'dark' : 'light');
          }}
          className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:scale-110 active:scale-90 mr-2.5 cursor-pointer ${
            isLight 
              ? 'bg-amber-100/80 text-amber-600 hover:bg-amber-200/90 border border-amber-200/50' 
              : 'bg-indigo-950/40 text-indigo-400 hover:bg-indigo-950/60 border border-indigo-500/20'
          }`}
          title={isLight ? "Mudar para Tema Escuro" : "Mudar para Tema Claro"}
        >
          {isLight ? (
            <i className="ti ti-sun text-[13px] font-bold" />
          ) : (
            <i className="ti ti-moon text-[13px] font-bold" />
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
            isLight ? 'text-black/60 hover:text-black hover:bg-black/10' : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
          title="Fechar Opções"
        >
          <i className="ti ti-x text-sm" />
        </button>
      </div>

      {/* Botões do Menu */}
      <div className="flex flex-col py-1.5 font-sans">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => item.isAction ? item.onClick?.() : togglePopup(item.id)}
            className={`w-full h-10 flex items-center px-3 transition-colors relative group ${
              activePopup === item.id 
                ? (isLight ? 'bg-[#D4AF37]/25 text-[#785C0D] font-bold' : 'bg-[#D4AF37]/15 text-[#D4AF37] font-semibold')
                : (isLight ? 'text-black/70 hover:text-black hover:bg-black/[0.05]' : 'text-white/60 hover:text-white/95 hover:bg-white/[0.04]')
            }`}
            title={item.label}
          >
            <i className={`ti ${item.icon} text-lg w-6 flex justify-center`} />
            {isOpen && <span className="ml-2.5 text-xs font-medium tracking-wide">{item.label}</span>}
            {isOpen && activePopup === item.id && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] ml-auto animate-pulse" />
            )}
          </button>
        ))}

        {/* Divisor */}
        <div className={`h-px my-1 mx-3 ${isLight ? 'bg-black/[0.08]' : 'bg-white/[0.07]'}`} />

        {/* Secundários */}
        {secondaryItems.map(item => {
          const isActive = item.isToggle ? item.active : activePopup === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isToggle) {
                  item.onToggle();
                } else {
                  togglePopup(item.id);
                }
              }}
              className={`w-full h-9 flex items-center px-3 transition-colors ${
                isActive 
                  ? (isLight ? 'bg-[#D4AF37]/25 text-[#785C0D] font-bold' : 'bg-[#D4AF37]/15 text-[#D4AF37] font-semibold')
                  : (isLight ? 'text-black/60 hover:text-black hover:bg-black/[0.05]' : 'text-white/45 hover:text-white/85 hover:bg-white/[0.04]')
              }`}
              title={item.label}
            >
              <i className={`ti ${item.icon} text-base w-6 flex justify-center`} />
              {isOpen && <span className="ml-2.5 text-xs font-medium flex-1 text-left">{item.label}</span>}
              {isOpen && isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] ml-auto shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. JANELA FLOATING POPUP (ÂNCORA FIXA À BARRA DE FERRAMENTAS) */}
      <AnimatePresence mode="wait">
        {activeItem && (
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, x: isLeftPlacement ? -12 : 12, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: isLeftPlacement ? -12 : 12, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`absolute w-72 max-h-[calc(100vh-80px)] liquid-glass rounded-2xl overflow-hidden flex flex-col z-[9996] font-sans shadow-2xl ${
              isLight ? 'text-neutral-900' : 'text-brand-text'
            } ${
              isLeftPlacement 
                ? (isBottomPlacement ? 'left-[calc(100%+14px)] bottom-0 origin-bottom-left' : 'left-[calc(100%+14px)] top-0 origin-top-left')
                : (isBottomPlacement ? 'right-[calc(100%+14px)] bottom-0 origin-bottom-right' : 'right-[calc(100%+14px)] top-0 origin-top-right')
            }`}
          >
            {/* Header da Janela Inspector */}
            <div className={`px-3.5 py-2.5 border-b flex items-center justify-between ${
              isLight ? 'border-black/[0.08] bg-black/[0.03]' : 'border-white/[0.08] bg-white/[0.03]'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <i className={`ti ${activeItem.icon} text-base`} />
                </div>
                <div>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-black/90' : 'text-white/95'}`}>{activeItem.label}</h4>
                  <p className={`text-[10px] font-mono ${isLight ? 'text-black/50' : 'text-white/40'}`}>Controles & Ferramentas</p>
                </div>
              </div>
              <button 
                onClick={() => setActivePopup(null)} 
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                  isLight ? 'hover:bg-black/10 text-black/50 hover:text-black' : 'hover:bg-white/10 text-white/40 hover:text-white'
                }`}
                title="Fechar"
              >
                <i className="ti ti-x text-sm" />
              </button>
            </div>

            {/* Conteúdo Dinâmico por Categoria */}
            <div className="max-h-[65vh] overflow-y-auto custom-scrollbar p-1">
              {activeItem.id === 'paineis' && (
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
              )}
              {activeItem.id === 'ponteiro' && (
                <>
                  <CtrlRow label="Mostrar Ponteiro" isLight={isLight}>
                    <Toggle on={props.pointerEnabled} onToggle={() => props.setPointerEnabled(!props.pointerEnabled)} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Estilo" isLight={isLight}>
                    <LineStyleSel value={props.pointerStyle === 'dashed' ? 'dashed' : 'solid'} onChange={v => props.setPointerStyle(v)} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Opacidade" isLight={isLight}>
                    <Stepper value={Math.round(props.pointerOpacity * 100)} onChange={v => props.setPointerOpacity(v / 100)} min={0} max={100} step={5} format={v => `${v}%`} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Espessura" isLight={isLight}>
                    <Stepper value={props.pointerThickness} onChange={props.setPointerThickness} min={1} max={5} step={0.5} format={v => `${v}px`} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Minimalista" isLight={isLight}>
                    <Toggle on={props.pointerShowGradLine} onToggle={() => props.setPointerShowGradLine(!props.pointerShowGradLine)} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Ponteiro completo" isLight={isLight}>
                    <Toggle on={props.pointerFull} onToggle={() => props.setPointerFull(!props.pointerFull)} isLight={isLight} />
                  </CtrlRow>
                  <SDivider isLight={isLight} />
                  <SubSec isLight={isLight}>Pontas do Ponteiro</SubSec>
                  <CtrlRow label="Cabeça" isLight={isLight}>
                    <SegSel options={[{label:'Seta', value:'arrow'}, {label:'Círculo', value:'circle'}, {label:'Quadrado', value:'square'}, {label:'Off', value:'none'}]} value={props.pointerHead} onChange={v => props.setPointerHead(v as PointerHeadTail)} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Cauda" isLight={isLight}>
                    <SegSel options={[{label:'Seta', value:'arrow'}, {label:'Círculo', value:'circle'}, {label:'Quadrado', value:'square'}, {label:'Off', value:'none'}]} value={props.pointerTail} onChange={v => props.setPointerTail(v as PointerHeadTail)} isLight={isLight} />
                  </CtrlRow>
                </>
              )}

              {activeItem.id === 'signos' && (
                <>
                  <CtrlRow label="Marcar Casas" isLight={isLight}>
                    <Toggle on={props.showSignLines} onToggle={() => props.setShowSignLines(!props.showSignLines)} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Cores dos Signos" isLight={isLight}>
                    <SegSel 
                      options={[
                        { label: 'Elementos', value: 'element' },
                        { label: 'Polaridade', value: 'polarity' },
                        { label: 'Modalidade', value: 'modality' }
                      ]} 
                      value={props.zodiacColorMode === 'none' ? 'element' : props.zodiacColorMode} 
                      onChange={v => {
                        props.setZodiacColorMode(v as 'element' | 'polarity' | 'modality');
                        props.setShowSignColors(true);
                      }} 
                      isLight={isLight} 
                    />
                  </CtrlRow>
                  <CtrlRow label="Sistema" isLight={isLight}>
                    <SegSel options={[{label:'Tropical', value:'tropical'}, {label:'Sideral', value:'sidereal'}]} value={props.zodiacSystem} onChange={v => props.setZodiacSystem(v as 'tropical' | 'sidereal')} isLight={isLight} />
                  </CtrlRow>
                </>
              )}

              {activeItem.id === 'casas' && (
                <>
                  <CtrlRow label="Linhas das Casas" isLight={isLight}>
                    <Toggle on={props.showHouseLines} onToggle={() => props.setShowHouseLines(!props.showHouseLines)} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Marcadores (1-12)" isLight={isLight}>
                    <Toggle on={props.showHouseMarkers} onToggle={() => props.setShowHouseMarkers(!props.showHouseMarkers)} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Estilo das Linhas" isLight={isLight}>
                    <LineStyleSel value={props.houseLineFormat === 'dashed' ? 'dashed' : 'solid'} onChange={v => props.setHouseLineFormat(v)} isLight={isLight} />
                  </CtrlRow>

                  <SDivider isLight={isLight} />
                  <SubSec isLight={isLight}>Linhas Principais (AS, DC, IC, MC)</SubSec>
                  <CtrlRow label="Cor Principal" isLight={isLight}>
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
                  <CtrlRow label="Espessura Principal" isLight={isLight}>
                    <Stepper value={props.mainHouseLineThickness ?? 1.5} onChange={v => props.setMainHouseLineThickness?.(v)} min={0.5} max={6} step={0.5} format={v => `${v}px`} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Opacidade Principal" isLight={isLight}>
                    <Stepper value={Math.round((props.mainHouseLineOpacity ?? 1.0) * 100)} onChange={v => props.setMainHouseLineOpacity?.(v / 100)} min={0} max={100} step={5} format={v => `${v}%`} isLight={isLight} />
                  </CtrlRow>

                  <SDivider isLight={isLight} />
                  <SubSec isLight={isLight}>Linhas Secundárias</SubSec>
                  <CtrlRow label="Cor Secundária" isLight={isLight}>
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
                  <CtrlRow label="Espessura Secundária" isLight={isLight}>
                    <Stepper value={props.houseLineThickness} onChange={props.setHouseLineThickness} min={0.5} max={4} step={0.5} format={v => `${v}px`} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Opacidade Secundária" isLight={isLight}>
                    <Stepper value={Math.round(props.houseLineOpacity * 100)} onChange={v => props.setHouseLineOpacity(v / 100)} min={0} max={100} step={5} format={v => `${v}%`} isLight={isLight} />
                  </CtrlRow>

                  <SDivider isLight={isLight} />
                  <CtrlRow label="Formato dos Números" isLight={isLight}>
                    <SegSel options={[{label:'1, 2, 3', value:'arabic'}, {label:'I, II, III', value:'roman'}]} value={props.houseFormat} onChange={v => props.setHouseFormat(v as 'arabic' | 'roman')} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Layout Painel" isLight={isLight}>
                    <SegSel options={[{label:'2 Colunas', value:'2col'}, {label:'1 Coluna', value:'1col'}]} value={props.houseCuspsColumns || '2col'} onChange={v => props.setHouseCuspsColumns?.(v as '1col' | '2col')} isLight={isLight} />
                  </CtrlRow>

                  <SDivider isLight={isLight} />
                  <SubSec isLight={isLight}>Anel dos Marcadores (Temporário)</SubSec>
                  <CtrlRow label="Cor do Anel" isLight={isLight}>
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
                  <CtrlRow label="Transparência" isLight={isLight}>
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
                </>
              )}

              {activeItem.id === 'planetas' && (
                <>
                  <CtrlRow label="Esferas" isLight={isLight}>
                    <Toggle on={props.showPlanetSpheres} onToggle={() => props.setShowPlanetSpheres(!props.showPlanetSpheres)} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Tamanho Relativo" isLight={isLight}>
                    <Scrubber value={props.clockPlanetSize} onChange={props.setClockPlanetSize} min={0.5} max={3} step={0.1} format={v => `${v.toFixed(1)}x`} isLight={isLight} />
                  </CtrlRow>
                </>
              )}

              {activeItem.id === 'aspectos' && (
                <>
                  <CtrlRow label="Mostrar Linhas" isLight={isLight}>
                    <Toggle on={props.showAspectLines} onToggle={() => props.setShowAspectLines(!props.showAspectLines)} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Símbolos" isLight={isLight}>
                    <Toggle on={props.aspectSettings?.aspects?.symbols ?? true} onToggle={() => props.setAspectSettings((prev: any) => ({ ...prev, aspects: { ...prev.aspects, symbols: !prev.aspects.symbols } }))} isLight={isLight} />
                  </CtrlRow>
                  <SDivider isLight={isLight} />
                  <SubSec isLight={isLight}>Aspectos Principais</SubSec>
                  {ALL_ASPECTS.filter(a => a.primary).map(a => {
                    const isChecked = props.aspectSettings?.aspects?.types?.[a.key as keyof typeof props.aspectSettings.aspects.types] ?? true;
                    return (
                      <div key={a.key} className={`flex items-center px-[14px] py-[5px] gap-2.5 rounded-lg cursor-pointer transition-colors ${
                        isLight ? 'hover:bg-black/[0.05]' : 'hover:bg-white/[0.04]'
                      }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          props.setAspectSettings((prev: any) => ({
                            ...prev,
                            aspects: {
                              ...prev.aspects,
                              types: {
                                ...prev.aspects?.types,
                                [a.key]: !(prev.aspects?.types?.[a.key as keyof typeof prev.aspects.types] ?? true)
                              }
                            }
                          }));
                        }}>
                        <span style={{ color: a.color }} className="text-base w-[22px] text-center font-bold">{a.sym}</span>
                        <span className={`text-[13px] flex-1 ${isLight ? 'text-black/80 font-medium' : 'text-white/70'}`}>{a.label}</span>
                        <span className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all flex-shrink-0 ${
                          isChecked
                          ? 'bg-[#D4AF37] border-[#D4AF37] after:content-["✓"] after:text-[10px] after:text-[#040004] after:font-bold'
                          : (isLight ? 'border-black/30' : 'border-white/20')
                        }`} />
                      </div>
                    );
                  })}
                  <SDivider isLight={isLight} />
                  <SubSec isLight={isLight}>Aspectos Secundários</SubSec>
                  {ALL_ASPECTS.filter(a => !a.primary).map(a => {
                    const isChecked = !!props.visibleSecondaryAspects[a.key];
                    return (
                      <div key={a.key} className={`flex items-center px-[14px] py-[5px] gap-2.5 rounded-lg cursor-pointer transition-colors ${
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
                        <span style={{ color: a.color }} className="text-base w-[22px] text-center font-bold">{a.sym}</span>
                        <span className={`text-[13px] flex-1 ${isLight ? 'text-black/80 font-medium' : 'text-white/70'}`}>{a.label}</span>
                        <span className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all flex-shrink-0 ${
                          isChecked
                          ? 'bg-[#D4AF37] border-[#D4AF37] after:content-["✓"] after:text-[10px] after:text-[#040004] after:font-bold'
                          : (isLight ? 'border-black/30' : 'border-white/20')
                        }`} />
                      </div>
                    );
                  })}
                </>
              )}

              {activeItem.id === 'graus' && (
                <>
                  <CtrlRow label="Graus nos Planetas" isLight={isLight}>
                    <Toggle 
                      on={props.showDegreeLabels ?? props.celestialSettings?.degrees ?? true} 
                      onToggle={() => {
                        props.setShowDegreeLabels?.(!props.showDegreeLabels);
                        props.setCelestialSettings?.((prev: any) => ({
                          ...prev,
                          degrees: !(prev?.degrees ?? true)
                        }));
                      }} 
                      isLight={isLight} 
                    />
                  </CtrlRow>
                  <CtrlRow label="Formato dos Graus" isLight={isLight}>
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
                  <CtrlRow label="Anti-Sobreposição" isLight={isLight}>
                    <SegSel 
                      options={[
                        { label: 'Auto', value: 'responsive' },
                        { label: 'Estático', value: 'static' },
                        { label: 'Escalonado', value: 'staggered' },
                      ]} 
                      value={props.degreeLabelPosition || 'responsive'} 
                      onChange={v => props.setDegreeLabelPosition?.(v as any)} 
                      isLight={isLight} 
                    />
                  </CtrlRow>
                  <CtrlRow label="Tamanho do Texto" isLight={isLight}>
                    <Stepper 
                      value={props.degreeLabelSize || 18} 
                      onChange={v => props.setDegreeLabelSize?.(v)} 
                      min={10} 
                      max={36} 
                      step={1} 
                      format={v => `${v}px`} 
                      isLight={isLight} 
                    />
                  </CtrlRow>
                  <SDivider isLight={isLight} />
                  <CtrlRow label="Relógio 24h" isLight={isLight}>
                    <Toggle on={props.showTimeRing} onToggle={() => props.setShowTimeRing(!props.showTimeRing)} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Escala do Relógio" isLight={isLight}>
                    <Stepper value={props.timeRingScale} onChange={props.setTimeRingScale} min={0.5} max={2} step={0.1} format={v => `${v.toFixed(1)}x`} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Espessura (Borda)" isLight={isLight}>
                    <Stepper value={props.graduationRingWidth} onChange={props.setGraduationRingWidth} min={2} max={30} step={1} format={v => `${v}px`} isLight={isLight} />
                  </CtrlRow>
                  <SDivider isLight={isLight} />
                  <SubSec isLight={isLight}>Anéis Adicionais</SubSec>
                  <CtrlRow label="Decanatos" isLight={isLight}>
                    <Toggle on={props.showDecanRing} onToggle={() => props.setShowDecanRing(!props.showDecanRing)} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Termos" isLight={isLight}>
                    <Toggle on={props.showTermsRing} onToggle={() => props.setShowTermsRing(!props.showTermsRing)} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Anel de Estações" isLight={isLight}>
                    <Toggle on={props.showSeasonsRing} onToggle={() => props.setShowSeasonsRing(!props.showSeasonsRing)} isLight={isLight} />
                  </CtrlRow>
                </>
              )}

              {activeItem.id === 'fundo' && (
                <>
                  <div className="px-3.5 py-2 flex flex-col gap-1.5">
                    <label className={`text-[12px] font-medium ${isLight ? 'text-black/70' : 'text-white/60'}`}>Imagem de Fundo</label>
                    <div className="flex items-center gap-2">
                      <label className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                        isLight ? 'bg-black/5 border-black/15 hover:bg-black/10' : 'bg-white/5 border-white/15 hover:bg-white/10'
                      }`}>
                        <i className="ti ti-upload text-xs" />
                        <span>Carregar Imagem</span>
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => props.setCustomBackgroundImage(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} className="hidden" />
                      </label>
                      {props.customBackgroundImage && (
                        <button
                          onClick={() => props.setCustomBackgroundImage(null)}
                          className="px-2 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all cursor-pointer"
                          title="Remover Imagem"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                  <CtrlRow label="Brilho do Fundo" isLight={isLight}>
                    <Stepper value={props.backgroundBrightness} onChange={props.setBackgroundBrightness} min={0} max={100} step={5} format={v => `${v}%`} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Opacidade da Imagem" isLight={isLight}>
                    <Stepper value={props.backgroundImageOpacity} onChange={props.setBackgroundImageOpacity} min={0} max={100} step={5} format={v => `${v}%`} isLight={isLight} />
                  </CtrlRow>
                  <SDivider isLight={isLight} />
                  <SubSec isLight={isLight}>Elementos de Fundo</SubSec>
                  <CtrlRow label="Constelações" isLight={isLight}>
                    <Toggle on={props.showConstellations} onToggle={() => props.setShowConstellations(!props.showConstellations)} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Estrelas" isLight={isLight}>
                    <Toggle on={props.showStars} onToggle={() => props.setShowStars(!props.showStars)} isLight={isLight} />
                  </CtrlRow>
                  {props.showStars && props.setStarCount && (
                    <>
                      <CtrlRow label="Preset de Densidade" isLight={isLight}>
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
                      <CtrlRow label="Qtd. de Estrelas" isLight={isLight}>
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
                      {props.setStarBrightness && (
                        <CtrlRow label="Brilho das Estrelas" isLight={isLight}>
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
                      {props.setStarTwinkleMode && (
                        <CtrlRow label="Modo Cintilação" isLight={isLight}>
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
                        <CtrlRow label="Intensidade Cintilar" isLight={isLight}>
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
                        <CtrlRow label="Velocidade Cintilar" isLight={isLight}>
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
                      {props.setStarMeteorFrequency && (
                        <CtrlRow label="Estrelas Cadentes" isLight={isLight}>
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
                        <CtrlRow label="Glow da Nebulosa" isLight={isLight}>
                          <Toggle
                            on={props.starNebulaGlow ?? true}
                            onToggle={() => props.setStarNebulaGlow!(!(props.starNebulaGlow ?? true))}
                            isLight={isLight}
                          />
                        </CtrlRow>
                      )}
                    </>
                  )}
                  <SDivider isLight={isLight} />
                  <SubSec isLight={isLight}>Tema Visual</SubSec>
                  <CtrlRow label="Tema" isLight={isLight}>
                    <SegSel options={[{label:'Escuro', value:'dark'}, {label:'Claro', value:'light'}]} value={props.theme} onChange={v => props.setTheme(v as 'dark' | 'light')} isLight={isLight} />
                  </CtrlRow>
                </>
              )}

              {activeItem.id === 'outros' && (
                <>
                  <CtrlRow label="Campo Magnético" isLight={isLight}>
                    <Toggle on={props.showMagneticField} onToggle={() => props.setShowMagneticField(!props.showMagneticField)} isLight={isLight} />
                  </CtrlRow>
                  <CtrlRow label="Intensidade Magnética" isLight={isLight}>
                    <Stepper value={Math.round(props.magneticFieldOpacity * 100)} onChange={v => props.setMagneticFieldOpacity(v / 100)} min={0} max={100} step={5} format={v => `${v}%`} isLight={isLight} />
                  </CtrlRow>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
