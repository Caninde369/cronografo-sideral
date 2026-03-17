
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ZODIAC_ICONS, CELESTIAL_GLYPHS, UI_ICONS } from './icons';
import { ZODIAC_DATA, ELEMENT_COLORS, getZodiacColorClass } from './zodiac';
import { Aspect, ASPECT_ORBS } from '../lib/astrology/aspects';
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
    panelPosition?: 'left' | 'right';
    onWidthChange?: (width: number) => void;
    onPanelPositionChange?: (pos: 'left' | 'right') => void;
    panelScale?: number;
    onPanelScaleChange?: (scale: number) => void;
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
                className="fixed z-[9999] bg-brand-surface/95 backdrop-blur-xl border border-brand-border/10 rounded-lg shadow-2xl p-3 w-72 animate-in fade-in zoom-in-95 duration-100 font-display text-brand-text"
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

const PLANET_NAMES_PT: Record<string, string> = {
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
    northNode: 'Nodo Norte',
    southNode: 'Nodo Sul',
    chiron: 'Quíron',
    lilith: 'Lilith',
    ceres: 'Ceres',
    pallas: 'Pallas',
    juno: 'Juno',
    vesta: 'Vesta'
};

const AspectBodyInfo: React.FC<{ 
    body: Aspect['body1'], 
    itemSize: number, 
    settings: AspectSettings;
    alignment: 'left' | 'right',
    houseFormat: 'arabic' | 'roman';
    zodiacColorMode: 'none' | 'element' | 'modality' | 'polarity';
    showPlanetSpheres?: boolean;
}> = ({ body, itemSize, settings, alignment, houseFormat, zodiacColorMode, showPlanetSpheres }) => {
    const planetGlyph = CELESTIAL_GLYPHS[body.id as keyof typeof CELESTIAL_GLYPHS];
    const sign = body.signIndex >= 0 && body.signIndex < 12 ? ZODIAC_DATA[body.signIndex] : null;
    const ZodiacSymbol = sign ? ZODIAC_ICONS[sign.id as keyof typeof ZODIAC_ICONS] : null;

    const planetColorClass = settings.planets.colors ? (planetColors[body.id] || 'text-brand-text') : 'text-brand-text';
    const nameColorClass = settings.planets.nameColors ? planetColorClass : 'text-brand-text';
    const signColorClass = settings.signs.colors ? getZodiacColorClass(sign, zodiacColorMode) : 'text-brand-text-muted';

    const baseFontSize = itemSize * 0.9;
    const glyphSize = itemSize * 1.1;
    const signSize = itemSize * 0.9;
    
    const houseLabel = houseFormat === 'roman' ? toRoman(body.house) : body.house;

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
            {settings.planets.names && <span className={`${nameColorClass} font-manrope font-light italic whitespace-nowrap`} style={{ fontSize: `${baseFontSize}px` }}>{PLANET_NAMES_PT[body.id] || body.name}</span>}
        </div>
    );
    
    return (
        <div className={`flex items-center ${alignment === 'left' ? 'justify-start' : 'justify-end'} flex-1 min-w-0`}>
            {alignment === 'left' ? (
                <div className="flex items-center gap-1.5">
                    {settings.signs.enabled && ZodiacSymbol && (
                        <div className="flex-shrink-0 flex items-center justify-center overflow-visible">
                            <ZodiacSymbol className={`${signColorClass} overflow-visible`} style={{ width: `${signSize}px`, height: `${signSize}px` }} />
                        </div>
                    )}
                    {settings.houses.enabled && (
                        <div className="flex-shrink-0 flex items-center justify-center px-1">
                            <span className={`font-bold text-center text-brand-text ${houseFormat === 'roman' ? 'font-manrope' : ''}`} style={{ fontSize: `${baseFontSize}px` }}>{houseLabel}</span>
                        </div>
                    )}
                    <div className="w-2"></div>
                    <div className="w-auto flex items-center justify-center">{renderPlanet()}</div>
                </div>
            ) : (
                <div className="flex items-center gap-1.5">
                    <div className="w-auto flex items-center justify-center">{renderPlanet()}</div>
                    <div className="w-2"></div>
                    {settings.houses.enabled && (
                        <div className="flex-shrink-0 flex items-center justify-center px-1">
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


const AspectCard: React.FC<{ 
    aspect: Aspect, 
    isSelected: boolean, 
    onHover: (id: string | null) => void, 
    onClick: (id: string) => void,
    onRightClick: (id: string) => void,
    itemSize: number,
    settings: AspectSettings;
    houseFormat: 'arabic' | 'roman';
    zodiacColorMode: 'none' | 'element' | 'modality' | 'polarity';
    showPlanetSpheres?: boolean;
    onTooltip: (e: React.MouseEvent, aspect: Aspect) => void;
    onTooltipLeave: () => void;
}> = ({ aspect, isSelected, onHover, onClick, onRightClick, itemSize, settings, houseFormat, zodiacColorMode, showPlanetSpheres, onTooltip, onTooltipLeave }) => {
    
    const aspectTypeClasses: Record<string, string> = {
        conjunction: 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]',
        opposition: 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.4)]',
        trine: 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]',
        square: 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]',
        sextile: 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]',
    };
    
    const maxOrb = ASPECT_ORBS[aspect.type as keyof typeof ASPECT_ORBS] || 1;
    const orbRatio = Math.min(aspect.orb / maxOrb, 1);
    const opacity = 0.4 + (1 - orbRatio) * 0.6;
    
    const baseFontSize = itemSize * 0.9;
    const aspectNameFontSize = baseFontSize - 2;

    const renderAspect = () => {
        if (settings.aspects.names) {
             return <span className={`font-bold uppercase font-manrope ${aspectTypeClasses[aspect.type] || ''} whitespace-nowrap`} style={{ fontSize: `${aspectNameFontSize}px` }}>{ASPECT_NAMES[aspect.type] || aspect.type}</span>;
        } else if (settings.aspects.abbr) {
            return <span className={`font-bold uppercase font-manrope ${aspectTypeClasses[aspect.type] || ''} whitespace-nowrap`} style={{ fontSize: `${aspectNameFontSize}px` }}>{aspectAbbr[aspect.type] || aspect.type}</span>;
        } else {
             return <span className={`${aspectTypeClasses[aspect.type] || ''}`} style={{ fontSize: `${itemSize * 1.2}px` }}>{aspect.symbol}</span>;
        }
    };
    
    return (
        <div 
            onMouseEnter={(e) => { onHover(aspect.id); onTooltip(e, aspect); }} 
            onMouseLeave={() => { onHover(null); onTooltipLeave(); }} 
            onClick={() => onClick(aspect.id)}
            onContextMenu={(e) => { e.preventDefault(); onRightClick(aspect.id); }}
            className={`flex items-center justify-between px-2 py-0.5 rounded-lg transition-all duration-200 border cursor-pointer ${isSelected ? 'bg-gradient-to-r from-brand-purple/20 to-brand-orange/20 border-brand-purple/50 shadow-[0_0_15px_rgba(124,58,237,0.2)]' : 'bg-brand-surface/30 border-transparent hover:bg-brand-surface-highlight/30 hover:shadow-md'}`}  
            style={{ opacity }}
        >
            <AspectBodyInfo body={aspect.body1} itemSize={itemSize} settings={settings} alignment="left" houseFormat={houseFormat} zodiacColorMode={zodiacColorMode} showPlanetSpheres={showPlanetSpheres} />
            <div className={`flex-shrink-0 flex flex-col items-center justify-center font-bold px-1 text-center ${settings.aspects.names ? 'min-w-[4.5rem]' : settings.aspects.abbr ? 'min-w-[2.5rem]' : 'min-w-[2rem]'}`}>
                {renderAspect()}
                {settings.orb && (
                    <span className="text-brand-text-muted font-manrope text-xs tabular-nums" style={{ fontSize: `${baseFontSize * 0.9}px` }}>
                        {aspect.orb.toFixed(2)}°
                    </span>
                )}
            </div>
            <AspectBodyInfo body={aspect.body2} itemSize={itemSize} settings={settings} alignment="right" houseFormat={houseFormat} zodiacColorMode={zodiacColorMode} showPlanetSpheres={showPlanetSpheres} />
        </div>
    );
};

export const AstroInfoPanel: React.FC<AstroInfoPanelProps> = ({ 
    aspects, retrogradeStatus, onAspectHover, onAspectClick, onAspectRightClick, selectedAspects, 
    onClearAllSelections, isAnythingSelected, dragHandle, activeMenu, setActiveMenu, scale = 1,
    showAspectLines, setShowAspectLines, showNatalLines, setShowNatalLines, hasNatalDate,
    houseFormat = 'arabic', zodiacColorMode = 'element', showPlanetSpheres,
    settings, onSettingsChange, panelPosition = 'right',
    onWidthChange, onPanelPositionChange,
    panelScale, onPanelScaleChange
}) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [itemSize, setItemSize] = useState(14);
    const scaledItemSize = itemSize * scale;
    const [tooltip, setTooltip] = useState<{ text: React.ReactNode, x: number, y: number } | null>(null);
    const hoverTimeout = useRef<number | null>(null);
    const [calculatedWidth, setCalculatedWidth] = useState(190);

    useEffect(() => {
        // Base width for symbols only, adjusted by internal scale
        let width = 140 * scale; 
        
        const nameWidth = 55 * scale;
        const signWidth = 24 * scale;
        const houseWidth = 24 * scale;
        const aspectNameWidth = 60 * scale;

        if (settings.planets.names) width += nameWidth * 2;
        if (settings.signs.enabled) width += signWidth * 2;
        if (settings.houses.enabled) width += houseWidth * 2;
        if (settings.aspects.names) width += aspectNameWidth;
        else if (settings.aspects.abbr) width += aspectNameWidth * 0.5;
        
        // Add padding and scrollbar buffer
        width += 24 * scale;

        setCalculatedWidth(width);
        
        if (onWidthChange) {
            // Report the visual width (including CSS transform scale)
            onWidthChange(width * (panelScale || 1));
        }
    }, [settings, onWidthChange, scale, panelScale]);
    
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const isMenuOpen = activeMenu === 'aspects';

    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
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
            className="bg-brand-surface/40 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col h-full font-display border border-brand-border/5"
            style={{ 
                minWidth: `${calculatedWidth}px`,
                width: `${100 / (panelScale || 1)}%`,
                transform: `scale(${panelScale || 1})`,
                transformOrigin: panelPosition === 'left' ? 'left top' : 'right top'
            }}
        >
            <div className="px-3 py-2 border-b border-brand-border/5 flex justify-between items-center gap-2 flex-shrink-0 bg-brand-surface-highlight/30 rounded-t-3xl">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {dragHandle}
                    <h3 className="text-[10px] font-medium uppercase text-brand-text-muted tracking-wider truncate font-manrope">Aspectos</h3>
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
                <PopupMenu onClose={() => setActiveMenu(null)} triggerRef={menuButtonRef} panelRef={panelRef}>
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
                            {settings.planets.names && (
                                <div className="flex flex-col px-2">
                                    <div className="flex items-center justify-between py-1.5 pl-4">
                                        <span className="text-xs font-manrope text-brand-text-muted">Cores</span>
                                        <CompactToggle isChecked={settings.planets.nameColors} onToggle={() => onSettingsChange({ ...settings, planets: { ...settings.planets, nameColors: !settings.planets.nameColors } })} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-px bg-brand-border/10"></div>

                        <div>
                            <div className="flex items-center justify-between px-2 mb-1">
                                <div className="text-[10px] font-bold uppercase text-brand-text-muted">Signos</div>
                                <CompactToggle isChecked={settings.signs.enabled} onToggle={() => onSettingsChange({ ...settings, signs: { ...settings.signs, enabled: !settings.signs.enabled } })} />
                            </div>
                            <div className="flex flex-col px-2">
                                {settings.signs.enabled && (
                                    <div className="flex items-center justify-between py-1.5 pl-4">
                                        <span className="text-xs font-manrope text-brand-text-muted">Cores</span>
                                        <CompactToggle isChecked={settings.signs.colors} onToggle={() => onSettingsChange({ ...settings, signs: { ...settings.signs, colors: !settings.signs.colors } })} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-brand-border/10"></div>

                        <div>
                            <div className="flex items-center justify-between px-2 mb-1">
                                <div className="text-[10px] font-bold uppercase text-brand-text-muted">Casas</div>
                                <CompactToggle isChecked={settings.houses.enabled} onToggle={() => onSettingsChange({ ...settings, houses: { ...settings.houses, enabled: !settings.houses.enabled } })} />
                            </div>
                        </div>

                        <div className="h-px bg-brand-border/10"></div>

                        <div>
                            <div className="text-[10px] font-bold uppercase text-brand-text-muted mb-2 px-2">Aspectos</div>
                            <div className="flex flex-col px-2">
                                <div className="flex items-center justify-between py-1.5">
                                    <span className="text-xs font-manrope text-brand-text">Símbolos</span>
                                    <CompactToggle isChecked={settings.aspects.symbols} onToggle={() => onSettingsChange({ ...settings, aspects: { ...settings.aspects, symbols: !settings.aspects.symbols, abbr: false, names: false } })} />
                                </div>
                                <div className="flex items-center justify-between py-1.5">
                                    <span className="text-xs font-manrope text-brand-text">Abreviação</span>
                                    <CompactToggle isChecked={settings.aspects.abbr} onToggle={() => onSettingsChange({ ...settings, aspects: { ...settings.aspects, abbr: !settings.aspects.abbr, symbols: false, names: false } })} />
                                </div>
                                <div className="flex items-center justify-between py-1.5">
                                    <span className="text-xs font-manrope text-brand-text">Nomes</span>
                                    <CompactToggle isChecked={settings.aspects.names} onToggle={() => onSettingsChange({ ...settings, aspects: { ...settings.aspects, names: !settings.aspects.names, symbols: false, abbr: false } })} />
                                </div>
                                
                                <div className="h-px bg-brand-border/10 my-1"></div>
                                
                                <div className="flex items-center justify-between py-1.5 pl-2">
                                    <span className="text-xs font-manrope text-brand-text-muted">Conjunção</span>
                                    <CompactToggle isChecked={settings.aspects.types.conjunction} onToggle={() => onSettingsChange({ ...settings, aspects: { ...settings.aspects, types: { ...settings.aspects.types, conjunction: !settings.aspects.types.conjunction } } })} />
                                </div>
                                <div className="flex items-center justify-between py-1.5 pl-2">
                                    <span className="text-xs font-manrope text-brand-text-muted">Oposição</span>
                                    <CompactToggle isChecked={settings.aspects.types.opposition} onToggle={() => onSettingsChange({ ...settings, aspects: { ...settings.aspects, types: { ...settings.aspects.types, opposition: !settings.aspects.types.opposition } } })} />
                                </div>
                                <div className="flex items-center justify-between py-1.5 pl-2">
                                    <span className="text-xs font-manrope text-brand-text-muted">Trígono</span>
                                    <CompactToggle isChecked={settings.aspects.types.trine} onToggle={() => onSettingsChange({ ...settings, aspects: { ...settings.aspects, types: { ...settings.aspects.types, trine: !settings.aspects.types.trine } } })} />
                                </div>
                                <div className="flex items-center justify-between py-1.5 pl-2">
                                    <span className="text-xs font-manrope text-brand-text-muted">Quadratura</span>
                                    <CompactToggle isChecked={settings.aspects.types.square} onToggle={() => onSettingsChange({ ...settings, aspects: { ...settings.aspects, types: { ...settings.aspects.types, square: !settings.aspects.types.square } } })} />
                                </div>
                                <div className="flex items-center justify-between py-1.5 pl-2">
                                    <span className="text-xs font-manrope text-brand-text-muted">Sextil</span>
                                    <CompactToggle isChecked={settings.aspects.types.sextile} onToggle={() => onSettingsChange({ ...settings, aspects: { ...settings.aspects, types: { ...settings.aspects.types, sextile: !settings.aspects.types.sextile } } })} />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-brand-border/10"></div>

                        <div>
                            <div className="flex items-center justify-between px-2 py-1.5">
                                <div className="text-[10px] font-bold uppercase text-brand-text-muted">Orbes</div>
                                <CompactToggle isChecked={settings.orb} onToggle={() => onSettingsChange({ ...settings, orb: !settings.orb })} />
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

            <div 
                className={`flex-1 overflow-y-auto p-1 min-h-0 space-y-0.5 custom-scrollbar ${panelPosition === 'left' ? '[direction:rtl]' : ''}`}
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
                                    settings={settings}
                                    houseFormat={houseFormat}
                                    zodiacColorMode={zodiacColorMode}
                                    showPlanetSpheres={showPlanetSpheres}
                                    onTooltip={handleTooltip}
                                    onTooltipLeave={handleTooltipLeave}
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
