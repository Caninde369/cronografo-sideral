
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n';
import { createPortal } from 'react-dom';
import { ZODIAC_DATA, getZodiacColorClass } from './zodiac';
import { ZODIAC_ICONS, CELESTIAL_GLYPHS, UI_ICONS } from './icons';
import { WidgetId } from '../App';
import { SizeControl, PopupToggle, CompactToggle, MicroToggle } from './Controls';
import { toRoman, formatDegrees } from '../lib/astrology/utils';
import { Tooltip } from './Tooltip';
import { PLANET_DESCRIPTIONS } from './astro-descriptions';

export type CelestialSettings = {
    planets: {
        symbols: boolean;
        glyphs: boolean;
        colors: boolean;
        names: boolean;
        namesColors: boolean;
        namesAbbr: boolean;
    };
    signs: {
        enabled: boolean;
        symbols: boolean;
        colors: boolean;
        abbr: boolean;
    };
    houses: {
        enabled: boolean;
    };
    degrees: boolean;
    degrees_colors?: boolean;
    retrograde: boolean;
};

interface CelestialBodyPanelProps {
    sunEclipticLongitude: number;
    moonEclipticLongitude: number;
    mercuryEclipticLongitude: number;
    marsEclipticLongitude: number;
    venusEclipticLongitude: number;
    jupiterEclipticLongitude: number;
    saturnEclipticLongitude: number;
    neptuneEclipticLongitude: number;
    uranusEclipticLongitude: number;
    plutoEclipticLongitude: number;
    lilithEclipticLongitude: number;
    northNodeEclipticLongitude: number;
    southNodeEclipticLongitude: number;
    chironEclipticLongitude: number;
    ceresEclipticLongitude: number;
    pallasEclipticLongitude: number;
    junoEclipticLongitude: number;
    vestaEclipticLongitude: number;
    partOfFortuneEclipticLongitude: number;
    moonPhase?: number;
    retrogradeStatus: Record<string, boolean>;
    stationaryStatus?: Record<string, boolean>;
    visiblePlanets: Record<string, boolean>;
    onVisibilityChange: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    housePlacements: Record<string, number>;
    selectedPlanets: string[];
    secondarySelectedPlanets?: string[];
    onPlanetClick: (planetId: string) => void;
    onPlanetRightClick: (planetId: string) => void;
    planetDisplayStatus: Record<string, 'active' | 'dimmed' | 'hidden'>;
    dragHandle?: React.ReactNode;
    activeMenu: WidgetId | null;
    setActiveMenu: (id: WidgetId | null) => void;
    hoveredPlanet: string | null;
    hoveredHouse: number | null;
    onClearSelections?: () => void;
    onWidthChange?: (width: number) => void;
    houseFormat: 'arabic' | 'roman';
    onHouseFormatChange: (format: 'arabic' | 'roman') => void;
    scale?: number;
    showPlanetSpheres?: boolean;
    setShowPlanetSpheres?: React.Dispatch<React.SetStateAction<boolean>>;
    showNeedle?: boolean;
    setShowNeedle?: React.Dispatch<React.SetStateAction<boolean>>;
    showOrbits?: boolean;
    setShowOrbits?: React.Dispatch<React.SetStateAction<boolean>>;
    zodiacColorMode?: 'none' | 'element' | 'modality' | 'polarity';
    settings: CelestialSettings;
    onSettingsChange: (settings: CelestialSettings) => void;
    panelPosition?: 'left' | 'right';
    onPanelPositionChange?: (pos: 'left' | 'right') => void;
    planetSize?: number;
    onPlanetSizeChange?: (size: number) => void;
    zodiacSignSize?: number;
    onZodiacSignSizeChange?: (size: number) => void;
    panelScale?: number;
    onPanelScaleChange?: (scale: number) => void;
    activeTab?: 'transit' | 'natal';
    onTabChange?: (tab: 'transit' | 'natal') => void;
    hasNatalDate?: boolean;
    theme?: 'dark' | 'light';
    hideHeader?: boolean;
    menuButtonRef?: React.RefObject<HTMLButtonElement | null>;
    isFreeTier?: boolean;
    isFreeTrial?: boolean;
    onOpenPaymentPlans?: () => void;
}

const PopupMenu: React.FC<{ children: React.ReactNode, onClose: () => void, triggerRef: React.RefObject<HTMLElement | null> }> = ({ children, onClose, triggerRef }) => {
    const [coords, setCoords] = useState<{top: number, left: number} | null>(null);

    useEffect(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const isRightSide = rect.left > window.innerWidth / 2;
            
            setCoords({
                top: rect.top,
                left: isRightSide ? Math.max(12, rect.left - 330) : Math.min(window.innerWidth - 350, rect.right + 12)
            });
        }
    }, [triggerRef]);

    if (!coords) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div 
                className="fixed z-[9999] bg-[#06060a]/98 border border-white/20 shadow-2xl backdrop-blur-2xl rounded-2xl p-3.5 w-80 sm:w-84 animate-in fade-in zoom-in-95 duration-100 font-sans text-brand-text"
                style={{ top: coords.top, left: coords.left }}
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </>,
        document.body
    );
};

const planetColors: Record<string, string> = {
    sun: 'text-amber-300', // Gold
    moon: 'text-slate-200', // Silver
    mercury: 'text-zinc-300', // Steel (Lighter)
    venus: 'text-rose-300', // Rose Gold
    mars: 'text-red-400', // Ruby
    jupiter: 'text-orange-300', // Bronze
    saturn: 'text-yellow-400', // Antique Gold (Brighter)
    uranus: 'text-cyan-300', // Turquoise
    neptune: 'text-indigo-400', // Sapphire
    pluto: 'text-slate-400', // Onyx (Lighter)
    northNode: 'text-teal-200', // Pale Aquamarine
    southNode: 'text-amber-600', // Dark Copper (Brighter)
    lilith: 'text-fuchsia-400', // Dark Amethyst (Much Brighter for visibility)
    chiron: 'text-emerald-400', // Emerald
    ceres: 'text-yellow-400', // Wheat/Gold (Brighter)
    pallas: 'text-indigo-300', // Pale Sapphire
    juno: 'text-pink-400', // Rose Quartz
    vesta: 'text-orange-400', // Carnelian (Brighter)
    partOfFortune: 'text-amber-500' // Gold
};

// Map for glyph colors inside spheres to ensure contrast
const sphereGlyphColors: Record<string, string> = {
    sun: '#422006', // Dark Brown
    moon: '#1e293b', // Dark Slate
    mercury: '#1e293b', // Dark Slate
    venus: '#4c0519', // Dark Rose
    mars: '#ffffff', // White
    jupiter: '#ffffff', // White
    saturn: '#422006', // Dark Brown
    uranus: '#0e7490', // Dark Cyan
    neptune: '#ffffff', // White
    pluto: '#ffffff', // White
    northNode: '#0f766e', // Dark Teal
    southNode: '#ffffff', // White
    lilith: '#e879f9', // Light Fuchsia (to stand out against dark purple)
    chiron: '#064e3b', // Dark Emerald
    ceres: '#3f6212', // Dark Yellow/Green
    pallas: '#1e3a8a', // Dark Blue
    juno: '#831843', // Dark Pink
    vesta: '#7c2d12', // Dark Orange
    partOfFortune: '#ffffff' // White
};

const PLANET_HEX_COLORS: Record<string, string> = {
    sun: '#FDE047',
    moon: '#F1F5F9',
    mercury: '#CBD5E1',
    venus: '#FDA4AF',
    mars: '#EF4444',
    jupiter: '#FB923C',
    saturn: '#FACC15',
    uranus: '#22D3EE',
    neptune: '#4870FF',
    pluto: '#94A3B8',
    northNode: '#34D399',
    southNode: '#34D399',
    lilith: '#8B5CF6',
    chiron: '#34D399',
    ceres: '#FACC15',
    pallas: '#4870FF',
    juno: '#FDA4AF',
    vesta: '#FB923C',
    partOfFortune: '#F59E0B',
};

const PLANET_NAMES_ABBR: Record<string, string> = {
    sun: 'SOL',
    moon: 'LUA',
    mercury: 'MER',
    venus: 'VÊN',
    mars: 'MAR',
    jupiter: 'JÚP',
    saturn: 'SAT',
    uranus: 'URA',
    neptune: 'NET',
    pluto: 'PLU',
    northNode: 'NOD.N',
    southNode: 'NOD.S',
    lilith: 'LIL',
    chiron: 'QUÍ',
    ceres: 'CER',
    pallas: 'PAL',
    juno: 'JUN',
    vesta: 'VES',
    partOfFortune: 'ROD',
};

const getMoonPhaseEmoji = (phase: number) => {
    if (phase <= 0.03 || phase >= 0.97) return '🌑';
    if (phase < 0.22) return '🌒';
    if (phase < 0.28) return '🌓';
    if (phase < 0.47) return '🌔';
    if (phase < 0.53) return '🌕';
    if (phase < 0.72) return '🌖';
    if (phase < 0.78) return '🌗';
    return '🌘';
};

// Component to render 3D sphere for planet
export const PlanetSphere: React.FC<{ id: string, size: number, moonPhase?: number }> = ({ id, size, moonPhase }) => {
    const radius = size / 2;
    const glyphSize = size * 0.6;
    
    // Check if we have a specific gradient for this planet (now includes all)
    const hasGradient = true; // All have gradients now
    const fillUrl = hasGradient ? `url(#panel-grad-${id})` : '#6b7280';
    
    const glyphColor = sphereGlyphColors[id] || 'white';
    const hasDarkGlyph = glyphColor !== '#ffffff' && glyphColor !== 'white' && id !== 'lilith'; // Lilith is special

    if (id === 'moon' && moonPhase !== undefined) {
        const moonEmoji = getMoonPhaseEmoji(moonPhase);
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                <text 
                    x="50%" y="50%" 
                    dy="0.35em" 
                    textAnchor="middle" 
                    fontSize={size} 
                    style={{ 
                        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif', 
                        pointerEvents: 'none', 
                        fill: 'white',
                        filter: 'grayscale(100%) drop-shadow(0 0 2px rgba(255,255,255,0.3))'
                    }}
                >
                    {moonEmoji}
                </text>
            </svg>
        );
    }

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
            <g>
                {id === 'saturn' && (
                    <ellipse cx={radius} cy={radius} rx={radius * 1.3} ry={radius * 0.4} fill="none" stroke="#D2B48C" strokeWidth={size * 0.15} transform={`rotate(-25, ${radius}, ${radius})`} opacity="0.8"/>
                )}
                {id === 'uranus' && (
                     <ellipse cx={radius} cy={radius} rx={radius * 0.5} ry={radius * 1.3} fill="none" stroke="#A0F0FF" strokeWidth={size * 0.075} opacity="0.8"/>
                )}
                
                <circle cx={radius} cy={radius} r={radius} fill={fillUrl} filter={id === 'sun' ? "url(#panel-glow)" : ""} />
                
                {id === 'jupiter' && (
                    <>
                        <circle cx={radius} cy={radius} r={radius} fill="url(#panel-grad-jupiter-stripes)" fillOpacity="0.6" transform={`rotate(45, ${radius}, ${radius})`} />
                        <circle cx={radius} cy={radius} r={radius} fill="url(#panel-grad-jupiter-overlay)" />
                    </>
                )}
                
                {/* Glyph overlay */}
                <text 
                    x="50%" y="50%" 
                    dy="0.35em" 
                    textAnchor="middle" 
                    fill={glyphColor} 
                    fontSize={glyphSize} 
                    style={{ 
                        fontFamily: '"Noto Sans Symbols", "Segoe UI Symbol", sans-serif', 
                        pointerEvents: 'none', 
                        filter: hasDarkGlyph ? 'drop-shadow(0 1px 0px rgba(255,255,255,0.3))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                        fontWeight: hasDarkGlyph ? 'bold' : 'normal'
                    }}
                >
                    {CELESTIAL_GLYPHS[id]}
                </text>
            </g>
        </svg>
    );
};

const CelestialBodyCard: React.FC<{
    body: { id: string; name: string; longitude: number; };
    housePlacements: Record<string, number>;
    retrogradeStatus: Record<string, boolean>;
    stationaryStatus?: Record<string, boolean>;
    onHover: (id: string | null) => void;
    isSelected: boolean;
    isSecondarySelected?: boolean;
    isVisible: boolean;
    onClick: (id: string) => void;
    onRightClick: (id: string) => void;
    itemSize: number;
    zodiacSignSize: number;
    scale?: number;
    settings: CelestialSettings;
    houseFormat: 'arabic' | 'roman';
    zodiacColorMode: 'none' | 'element' | 'modality' | 'polarity';
    anyHovered: boolean;
    isHovered: boolean;
    anySelected: boolean;
    moonPhase?: number;
    className?: string;
    onTooltip: (e: React.MouseEvent, id: string) => void;
    onTooltipLeave: () => void;
    theme?: 'dark' | 'light';
    isLocked?: boolean;
}> = ({ body, housePlacements, retrogradeStatus, stationaryStatus, onHover, isSelected, isSecondarySelected, isVisible, onClick, onRightClick, itemSize, zodiacSignSize, scale = 1, settings, houseFormat, zodiacColorMode, anyHovered, isHovered, anySelected, moonPhase, className, onTooltip, onTooltipLeave, theme = 'dark', isLocked = false }) => {
    
    const safeLongitude = body.longitude || 0;
    const signIndex = Math.floor(safeLongitude / 30);
    const sign = signIndex >= 0 && signIndex < 12 ? ZODIAC_DATA[signIndex] : null;
    const houseNumber = housePlacements[body.id];
    const isRetro = retrogradeStatus[body.id];
    const isStationary = stationaryStatus?.[body.id];
    
    const planetGlyph = CELESTIAL_GLYPHS[body.id as keyof typeof CELESTIAL_GLYPHS];
    const SignSymbol = sign ? ZODIAC_ICONS[sign.id as keyof typeof ZODIAC_ICONS] : null;

    const planetColorClass = settings.planets.colors ? (planetColors[body.id] || 'text-brand-text') : 'text-brand-text';
    
    const isLight = theme === 'light';

    // Determine readability colors based on light mode
    const nameColor = settings.planets.namesColors 
        ? (PLANET_HEX_COLORS[body.id] || 'var(--color-panel-header)') 
        : 'var(--color-panel-header)';
        
    const degreeColor = (settings.degrees_colors ?? false)
        ? (PLANET_HEX_COLORS[body.id] || (isLight ? '#3B2F14' : '#F5F2EB'))
        : (isLight ? '#3B2F14' : '#F5F2EB');

    const signColorClass = settings.signs.colors
        ? getZodiacColorClass(sign, zodiacColorMode)
        : 'text-brand-text';
    const cardPaddingY = Math.max(2, Math.round(4 * scale));
    const cardPaddingX = Math.max(3, Math.round(5 * scale));
    const baseClasses = `flex items-center gap-1 sm:gap-1.5 transition-[background,border-color] duration-150 cursor-pointer rounded-[10px] border ease-out w-full max-w-full ${className || ''}`;
    
    let stateClasses = "";

    // Seleção em ouro (SURFACE.rowSelected). Sem scale: numa lista de 19 linhas,
    // cada hover empurrando as vizinhas cria ruído de layout.
    if (isSelected) {
        stateClasses = isLight
            ? "bg-gradient-to-b from-[#D4AF37]/25 to-[#D4AF37]/10 border-[#8a6d1f]/60"
            : "bg-gradient-to-b from-[#D4AF37]/[0.10] to-[#D4AF37]/[0.03] border-[#D4AF37]/50";
    } else if (isSecondarySelected) {
        stateClasses = isLight
            ? "bg-gradient-to-b from-[#D4AF37]/12 to-transparent border-[#8a6d1f]/30"
            : "bg-gradient-to-b from-[#D4AF37]/[0.05] to-transparent border-[#D4AF37]/25";
    } else if (isHovered) {
        stateClasses = isLight
            ? "bg-black/[0.07] border-black/25"
            : "bg-white/[0.09] border-white/25";
    } else {
        stateClasses = isLight
            ? "bg-transparent border-transparent hover:bg-black/[0.04]"
            : "bg-transparent border-transparent hover:bg-white/[0.05]";
    }

    if (!isVisible) {
        stateClasses += " opacity-40 grayscale-[0.5]";
    } else {
        stateClasses += " opacity-100";
    }

    const glyphSize = Math.max(11, Math.round(itemSize * 1.15));
    const signSize = Math.max(11, Math.round(zodiacSignSize));
    const textSize = Math.max(9.5, Math.round(itemSize * 0.9)); 
    const degreeSize = Math.max(9, Math.round(itemSize * 0.85)); 
    const houseSize = Math.max(10.5, Math.round(degreeSize + 1.5));

    // Dynamic width for the icon container to prevent overflow
    const iconContainerSize = Math.max(18, Math.round(glyphSize * 1.5));
    const signBoxWidth = Math.max(14, Math.round((settings.signs.abbr ? 34 : 18) * scale));
    const houseBoxWidth = Math.max(14, Math.round(20 * scale));
    const degreesBoxWidth = Math.max(34, Math.round(44 * scale));
    const retroBoxWidth = Math.max(12, Math.round(15 * scale));

    const renderPlanet = () => (
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            {settings.planets.symbols && (
                <div 
                    className="flex-shrink-0 flex justify-center items-center relative" 
                    style={{ width: `${iconContainerSize}px`, height: `${iconContainerSize}px` }}
                >
                    {!settings.planets.glyphs ? (
                        <div className="absolute inset-0 flex items-center justify-center overflow-visible">
                             <PlanetSphere id={body.id} size={glyphSize * 1.2} moonPhase={moonPhase} />
                        </div>
                    ) : (
                        <span className={planetColorClass} style={{ fontSize: `${glyphSize}px`, fontFamily: '"Noto Sans Symbols", "Segoe UI Symbol", sans-serif' }}>{planetGlyph}</span>
                    )}
                </div>
            )}
            {settings.planets.names && (
                <span
                    className={`font-bold leading-none flex items-center gap-1 ${settings.planets.namesAbbr ? 'whitespace-nowrap shrink-0' : 'truncate flex-1 min-w-0'}`}
                    style={{
                        fontSize: `${textSize}px`,
                        color: nameColor,
                    }}
                >
                    <span className="truncate">{settings.planets.namesAbbr ? (PLANET_NAMES_ABBR[body.id] || body.name.substring(0, 3).toUpperCase()) : body.name}</span>
                    {isLocked && (
                        <i className="ti ti-lock text-[9px] text-[#D4AF37] shrink-0" title="Disponível nos Planos Mensal e Vitalício" />
                    )}
                </span>
            )}
        </div>
    );
    
    return (
        <div 
            className={`${baseClasses} ${stateClasses}`}
            style={{
                paddingTop: `${cardPaddingY}px`,
                paddingBottom: `${cardPaddingY}px`,
                paddingLeft: `${cardPaddingX}px`,
                paddingRight: `${cardPaddingX}px`
            }}
            onMouseEnter={(e) => { onHover(body.id); onTooltip(e, body.id); }}
            onMouseLeave={() => { onHover(null); onTooltipLeave(); }}
            onClick={() => onClick(body.id)}
            onContextMenu={(e) => { e.preventDefault(); onRightClick(body.id); }}
        >
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden pr-1">
                {renderPlanet()}
            </div>

            <div className={`flex items-center justify-end flex-shrink-0 gap-1 pl-1 border-l ${isLight ? "border-black/[0.07]" : "border-white/[0.07]"}`}>
                {settings.signs.enabled && (
                    <div className={`flex items-center justify-center shrink-0 ${settings.signs.abbr ? 'gap-1' : ''}`} style={{ width: `${signBoxWidth}px` }}>
                        {settings.signs.symbols && SignSymbol && <SignSymbol className={signColorClass} style={{ width: `${signSize}px`, height: `${signSize}px` }} />}
                        {settings.signs.abbr && <span className={`${signColorClass} font-manrope font-normal text-xs`}>{sign ? (sign as any).abbr : '-'}</span>}
                    </div>
                )}
                {settings.houses.enabled && (
                    <div className="flex items-center justify-center shrink-0" style={{ width: `${houseBoxWidth}px` }}>
                         {houseNumber && (
                            <span 
                                className={`font-bold text-center text-brand-text ${houseFormat === 'roman' ? 'font-cormorant' : ''}`} 
                                style={{ fontSize: `${houseSize}px` }}
                            >
                                {houseFormat === 'roman' ? toRoman(houseNumber) : houseNumber}
                            </span>
                         )}
                    </div>
                )}
                {settings.degrees && (
                    <div className={`py-0.5 flex items-center justify-center rounded-[5px] border shrink-0 ${isLight ? 'bg-black/[0.05] border-black/15' : 'bg-black/40 border-white/15'}`} style={{ width: `${degreesBoxWidth}px` }}>
                        <span className="tracking-tight tabular-nums leading-none whitespace-nowrap text-center font-normal" style={{
                            fontSize: `${degreeSize}px`,
                            fontFamily: "'Azeret Mono', monospace",
                            fontVariantNumeric: "tabular-nums",
                            color: degreeColor,
                            fontWeight: 400
                        }}>
                            {formatDegrees(safeLongitude % 30)}
                        </span>
                    </div>
                )}
                {settings.retrograde && (
                    <div className="flex items-center justify-center shrink-0" style={{ width: `${retroBoxWidth}px` }}>
                        {isStationary ? (
                            <span className="font-medium leading-none" style={{ fontSize: `${degreeSize * 0.82}px`, fontFamily: "'Azeret Mono', monospace", color: '#FFD700', fontWeight: 500 }}>St</span>
                        ) : isRetro ? (
                            <span className="font-medium leading-none" style={{ fontSize: `${degreeSize * 0.82}px`, fontFamily: "'Azeret Mono', monospace", color: '#F87171', fontWeight: 500 }}>Rx</span>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
};

export const CelestialBodyPanel: React.FC<CelestialBodyPanelProps> = ({
    sunEclipticLongitude, moonEclipticLongitude, mercuryEclipticLongitude, marsEclipticLongitude, venusEclipticLongitude, jupiterEclipticLongitude, saturnEclipticLongitude, neptuneEclipticLongitude, uranusEclipticLongitude, plutoEclipticLongitude, lilithEclipticLongitude, northNodeEclipticLongitude, southNodeEclipticLongitude, chironEclipticLongitude, ceresEclipticLongitude, pallasEclipticLongitude, junoEclipticLongitude, vestaEclipticLongitude, partOfFortuneEclipticLongitude,
    retrogradeStatus, stationaryStatus, onPlanetHover, housePlacements, 
    selectedPlanets, secondarySelectedPlanets = [], onPlanetClick, onPlanetRightClick,
    visiblePlanets, onVisibilityChange, planetDisplayStatus, dragHandle,
    activeMenu, setActiveMenu, hoveredPlanet, hoveredHouse, onClearSelections, onWidthChange,
    houseFormat, onHouseFormatChange, scale = 1,
    showPlanetSpheres, setShowPlanetSpheres, showNeedle, setShowNeedle, showOrbits, setShowOrbits,
    zodiacColorMode = 'element',
    settings,
    onSettingsChange,
    panelPosition = 'left',
    onPanelPositionChange,
    moonPhase,
    planetSize = 12,
    onPlanetSizeChange,
    zodiacSignSize = 16,
    onZodiacSignSizeChange,
    panelScale = 1,
    onPanelScaleChange,
    activeTab = 'transit',
    onTabChange,
    hasNatalDate,
    theme = 'dark',
    hideHeader,
    menuButtonRef,
    isFreeTier = false,
    isFreeTrial = false,
    onOpenPaymentPlans
}) => {
    const { t } = useLanguage();
    const isFree = Boolean(isFreeTier || isFreeTrial);
    const isLight = theme === 'light';
    const itemSize = planetSize;
    const scaledItemSize = itemSize * scale;
    const scaledZodiacSignSize = zodiacSignSize * scale;
    const [tooltip, setTooltip] = useState<{ text: React.ReactNode, x: number, y: number } | null>(null);
    const hoverTimeout = useRef<number | null>(null);

    const localMenuButtonRef = useRef<HTMLButtonElement>(null);
    const finalMenuButtonRef = menuButtonRef || localMenuButtonRef;
    const isMenuOpen = activeMenu === 'planets';
    
    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFree) {
            onOpenPaymentPlans?.();
            return;
        }
        setActiveMenu(isMenuOpen ? null : 'planets');
    };
    
    // Planetas, Pontos lunares, Asteroides e outros iniciam abertos por padrão.
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
    const toggleSection = (title: string) => setCollapsedSections(prev => ({ ...prev, [title]: !prev[title] }));

    const [calculatedWidth, setCalculatedWidth] = useState(190);
    const isInitialWidthEmitted = useRef(false);

    useEffect(() => {
        let width = 16; // Base card padding (px-2 = 16px)
        let leftColWidth = 0;
        
        // Planet Section
        const currentGlyphSize = scaledItemSize * 1.2;
        const currentIconContainerSize = Math.max(24, currentGlyphSize * 1.8);
        
        if (settings.planets.symbols) leftColWidth += currentIconContainerSize; 
        if (settings.planets.names) {
            // Nomes abreviados (3-5 letras ex: "NOD.N") precisam de ~36px + gap, nomes completos de ~90px
            leftColWidth += settings.planets.namesAbbr ? 36 : 90; 
        }
        if (settings.planets.symbols && settings.planets.names) leftColWidth += 4; 
        
        width += leftColWidth;
        
        // Right Section
        let rightColWidth = 0;
        if (settings.signs.enabled) rightColWidth += settings.signs.abbr ? 42 : 20;
        if (settings.houses.enabled) rightColWidth += 26;
        if (settings.degrees) rightColWidth += 52;
        if (settings.retrograde) rightColWidth += 18;
        if (rightColWidth > 0) rightColWidth += 6; // Borda divisora + padding lateral
        
        width += rightColWidth;
        
        width += 14; // Buffer da barra de rolagem vertical + margem de segurança
        
        setCalculatedWidth(width);
        if (onWidthChange) {
            const minW = settings.planets.names ? (settings.planets.namesAbbr ? 215 : 280) : 180;
            const w = Math.max(minW, Math.ceil(width * (panelScale || 1)));
            onWidthChange(w);
        }
    }, [settings, onWidthChange, scaledItemSize, panelScale]);
    
    /**
     * Agrupamento astrológico dos corpos: Planetas, Pontos lunares, Asteroides e outros.
     */
    const celestialBodies = useMemo(() => ({
        planets: [
            { id: 'sun', name: 'Sol', longitude: sunEclipticLongitude },
            { id: 'moon', name: 'Lua', longitude: moonEclipticLongitude },
            { id: 'mercury', name: 'Mercúrio', longitude: mercuryEclipticLongitude },
            { id: 'venus', name: 'Vênus', longitude: venusEclipticLongitude },
            { id: 'mars', name: 'Marte', longitude: marsEclipticLongitude },
            { id: 'jupiter', name: 'Júpiter', longitude: jupiterEclipticLongitude },
            { id: 'saturn', name: 'Saturno', longitude: saturnEclipticLongitude },
            { id: 'uranus', name: 'Urano', longitude: uranusEclipticLongitude },
            { id: 'neptune', name: 'Netuno', longitude: neptuneEclipticLongitude },
            { id: 'pluto', name: 'Plutão', longitude: plutoEclipticLongitude },
        ],
        lunar: [
            { id: 'northNode', name: 'Nodo N.', longitude: northNodeEclipticLongitude },
            { id: 'southNode', name: 'Nodo S.', longitude: southNodeEclipticLongitude },
            { id: 'lilith', name: 'Lilith', longitude: lilithEclipticLongitude },
        ],
        asteroidsAndOthers: [
            { id: 'chiron', name: 'Quíron', longitude: chironEclipticLongitude },
            { id: 'ceres', name: 'Ceres', longitude: ceresEclipticLongitude },
            { id: 'pallas', name: 'Pallas', longitude: pallasEclipticLongitude },
            { id: 'juno', name: 'Juno', longitude: junoEclipticLongitude },
            { id: 'vesta', name: 'Vesta', longitude: vestaEclipticLongitude },
            { id: 'partOfFortune', name: 'Roda', longitude: partOfFortuneEclipticLongitude },
        ]
    }), [sunEclipticLongitude, moonEclipticLongitude, mercuryEclipticLongitude, marsEclipticLongitude, venusEclipticLongitude, jupiterEclipticLongitude, saturnEclipticLongitude, uranusEclipticLongitude, neptuneEclipticLongitude, plutoEclipticLongitude, lilithEclipticLongitude, northNodeEclipticLongitude, southNodeEclipticLongitude, chironEclipticLongitude, ceresEclipticLongitude, pallasEclipticLongitude, junoEclipticLongitude, vestaEclipticLongitude, partOfFortuneEclipticLongitude]);

    type BodyGroup = keyof typeof celestialBodies;

    const BODY_SECTIONS: { key: BodyGroup; label: string; collapsible: boolean }[] = [
        { key: 'planets',            label: 'Planetas',            collapsible: false },
        { key: 'lunar',              label: 'Pontos lunares',      collapsible: true  },
        { key: 'asteroidsAndOthers', label: 'Asteroides e outros', collapsible: true  },
    ];

    const allBodies = useMemo(
        () => BODY_SECTIONS.flatMap(sec => celestialBodies[sec.key]),
        [celestialBodies]
    );

    const handleToggleSectionVisibility = (section: BodyGroup) => {
        if (isFree && (section === 'lunar' || section === 'asteroidsAndOthers')) {
            onOpenPaymentPlans?.();
            return;
        }
        const sectionIds = celestialBodies[section].map(body => body.id);
        const currentlyAllVisible = sectionIds.every(id => visiblePlanets[id]);
        onVisibilityChange(prev => {
            const newState = { ...prev };
            sectionIds.forEach(id => { newState[id] = !currentlyAllVisible; });
            return newState;
        });
    };

    const anySelected = selectedPlanets.length > 0;
    const anyHovered = hoveredPlanet !== null;

    const handleTooltip = (e: React.MouseEvent, id: string) => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        hoverTimeout.current = window.setTimeout(() => {
            const body = allBodies.find(b => b.id === id);
            if (!body) return;

            const signIndex = Math.floor((body.longitude || 0) / 30);
            const sign = ZODIAC_DATA[signIndex];
            const house = housePlacements[id];
            
            let text = '';
            const planetName = body.name;
            const signName = sign ? sign.name : '';
            
            if (!settings.houses.enabled) {
                text = `${planetName} em ${signName}`;
            } else {
                text = `${planetName} em ${signName} na Casa ${house}`;
            }

            setTooltip({
                text: <span className="font-medium">{text}</span>,
                x: mouseX,
                y: mouseY
            });
        }, 300);
    };

    const handleTooltipLeave = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setTooltip(null);
    };

    const renderBodyCard = (body: { id: string, name: string, longitude: number }) => {
        const isLunarPoint = ['northNode', 'southNode', 'lilith'].includes(body.id);
        const isAsteroidOrOther = ['chiron', 'ceres', 'pallas', 'juno', 'vesta', 'partOfFortune'].includes(body.id);
        const isPointLocked = isFree && (isLunarPoint || isAsteroidOrOther);
        return (
            <CelestialBodyCard 
                key={body.id} 
                body={body} 
                housePlacements={housePlacements} 
                retrogradeStatus={retrogradeStatus} 
                stationaryStatus={stationaryStatus}
                onHover={onPlanetHover} 
                isSelected={selectedPlanets.includes(body.id) || selectedPlanets.includes(`natal_${body.id}`)} 
                isSecondarySelected={secondarySelectedPlanets.includes(body.id)}
                isVisible={!!visiblePlanets[body.id]}
                isLocked={isPointLocked}
                onClick={(id) => {
                    if (isPointLocked) {
                        onOpenPaymentPlans?.();
                        return;
                    }
                    onPlanetClick(id);
                }} 
                onRightClick={(id) => {
                    if (isPointLocked) {
                        onOpenPaymentPlans?.();
                        return;
                    }
                    onPlanetRightClick(id);
                }}
                itemSize={scaledItemSize}
                zodiacSignSize={scaledZodiacSignSize}
                scale={scale}
                settings={settings}
                houseFormat={houseFormat}
                zodiacColorMode={zodiacColorMode}
                anyHovered={anyHovered}
                isHovered={hoveredPlanet === body.id || housePlacements[body.id] === hoveredHouse}
                anySelected={anySelected}
                moonPhase={moonPhase}
                className="flex-1 min-h-0"
                onTooltip={handleTooltip}
                onTooltipLeave={handleTooltipLeave}
                theme={theme}
            />
        );
    };

    const renderSectionHeader = (
        title: string, 
        count: number,
        isCollapsible: boolean,
        isCollapsed: boolean,
        onToggleCollapse?: () => void,
        actions?: React.ReactNode
    ) => (
        <div 
            onClick={isCollapsible && onToggleCollapse ? onToggleCollapse : undefined}
            className={`flex justify-between items-center px-2 py-0.5 my-0.5 rounded-md transition-all select-none group flex-none ${
                isCollapsible ? 'cursor-pointer' : ''
            } ${
                isLight 
                    ? 'bg-[#8b8370]/[0.06] hover:bg-[#8b8370]/[0.12] border border-[#8b8370]/15 text-amber-950' 
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-slate-300'
            }`}
            style={{ height: `${Math.max(18, Math.round(22 * scale))}px` }}
        >
            <div className="flex items-center gap-1.5 min-w-0">
                {isCollapsible && (
                    <UI_ICONS.ChevronDownIcon 
                        className={`w-3 h-3 text-slate-400 group-hover:text-white transition-transform duration-200 ${
                            isCollapsed ? '-rotate-90' : 'rotate-0'
                        }`} 
                    />
                )}
                {/* Título de sanfona em creme, não em ouro: são seis seções na lista
                    e o ouro em todas ocupava peso visual demais. O ouro fica reservado
                    ao item selecionado e aos eixos do relógio. */}
                <span
                    className="font-bold uppercase truncate"
                    style={{ 
                        fontSize: `${Math.max(8.5, Math.round(9.5 * scale))}px`,
                        letterSpacing: '.13em', 
                        color: isLight ? '#3B2F14' : '#F5F2EB', 
                        opacity: .78 
                    }}
                >
                    {title}
                </span>
                <span 
                    className={`font-mono px-1 rounded ${
                        isLight ? 'bg-[#8b8370]/20 text-amber-900' : 'bg-white/10 text-slate-400'
                    }`}
                    style={{ fontSize: `${Math.max(7.5, Math.round(8 * scale))}px` }}
                >
                    {count}
                </span>
            </div>
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {actions}
            </div>
        </div>
    );

return (
        <div 
            className="flex flex-col h-full w-full font-manrope bg-transparent relative min-w-0"
        >
             {/* Gradient Defs for Spheres - Updated to match Clock */}
            <svg className="absolute w-0 h-0 pointer-events-none">
                <defs>
                    <filter id="panel-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <radialGradient id="panel-grad-sun" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#FFFACD" /><stop offset="40%" stopColor="#FFD700" /><stop offset="100%" stopColor="#FF8C00" /></radialGradient>
                    <radialGradient id="panel-grad-moon" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#F5F5F5" /><stop offset="50%" stopColor="#D3D3D3" /><stop offset="100%" stopColor="#808080" /></radialGradient>
                    <radialGradient id="panel-grad-mercury" cx="40%" cy="40%" r="60%"><stop offset="0%" stopColor="#E0E0E0" /><stop offset="60%" stopColor="#A9A9A9" /><stop offset="100%" stopColor="#757575" /></radialGradient>
                    <radialGradient id="panel-grad-venus" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#E9D5FF" /><stop offset="50%" stopColor="#C084FC" /><stop offset="100%" stopColor="#9333EA" /></radialGradient>
                    <radialGradient id="panel-grad-mars" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#FF7F50" /><stop offset="60%" stopColor="#CD5C5C" /><stop offset="100%" stopColor="#8B0000" /></radialGradient>
                    <linearGradient id="panel-grad-jupiter-stripes" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFF8DC" /><stop offset="20%" stopColor="#CD853F" /><stop offset="40%" stopColor="#FFF8DC" /><stop offset="60%" stopColor="#D2691E" /><stop offset="80%" stopColor="#FFF8DC" /><stop offset="100%" stopColor="#CD853F" /></linearGradient>
                    <radialGradient id="panel-grad-jupiter-overlay" cx="35%" cy="35%" r="70%"><stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4"/><stop offset="100%" stopColor="#000000" stopOpacity="0.2"/></radialGradient>
                    <radialGradient id="panel-grad-saturn" cx="40%" cy="30%" r="70%"><stop offset="0%" stopColor="#F0E68C" /><stop offset="100%" stopColor="#DAA520" /></radialGradient>
                    <radialGradient id="panel-grad-uranus" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#AFEEEE" /><stop offset="100%" stopColor="#00CED1" /></radialGradient>
                    <radialGradient id="panel-grad-neptune" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#4169E1" /><stop offset="100%" stopColor="#00008B" /></radialGradient>
                    
                    {/* Updated Pluto: Red/Metal */}
                    <radialGradient id="panel-grad-pluto" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#8B0000" /><stop offset="50%" stopColor="#708090" /><stop offset="100%" stopColor="#2F4F4F" /></radialGradient>
                    
                    {/* Points & Asteroids Gradients */}
                    <radialGradient id="panel-grad-northNode" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#E0FFFF" /><stop offset="100%" stopColor="#00CED1" /></radialGradient>
                    <radialGradient id="panel-grad-southNode" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#D2691E" /><stop offset="100%" stopColor="#8B4513" /></radialGradient>
                    <radialGradient id="panel-grad-lilith" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#4B0082" /><stop offset="60%" stopColor="#000000" /><stop offset="100%" stopColor="#2e022e" /></radialGradient>
                    <radialGradient id="panel-grad-chiron" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#90EE90" /><stop offset="100%" stopColor="#2E8B57" /></radialGradient>
                    <radialGradient id="panel-grad-ceres" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#556B2F" /></radialGradient>
                    <radialGradient id="panel-grad-pallas" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#F0F8FF" /><stop offset="100%" stopColor="#4682B4" /></radialGradient>
                    <radialGradient id="panel-grad-juno" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFB6C1" /><stop offset="100%" stopColor="#C71585" /></radialGradient>
                    <radialGradient id="panel-grad-vesta" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFA500" /><stop offset="100%" stopColor="#FF4500" /></radialGradient>
                    <radialGradient id="panel-grad-partOfFortune" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FDE047" /><stop offset="100%" stopColor="#D97706" /></radialGradient>
                </defs>
            </svg>

            {!hideHeader && (
                <div className="px-3 py-2 flex justify-between items-center gap-2 flex-shrink-0 rounded-t-3xl">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {dragHandle}
                        <h3 className="truncate" style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '10px',
                          fontWeight: 700,
                          color: 'var(--color-panel-header)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>Astros</h3>
                        <div style={{
                          flex: 1,
                          height: '1px',
                          marginLeft: '8px',
                          backgroundColor: '#2A2A2A',
                          opacity: 0.8
                        }} />
                    </div>
                    <button 
                        ref={finalMenuButtonRef}
                        onClick={handleMenuToggle}
                        className={`p-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-90 ${isMenuOpen ? 'bg-gradient-to-b from-[#D4AF37]/[0.18] to-[#D4AF37]/[0.06] border border-[#D4AF37]/50 text-[#F5D98A]' : 'text-brand-text-muted hover:text-brand-text hover:bg-white/10 hover:scale-105'}`}
                        title={isFree ? "Opções de Astros (Disponível no Plano Pro)" : "Opções do Painel"}
                    >
                        {isFree ? (
                            <i className="ti ti-lock text-amber-400 text-sm" />
                        ) : (
                            <UI_ICONS.MoreIcon className="w-4 h-4" />
                        )}
                    </button>
                </div>
            )}

            {isMenuOpen && (
                <PopupMenu onClose={() => setActiveMenu(null)} triggerRef={finalMenuButtonRef}>
                    <div className="flex flex-col gap-2.5 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar text-brand-text font-sans">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-2 px-1">
                            <div className="flex items-center gap-2">
                                <i className="ti ti-adjustments text-brand-purple text-base" />
                                <span className="text-xs font-bold uppercase tracking-wider text-white font-sans">Opções do Painel</span>
                            </div>
                            <span className="text-[10px] text-white/40 font-mono">Astros</span>
                        </div>

                        {/* Banner de Bloqueio Plano Free */}
                        {isFree && (
                            <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-between gap-2 shadow-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-amber-400 text-sm shrink-0">🔒</span>
                                    <span className="text-[11px] font-semibold text-amber-200 leading-tight">
                                        Edições dos Astros bloqueadas no Plano Gratuito.
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { onOpenPaymentPlans?.(); setActiveMenu(null); }}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-bold text-[10px] hover:bg-amber-400 active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm"
                                >
                                    Upgrade
                                </button>
                            </div>
                        )}

                        <div className={isFree ? 'opacity-40 pointer-events-none select-none flex flex-col gap-2.5' : 'flex flex-col gap-2.5'}>
                        {/* Card 1: Planetas (Símbolos e Nomes) */}
                        <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/10 space-y-2">
                            {/* Símbolos dos Planetas */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <i className="ti ti-planet text-amber-300 text-sm" />
                                    <span className="text-xs font-bold text-white font-sans">Símbolos dos Planetas</span>
                                </div>
                                <CompactToggle isChecked={settings.planets.symbols} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, symbols: !settings.planets.symbols } })} />
                            </div>
                            {settings.planets.symbols && (
                                <div className="pl-6 space-y-1.5 pt-1.5 border-t border-white/5 font-sans">
                                    <div className="flex items-center justify-between text-xs text-white/70">
                                        <span>Glifos (vs Esferas)</span>
                                        <CompactToggle isChecked={settings.planets.glyphs} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, glyphs: !settings.planets.glyphs } })} />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-white/70">
                                        <span>Cores dos Planetas</span>
                                        <CompactToggle isChecked={settings.planets.colors} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, colors: !settings.planets.colors } })} />
                                    </div>
                                </div>
                            )}

                            {/* Nomes dos Planetas */}
                            <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                                <div className="flex items-center gap-1.5">
                                    <i className="ti ti-typography text-blue-300 text-sm" />
                                    <span className="text-xs font-bold text-white font-sans">Nomes dos Planetas</span>
                                </div>
                                <CompactToggle isChecked={settings.planets.names} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, names: !settings.planets.names } })} />
                            </div>
                            {settings.planets.names && (
                                <div className="pl-6 space-y-1.5 pt-1.5 border-t border-white/5 font-sans">
                                    <div className="flex items-center justify-between text-xs text-white/70">
                                        <span>Abreviar Nomes</span>
                                        <CompactToggle isChecked={settings.planets.namesAbbr} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, namesAbbr: !settings.planets.namesAbbr } })} />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-white/70">
                                        <span>Cores dos Nomes</span>
                                        <CompactToggle isChecked={settings.planets.namesColors} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, namesColors: !settings.planets.namesColors } })} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Card 2: Signos e Casas */}
                        <div className="grid grid-cols-2 gap-2 font-sans">
                            {/* Signos */}
                            <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/10 space-y-1.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <i className="ti ti-zodiac-leo text-emerald-300 text-sm" />
                                        <span className="text-xs font-bold text-white">Signos</span>
                                    </div>
                                    <CompactToggle isChecked={settings.signs.enabled} onToggle={() => onSettingsChange({ ...settings, signs: { ...settings.signs, enabled: !settings.signs.enabled } })} />
                                </div>
                                {settings.signs.enabled && (
                                    <div className="pl-1 space-y-1 pt-1 border-t border-white/5 text-[11px] text-white/70">
                                        <div className="flex items-center justify-between">
                                            <span>Símbolos</span>
                                            <CompactToggle isChecked={settings.signs.symbols} onToggle={() => onSettingsChange({ ...settings, signs: { ...settings.signs, symbols: !settings.signs.symbols } })} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Cores</span>
                                            <CompactToggle isChecked={settings.signs.colors} onToggle={() => onSettingsChange({ ...settings, signs: { ...settings.signs, colors: !settings.signs.colors } })} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Abreviação</span>
                                            <CompactToggle isChecked={settings.signs.abbr} onToggle={() => onSettingsChange({ ...settings, signs: { ...settings.signs, abbr: !settings.signs.abbr } })} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Casas */}
                            <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/10 space-y-1.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <i className="ti ti-home text-rose-300 text-sm" />
                                        <span className="text-xs font-bold text-white">Casas</span>
                                    </div>
                                    <CompactToggle isChecked={settings.houses.enabled} onToggle={() => onSettingsChange({ ...settings, houses: { ...settings.houses, enabled: !settings.houses.enabled } })} />
                                </div>
                                {settings.houses.enabled && (
                                    <div className="pt-1 border-t border-white/5 space-y-1">
                                        <span className="text-[10px] text-white/50 uppercase font-semibold">Formato</span>
                                        <div className="grid grid-cols-2 gap-1 bg-white/[0.04] p-0.5 rounded-lg border border-white/10">
                                            <button
                                                onClick={() => onHouseFormatChange('roman')}
                                                className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer text-center active:scale-95 ${houseFormat === 'roman' ? 'bg-gradient-to-b from-[#D4AF37]/[0.18] to-[#D4AF37]/[0.06] border border-[#D4AF37]/50 text-[#F5D98A]' : 'btn-3d-glow btn-3d-dark text-white/60 hover:text-white'}`}
                                            >
                                                Romanos
                                            </button>
                                            <button
                                                onClick={() => onHouseFormatChange('arabic')}
                                                className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer text-center active:scale-95 ${houseFormat === 'arabic' ? 'bg-gradient-to-b from-[#D4AF37]/[0.18] to-[#D4AF37]/[0.06] border border-[#D4AF37]/50 text-[#F5D98A]' : 'btn-3d-glow btn-3d-dark text-white/60 hover:text-white'}`}
                                            >
                                                Números
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card 3: Graus & Retrogradação */}
                        <div className="grid grid-cols-2 gap-2 font-sans">
                            {/* Graus */}
                            <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/10 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <i className="ti ti-angle text-cyan-300 text-sm" />
                                        <span className="text-xs font-bold text-white">Graus</span>
                                    </div>
                                    <CompactToggle isChecked={settings.degrees} onToggle={() => onSettingsChange({ ...settings, degrees: !settings.degrees })} />
                                </div>
                                {settings.degrees && (
                                    <div className="flex items-center justify-between text-[11px] text-white/70 pt-1 border-t border-white/5">
                                        <span>Cores</span>
                                        <CompactToggle isChecked={settings.degrees_colors ?? false} onToggle={() => onSettingsChange({ ...settings, degrees_colors: !(settings.degrees_colors ?? false) })} />
                                    </div>
                                )}
                            </div>

                            {/* Retrogradação */}
                            <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <i className="ti ti-rotate-2 text-amber-400 text-sm" />
                                    <span className="text-xs font-bold text-white">Retrogradação</span>
                                </div>
                                <CompactToggle isChecked={settings.retrograde} onToggle={() => onSettingsChange({ ...settings, retrograde: !settings.retrograde })} />
                            </div>
                        </div>

                        {/* Card 4: Controles de Tamanho e Escala */}
                        <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/10 space-y-2.5 font-sans">
                            {/* Planetas */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs text-white">
                                    <span className="flex items-center gap-1.5 font-bold">
                                        <i className="ti ti-planet text-amber-300 text-xs" /> Tamanho Planetas
                                    </span>
                                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                                        {planetSize}px
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => onPlanetSizeChange?.(Math.max(12, (planetSize || 24) - 2))} 
                                        className="w-7 h-7 flex items-center justify-center btn-3d-glow btn-3d-dark text-white font-bold transition-all duration-150 active:scale-90 hover:scale-110 cursor-pointer shadow-sm"
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="range"
                                        min="12"
                                        max="84"
                                        step="2"
                                        value={planetSize || 24}
                                        onChange={(e) => onPlanetSizeChange?.(parseInt(e.target.value))}
                                        className="flex-1 accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                                    />
                                    <button 
                                        onClick={() => onPlanetSizeChange?.(Math.min(84, (planetSize || 24) + 2))} 
                                        className="w-7 h-7 flex items-center justify-center btn-3d-glow btn-3d-dark text-white font-bold transition-all duration-150 active:scale-90 hover:scale-110 cursor-pointer shadow-sm"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Signos */}
                            <div className="space-y-1 pt-1.5 border-t border-white/5">
                                <div className="flex justify-between items-center text-xs text-white">
                                    <span className="flex items-center gap-1.5 font-bold">
                                        <i className="ti ti-zodiac-leo text-emerald-300 text-xs" /> Tamanho Signos
                                    </span>
                                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                        {zodiacSignSize}px
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => onZodiacSignSizeChange?.(Math.max(10, (zodiacSignSize || 20) - 2))} 
                                        className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg text-white font-bold transition-all border border-white/10 cursor-pointer"
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="range"
                                        min="10"
                                        max="60"
                                        step="2"
                                        value={zodiacSignSize || 20}
                                        onChange={(e) => onZodiacSignSizeChange?.(parseInt(e.target.value))}
                                        className="flex-1 accent-emerald-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                                    />
                                    <button 
                                        onClick={() => onZodiacSignSizeChange?.(Math.min(60, (zodiacSignSize || 20) + 2))} 
                                        className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg text-white font-bold transition-all border border-white/10 cursor-pointer"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Escala do Painel */}
                            <div className="space-y-1 pt-1.5 border-t border-white/5">
                                <div className="flex justify-between items-center text-xs text-white">
                                    <span className="flex items-center gap-1.5 font-bold">
                                        <i className="ti ti-zoom-in text-purple-300 text-xs" /> Escala Painel
                                    </span>
                                    <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">
                                        {Math.round((panelScale || 1) * 100)}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => onPanelScaleChange?.(Math.max(0.6, Number(((panelScale || 1) - 0.1).toFixed(1))))} 
                                        className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg text-white font-bold transition-all border border-white/10 cursor-pointer"
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="range"
                                        min="0.6"
                                        max="1.4"
                                        step="0.05"
                                        value={panelScale || 1}
                                        onChange={(e) => onPanelScaleChange?.(parseFloat(e.target.value))}
                                        className="flex-1 accent-purple-500 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                                    />
                                    <button 
                                        onClick={() => onPanelScaleChange?.(Math.min(1.4, Number(((panelScale || 1) + 0.1).toFixed(1))))} 
                                        className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg text-white font-bold transition-all border border-white/10 cursor-pointer"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                </PopupMenu>
            )}

            {tooltip && (
                <Tooltip 
                    text={tooltip.text}
                    visible={!!tooltip}
                    x={tooltip.x}
                    y={tooltip.y}
                />
            )}

            <div className="flex-grow min-h-0 w-full px-1 pb-1 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar">
                {hasNatalDate && onTabChange && (
                    <div className="flex justify-center mb-2 mt-1">
                        <div className="flex bg-brand-surface-highlight/40 rounded-xl p-1 border border-white/5 shadow-inner">
                            <button
                                onClick={() => onTabChange('transit')}
                                className={`px-4 py-1 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${activeTab === 'transit' ? 'bg-brand-purple text-[rgb(var(--color-brand-purple-contrast))] shadow-[0_0_10px_rgb(var(--color-brand-purple)_/_0.3)]' : 'text-brand-text-muted hover:text-brand-text'}`}
                            >
                                {t('chrono.transit')}
                            </button>
                            <button
                                onClick={() => onTabChange('natal')}
                                className={`px-4 py-1 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${activeTab === 'natal' ? 'bg-brand-orange text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'text-brand-text-muted hover:text-brand-text'}`}
                            >
                                {t('chrono.natal')}
                            </button>   
                        </div>
                    </div>
                )}
                {BODY_SECTIONS.map(sec => {
                    const bodies = celestialBodies[sec.key];
                    if (!bodies.length) return null;
                    const allVisible = bodies.every(b => visiblePlanets[b.id]);
                    const isCollapsed = sec.collapsible && !!collapsedSections[sec.label];
                    return (
                        <React.Fragment key={sec.key}>
                            {renderSectionHeader(
                                sec.label,
                                bodies.length,
                                sec.collapsible,
                                isCollapsed,
                                sec.collapsible ? () => toggleSection(sec.label) : undefined,
                                (sec.key === 'planets' && anySelected) ? (
                                    <button
                                        onClick={onClearSelections}
                                        className="p-0.5 rounded hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                                        title="Limpar Seleção"
                                    >
                                        <UI_ICONS.CloseIcon className="w-3.5 h-3.5" />
                                    </button>
                                ) : ((sec.key === 'lunar' || sec.key === 'asteroidsAndOthers') && isFree) ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenPaymentPlans?.();
                                        }}
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[#D4AF37] text-[8.5px] font-bold cursor-pointer transition-colors shadow-xs active:scale-95"
                                        title={`Controle de ligar e desligar ${sec.label.toLowerCase()} disponível no Plano Mensal e Vitalício. Clique para desbloquear.`}
                                    >
                                        <i className="ti ti-lock text-[9px]" />
                                        <span>Bloqueado</span>
                                    </button>
                                ) : (
                                    <MicroToggle
                                        isChecked={allVisible}
                                        onToggle={() => handleToggleSectionVisibility(sec.key)}
                                        title={`Visibilidade · ${sec.label}`}
                                        theme={theme}
                                    />
                                )
                            )}
                            {!isCollapsed && bodies.map(renderBodyCard)}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
);
};
