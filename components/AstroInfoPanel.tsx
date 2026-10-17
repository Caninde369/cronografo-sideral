
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ZODIAC_ICONS, CELESTIAL_GLYPHS, UI_ICONS } from './icons';
import { ZODIAC_DATA, ELEMENT_COLORS, getZodiacColorClass } from './zodiac';
import { Aspect, ASPECT_ORBS, getAspectTransitRange, formatDateCompact } from '../lib/astrology/aspects';
import { WidgetId } from '../App';
import { SizeControl, PopupToggle, SegmentedControl } from './Controls';
import { toRoman } from '../lib/astrology/utils';
import { PlanetSphere } from './CelestialBodyPanel';
import { Tooltip } from './Tooltip';
import { CompactToggle } from './Controls';

export type AspectSettings = {
    planets: {
        symbols: boolean;
        glyphs: boolean;
        colors: boolean;
        names: boolean;
        nameColors: boolean;
        namesAbbr?: boolean;
    };
    signs: {
        enabled: boolean;
        colors: boolean;
    };
    houses: {
        enabled: boolean;
    };
    aspects: {
        symbols: boolean;
        abbr: boolean;
        names: boolean;
        types: {
            conjunction: boolean;
            opposition: boolean;
            trine: boolean;
            square: boolean;
            sextile: boolean;
        };
    };
    orb: boolean;
    transitDates?: boolean;
};

interface AstroInfoPanelProps {
    aspects: Aspect[];
    retrogradeStatus: Record<string, boolean>;
    onAspectHover: (aspectId: string | null) => void;
    onAspectClick: (aspectId: string) => void;
    onAspectRightClick: (aspectId: string) => void;
    selectedAspects: string[];
    onClearAllSelections: () => void;
    isAnythingSelected: boolean;
    dragHandle?: React.ReactNode;
    activeMenu: WidgetId | null;
    setActiveMenu: (id: WidgetId | null) => void;
    scale?: number;
    showAspectLines?: boolean;
    setShowAspectLines?: () => void;
    showNatalLines?: boolean;
    setShowNatalLines?: () => void;
    hasNatalDate?: boolean;
    houseFormat?: 'arabic' | 'roman';
    zodiacColorMode?: 'none' | 'element' | 'modality' | 'polarity';
    showPlanetSpheres?: boolean;
    settings: AspectSettings;
    onSettingsChange: (settings: AspectSettings) => void;
    currentTime?: Date;
    panelPosition?: 'left' | 'right';
    onWidthChange?: (width: number) => void;
    onPanelPositionChange?: (pos: 'left' | 'right') => void;
    panelScale?: number;
    onPanelScaleChange?: (scale: number) => void;
    theme?: 'dark' | 'light';
    hideHeader?: boolean;
    menuButtonRef?: React.RefObject<HTMLButtonElement | null>;
    isFreeTier?: boolean;
    isFreeTrial?: boolean;
    onOpenPaymentPlans?: () => void;
}

const PopupMenu: React.FC<{ children: React.ReactNode, onClose: () => void, triggerRef: React.RefObject<HTMLElement | null>, panelRef?: React.RefObject<HTMLElement | null> }> = ({ children, onClose, triggerRef, panelRef }) => {
    const [coords, setCoords] = useState<{top: number, left?: number, right?: number} | null>(null);

    useEffect(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const isRightSide = rect.left > window.innerWidth / 2;
            
            if (isRightSide && panelRef?.current) {
                const panelRect = panelRef.current.getBoundingClientRect();
                setCoords({
                    top: rect.top,
                    right: window.innerWidth - panelRect.left
                });
            } else {
                setCoords({
                    top: rect.top,
                    left: rect.right + 12
                });
            }
        }
    }, [triggerRef, panelRef]);

    if (!coords) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div 
                className="fixed z-[9999] bg-[#06060a]/98 border border-white/20 shadow-2xl backdrop-blur-2xl rounded-2xl p-3.5 w-80 sm:w-84 animate-in fade-in zoom-in-95 duration-100 font-sans text-brand-text"
                style={{ top: coords.top, left: coords.left, right: coords.right }}
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
    mercury: 'text-zinc-400', // Steel
    venus: 'text-rose-300', // Rose Gold
    mars: 'text-red-400', // Ruby
    jupiter: 'text-orange-300', // Bronze
    saturn: 'text-yellow-600', // Antique Gold
    uranus: 'text-cyan-300', // Turquoise
    neptune: 'text-indigo-400', // Sapphire
    pluto: 'text-slate-500', // Onyx
    northNode: 'text-teal-200', // Pale Aquamarine
    southNode: 'text-amber-700', // Dark Copper
    lilith: 'text-purple-900', // Dark Amethyst
    chiron: 'text-emerald-400', // Emerald
    ceres: 'text-yellow-600', // Wheat/Gold
    pallas: 'text-indigo-300', // Pale Sapphire
    juno: 'text-pink-400', // Rose Quartz
    vesta: 'text-orange-500' // Carnelian
};

const aspectAbbr: Record<string, string> = {
    conjunction: 'CON', opposition: 'OPO', trine: 'TRI', square: 'QUA', sextile: 'SXL',
};

const ASPECT_NAMES: Record<string, string> = {
    conjunction: 'Conjunção', opposition: 'Oposição', trine: 'Trígono', square: 'Quadratura', sextile: 'Sextil',
};

type AspectFormat = 'name' | 'abbr' | 'symbol';

const PLANET_NAMES_ABBR_PT: Record<string, string> = {
    sun: 'Sol',
    moon: 'Lua',
    mercury: 'Mer',
    venus: 'Vên',
    mars: 'Mar',
    jupiter: 'Júp',
    saturn: 'Sat',
    uranus: 'Ura',
    neptune: 'Net',
    pluto: 'Plu',
    northNode: 'Nod.N',
    southNode: 'Nod.S',
    chiron: 'Quí',
    lilith: 'Lil',
    ceres: 'Cer',
    pallas: 'Pal',
    juno: 'Jun',
    vesta: 'Ves',
    partOfFortune: 'Rod'
};

const PLANET_NAMES_FULL_PT: Record<string, string> = {
    sun: 'Sol',
    moon: 'Lua',
    mercury: 'Mercúrio',
    venus: 'Vênus',
    mars: 'Marte',
    jupiter: 'Júpiter',
    saturn: 'Saturno',
    uranus: 'Urano',
    neptune: 'Netuno',
    pluto: 'Plutão',
    northNode: 'Nodo N.',
    southNode: 'Nodo S.',
    chiron: 'Quíron',
    lilith: 'Lilith',
    ceres: 'Ceres',
    pallas: 'Pallas',
    juno: 'Juno',
    vesta: 'Vesta',
    partOfFortune: 'Roda'
};

const AspectBodyInfo: React.FC<{ 
    body: Aspect['body1'], 
    itemSize: number, 
    settings: AspectSettings;
    alignment: 'left' | 'right',
    houseFormat: 'arabic' | 'roman';
    zodiacColorMode: 'none' | 'element' | 'modality' | 'polarity';
    showPlanetSpheres?: boolean;
    theme?: 'dark' | 'light';
}> = ({ body, itemSize, settings, alignment, houseFormat, zodiacColorMode, showPlanetSpheres, theme = 'dark' }) => {
    const planetGlyph = CELESTIAL_GLYPHS[body.id as keyof typeof CELESTIAL_GLYPHS];
    const sign = body.signIndex >= 0 && body.signIndex < 12 ? ZODIAC_DATA[body.signIndex] : null;
    const ZodiacSymbol = sign ? ZODIAC_ICONS[sign.id as keyof typeof ZODIAC_ICONS] : null;

    const planetColorClass = settings.planets.colors ? (planetColors[body.id] || 'text-brand-text') : 'text-brand-text';
    const nameColorClass = settings.planets.nameColors ? planetColorClass : 'text-brand-text';
    const signColorClass = settings.signs.colors ? getZodiacColorClass(sign, zodiacColorMode) : 'text-brand-text';

    const baseFontSize = Math.max(11, itemSize * 0.9);
    const glyphSize = Math.max(12, itemSize * 1.1);
    const signSize = Math.max(12, itemSize * 0.9);
    
    const houseLabel = houseFormat === 'roman' ? toRoman(body.house) : body.house;
    const planetDisplayName = (settings.planets.namesAbbr ?? true) 
        ? (PLANET_NAMES_ABBR_PT[body.id] || body.name) 
        : (PLANET_NAMES_FULL_PT[body.id] || body.name);

    const renderPlanet = () => (
        <div className={`flex items-center gap-1.5 ${alignment === 'right' ? 'flex-row-reverse' : ''}`}>
            {settings.planets.symbols && (
                !settings.planets.glyphs ? (
                    <div className="flex-shrink-0 flex justify-center items-center" style={{ width: `${glyphSize * 1.2}px`, height: `${glyphSize * 1.2}px` }}>
                        <PlanetSphere id={body.id} size={glyphSize * 1.2} />
                    </div>
                ) : (
                    <span className={planetColorClass} style={{ fontSize: `${glyphSize}px` }}>{planetGlyph}</span>
                )
            )}
            {settings.planets.names && <span className={`${nameColorClass} font-manrope font-light italic truncate`} style={{ fontSize: `${baseFontSize}px` }}>{planetDisplayName}</span>}
        </div>
    );
    
    return (
        <div className={`flex items-center ${alignment === 'left' ? 'justify-start' : 'justify-end'} flex-1 min-w-0`}>
            {alignment === 'left' ? (
                <div className="flex items-center gap-1 min-w-0">
                    {settings.signs.enabled && ZodiacSymbol && (
                        <div className="flex-shrink-0 flex items-center justify-center overflow-visible">
                            <ZodiacSymbol className={`${signColorClass} overflow-visible`} style={{ width: `${signSize}px`, height: `${signSize}px` }} />
                        </div>
                    )}
                    {settings.houses.enabled && (
                        <div className="flex-shrink-0 flex items-center justify-center px-0.5">
                            <span className={`font-bold text-center text-brand-text ${houseFormat === 'roman' ? 'font-manrope' : ''}`} style={{ fontSize: `${baseFontSize}px` }}>{houseLabel}</span>
                        </div>
                    )}
                    <div className="w-auto flex items-center justify-center">{renderPlanet()}</div>
                </div>
            ) : (
                <div className="flex items-center gap-1 min-w-0">
                    <div className="w-auto flex items-center justify-center">{renderPlanet()}</div>
                    {settings.houses.enabled && (
                        <div className="flex-shrink-0 flex items-center justify-center px-0.5">
                            <span className={`font-bold text-center text-brand-text ${houseFormat === 'roman' ? 'font-manrope' : ''}`} style={{ fontSize: `${baseFontSize}px` }}>{houseLabel}</span>
                        </div>
                    )}
                    {settings.signs.enabled && ZodiacSymbol && (
                        <div className="flex-shrink-0 flex items-center justify-center overflow-visible">
                            <ZodiacSymbol className={`${signColorClass} overflow-visible`} style={{ width: `${signSize}px`, height: `${signSize}px` }} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const ASPECT_COLORS: Record<string, string> = {
  trine:       '#4ade80',
  sextile:     '#60a5fa',
  conjunction: '#4870FF',
  square:      '#FB923C',
  opposition:  '#f87171',
};

const AspectCard: React.FC<{ 
    aspect: Aspect, 
    isSelected: boolean, 
    onHover: (id: string | null) => void, 
    onClick: (id: string) => void,
    onRightClick: (id: string) => void,
    itemSize: number,
    scale?: number,
    settings: AspectSettings;
    houseFormat: 'arabic' | 'roman';
    zodiacColorMode: 'none' | 'element' | 'modality' | 'polarity';
    showPlanetSpheres?: boolean;
    onTooltip: (e: React.MouseEvent, aspect: Aspect) => void;
    onTooltipLeave: () => void;
    theme?: 'dark' | 'light';
    currentTime?: Date;
}> = ({ aspect, isSelected, onHover, onClick, onRightClick, itemSize, scale = 1, settings, houseFormat, zodiacColorMode, showPlanetSpheres, onTooltip, onTooltipLeave, theme = 'dark', currentTime }) => {
    
    const aspectTypeClasses: Record<string, string> = {
        conjunction: 'drop-shadow-[0_0_8px_rgba(72,112,255,0.4)]',
        opposition: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]',
        trine: 'drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]',
        square: 'drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]',
        sextile: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]',
    };
    
    const maxOrb = ASPECT_ORBS[aspect.type as keyof typeof ASPECT_ORBS] || 1;
    const orbRatio = Math.min(aspect.orb / maxOrb, 1);
    const opacity = 0.4 + (1 - orbRatio) * 0.6;
    
    const baseFontSize = Math.max(10, Math.round(itemSize * 0.9));
    const aspectNameFontSize = Math.max(9, Math.round(baseFontSize - 2));
    const glyphSize = Math.max(11, Math.round(itemSize * 1.1));
    const signSize = Math.max(11, Math.round(itemSize * 0.9));
    const signWidth = Math.max(14, Math.round(16 * scale));
    const houseWidth = Math.max(14, Math.round(16 * scale));
    const symbolWidth = Math.max(16, Math.round(20 * scale));
    const aspectCenterWidth = Math.max(22, Math.round((settings.aspects.names ? 64 : settings.aspects.abbr ? 40 : 28) * scale));
    const orbWidth = Math.max(30, Math.round(40 * scale));
    const cardPaddingY = Math.max(3, Math.round(5 * scale));
    const cardPaddingX = Math.max(6, Math.round(8 * scale));

    const transitRange = useMemo(() => {
        if (!settings.transitDates) return null;
        return getAspectTransitRange(aspect, currentTime || new Date());
    }, [settings.transitDates, aspect, currentTime]);

    const renderAspect = () => {
        const color = ASPECT_COLORS[aspect.type] || '#F5F2EB';
        if (settings.aspects.names) {
             return <span className={`font-bold uppercase font-sans tracking-wide ${aspectTypeClasses[aspect.type] || ''} whitespace-nowrap`} style={{ fontSize: `${aspectNameFontSize}px`, color }}>{ASPECT_NAMES[aspect.type] || aspect.type}</span>;
        } else if (settings.aspects.abbr) {
            return <span className={`font-bold uppercase font-sans tracking-wide ${aspectTypeClasses[aspect.type] || ''} whitespace-nowrap`} style={{ fontSize: `${aspectNameFontSize}px`, color }}>{aspectAbbr[aspect.type] || aspect.type}</span>;
        } else {
             return <span className={`inline-flex items-center justify-center text-center leading-none ${aspectTypeClasses[aspect.type] || ''}`} style={{ fontSize: `${itemSize * 1.2}px`, color }}>{aspect.symbol}</span>;
        }
    };
    
    const isLight = theme === 'light';
    const showPlanetText = settings.planets.names && scale > 0.92;

    // Planet 1 Data
    const planetGlyph1 = CELESTIAL_GLYPHS[aspect.body1.id as keyof typeof CELESTIAL_GLYPHS];
    const sign1 = aspect.body1.signIndex >= 0 && aspect.body1.signIndex < 12 ? ZODIAC_DATA[aspect.body1.signIndex] : null;
    const ZodiacSymbol1 = sign1 ? ZODIAC_ICONS[sign1.id as keyof typeof ZODIAC_ICONS] : null;
    const planetColorClass1 = settings.planets.colors ? (planetColors[aspect.body1.id] || 'text-brand-text') : 'text-brand-text';
    const nameColorClass1 = settings.planets.nameColors ? planetColorClass1 : 'text-brand-text';
    const signColorClass1 = settings.signs.colors ? getZodiacColorClass(sign1, zodiacColorMode) : 'text-brand-text';
    const houseLabel1 = houseFormat === 'roman' ? toRoman(aspect.body1.house) : aspect.body1.house;
    const planetDisplayName1 = (settings.planets.namesAbbr ?? true) 
        ? (PLANET_NAMES_ABBR_PT[aspect.body1.id] || aspect.body1.name) 
        : (PLANET_NAMES_FULL_PT[aspect.body1.id] || aspect.body1.name);

    // Planet 2 Data
    const planetGlyph2 = CELESTIAL_GLYPHS[aspect.body2.id as keyof typeof CELESTIAL_GLYPHS];
    const sign2 = aspect.body2.signIndex >= 0 && aspect.body2.signIndex < 12 ? ZODIAC_DATA[aspect.body2.signIndex] : null;
    const ZodiacSymbol2 = sign2 ? ZODIAC_ICONS[sign2.id as keyof typeof ZODIAC_ICONS] : null;
    const planetColorClass2 = settings.planets.colors ? (planetColors[aspect.body2.id] || 'text-brand-text') : 'text-brand-text';
    const nameColorClass2 = settings.planets.nameColors ? planetColorClass2 : 'text-brand-text';
    const signColorClass2 = settings.signs.colors ? getZodiacColorClass(sign2, zodiacColorMode) : 'text-brand-text';
    const houseLabel2 = houseFormat === 'roman' ? toRoman(aspect.body2.house) : aspect.body2.house;
    const planetDisplayName2 = (settings.planets.namesAbbr ?? true) 
        ? (PLANET_NAMES_ABBR_PT[aspect.body2.id] || aspect.body2.name) 
        : (PLANET_NAMES_FULL_PT[aspect.body2.id] || aspect.body2.name);

    return (
        <div 
            onMouseEnter={(e) => { onHover(aspect.id); onTooltip(e, aspect); }} 
            onMouseLeave={() => { onHover(null); onTooltipLeave(); }} 
            onClick={() => onClick(aspect.id)}
            onContextMenu={(e) => { e.preventDefault(); onRightClick(aspect.id); }}
            className={`flex flex-col gap-1 rounded-[10px] transition-[background,border-color] duration-150 border cursor-pointer ${
                isSelected
                    ? (isLight
                        ? 'bg-gradient-to-b from-[#D4AF37]/25 to-[#D4AF37]/10 border-[#8a6d1f]/60 text-amber-950'
                        : 'bg-gradient-to-b from-[#D4AF37]/[0.10] to-[#D4AF37]/[0.03] border-[#D4AF37]/50')
                    : (isLight
                        ? 'bg-transparent border-transparent hover:bg-black/[0.04] text-amber-950'
                        : 'bg-transparent border-transparent hover:bg-white/[0.05]')
            }`}
            style={{ 
                opacity,
                paddingTop: `${cardPaddingY}px`,
                paddingBottom: `${cardPaddingY}px`,
                paddingLeft: `${cardPaddingX}px`,
                paddingRight: `${cardPaddingX}px`
            }}
        >
            {/* Linha 1: Astros, Aspecto Central e Orbe */}
            <div className="flex items-center justify-between gap-1.5 w-full">
                {/* 1 & 2: Esfera planeta 1 > Nome planeta 1 (Alinhado à direita para convergir com o aspecto central) */}
                <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0 overflow-hidden">
                    {settings.signs.enabled && ZodiacSymbol1 && (
                        <div className="shrink-0 flex items-center justify-center overflow-visible" style={{ width: `${signWidth}px` }}>
                            <ZodiacSymbol1 className={`${signColorClass1} overflow-visible`} style={{ width: `${signSize}px`, height: `${signSize}px` }} />
                        </div>
                    )}
                    {settings.houses.enabled && (
                        <div className="shrink-0 flex items-center justify-center px-0.5" style={{ width: `${houseWidth}px` }}>
                            <span className={`font-bold text-center text-brand-text ${houseFormat === 'roman' ? 'font-manrope' : ''}`} style={{ fontSize: `${baseFontSize}px` }}>{houseLabel1}</span>
                        </div>
                    )}
                    {showPlanetText && (
                        <span className={`${nameColorClass1} font-manrope font-light italic truncate min-w-0 flex-1 text-right leading-none`} style={{ fontSize: `${baseFontSize}px` }}>
                            {planetDisplayName1}
                        </span>
                    )}
                    {settings.planets.symbols && (
                        <div className="shrink-0 flex items-center justify-center" style={{ width: `${symbolWidth}px` }}>
                            {!settings.planets.glyphs ? (
                                <div className="flex justify-center items-center" style={{ width: `${glyphSize * 1.2}px`, height: `${glyphSize * 1.2}px` }}>
                                    <PlanetSphere id={aspect.body1.id} size={glyphSize * 1.2} />
                                </div>
                            ) : (
                                <span className={`${planetColorClass1} shrink-0 text-center leading-none flex items-center justify-center`} style={{ fontSize: `${glyphSize}px` }}>{planetGlyph1}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* 3: Símbolo aspecto - Ponto focal central perfeitamente posicionado entre os dois planetas */}
                <div className="shrink-0 flex items-center justify-center font-bold px-1 text-center" style={{ width: `${aspectCenterWidth}px` }}>
                    {renderAspect()}
                </div>

                {/* 4 & 5: Esfera planeta 2 > Nome planeta 2 (Alinhado à esquerda para convergir com o aspecto central) */}
                <div className="flex-1 flex items-center justify-start gap-1.5 min-w-0 overflow-hidden">
                    {settings.planets.symbols && (
                        <div className="shrink-0 flex items-center justify-center" style={{ width: `${symbolWidth}px` }}>
                            {!settings.planets.glyphs ? (
                                <div className="flex justify-center items-center" style={{ width: `${glyphSize * 1.2}px`, height: `${glyphSize * 1.2}px` }}>
                                    <PlanetSphere id={aspect.body2.id} size={glyphSize * 1.2} />
                                </div>
                            ) : (
                                <span className={`${planetColorClass2} shrink-0 text-center leading-none flex items-center justify-center`} style={{ fontSize: `${glyphSize}px` }}>{planetGlyph2}</span>
                            )}
                        </div>
                    )}
                    {showPlanetText && (
                        <span className={`${nameColorClass2} font-manrope font-light italic truncate min-w-0 flex-1 text-left leading-none`} style={{ fontSize: `${baseFontSize}px` }}>
                            {planetDisplayName2}
                        </span>
                    )}
                    {settings.houses.enabled && (
                        <div className="shrink-0 flex items-center justify-center px-0.5" style={{ width: `${houseWidth}px` }}>
                            <span className={`font-bold text-center text-brand-text ${houseFormat === 'roman' ? 'font-manrope' : ''}`} style={{ fontSize: `${baseFontSize}px` }}>{houseLabel2}</span>
                        </div>
                    )}
                    {settings.signs.enabled && ZodiacSymbol2 && (
                        <div className="shrink-0 flex items-center justify-center overflow-visible" style={{ width: `${signWidth}px` }}>
                            <ZodiacSymbol2 className={`${signColorClass2} overflow-visible`} style={{ width: `${signSize}px`, height: `${signSize}px` }} />
                        </div>
                    )}
                </div>

                {/* 6: Grau do aspecto - Área de segurança para orbe */}
                {settings.orb && (
                    <div className="shrink-0 text-right flex justify-end items-center" style={{ width: `${orbWidth}px` }}>
                        <span 
                            className="tabular-nums font-mono font-normal leading-none tracking-tight" 
                            style={{ 
                                fontSize: `${Math.max(9, baseFontSize * 0.88)}px`, 
                                fontFamily: "'Azeret Mono', monospace", 
                                fontVariantNumeric: 'tabular-nums', 
                                color: isLight ? '#3B2F14' : '#F5F2EB',
                                fontWeight: 400
                            }}
                        >
                            {aspect.orb.toFixed(2)}°
                        </span>
                    </div>
                )}
            </div>

            {/* Linha 2: Vigência do Trânsito (data de início e término formatadas em linha dedicada) */}
            {settings.transitDates && transitRange && (
                <div 
                    className={`flex items-center justify-center gap-1.5 pt-1 mt-0.5 border-t ${
                        isLight ? 'border-black/10 text-stone-700' : 'border-white/10 text-slate-200'
                    } tabular-nums text-center leading-none tracking-tight whitespace-nowrap`}
                    style={{ 
                        fontSize: `${Math.max(8.5, baseFontSize * 0.75)}px`, 
                        fontFamily: "'Azeret Mono', monospace" 
                    }}
                >
                    <span className="inline-flex items-center gap-1">
                        <span className="opacity-70 text-[8px] uppercase font-sans font-medium">de:</span>
                        <span className="font-normal">{formatDateCompact(transitRange.start)}</span>
                    </span>
                    <span className="opacity-40">•</span>
                    <span className="inline-flex items-center gap-1">
                        <span className="opacity-70 text-[8px] uppercase font-sans font-medium">até:</span>
                        <span className="font-normal">{formatDateCompact(transitRange.end)}</span>
                    </span>
                </div>
            )}
        </div>
    );
};

export const AstroInfoPanel: React.FC<AstroInfoPanelProps> = ({ 
    aspects, retrogradeStatus, onAspectHover, onAspectClick, onAspectRightClick, selectedAspects, 
    onClearAllSelections, isAnythingSelected, dragHandle, activeMenu, setActiveMenu, scale = 1,
    showAspectLines, setShowAspectLines, showNatalLines, setShowNatalLines, hasNatalDate,
    houseFormat = 'arabic', zodiacColorMode = 'element', showPlanetSpheres,
    settings, onSettingsChange, currentTime, panelPosition = 'right',
    onWidthChange, onPanelPositionChange,
    panelScale, onPanelScaleChange,
    theme = 'dark',
    hideHeader,
    menuButtonRef,
    isFreeTier = false,
    isFreeTrial = false,
    onOpenPaymentPlans
}) => {
    const isFree = Boolean(isFreeTier || isFreeTrial);
    const panelRef = useRef<HTMLDivElement>(null);
    const [itemSize, setItemSize] = useState(14);
    const scaledItemSize = itemSize * scale * (panelScale || 1);
    const [tooltip, setTooltip] = useState<{ text: React.ReactNode, x: number, y: number } | null>(null);
    const hoverTimeout = useRef<number | null>(null);
    const [calculatedWidth, setCalculatedWidth] = useState(190);
    const isInitialWidthEmitted = useRef(false);

    useEffect(() => {
        // Base width for aspect card container (padding, borders, symbols/spheres)
        let width = 120 * scale * (panelScale || 1); 
        
        const isFullNames = settings.planets.names && settings.planets.namesAbbr === false;
        const nameWidth = (isFullNames ? 56 : 32) * scale * (panelScale || 1);
        const signWidth = 16 * scale * (panelScale || 1);
        const houseWidth = 16 * scale * (panelScale || 1);
        const aspectNameWidth = (settings.aspects.names ? 52 : settings.aspects.abbr ? 26 : 0) * scale * (panelScale || 1);
        const orbWidth = (settings.orb ? 18 : 0) * scale * (panelScale || 1);

        if (settings.planets.names) width += nameWidth * 2;
        if (settings.signs.enabled) width += signWidth * 2;
        if (settings.houses.enabled) width += houseWidth * 2;
        width += aspectNameWidth;
        width += orbWidth;
        
        width += 24 * scale * (panelScale || 1);

        if (settings.transitDates) {
            const minTransitWidth = 230 * scale * (panelScale || 1);
            width = Math.max(width, minTransitWidth);
        }

        const finalWidth = Math.round(width);
        setCalculatedWidth(finalWidth);
        
        if (onWidthChange) {
            onWidthChange(finalWidth);
        }
    }, [settings, onWidthChange, scale, panelScale]);
    
    const localMenuButtonRef = useRef<HTMLButtonElement>(null);
    const finalMenuButtonRef = menuButtonRef || localMenuButtonRef;
    const isMenuOpen = activeMenu === 'aspects';

    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFree) {
            onOpenPaymentPlans?.();
            return;
        }
        setActiveMenu(isMenuOpen ? null : 'aspects');
    };

    const sortedAspects = useMemo(() => {
        return [...aspects].sort((a, b) => a.orb - b.orb);
    }, [aspects]);

    const handleTooltip = (e: React.MouseEvent, aspect: Aspect) => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        hoverTimeout.current = window.setTimeout(() => {
            const aspectName = ASPECT_NAMES[aspect.type] || aspect.type;
            const body1 = aspect.body1;
            const body2 = aspect.body2;
            const sign1 = ZODIAC_DATA[body1.signIndex]?.name || '';
            const sign2 = ZODIAC_DATA[body2.signIndex]?.name || '';
            
            let text = '';
            
            if (!settings.signs.enabled && !settings.houses.enabled) {
                text = `${body1.name} ${aspectName} ${body2.name}`;
            } else {
                text = `${body1.name} em ${sign1} na Casa ${body1.house} ${aspectName} ${body2.name} em ${sign2} na Casa ${body2.house}`;
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

    return (
        <div 
            ref={panelRef} 
            className="flex flex-col h-full font-manrope bg-transparent w-full min-w-0"
        >
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
                            }}>Aspectos</h3>
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
                            title={isFree ? "Opções de Aspectos (Disponível no Plano Pro)" : "Opções do Painel"}
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
                    <PopupMenu onClose={() => setActiveMenu(null)} triggerRef={finalMenuButtonRef} panelRef={panelRef}>
                        <div className="flex flex-col gap-3.5 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar text-white">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <div className="flex items-center gap-2">
                                    <i className="ti ti-adjustments text-brand-purple text-base" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white">Opções do Painel</span>
                                </div>
                                <span className="text-[10px] text-white/40 font-mono">Aspectos</span>
                            </div>

                            {/* Banner de Bloqueio Plano Free */}
                            {isFree && (
                                <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-between gap-2 shadow-sm">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-amber-400 text-sm shrink-0">🔒</span>
                                        <span className="text-[11px] font-semibold text-amber-200 leading-tight">
                                            Edições de Aspectos bloqueadas no Plano Gratuito.
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

                            <div className={isFree ? 'opacity-40 pointer-events-none select-none flex flex-col gap-3.5' : 'flex flex-col gap-3.5'}>
                            {/* Modo de Exibição de Aspecto (Segmented Control Cards) */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1.5 flex items-center gap-1.5 font-sans">
                                    <i className="ti ti-star text-amber-400 text-xs" /> Formato do Aspecto
                                </label>
                                <div className="grid grid-cols-3 gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/10 shadow-inner font-sans">
                                    <button
                                        onClick={() => onSettingsChange({ ...settings, aspects: { ...settings.aspects, symbols: true, abbr: false, names: false } })}
                                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer active:scale-95 ${
                                            settings.aspects.symbols && !settings.aspects.abbr && !settings.aspects.names
                                                ? 'bg-gradient-to-b from-[#D4AF37]/[0.18] to-[#D4AF37]/[0.06] border border-[#D4AF37]/50 text-[#F5D98A]'
                                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <span>☌</span> Símbolo
                                    </button>
                                    <button
                                        onClick={() => onSettingsChange({ ...settings, aspects: { ...settings.aspects, abbr: true, symbols: false, names: false } })}
                                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer active:scale-95 ${
                                            settings.aspects.abbr
                                                ? 'bg-gradient-to-b from-[#D4AF37]/[0.18] to-[#D4AF37]/[0.06] border border-[#D4AF37]/50 text-[#F5D98A]'
                                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <span>CON</span> Abrev.
                                    </button>
                                    <button
                                        onClick={() => onSettingsChange({ ...settings, aspects: { ...settings.aspects, names: true, symbols: false, abbr: false } })}
                                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer active:scale-95 ${
                                            settings.aspects.names
                                                ? 'bg-gradient-to-b from-[#D4AF37]/[0.18] to-[#D4AF37]/[0.06] border border-[#D4AF37]/50 text-[#F5D98A]'
                                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <span>Nome</span>
                                    </button>
                                </div>
                            </div>

                            {/* Filtro de Tipos de Aspecto (Visual Toggle Cards with Colors) */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1.5 flex items-center gap-1.5 font-sans">
                                    <i className="ti ti-filter text-cyan-400 text-xs" /> Filtrar Aspectos Ativos
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-sans">
                                    {[
                                        { id: 'conjunction', label: 'Conjunção', symbol: '☌', color: '#60a5fa', bg: 'rgba(72,112,255,0.25)', border: 'rgba(72,112,255,0.6)' },
                                        { id: 'opposition', label: 'Oposição', symbol: '☍', color: '#f87171', bg: 'rgba(248,113,113,0.25)', border: 'rgba(248,113,113,0.6)' },
                                        { id: 'trine', label: 'Trígono', symbol: '△', color: '#4ade80', bg: 'rgba(74,222,128,0.25)', border: 'rgba(74,222,128,0.6)' },
                                        { id: 'square', label: 'Quadratura', symbol: '□', color: '#FB923C', bg: 'rgba(251,146,60,0.25)', border: 'rgba(251,146,60,0.6)' },
                                        { id: 'sextile', label: 'Sextil', symbol: '⚹', color: '#38bdf8', bg: 'rgba(56,189,248,0.25)', border: 'rgba(56,189,248,0.6)' },
                                    ].map((item) => {
                                        const key = item.id as keyof typeof settings.aspects.types;
                                        const isActive = settings.aspects.types[key];
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => onSettingsChange({
                                                    ...settings,
                                                    aspects: {
                                                        ...settings.aspects,
                                                        types: { ...settings.aspects.types, [key]: !isActive }
                                                    }
                                                })}
                                                className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-xs font-semibold transition-all text-left cursor-pointer active:scale-95 ${
                                                    isActive
                                                        ? 'shadow-md shadow-black/40'
                                                        : 'opacity-40 bg-white/[0.02] border-white/5 hover:opacity-70'
                                                }`}
                                                style={isActive ? { backgroundColor: item.bg, borderColor: item.border } : {}}
                                            >
                                                <span className="font-bold text-sm leading-none" style={{ color: item.color }}>{item.symbol}</span>
                                                <span className="truncate text-[11px] text-white font-bold">{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="h-px bg-white/10" />

                            {/* Planetas Card */}
                            <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/10 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <i className="ti ti-planet text-amber-300 text-sm" />
                                        <span className="text-xs font-bold text-white">Símbolos dos Planetas</span>
                                    </div>
                                    <CompactToggle isChecked={settings.planets.symbols} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, symbols: !settings.planets.symbols } })} />
                                </div>
                                {settings.planets.symbols && (
                                    <div className="pl-6 space-y-1.5 pt-1.5 border-t border-white/5">
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

                                <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                                    <div className="flex items-center gap-1.5">
                                        <i className="ti ti-typography text-blue-300 text-sm" />
                                        <span className="text-xs font-bold text-white">Nomes dos Planetas</span>
                                    </div>
                                    <CompactToggle isChecked={settings.planets.names} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, names: !settings.planets.names } })} />
                                </div>
                                {settings.planets.names && (
                                    <div className="pl-6 space-y-1.5 pt-1.5 border-t border-white/5">
                                        <div className="flex items-center justify-between text-xs text-white/70">
                                            <span>Abreviar Nomes</span>
                                            <CompactToggle isChecked={settings.planets.namesAbbr ?? true} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, namesAbbr: !(settings.planets.namesAbbr ?? true) } })} />
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-white/70">
                                            <span>Cores dos Nomes</span>
                                            <CompactToggle isChecked={settings.planets.nameColors} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, nameColors: !settings.planets.nameColors } })} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Signos & Casas Card */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 bg-white/[0.03] rounded-xl border border-white/10 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <i className="ti ti-zodiac-leo text-emerald-300 text-sm" />
                                            <span className="text-xs font-bold text-white">Signos</span>
                                        </div>
                                        <CompactToggle isChecked={settings.signs.enabled} onToggle={() => onSettingsChange({ ...settings, signs: { ...settings.signs, enabled: !settings.signs.enabled } })} />
                                    </div>
                                    {settings.signs.enabled && (
                                        <div className="flex items-center justify-between text-[11px] text-white/70 pt-1 border-t border-white/5">
                                            <span>Cores</span>
                                            <CompactToggle isChecked={settings.signs.colors} onToggle={() => onSettingsChange({ ...settings, signs: { ...settings.signs, colors: !settings.signs.colors } })} />
                                        </div>
                                    )}
                                </div>

                                <div className="p-2 bg-white/[0.03] rounded-xl border border-white/10 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <i className="ti ti-home text-rose-300 text-sm" />
                                            <span className="text-xs font-bold text-white">Casas</span>
                                        </div>
                                        <CompactToggle isChecked={settings.houses.enabled} onToggle={() => onSettingsChange({ ...settings, houses: { ...settings.houses, enabled: !settings.houses.enabled } })} />
                                    </div>
                                </div>
                            </div>

                            {/* Orbes & Valor */}
                            <div className="p-2 bg-white/[0.03] rounded-xl border border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <i className="ti ti-ruler text-teal-300 text-sm" />
                                    <span className="text-xs font-bold text-white">Exibir Graus de Orbe</span>
                                </div>
                                <CompactToggle isChecked={settings.orb} onToggle={() => onSettingsChange({ ...settings, orb: !settings.orb })} />
                            </div>

                            {/* Vigência do Trânsito */}
                            <div className="p-2 bg-white/[0.03] rounded-xl border border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <i className="ti ti-calendar-time text-fuchsia-300 text-sm" />
                                    <span className="text-xs font-bold text-white">Vigência do Trânsito</span>
                                </div>
                                <CompactToggle isChecked={!!settings.transitDates} onToggle={() => onSettingsChange({ ...settings, transitDates: !settings.transitDates })} />
                            </div>

                            {/* Escala do Painel */}
                            <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/10 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <i className="ti ti-zoom-in text-purple-300 text-sm" />
                                        <span className="text-xs font-bold text-white">Escala do Painel</span>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-purple-300 bg-brand-purple/20 px-1.5 py-0.5 rounded border border-brand-purple/30">
                                        {Math.round((panelScale || 1) * 100)}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => onPanelScaleChange?.(Math.max(0.6, Number(((panelScale || 1) - 0.1).toFixed(1))))} 
                                        className="w-7 h-7 flex items-center justify-center btn-3d-glow btn-3d-dark text-white font-bold transition-all duration-150 active:scale-90 hover:scale-110 cursor-pointer shadow-sm"
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
                                        className="w-7 h-7 flex items-center justify-center btn-3d-glow btn-3d-dark text-white font-bold transition-all duration-150 active:scale-90 hover:scale-110 cursor-pointer shadow-sm"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                        </div>
                    </PopupMenu>
                )}

                <div 
                    className={`flex-1 overflow-y-auto pl-1.5 pr-1.5 py-1 min-h-0 space-y-1 custom-scrollbar ${panelPosition === 'left' ? '[direction:rtl]' : ''}`}
                >
                    <div className={panelPosition === 'left' ? '[direction:ltr]' : ''}>
                        {sortedAspects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-brand-text-muted opacity-50 py-8">
                                <UI_ICONS.AspectIcon className="w-8 h-8 mb-2" />
                                <span className="text-xs uppercase font-bold tracking-wider">Sem Aspectos</span>
                            </div>
                        ) : (
                            sortedAspects.map((aspect) => (
                                <div key={aspect.id}>
                                    <AspectCard 
                                        aspect={aspect} 
                                        isSelected={selectedAspects.includes(aspect.id)}
                                        onHover={onAspectHover}
                                        onClick={onAspectClick}
                                        onRightClick={onAspectRightClick}
                                        itemSize={scaledItemSize}
                                        scale={scale}
                                        settings={settings}
                                        houseFormat={houseFormat}
                                        zodiacColorMode={zodiacColorMode}
                                        showPlanetSpheres={showPlanetSpheres}
                                        onTooltip={handleTooltip}
                                        onTooltipLeave={handleTooltipLeave}
                                        theme={theme}
                                        currentTime={currentTime}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            {tooltip && (
                <Tooltip 
                    text={tooltip.text}
                    visible={!!tooltip}
                    x={tooltip.x}
                    y={tooltip.y}
                />
            )}
        </div>
    );
};
