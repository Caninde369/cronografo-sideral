
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n';
import { createPortal } from 'react-dom';
import { ZODIAC_DATA, getZodiacColorClass } from './zodiac';
import { ZODIAC_ICONS, CELESTIAL_GLYPHS, UI_ICONS } from './icons';
import { WidgetId } from '../App';
import { SizeControl, PopupToggle, CompactToggle } from './Controls';
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
    moonPhase?: number;
    retrogradeStatus: Record<string, boolean>;
    onPlanetHover: (planetId: string | null) => void;
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
}

const PopupMenu: React.FC<{ children: React.ReactNode, onClose: () => void, triggerRef: React.RefObject<HTMLElement | null> }> = ({ children, onClose, triggerRef }) => {
    const [coords, setCoords] = useState<{top: number, left: number} | null>(null);

    useEffect(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const isRightSide = rect.left > window.innerWidth / 2;
            
            setCoords({
                top: rect.top,
                left: isRightSide ? rect.left - 300 : rect.right + 12
            });
        }
    }, [triggerRef]);

    if (!coords) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div 
                className="fixed z-[9999] bg-brand-surface/95 backdrop-blur-xl border border-brand-border/10 rounded-lg shadow-2xl p-3 w-72 animate-in fade-in zoom-in-95 duration-100 font-display text-brand-text"
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
    vesta: 'text-orange-400' // Carnelian (Brighter)
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
    vesta: '#7c2d12' // Dark Orange
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
    onHover: (id: string | null) => void;
    isSelected: boolean;
    isSecondarySelected?: boolean;
    isVisible: boolean;
    onClick: (id: string) => void;
    onRightClick: (id: string) => void;
    itemSize: number;
    zodiacSignSize: number;
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
}> = ({ body, housePlacements, retrogradeStatus, onHover, isSelected, isSecondarySelected, isVisible, onClick, onRightClick, itemSize, zodiacSignSize, settings, houseFormat, zodiacColorMode, anyHovered, isHovered, anySelected, moonPhase, className, onTooltip, onTooltipLeave }) => {
    
    const safeLongitude = body.longitude || 0;
    const signIndex = Math.floor(safeLongitude / 30);
    const sign = signIndex >= 0 && signIndex < 12 ? ZODIAC_DATA[signIndex] : null;
    const houseNumber = housePlacements[body.id];
    const isRetro = retrogradeStatus[body.id];
    
    const planetGlyph = CELESTIAL_GLYPHS[body.id as keyof typeof CELESTIAL_GLYPHS];
    const SignSymbol = sign ? ZODIAC_ICONS[sign.id as keyof typeof ZODIAC_ICONS] : null;

    const planetColorClass = settings.planets.colors ? (planetColors[body.id] || 'text-white') : 'text-white';
    
    const signColorClass = settings.signs.colors ? getZodiacColorClass(sign, zodiacColorMode) : 'text-brand-text-muted';

    const baseClasses = `flex items-center gap-2 transition-all duration-200 cursor-pointer px-2 py-1.5 rounded-xl border ease-out font-display w-full max-w-full ${className || ''}`;
    
    let stateClasses = "";

    if (isSelected) {
        stateClasses = "bg-gradient-to-r from-brand-purple/20 to-brand-orange/20 border-brand-purple/50 shadow-[0_0_15px_rgba(124,58,237,0.2)]";
    } else if (isSecondarySelected) {
        stateClasses = "bg-brand-purple/10 border-brand-purple/30 shadow-[0_0_10px_rgba(124,58,237,0.1)]";
    } else if (isHovered) {
        stateClasses = "bg-brand-surface-highlight/50 border-white/10 shadow-lg scale-[1.02]";
    } else {
        stateClasses = "bg-brand-surface/30 border-transparent hover:bg-brand-surface-highlight/30 hover:shadow-md";
    }

    if (!isVisible) {
        stateClasses += " opacity-40 grayscale-[0.5]";
    } else {
        stateClasses += " opacity-100";
    }

    const glyphSize = itemSize * 1.2;
    const signSize = zodiacSignSize;
    const textSize = itemSize * 0.92; 
    const degreeSize = itemSize * 0.88; 

    // Dynamic width for the icon container to prevent overflow
    // Increased buffer to prevent clipping of the sphere glow/strokes
    const iconContainerSize = Math.max(24, glyphSize * 1.8);

    const renderPlanet = () => (
        <div className="flex items-center gap-2 w-full">
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
            {settings.planets.names && <span className={`font-manrope font-normal italic ${settings.planets.namesColors ? 'text-brand-text' : 'text-brand-text-muted'}`} style={{ fontSize: `${textSize}px` }}>{settings.planets.namesAbbr ? body.name.substring(0, 3).toUpperCase() : body.name}</span>}
        </div>
    );
    
    return (
        <div 
            className={`${baseClasses} ${stateClasses}`}
            onMouseEnter={(e) => { onHover(body.id); onTooltip(e, body.id); }}
            onMouseLeave={() => { onHover(null); onTooltipLeave(); }}
            onClick={() => onClick(body.id)}
            onContextMenu={(e) => { e.preventDefault(); onRightClick(body.id); }}
        >
            <div className="flex items-center gap-2 min-w-0 flex-1">
                {renderPlanet()}
            </div>

             <div className="flex items-center justify-end flex-shrink-0 gap-0.5">
                {settings.signs.enabled && (
                    <div className={`flex items-center gap-2 ${settings.signs.abbr ? 'w-[3.2rem] justify-start' : 'w-8 justify-center'}`}>
                        {settings.signs.symbols && SignSymbol && <SignSymbol className={signColorClass} style={{ width: `${signSize}px`, height: `${signSize}px` }} />}
                        {settings.signs.abbr && <span className={`${signColorClass} font-manrope font-normal text-xs`}>{sign ? (sign as any).abbr : '-'}</span>}
                    </div>
                )}
                {settings.houses.enabled && (
                    <div className="w-6 flex items-center justify-center">
                         {houseNumber && <span className={`font-bold text-center text-brand-text ${houseFormat === 'roman' ? 'font-serif' : ''}`} style={{ fontSize: `${degreeSize}px` }}>{houseFormat === 'roman' ? toRoman(houseNumber) : houseNumber}</span>}
                    </div>
                )}
                {settings.degrees && (
                    <div className="w-[3.8rem] flex items-center justify-center bg-brand-surface-highlight/50 rounded py-0 ml-1 shadow-sm border border-brand-border/5 h-full min-h-[1.2em]">
                        <span className="font-manrope font-medium text-brand-text tracking-tight tabular-nums leading-none" style={{ fontSize: `${degreeSize}px` }}>
                            {formatDegrees(safeLongitude % 30)}
                        </span>
                    </div>
                )}
                {settings.retrograde && (
                    <div className="w-5 flex items-center justify-center">
                        {isRetro && <span className="font-bold text-red-400" style={{ fontSize: `${degreeSize}px` }}>R</span>}
                    </div>
                )}
            </div>
        </div>
    );
};

export const CelestialBodyPanel: React.FC<CelestialBodyPanelProps> = ({
    sunEclipticLongitude, moonEclipticLongitude, mercuryEclipticLongitude, marsEclipticLongitude, venusEclipticLongitude, jupiterEclipticLongitude, saturnEclipticLongitude, neptuneEclipticLongitude, uranusEclipticLongitude, plutoEclipticLongitude, lilithEclipticLongitude, northNodeEclipticLongitude, southNodeEclipticLongitude, chironEclipticLongitude, ceresEclipticLongitude, pallasEclipticLongitude, junoEclipticLongitude, vestaEclipticLongitude,
    retrogradeStatus, onPlanetHover, housePlacements, 
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
    planetSize = 13,
    onPlanetSizeChange,
    zodiacSignSize = 12,
    onZodiacSignSizeChange,
    panelScale = 1,
    onPanelScaleChange,
    activeTab = 'transit',
    onTabChange,
    hasNatalDate
}) => {
    const { t } = useLanguage();
    const itemSize = planetSize;
    const scaledItemSize = itemSize * scale;
    const scaledZodiacSignSize = zodiacSignSize * scale;
    const [tooltip, setTooltip] = useState<{ text: React.ReactNode, x: number, y: number } | null>(null);
    const hoverTimeout = useRef<number | null>(null);

    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const isMenuOpen = activeMenu === 'planets';
    
    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenu(isMenuOpen ? null : 'planets');
    };
    
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
        'Pontos': true,
        'Asteroides': true,
    });
    const toggleSection = (title: string) => setCollapsedSections(prev => ({ ...prev, [title]: !prev[title] }));

    useEffect(() => {
        if (onWidthChange) {
            let width = 4; // Minimal base padding
            let leftColWidth = 0;
            // Planet Section
            // Dynamic width calculation based on itemSize and scale
            const currentGlyphSize = scaledItemSize * 1.2;
            const currentIconContainerSize = Math.max(24, currentGlyphSize * 1.8);
            
            if (settings.planets.symbols) leftColWidth += currentIconContainerSize; 
            if (settings.planets.names) leftColWidth += settings.planets.namesAbbr ? 40 : 65; // Approx min width for name
            if (settings.planets.symbols && settings.planets.names) leftColWidth += 6; 
            
            width += leftColWidth;
            
            // Right Section
            if (settings.signs.enabled) width += settings.signs.abbr ? 54 : 34; // Tightened
            if (settings.houses.enabled) width += 26;
            if (settings.degrees) width += 64; // Tightened from 72
            if (settings.retrograde) width += 22;
            
            width += 18; // Vertical Scrollbar buffer + slight margin
            
            onWidthChange(width * (panelScale || 1));
        }
    }, [settings, onWidthChange, scaledItemSize, panelScale]);
    
    const celestialBodies = useMemo(() => ({
        planets: [
            { id: 'sun', name: 'Sol', longitude: sunEclipticLongitude }, { id: 'moon', name: 'Lua', longitude: moonEclipticLongitude },
            { id: 'mercury', name: 'Mercúrio', longitude: mercuryEclipticLongitude }, { id: 'venus', name: 'Vênus', longitude: venusEclipticLongitude },
            { id: 'mars', name: 'Marte', longitude: marsEclipticLongitude }, { id: 'jupiter', name: 'Júpiter', longitude: jupiterEclipticLongitude },
            { id: 'saturn', name: 'Saturno', longitude: saturnEclipticLongitude }, { id: 'uranus', name: 'Urano', longitude: uranusEclipticLongitude },
            { id: 'neptune', name: 'Netuno', longitude: neptuneEclipticLongitude }, { id: 'pluto', name: 'Plutão', longitude: plutoEclipticLongitude },
        ],
        points: [
            { id: 'northNode', name: 'Nodo N.', longitude: northNodeEclipticLongitude }, { id: 'lilith', name: 'Lilith', longitude: lilithEclipticLongitude },
            { id: 'southNode', name: 'Nodo S.', longitude: southNodeEclipticLongitude },
        ],
        asteroids: [
            { id: 'chiron', name: 'Quíron', longitude: chironEclipticLongitude }, { id: 'ceres', name: 'Ceres', longitude: ceresEclipticLongitude },
            { id: 'pallas', name: 'Pallas', longitude: pallasEclipticLongitude }, { id: 'juno', name: 'Juno', longitude: junoEclipticLongitude },
            { id: 'vesta', name: 'Vesta', longitude: vestaEclipticLongitude },
        ]
    }), [sunEclipticLongitude, moonEclipticLongitude, mercuryEclipticLongitude, marsEclipticLongitude, venusEclipticLongitude, jupiterEclipticLongitude, saturnEclipticLongitude, uranusEclipticLongitude, neptuneEclipticLongitude, plutoEclipticLongitude, lilithEclipticLongitude, northNodeEclipticLongitude, southNodeEclipticLongitude, chironEclipticLongitude, ceresEclipticLongitude, pallasEclipticLongitude, junoEclipticLongitude, vestaEclipticLongitude]);


    const arePrincipaisVisible = useMemo(() => celestialBodies.planets.every(p => visiblePlanets[p.id]), [celestialBodies.planets, visiblePlanets]);
    const arePontosVisible = useMemo(() => celestialBodies.points.every(p => visiblePlanets[p.id]), [celestialBodies.points, visiblePlanets]);
    const areAsteroidesVisible = useMemo(() => celestialBodies.asteroids.every(p => visiblePlanets[p.id]), [celestialBodies.asteroids, visiblePlanets]);

    const handleToggleSectionVisibility = (section: 'planets' | 'points' | 'asteroids') => {
        const bodiesInSection = celestialBodies[section];
        const sectionIds = bodiesInSection.map(body => body.id);
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
            const body = [...celestialBodies.planets, ...celestialBodies.points, ...celestialBodies.asteroids].find(b => b.id === id);
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

    const renderBodyCard = (body: { id: string, name: string, longitude: number }) => (
        <CelestialBodyCard 
            key={body.id} 
            body={body} 
            housePlacements={housePlacements} 
            retrogradeStatus={retrogradeStatus} 
            onHover={onPlanetHover} 
            isSelected={selectedPlanets.includes(body.id)} 
            isSecondarySelected={secondarySelectedPlanets.includes(body.id)}
            isVisible={!!visiblePlanets[body.id]}
            onClick={onPlanetClick} 
            onRightClick={onPlanetRightClick}
            itemSize={scaledItemSize}
            zodiacSignSize={scaledZodiacSignSize}
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
        />
    );

    const renderSectionHeader = (title: string, actions: React.ReactNode) => (
        <div className="flex justify-between items-center px-2 py-1 mt-1 flex-none group">
            <h4 className="text-[10px] font-bold uppercase text-brand-purple tracking-wider font-manrope truncate mr-2">{title}</h4>
            <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">{actions}</div>
        </div>
    );

    return (
        <div 
            className="bg-brand-surface/40 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col h-full font-display border border-brand-border/5 relative"
            style={{ 
                width: `${100 / (panelScale || 1)}%`,
                transform: `scale(${panelScale || 1})`,
                transformOrigin: panelPosition === 'left' ? 'left top' : 'right top'
            }}
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
                </defs>
            </svg>

            <div className="px-3 py-2 border-b border-brand-border/5 flex justify-between items-center gap-2 flex-shrink-0 bg-brand-surface-highlight/30 rounded-t-3xl">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {dragHandle}
                    <h3 className="text-[10px] font-medium uppercase text-brand-text-muted tracking-wider truncate font-manrope">Corpos Celestes</h3>
                    <div className="h-px bg-brand-border/10 flex-1 ml-2"></div>
                </div>
                <button 
                    ref={menuButtonRef}
                    onClick={handleMenuToggle}
                    className={`p-1 rounded-lg transition-colors ${isMenuOpen ? 'bg-brand-surface-highlight text-brand-text' : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-highlight/50'}`}
                >
                    <UI_ICONS.MoreIcon className="w-4 h-4" />
                </button>
            </div>

            {isMenuOpen && (
                <PopupMenu onClose={() => setActiveMenu(null)} triggerRef={menuButtonRef}>
                    <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div>
                            <div className="flex items-center justify-between px-2 mb-1">
                                <div className="text-[10px] font-bold uppercase text-brand-text-muted">Símbolos Planetas</div>
                                <CompactToggle isChecked={settings.planets.symbols} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, symbols: !settings.planets.symbols } })} />
                            </div>
                            <div className="flex flex-col px-2">
                                {settings.planets.symbols && (
                                    <>
                                        <div className="flex items-center justify-between py-1.5 pl-4">
                                            <span className="text-xs font-manrope text-brand-text-muted">Glifos (vs Esferas)</span>
                                            <CompactToggle isChecked={settings.planets.glyphs} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, glyphs: !settings.planets.glyphs } })} />
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 pl-4">
                                            <span className="text-xs font-manrope text-brand-text-muted">Cores</span>
                                            <CompactToggle isChecked={settings.planets.colors} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, colors: !settings.planets.colors } })} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-brand-border/10"></div>

                        <div>
                            <div className="flex items-center justify-between px-2 mb-1">
                                <div className="text-[10px] font-bold uppercase text-brand-text-muted">Nomes Planetas</div>
                                <CompactToggle isChecked={settings.planets.names} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, names: !settings.planets.names } })} />
                            </div>
                            <div className="flex flex-col px-2">
                                {settings.planets.names && (
                                    <>
                                        <div className="flex items-center justify-between py-1.5 pl-4">
                                            <span className="text-xs font-manrope text-brand-text-muted">Cores</span>
                                            <CompactToggle isChecked={settings.planets.namesColors} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, namesColors: !settings.planets.namesColors } })} />
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 pl-4">
                                            <span className="text-xs font-manrope text-brand-text-muted">Abreviação</span>
                                            <CompactToggle isChecked={settings.planets.namesAbbr} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, namesAbbr: !settings.planets.namesAbbr } })} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-brand-border/10"></div>

                        <div>
                            <div className="flex items-center justify-between px-2 mb-1">
                                <div className="text-[10px] font-bold uppercase text-brand-text-muted">Signos</div>
                                <CompactToggle isChecked={settings.signs.enabled} onToggle={() => onSettingsChange({ ...settings, signs: { ...settings.signs, enabled: !settings.signs.enabled } })} />
                            </div>
                            <div className="flex flex-col px-2">
                                {settings.signs.enabled && (
                                    <>
                                        <div className="flex items-center justify-between py-1.5 pl-4">
                                            <span className="text-xs font-manrope text-brand-text-muted">Símbolos</span>
                                            <CompactToggle isChecked={settings.signs.symbols} onToggle={() => onSettingsChange({ ...settings, signs: { ...settings.signs, symbols: !settings.signs.symbols } })} />
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 pl-4">
                                            <span className="text-xs font-manrope text-brand-text-muted">Cores</span>
                                            <CompactToggle isChecked={settings.signs.colors} onToggle={() => onSettingsChange({ ...settings, signs: { ...settings.signs, colors: !settings.signs.colors } })} />
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 pl-4">
                                            <span className="text-xs font-manrope text-brand-text-muted">Abreviação</span>
                                            <CompactToggle isChecked={settings.signs.abbr} onToggle={() => onSettingsChange({ ...settings, signs: { ...settings.signs, abbr: !settings.signs.abbr } })} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-brand-border/10"></div>

                        <div>
                            <div className="flex items-center justify-between px-2 mb-1">
                                <div className="text-[10px] font-bold uppercase text-brand-text-muted">Casas</div>
                                <CompactToggle isChecked={settings.houses.enabled} onToggle={() => onSettingsChange({ ...settings, houses: { ...settings.houses, enabled: !settings.houses.enabled } })} />
                            </div>
                            <div className="flex flex-col px-2">
                                {settings.houses.enabled && (
                                    <div className="flex items-center justify-between py-1.5 pl-4">
                                        <span className="text-xs font-manrope text-brand-text-muted">Formato</span>
                                        <div className="flex bg-brand-surface-highlight/50 p-0.5 rounded-lg">
                                            <button
                                                onClick={() => onHouseFormatChange('roman')}
                                                className={`px-2 py-1 rounded-md text-[10px] font-manrope transition-all ${houseFormat === 'roman' ? 'bg-brand-surface shadow-sm text-brand-text' : 'text-brand-text-muted hover:text-brand-text-muted/80'}`}
                                            >
                                                Romanos
                                            </button>
                                            <button
                                                onClick={() => onHouseFormatChange('arabic')}
                                                className={`px-2 py-1 rounded-md text-[10px] font-manrope transition-all ${houseFormat === 'arabic' ? 'bg-brand-surface shadow-sm text-brand-text' : 'text-brand-text-muted hover:text-brand-text-muted/80'}`}
                                            >
                                                Números
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-brand-border/10"></div>

                        <div>
                            <div className="flex items-center justify-between px-2 py-1.5">
                                <div className="text-[10px] font-bold uppercase text-brand-text-muted">Graus</div>
                                <CompactToggle isChecked={settings.degrees} onToggle={() => onSettingsChange({ ...settings, degrees: !settings.degrees })} />
                            </div>
                        </div>

                        <div className="h-px bg-brand-border/10"></div>

                        <div>
                            <div className="flex items-center justify-between px-2 py-1.5">
                                <div className="text-[10px] font-bold uppercase text-brand-text-muted">Retrogradação</div>
                                <CompactToggle isChecked={settings.retrograde} onToggle={() => onSettingsChange({ ...settings, retrograde: !settings.retrograde })} />
                            </div>
                        </div>
                        
                        {onPanelPositionChange && (
                            <>
                                <div className="h-px bg-brand-border/10"></div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-brand-text-muted mb-2 px-2">Posição do Painel</div>
                                    <div className="flex bg-brand-surface-highlight/50 p-1 rounded-lg">
                                        <button
                                            onClick={() => onPanelPositionChange('left')}
                                            className={`flex-1 py-1.5 rounded-md text-xs font-manrope transition-all ${panelPosition === 'left' ? 'bg-brand-surface shadow-sm text-brand-text' : 'text-brand-text-muted hover:text-brand-text-muted/80'}`}
                                        >
                                            Esq.
                                        </button>
                                        <button
                                            onClick={() => onPanelPositionChange('right')}
                                            className={`flex-1 py-1.5 rounded-md text-xs font-manrope transition-all ${panelPosition === 'right' ? 'bg-brand-surface shadow-sm text-brand-text' : 'text-brand-text-muted hover:text-brand-text-muted/80'}`}
                                        >
                                            Dir.
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="h-px bg-brand-border/10 my-1" />

                        {/* Size Controls */}
                        <div className="space-y-3 px-1 py-1">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] text-brand-text-muted uppercase font-bold tracking-wider">
                                    <span>Planetas</span>
                                    <span className="text-brand-text">{planetSize}px</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onPlanetSizeChange?.(Math.max(12, (planetSize || 24) - 2))} className="w-6 h-6 flex items-center justify-center bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded text-brand-text border border-brand-border/5">-</button>
                                    <div className="flex-1 h-1 bg-brand-surface-highlight/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-purple" style={{ width: `${(((planetSize || 24) - 12) / (84 - 12)) * 100}%` }}></div>
                                    </div>
                                    <button onClick={() => onPlanetSizeChange?.(Math.min(84, (planetSize || 24) + 2))} className="w-6 h-6 flex items-center justify-center bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded text-brand-text border border-brand-border/5">+</button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] text-brand-text-muted uppercase font-bold tracking-wider">
                                    <span>Signos</span>
                                    <span className="text-brand-text">{zodiacSignSize}px</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onZodiacSignSizeChange?.(Math.max(10, (zodiacSignSize || 20) - 2))} className="w-6 h-6 flex items-center justify-center bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded text-brand-text border border-brand-border/5">-</button>
                                    <div className="flex-1 h-1 bg-brand-surface-highlight/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-purple" style={{ width: `${(((zodiacSignSize || 20) - 10) / (60 - 10)) * 100}%` }}></div>
                                    </div>
                                    <button onClick={() => onZodiacSignSizeChange?.(Math.min(60, (zodiacSignSize || 20) + 2))} className="w-6 h-6 flex items-center justify-center bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded text-brand-text border border-brand-border/5">+</button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] text-brand-text-muted uppercase font-bold tracking-wider">
                                    <span>Escala Painel</span>
                                    <span className="text-brand-text">{Math.round((panelScale || 1) * 100)}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onPanelScaleChange?.(Math.max(0.6, Number(((panelScale || 1) - 0.1).toFixed(1))))} className="w-6 h-6 flex items-center justify-center bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded text-brand-text border border-brand-border/5">-</button>
                                    <div className="flex-1 h-1 bg-brand-surface-highlight/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-purple" style={{ width: `${(((panelScale || 1) - 0.6) / (1.4 - 0.6)) * 100}%` }}></div>
                                    </div>
                                    <button onClick={() => onPanelScaleChange?.(Math.min(1.4, Number(((panelScale || 1) + 0.1).toFixed(1))))} className="w-6 h-6 flex items-center justify-center bg-brand-surface-highlight/50 hover:bg-brand-surface-highlight rounded text-brand-text border border-brand-border/5">+</button>
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

            <div className="flex-grow min-h-0 w-full px-1 pb-1 flex flex-col gap-0.5 overflow-hidden">
                {hasNatalDate && onTabChange && (
                    <div className="flex justify-center mb-2 mt-1">
                        <div className="flex bg-brand-surface-highlight/40 rounded-xl p-1 border border-white/5 shadow-inner">
                            <button
                                onClick={() => onTabChange('transit')}
                                className={`px-4 py-1 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${activeTab === 'transit' ? 'bg-brand-purple text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]' : 'text-brand-text-muted hover:text-brand-text'}`}
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
                {renderSectionHeader("Principais",
                    anySelected ? (
                        <button onClick={onClearSelections} className="p-1 rounded-full hover:bg-red-500/20 text-red-400 transition-colors" title="Limpar Seleção">
                            <UI_ICONS.CloseIcon className="w-5 h-5" />
                        </button>
                    ) : (
                        <CompactToggle isChecked={arePrincipaisVisible} onToggle={() => handleToggleSectionVisibility('planets')} />
                    )
                )}
                {celestialBodies.planets.map(renderBodyCard)}

                {renderSectionHeader("Pontos",
                    <div className="flex items-center gap-2">
                         <CompactToggle isChecked={arePontosVisible} onToggle={() => handleToggleSectionVisibility('points')} />
                        <button onClick={() => toggleSection('Pontos')} className="p-1 rounded-full hover:bg-brand-surface-highlight text-brand-text-muted"><UI_ICONS.ChevronDownIcon className={`w-5 h-5 transition-transform ${collapsedSections['Pontos'] ? '-rotate-90' : ''}`} /></button>
                    </div>
                )}
                {!collapsedSections['Pontos'] && celestialBodies.points.map(renderBodyCard)}

                {renderSectionHeader("Asteroides", 
                    <div className="flex items-center gap-2">
                         <CompactToggle isChecked={areAsteroidesVisible} onToggle={() => handleToggleSectionVisibility('asteroids')} />
                        <button onClick={() => toggleSection('Asteroides')} className="p-1 rounded-full hover:bg-brand-surface-highlight text-brand-text-muted"><UI_ICONS.ChevronDownIcon className={`w-5 h-5 transition-transform ${collapsedSections['Asteroides'] ? '-rotate-90' : ''}`} /></button>
                    </div>
                )}
                {!collapsedSections['Asteroides'] && celestialBodies.asteroids.map(renderBodyCard)}
            </div>
        </div>
    );
};
