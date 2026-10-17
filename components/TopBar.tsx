import React, { useState } from 'react';

export interface TopBarProps {
  exportData?: any;
  showConstellations?: boolean;
  setShowConstellations?: (v: boolean) => void;
  showStars?: boolean;
  setShowStars?: (v: boolean) => void;
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
  theme?: 'dark' | 'light';
  setTheme?: (v: 'dark' | 'light') => void;
  customBackgroundImage?: string | null;
  setCustomBackgroundImage?: (v: string | null) => void;
  backgroundBrightness?: number;
  setBackgroundBrightness?: (v: number) => void;
  backgroundImageOpacity?: number;
  setBackgroundImageOpacity?: (v: number) => void;

  showAtmosphere?: boolean;
  onToggleAtmosphere?: () => void;

  pointerEnabled?: boolean;
  setPointerEnabled?: (v: boolean) => void;
  pointerStyle?: 'solid' | 'dashed' | 'minimal';
  setPointerStyle?: (v: 'solid' | 'dashed' | 'minimal') => void;
  pointerThickness?: number;
  setPointerThickness?: (v: number) => void;
  pointerOpacity?: number;
  setPointerOpacity?: (v: number) => void;
  pointerHead?: any;
  setPointerHead?: (v: any) => void;
  pointerTail?: any;
  setPointerTail?: (v: any) => void;
  pointerShowGradLine?: boolean;
  setPointerShowGradLine?: (v: boolean) => void;
  pointerFull?: boolean;
  setPointerFull?: (v: boolean) => void;

  showAspectLines?: boolean;
  setShowAspectLines?: (v: boolean) => void;
  aspectSettings?: any;
  setAspectSettings?: (v: any) => void;
  visibleSecondaryAspects?: Record<string, boolean>;
  setVisibleSecondaryAspects?: (v: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;

  showOrbits?: boolean;
  setShowOrbits?: (v: boolean) => void;
  allPlanetsSameOrbit?: boolean;
  setAllPlanetsSameOrbit?: (v: boolean) => void;

  showDegreeLabels?: boolean;
  setShowDegreeLabels?: (v: boolean | ((prev: boolean) => boolean)) => void;
  degreeLabelSize?: number;
  setDegreeLabelSize?: (v: number) => void;
  degreeLabelPosition?: 'responsive' | 'static' | 'callout' | 'staggered';
  setDegreeLabelPosition?: (v: 'responsive' | 'static' | 'callout' | 'staggered') => void;
  degreeLabelFormat?: 'vertical' | 'horizontal';
  setDegreeLabelFormat?: (v: 'vertical' | 'horizontal') => void;

  showHouseLines?: boolean;
  setShowHouseLines?: (v: boolean) => void;
  showHouseMarkers?: boolean;
  setShowHouseMarkers?: (v: boolean) => void;
  houseLineThickness?: number;
  setHouseLineThickness?: (v: number) => void;
  houseLineOpacity?: number;
  setHouseLineOpacity?: (v: number) => void;
  houseLineColor?: string;
  setHouseLineColor?: (v: string) => void;
  mainHouseLineThickness?: number;
  setMainHouseLineThickness?: (v: number) => void;
  mainHouseLineOpacity?: number;
  setMainHouseLineOpacity?: (v: number) => void;
  mainHouseLineColor?: string;
  setMainHouseLineColor?: (v: string) => void;
  houseFormat?: 'arabic' | 'roman';
  setHouseFormat?: (v: 'arabic' | 'roman') => void;
  houseLineFormat?: 'solid' | 'dashed';
  setHouseLineFormat?: (v: 'solid' | 'dashed') => void;
  houseCuspsColumns?: '1col' | '2col';
  setHouseCuspsColumns?: (v: '1col' | '2col') => void;

  showDecanRing?: boolean;
  setShowDecanRing?: (v: boolean | ((prev: boolean) => boolean)) => void;
  showTermsRing?: boolean;
  setShowTermsRing?: (v: boolean | ((prev: boolean) => boolean)) => void;
  showSeasonsRing?: boolean;
  setShowSeasonsRing?: (v: boolean | ((prev: boolean) => boolean)) => void;
  showTimeRing?: boolean;
  setShowTimeRing?: (v: boolean | ((prev: boolean) => boolean)) => void;
  timeRingScale?: number;
  setTimeRingScale?: (v: number) => void;
  ringLineColor?: string;
  setRingLineColor?: (v: string) => void;
  graduationRingWidth?: number;
  setGraduationRingWidth?: (v: number) => void;
  zodiacRingScale?: number;
  setZodiacRingScale?: (v: number) => void;
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
  zodiacSignSize?: number;
  setZodiacSignSize?: (v: number) => void;
  zodiacColorMode?: 'none' | 'element' | 'modality' | 'polarity';
  setZodiacColorMode?: (v: 'element' | 'polarity' | 'modality') => void;
  showSignColors?: boolean;
  setShowSignColors?: (v: boolean) => void;
  zodiacSystem?: 'tropical' | 'sidereal';
  setZodiacSystem?: (v: 'tropical' | 'sidereal') => void;

  showTransitChart?: boolean;
  setShowTransitChart?: (v: boolean) => void;
  isHeliocentricMode?: boolean;
  setIsHeliocentricMode?: (v: boolean) => void;

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
  clockPlanetSize?: number;
  setClockPlanetSize?: (v: number) => void;

  // Docks layout
  leftDockWidth?: number;
  isLeftDockOpen?: boolean;
  panelStates?: Record<string, { isOpen: boolean; isCollapsed: boolean }>;
  onReopenPanel?: (panelId: 'celestial' | 'statistics' | 'aspects' | 'cusps') => void;

  // Action buttons
  onOpenSettings?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onOpenAccount?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isOptionsRailOpen?: boolean;
  isQuickToolsSidebarOpen?: boolean;
  onToggleQuickToolsSidebar?: () => void;

  // Moon Card
  celestialData?: any;
  currentTime?: Date;
  location?: any;
  onOpenLunarCalendar?: () => void;

  // New Date Actions
  onSetTime?: (date: Date) => void;
  onSetNatalTime?: (date: Date) => void;
  onOpenNatal?: () => void;
  natalTime?: Date | null;
  onClearNatal?: () => void;

  isFreeTier?: boolean;
  userPlan?: 'free' | 'monthly' | 'lifetime';
  isAdmin?: boolean;
  isAuthenticated?: boolean;
  onOpenLogin?: () => void;
  onOpenPaymentPlans?: () => void;
}

export const TopBar: React.FC<TopBarProps> = (props) => {
  const [logoError, setLogoError] = useState(false);
  const isLight = props.theme === 'light';

  const PANEL_CONFIGS: { id: 'celestial' | 'statistics' | 'aspects' | 'cusps'; label: string; icon: string }[] = [
    { id: 'celestial', label: 'Astros', icon: 'ti ti-planet' },
    { id: 'statistics', label: 'Status', icon: 'ti ti-chart-dots' },
    { id: 'aspects', label: 'Aspectos', icon: 'ti ti-star' },
    { id: 'cusps', label: 'Casas', icon: 'ti ti-home' },
  ];

  const closedPanels = PANEL_CONFIGS.filter(p => props.panelStates && !props.panelStates[p.id]?.isOpen);

  // Calculate left offset: immediately to the right of the left docks, respecting the safety margin
  const leftOffset = props.isLeftDockOpen !== false
    ? (props.leftDockWidth ? `${props.leftDockWidth + 16}px` : '285px')
    : '16px';

  // Calculate right offset: immediately to the left of the right dock / lunar calendar
  const rightOffset = (props.isQuickToolsSidebarOpen ? 64 : 8) + (props.rightDockWidth || 245) + 12;

  return (
    <>
      {/* Gradient top overlay for depth and readability (cream in light mode, black in dark mode) */}
      <div className={`fixed top-0 left-0 right-0 h-28 pointer-events-none z-40 ${isLight ? 'bg-gradient-to-b from-[#f4f1ea]/95 via-[#f4f1ea]/50 to-transparent' : 'bg-gradient-to-b from-black/85 via-black/40 to-transparent'}`} />

      {/* Logo Cronógrafo Sideral: Posicionado à direita das docas esquerdas, com o gradiente sideral vibrante */}
      <div 
        className="fixed top-2.5 sm:top-3.5 z-[9990] flex items-center transition-[left] duration-300 ease-out select-none pointer-events-auto"
        style={{ left: leftOffset }}
      >
        <div 
          className="flex flex-col select-none group cursor-pointer"
          style={{ marginLeft: '28px' }}
        >
          <div className="flex items-baseline gap-1.5 leading-none">
            <span 
              className={`font-serif not-italic font-normal tracking-tight ${isLight ? 'text-[#231714]' : 'text-white/95'}`}
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontStyle: 'normal' }}
            >
              Cronógrafo
            </span>
            <span 
              className={`font-bold tracking-[0.14em] uppercase ${isLight ? 'text-[#231714]' : 'text-white'}`}
              style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 'bold' }}
            >
              SIDERAL
            </span>
          </div>
          {/* Linha com as cores vibrantes do gradiente sideral abaixo do nome */}
          <div 
            className="rounded-full transition-all duration-300" 
            style={{
              height: '0.5px',
              width: '80px',
              marginLeft: '103px',
              marginTop: '2px',
              background: 'linear-gradient(90deg, #6366F1 0%, #22D3EE 25%, #FDE047 50%, #FB923C 75%, #EF4444 100%)',
              boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.12)' : '0 0 10px rgba(34, 211, 238, 0.55)'
            }}
          />
        </div>
      </div>

      {/* Pílula do Plano e Painéis Fechados: Ancorados no canto superior direito, na mesma altura do logo */}
      <div 
        className="fixed top-2.5 sm:top-3.5 z-[9990] flex items-center justify-end gap-2 pointer-events-auto select-none max-w-[calc(100vw-380px)] overflow-x-auto no-scrollbar transition-[right] duration-300 ease-out py-0.5"
        style={{ right: `${rightOffset}px` }}
      >
        {/* Pílula do Plano (apenas no plano gratuito) */}
        {props.isFreeTier && (
            <div className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-full ${isLight ? 'bg-white/95 border-[#8b8370]/35 text-[#231714] shadow-[0_3px_10px_-1px_rgba(110,98,75,0.16)]' : 'bg-[#06060a]/95 border border-white/15 text-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.5)]'} backdrop-blur-xl flex items-center gap-2 shrink-0 select-none`}>
                {/* Indicador de status do plano */}
                <div className="relative flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>

                {/* Nome do plano */}
                <div className="flex items-center gap-1 font-manrope text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                    <span className={isLight ? 'text-[#8b8370]' : 'text-white/60'}>Plano:</span>
                    <span className={`font-semibold ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>
                        Gratuito
                    </span>
                </div>

                {/* Divisor */}
                <div className={`w-px h-3 ${isLight ? 'bg-black/15' : 'bg-white/20'} flex-shrink-0`} />

                {/* Botão Entrar / Login */}
                {!props.isAuthenticated && (
                    <button
                        onClick={() => props.onOpenLogin?.()}
                        className={`font-manrope font-bold text-[9.5px] uppercase tracking-wider px-2 py-0.5 rounded-full cursor-pointer transition-all shrink-0 ${isLight ? 'bg-black/5 hover:bg-black/10 text-[#231714]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                        Entrar
                    </button>
                )}

                {/* Botão Upgrade */}
                <button
                    onClick={() => props.onOpenPaymentPlans?.()}
                    className="font-manrope font-bold text-[9.5px] uppercase tracking-wider text-black bg-gradient-to-r from-[#D4AF37] to-[#F5D98A] hover:opacity-90 active:scale-95 px-2.5 py-0.5 rounded-full cursor-pointer transition-all shrink-0 shadow-sm"
                >
                    Upgrade
                </button>
            </div>
        )}

        {closedPanels.map((panel) => (
            <button
              key={panel.id}
              onClick={() => props.onReopenPanel?.(panel.id)}
              className={`flex items-center gap-1.5 px-3 h-7 sm:h-7.5 rounded-full cursor-pointer transition-all active:scale-95 shrink-0 border shadow-md ${
                isLight
                  ? 'bg-gradient-to-b from-[#fbf9f4] to-[#ebe5d8] border-[#8b8370]/35 text-[#231714] shadow-[0_3px_10px_-1px_rgba(110,98,75,0.16)] hover:from-[#ffffff] hover:to-[#ede6d8] hover:border-[#8b8370]/60'
                  : 'btn-3d-glow btn-3d-dark border-white/15 text-white/90 hover:text-white shadow-[0_4px_16px_rgba(0,0,0,0.4)]'
              }`}
              title={`Reabrir painel ${panel.label}`}
            >
              <i className={`${panel.icon} text-xs ${isLight ? 'text-amber-800' : 'text-amber-400'}`} />
              <span
                className={`text-[10px] uppercase tracking-[0.06em] leading-none ${
                  isLight ? 'text-[#231714] font-bold' : 'text-white/90 font-bold'
                }`}
                style={{ fontFamily: 'Verdana, sans-serif' }}
              >
                {panel.label}
              </span>
              <span className={`text-[11px] font-bold leading-none ml-0.5 ${isLight ? 'text-[#8b8370]' : 'text-white/50'}`}>+</span>
            </button>
        ))}
      </div>
    </>
  );
};
