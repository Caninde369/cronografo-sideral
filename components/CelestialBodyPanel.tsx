
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n';
import { createPortal } from 'react-dom';
import { ZODIAC_DATA, getZodiacColorClass } from './zodiac';
import { ZODIAC_ICONS, CELESTIAL_GLYPHS, UI_ICONS } from './icons';
import { WidgetId } from '../App';
import { SizeControl, PopupToggle, CompactToggle, MicroToggle } from './Controls';
import { toRoman, formatDegrees } from '../lib/astrology/utils';
import { findRetrogradePeriod, findDirectPeriod, findStationWindow, RETRO_CAPABLE_BODIES, findNearestStation } from '../lib/astrology/retrogrades';
import { Tooltip } from './Tooltip';
import { OPT_CSS, OptHeader, OptGroup, OptToggle, OptSegment, OptSlider } from './panel/PanelOptions';
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
        abbr: boolean;   // mostra o nome do signo em texto
        short?: boolean; // true = sigla (SCO); false/ausente = nome completo (Escorpião)
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
    /** Data do céu mostrado (para calcular início e fim da retrogradação) */
    referenceDate?: Date;
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
                className="fixed z-[9999] bg-[#0a070c] border border-[#221d27] shadow-[0_30px_80px_-20px_rgba(0,0,0,.9)] rounded-2xl p-1.5 w-[300px] animate-in fade-in zoom-in-95 duration-100"
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
    onRetroClick?: (id: string, kind: 'retro' | 'station' | 'direct', anchor: DOMRect) => void;
}> = ({ body, housePlacements, retrogradeStatus, stationaryStatus, onHover, isSelected, isSecondarySelected, isVisible, onClick, onRightClick, itemSize, zodiacSignSize, scale = 1, settings, houseFormat, zodiacColorMode, anyHovered, isHovered, anySelected, moonPhase, className, onTooltip, onTooltipLeave, theme = 'dark', isLocked = false, onRetroClick }) => {
    
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
                    className={`leading-none flex items-center gap-1 ${settings.planets.namesAbbr ? 'whitespace-nowrap shrink-0' : 'truncate flex-1 min-w-0'}`}
                    style={{
                        fontSize: `${textSize + 0.5}px`,
                        color: nameColor,
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                        fontWeight: 400,
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
    
    // Colunas: o espaço que sobra é dividido entre todas (não só depois do nome)
    // mínimos enxutos: a linha nunca fica mais larga que o painel (o destaque da seleção acompanha)
    // Nome do planeta com largura fixa (igual em todas as linhas): o signo começa logo depois do nome mais longo.
    const signFull = settings.signs.abbr && !settings.signs.short;
    const nameColPx = (settings.planets.symbols ? iconContainerSize + 6 : 0)
        + (settings.planets.names ? Math.round((textSize + 0.5) * (settings.planets.namesAbbr ? 3.2 : 4.5)) : 0);
    const cols: string[] = [settings.planets.names ? `${nameColPx}px` : `${iconContainerSize + 2}px`];
    if (settings.signs.enabled) cols.push(`minmax(${settings.signs.abbr ? (settings.signs.symbols ? signSize + 26 : 24) : signSize + 2}px, 1fr)`);
    if (settings.houses.enabled) cols.push(`${Math.round(26 * scale)}px`);
    if (settings.degrees) cols.push(`${Math.round(44 * scale)}px`);
    if (settings.retrograde) cols.push(`${Math.max(14, Math.round(16 * scale))}px`);
    const badge = Math.max(15, Math.round(16 * scale));

    return (
        <div 
            className={`${baseClasses} ${stateClasses}`}
            style={{
                display: 'grid',
                gridTemplateColumns: cols.join(' '),
                alignItems: 'center',
                columnGap: `${Math.max(3, Math.round(5 * scale))}px`,
                minWidth: 0,
                paddingTop: `${cardPaddingY}px`,
                paddingBottom: `${cardPaddingY}px`,
                paddingLeft: `${cardPaddingX}px`,
                paddingRight: `${cardPaddingX}px`
            }}
            data-tour={`body-${body.id}`}
            onMouseEnter={(e) => { onHover(body.id); onTooltip(e, body.id); }}
            onMouseLeave={() => { onHover(null); onTooltipLeave(); }}
            onClick={() => onClick(body.id)}
            onContextMenu={(e) => { e.preventDefault(); onRightClick(body.id); }}
        >
            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                {renderPlanet()}
            </div>

            {settings.signs.enabled && (
                <div className={`flex items-center ${settings.signs.abbr ? 'justify-start' : 'justify-center'} gap-1 min-w-0`}>
                    {settings.signs.symbols && SignSymbol && (
                        <span className="inline-flex items-center justify-center shrink-0" style={{ width: `${signSize + 2}px`, height: `${signSize + 2}px` }}>
                            <SignSymbol className={signColorClass} style={{ width: `${signSize}px`, height: `${signSize}px`, display: 'block' }} />
                        </span>
                    )}
                    {settings.signs.abbr && (
                        signFull ? (
                            <span className={`${signColorClass} leading-none truncate min-w-0`} style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: `${Math.max(10.5, textSize - 0.5)}px` }}>
                                {sign ? (sign as any).name : '-'}
                            </span>
                        ) : (
                            <span className={`${signColorClass} leading-none`} style={{ fontFamily: "'DM Mono', ui-monospace, monospace", fontSize: `${Math.max(10, degreeSize - 0.5)}px`, letterSpacing: '0.02em', width: '3ch' }}>
                                {sign ? (sign as any).abbr : '-'}
                            </span>
                        )
                    )}
                </div>
            )}
            {settings.houses.enabled && (
                <div className="flex items-center justify-center">
                    {houseNumber && (
                        <span
                            className={`text-center leading-none ${isLight ? 'text-neutral-700' : 'text-[#D9D4DE]'}`}
                            style={houseFormat === 'roman'
                                ? { fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, fontSize: `${houseSize + 1.5}px`, letterSpacing: '0.07em' }
                                : { fontFamily: "'DM Mono', ui-monospace, monospace", fontSize: `${degreeSize}px` }}
                        >
                            {houseFormat === 'roman' ? toRoman(houseNumber) : houseNumber}
                        </span>
                    )}
                </div>
            )}
            {settings.degrees && (
                <div className="flex items-center justify-end">
                    <span className="tabular-nums leading-none whitespace-nowrap" style={{
                        fontSize: `${degreeSize + 0.5}px`,
                        fontFamily: "'DM Mono', ui-monospace, monospace",
                        color: degreeColor,
                        fontWeight: 400
                    }}>
                        {formatDegrees(safeLongitude % 30)}
                    </span>
                </div>
            )}
            {settings.retrograde && (
                <div className="flex items-center justify-center">
                    {(() => {
                        const kind: 'station' | 'retro' | 'direct' | null = isStationary ? 'station' : isRetro ? 'retro' : (RETRO_CAPABLE_BODIES.includes(body.id) ? 'direct' : null);
                        if (!kind) return null;
                        const C = kind === 'station'
                            ? { c: '#FACC15', b: 'rgba(250,204,21,.55)', bg: 'rgba(250,204,21,.06)', t: 'S', tip: 'Estacionário: ver início e fim da estação', aria: 'estacionário' }
                            : kind === 'retro'
                            ? { c: '#F87171', b: 'rgba(248,113,113,.55)', bg: 'rgba(248,113,113,.06)', t: 'R', tip: 'Retrógrado: ver início e fim', aria: 'retrógrado' }
                            : { c: isLight ? '#5c4b3e' : '#B9B4BE', b: isLight ? 'rgba(35,23,20,.25)' : 'rgba(185,180,190,.32)', bg: 'transparent', t: 'D', tip: 'Direto: ver o período do trânsito direto', aria: 'direto' };
                        return (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onRetroClick?.(body.id, kind, (e.currentTarget as HTMLElement).getBoundingClientRect()); }}
                            className="inline-flex items-center justify-center rounded-[5px] border leading-none cursor-pointer transition-colors"
                            style={{
                                width: badge, height: badge,
                                fontFamily: "'DM Mono', ui-monospace, monospace",
                                fontSize: `${Math.max(9.5, badge * 0.62)}px`,
                                color: C.c,
                                borderColor: C.b,
                                background: C.bg,
                            }}
                            title={C.tip}
                            aria-label={`${body.name} ${C.aria}`}
                        >
                            {C.t}
                        </button>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

/** Janela do R / S: quando começou e quando termina a retrogradação, ou quando é a estação. */
const RetroPopover: React.FC<{ info: { id: string; name: string; kind: 'retro' | 'station' | 'direct'; rect: DOMRect }; date: Date; onClose: () => void }> = ({ info, date, onClose }) => {
    const data = useMemo(() => {
        if (info.kind === 'station') {
            const w = findStationWindow(info.id, date);
            return { rows: w ? [
                { k: 'Estação começa', v: w.start },
                { k: w.turnsTo === 'retro' ? 'Vira retrógrado' : 'Vira direto', v: w.at },
                { k: 'Estação termina', v: w.end },
            ] : [], period: w ? { start: w.start, end: w.end } : null };
        }
        if (info.kind === 'direct') {
            const p = findDirectPeriod(info.id, date);
            return { rows: p ? [
                { k: 'Direto desde', v: p.start },
                { k: 'Fica retrógrado em', v: p.end },
            ] : [], period: p };
        }
        const p = findRetrogradePeriod(info.id, date);
        return { rows: p ? [
            { k: 'Começou', v: p.start },
            { k: 'Volta a andar direto em', v: p.end },
        ] : [], period: p };
    }, [info.id, info.kind, date.getTime()]);
    const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const W = 248;
    const left = Math.max(8, Math.min(window.innerWidth - W - 8, info.rect.right - W));
    const top = Math.min(window.innerHeight - 190, info.rect.bottom + 6);
    const { rows, period } = data;
    const prog = period ? Math.max(0, Math.min(1, (date.getTime() - period.start.getTime()) / Math.max(1, period.end.getTime() - period.start.getTime()))) : 0;
    const accent = info.kind === 'station' ? '#FACC15' : info.kind === 'retro' ? '#F87171' : '#EDE9E3';
    const title = info.kind === 'station' ? 'estacionário' : info.kind === 'retro' ? 'retrógrado' : 'direto';
    return createPortal(
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div className="fixed z-[9999] rounded-xl border border-[#2f2a36] bg-[#141018] px-3 py-2.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,.9)]" style={{ top, left, width: W, fontFamily: "'DM Sans', system-ui, sans-serif", color: '#EDE9E3' }} onClick={e => e.stopPropagation()}>
                <div className="text-[9.5px] uppercase tracking-[0.2em] mb-1.5" style={{ color: accent }}>
                    {info.name} {title}
                </div>
                {rows.map(r => (
                    <div key={r.k} className="flex justify-between text-[12px] py-0.5"><span className="text-[#B9B4BE]">{r.k}</span><span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11.5 }}>{fmt(r.v)}</span></div>
                ))}
                {period && (
                    <>
                        <div className="h-[3px] rounded bg-[#2a2430] mt-2 mb-1 relative overflow-hidden"><div className="absolute inset-y-0 left-0 rounded" style={{ width: `${prog * 100}%`, background: accent }} /></div>
                        <div className="text-[11px] text-[#8a8590]">{Math.round(prog * 100)}% do {info.kind === 'station' ? 'período parado' : info.kind === 'retro' ? 'período retrógrado' : 'trânsito direto'}</div>
                    </>
                )}
                {rows.length === 0 && <div className="text-[12px] text-[#B9B4BE]">Não foi possível calcular o período.</div>}
            </div>
        </>,
        document.body
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
    onOpenPaymentPlans,
    referenceDate
}) => {
    const [retroInfo, setRetroInfo] = useState<{ id: string; name: string; kind: 'retro' | 'station' | 'direct'; rect: DOMRect } | null>(null);
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
            const minW = settings.planets.names ? (settings.planets.namesAbbr ? 215 : 296) : 180;
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
                onRetroClick={(id, kind, rect) => setRetroInfo({ id, name: body.name, kind, rect })}
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
                    <div className="po max-h-[75vh] overflow-y-auto custom-scrollbar">
                        <style>{OPT_CSS}</style>
                        <OptHeader title="Opções do painel" context="Astros" />
                        {isFree && (
                            <div className="po-lock">
                                <i className="ti ti-lock" aria-hidden="true" />
                                <span>Ajustes liberados nos planos Mensal e Vitalício.</span>
                                <button type="button" onClick={() => { onOpenPaymentPlans?.(); setActiveMenu(null); }}>Ver planos</button>
                            </div>
                        )}
                        <div className={isFree ? 'po-off' : ''}>
                            <OptGroup title="Planetas" />
                            <OptToggle icon={<i className="ti ti-planet" />} label="Símbolos dos planetas" checked={settings.planets.symbols} onChange={() => onSettingsChange({ ...settings, planets: { ...settings.planets, symbols: !settings.planets.symbols } })} />
                            {settings.planets.symbols && <>
                                <OptToggle sub label="Glifos no lugar das esferas" checked={settings.planets.glyphs} onChange={() => onSettingsChange({ ...settings, planets: { ...settings.planets, glyphs: !settings.planets.glyphs } })} />
                                <OptToggle sub label="Cores dos planetas" checked={settings.planets.colors} onChange={() => onSettingsChange({ ...settings, planets: { ...settings.planets, colors: !settings.planets.colors } })} />
                            </>}
                            <OptToggle icon={<i className="ti ti-letter-case" />} label="Nomes" checked={settings.planets.names} onChange={() => onSettingsChange({ ...settings, planets: { ...settings.planets, names: !settings.planets.names } })} />
                            {settings.planets.names && <>
                                <OptToggle sub label="Abreviar nomes" checked={settings.planets.namesAbbr} onChange={() => onSettingsChange({ ...settings, planets: { ...settings.planets, namesAbbr: !settings.planets.namesAbbr } })} />
                                <OptToggle sub label="Nomes coloridos" checked={settings.planets.namesColors} onChange={() => onSettingsChange({ ...settings, planets: { ...settings.planets, namesColors: !settings.planets.namesColors } })} />
                            </>}

                            <OptGroup title="Signos e casas" />
                            <OptToggle icon={<i className="ti ti-zodiac-aries" />} label="Signos" checked={settings.signs.enabled} onChange={() => onSettingsChange({ ...settings, signs: { ...settings.signs, enabled: !settings.signs.enabled } })} />
                            {settings.signs.enabled && <>
                                <OptToggle sub label="Símbolo" checked={settings.signs.symbols} onChange={() => onSettingsChange({ ...settings, signs: { ...settings.signs, symbols: !settings.signs.symbols } })} />
                                <OptSegment sub label="Nome" value={!settings.signs.abbr ? 'none' : settings.signs.short ? 'short' : 'full'} options={[{ v: 'full', label: 'Completo' }, { v: 'short', label: 'Sigla' }, { v: 'none', label: 'Não' }]} onChange={(v) => onSettingsChange({ ...settings, signs: { ...settings.signs, abbr: v !== 'none', short: v === 'short' } })} />
                                <OptToggle sub label="Cores dos signos" checked={settings.signs.colors} onChange={() => onSettingsChange({ ...settings, signs: { ...settings.signs, colors: !settings.signs.colors } })} />
                            </>}
                            <OptToggle icon={<i className="ti ti-home" />} label="Casas" checked={settings.houses.enabled} onChange={() => onSettingsChange({ ...settings, houses: { ...settings.houses, enabled: !settings.houses.enabled } })} />
                            {settings.houses.enabled && (
                                <OptSegment sub label="Formato" value={houseFormat} options={[{ v: 'roman', label: 'XII' }, { v: 'arabic', label: '12' }]} onChange={(v) => onHouseFormatChange(v as any)} />
                            )}

                            <OptGroup title="Detalhes" />
                            <OptToggle icon={<span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13 }}>°</span>} label="Graus" checked={settings.degrees} onChange={() => onSettingsChange({ ...settings, degrees: !settings.degrees })} />
                            {settings.degrees && (
                                <OptToggle sub label="Graus coloridos" checked={settings.degrees_colors ?? false} onChange={() => onSettingsChange({ ...settings, degrees_colors: !(settings.degrees_colors ?? false) })} />
                            )}
                            <OptToggle icon={<span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#F87171' }}>R</span>} label="Retrógrado e estacionário" checked={settings.retrograde} onChange={() => onSettingsChange({ ...settings, retrograde: !settings.retrograde })} />

                            <OptGroup title="Tamanho" />
                            <OptSlider label="Planetas" value={planetSize || 24} min={12} max={84} step={2} unit="px" onChange={(v) => onPlanetSizeChange?.(v)} />
                            <OptSlider label="Signos" value={zodiacSignSize || 20} min={10} max={60} step={2} unit="px" onChange={(v) => onZodiacSignSizeChange?.(v)} />
                            <OptSlider label="Escala do painel" value={panelScale || 1} min={0.6} max={1.4} step={0.1} display={(v) => `${Math.round(v * 100)}%`} onChange={(v) => onPanelScaleChange?.(v)} />
                        </div>
                    </div>
                </PopupMenu>
            )}

            {retroInfo && (
                <RetroPopover info={retroInfo} date={referenceDate || new Date()} onClose={() => setRetroInfo(null)} />
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
                                        data-tour="planets-clear"
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
                                    <span data-tour={`${sec.key}-toggle`} className="inline-flex">
                                    <MicroToggle
                                        isChecked={allVisible}
                                        onToggle={() => handleToggleSectionVisibility(sec.key)}
                                        title={`Visibilidade · ${sec.label}`}
                                        theme={theme}
                                    />
                                    </span>
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
