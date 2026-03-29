
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CelestialData } from '../hooks/useCelestialData';
import { ZODIAC_DATA } from './zodiac';
import { UI_ICONS } from './icons';
import { WidgetId } from '../App';

import { getMoonPhaseInfo } from '../lib/astrology/moon';

export type HighlightFilter = {
    type: 'element' | 'modality' | 'polarity';
    value: string;
} | null;

interface ChartStatisticsPanelProps {
    celestialData: CelestialData;
    scale?: number;
    zodiacColorMode?: 'none' | 'element' | 'modality' | 'polarity';
    onZodiacColorModeChange?: (mode: 'none' | 'element' | 'modality' | 'polarity') => void;
    highlightFilter?: HighlightFilter;
    onHighlightFilterChange?: (filter: HighlightFilter) => void;
    layoutMode?: 'minimal' | 'complete';
    onLayoutChange?: (mode: 'minimal' | 'complete') => void;
    activeMenu?: WidgetId | null;
    setActiveMenu?: (id: WidgetId | null) => void;
    panelPosition?: 'left' | 'right';
    dragHandle?: React.ReactNode;
    onPanelPositionChange?: (pos: 'left' | 'right') => void;
    onWidthChange?: (width: number) => void;
    seasonInfo?: { name: string; color: string; icon: any };
    sunriseTime?: string;
    sunsetTime?: string;
    moonPhase?: number;
    moonriseTime?: string;
    moonsetTime?: string;
    onEclipseClick?: () => void;
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

const ELEMENT_SYMBOLS: Record<string, React.ReactNode> = {
    fire: (
        <svg width="10" height="11" viewBox="0 0 10 11" fill="none" className="opacity-70">
            <path d="M5 1L1 10h8L5 1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
        </svg>
    ),
    water: (
        <svg width="10" height="11" viewBox="0 0 10 11" fill="none" className="opacity-70">
            <path d="M5 10L1 1h8L5 10Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
        </svg>
    ),
    air: (
        <svg width="10" height="11" viewBox="0 0 10 11" fill="none" className="opacity-70">
            <path d="M5 1L1 10h8L5 1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
            <path d="M2.5 6.5h5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
    ),
    earth: (
        <svg width="10" height="11" viewBox="0 0 10 11" fill="none" className="opacity-70">
            <path d="M5 10L1 1h8L5 10Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
            <path d="M2.5 4.5h5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
    )
};

const MODALITY_SYMBOLS: Record<string, React.ReactNode> = {
    cardinal: (
        <svg width="10" height="11" viewBox="0 0 10 11" fill="none" className="opacity-70">
            <path d="M1 5.5h8M5.5 1v9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
    ),
    fixed: (
        <svg width="10" height="11" viewBox="0 0 10 11" fill="none" className="opacity-70">
            <rect x="1" y="1.5" width="8" height="8" stroke="currentColor" strokeWidth="1.1"/>
            <circle cx="5" cy="5.5" r="1" fill="currentColor"/>
        </svg>
    ),
    mutable: (
        <svg width="10" height="11" viewBox="0 0 10 11" fill="none" className="opacity-70">
            <path d="M2 2.5l6 6M8 2.5l-6 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
    )
};

const GENDER_SYMBOLS: Record<string, React.ReactNode> = {
    masculine: (
        <svg width="10" height="11" viewBox="0 0 10 11" fill="none" className="opacity-70">
            <circle cx="4" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.1"/>
            <path d="M6 5l3-3M6 2h3v3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    feminine: (
        <svg width="10" height="11" viewBox="0 0 10 11" fill="none" className="opacity-70">
            <circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.1"/>
            <path d="M5 6.5v3.5M3.5 8.5h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
    )
};

const ThinMultiBar: React.FC<{
    segments: { value: number; colorClass: string; label: string; filterValue: string }[];
    total: number;
    filterType: 'element' | 'modality' | 'polarity';
    activeFilter: string | null;
    onHover: (val: string) => void;
    onLeave: () => void;
    compact?: boolean;
    isCompactPanel?: boolean;
}> = ({ segments, total, filterType, activeFilter, onHover, onLeave, compact, isCompactPanel }) => {
    return (
        <div className={`flex flex-col w-full ${isCompactPanel ? 'gap-0.5' : 'gap-1.5'}`}>
            {/* The Bar */}
            <div className={`w-full flex rounded-full overflow-hidden bg-brand-surface-highlight ${compact ? 'h-1.5' : 'h-1'}`}>
                {segments.map((seg, i) => {
                    if (seg.value === 0) return null;
                    const width = total > 0 ? (seg.value / total) * 100 : 0;
                    const isActive = !activeFilter || activeFilter === seg.filterValue;
                    return (
                        <div 
                            key={i} 
                            style={{ width: `${width}%` }} 
                            className={`h-full ${seg.colorClass} transition-all duration-500 cursor-crosshair ${isActive ? 'opacity-100' : 'opacity-20'}`}
                            onMouseEnter={() => onHover(seg.filterValue)}
                            onMouseLeave={onLeave}
                        />
                    );
                })}
            </div>
            {/* The Legend */}
            {!compact && (
                <div className="flex justify-between items-center w-full">
                    {segments.map((seg, i) => {
                        if (seg.value === 0) return null;
                        const isActive = !activeFilter || activeFilter === seg.filterValue;
                        return (
                            <div 
                                key={i} 
                                className={`flex items-center gap-1 cursor-crosshair transition-opacity ${isActive ? 'opacity-100' : 'opacity-30 hover:opacity-100'}`}
                                onMouseEnter={() => onHover(seg.filterValue)}
                                onMouseLeave={onLeave}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${seg.colorClass} shadow-[0_0_4px_currentColor]`} />
                                <span className="text-[8px] uppercase tracking-wider text-brand-text-muted">{seg.label}</span>
                                <span className="font-manrope text-[9px] text-brand-text tabular-nums">{seg.value}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const ChartStatisticsPanel: React.FC<ChartStatisticsPanelProps> = ({ 
    celestialData, 
    scale = 1, 
    zodiacColorMode, 
    onZodiacColorModeChange, 
    highlightFilter, 
    onHighlightFilterChange,
    layoutMode = 'complete',
    onLayoutChange,
    activeMenu,
    setActiveMenu,
    panelPosition = 'right',
    dragHandle,
    onPanelPositionChange,
    onWidthChange,
    seasonInfo,
    sunriseTime,
    sunsetTime,
    moonPhase,
    moonriseTime,
    moonsetTime,
    onEclipseClick
}) => {
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const isMenuOpen = activeMenu === 'statistics'; 
    
    useEffect(() => {
        if (onWidthChange) {
            const baseWidth = layoutMode === 'complete' ? 260 : 160;
            onWidthChange(baseWidth * scale);
        }
    }, [layoutMode, onWidthChange, scale]);
    // Actually WidgetId is 'planets' | 'aspects' | 'houses' | 'transits' | 'clock' | 'toolbar'.
    // I should add 'statistics' to WidgetId in App.tsx.
    // For now I'll cast it or just use a local state if I can't change App.tsx types easily (I can, but let's see).
    // The user didn't ask to change types, but I need to to support the menu.
    // I'll assume I can update App.tsx.
    // I'll assume I can update App.tsx.

    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenu?.(isMenuOpen ? null : 'statistics' as any);
    };
    
    const stats = useMemo(() => {
        // Planets to consider for statistics (The standard 10 celestial bodies)
        const PLANETS = [
            'sun', 'moon', 'mercury', 'venus', 'mars', 
            'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'
        ];

        const counts = {
            masculine: 0, feminine: 0,
            fire: 0, earth: 0, air: 0, water: 0,
            cardinal: 0, fixed: 0, mutable: 0,
            total: 0
        };

        PLANETS.forEach(planetId => {
            const key = `${planetId}EclipticLongitude` as keyof CelestialData;
            const longitude = celestialData[key] as number;
            
            if (typeof longitude === 'number') {
                const signIndex = Math.floor(longitude / 30);
                const sign = ZODIAC_DATA[signIndex];
                
                if (sign) {
                    counts.total++;
                    if (sign.polarity === 'masculine') counts.masculine++;
                    if (sign.polarity === 'feminine') counts.feminine++;
                    
                    if (sign.element === 'fire') counts.fire++;
                    if (sign.element === 'earth') counts.earth++;
                    if (sign.element === 'air') counts.air++;
                    if (sign.element === 'water') counts.water++;
                    
                    if (sign.modality === 'cardinal') counts.cardinal++;
                    if (sign.modality === 'fixed') counts.fixed++;
                    if (sign.modality === 'mutable') counts.mutable++;
                }
            }
        });

        return counts;
    }, [celestialData]);

    const handleHover = (type: 'element' | 'modality' | 'polarity', value: string) => {
        if (onHighlightFilterChange) {
            onHighlightFilterChange({ type, value });
        }
    };

    const handleLeave = () => {
        if (onHighlightFilterChange) {
            onHighlightFilterChange(null);
        }
    };

    const ColorModeTag: React.FC<{ mode: 'none' | 'element' | 'modality' | 'polarity', label: string }> = ({ mode, label }) => {
        const isActive = zodiacColorMode === mode;
        return (
            <button
                onClick={() => onZodiacColorModeChange && onZodiacColorModeChange(mode)}
                className={`text-[8px] uppercase tracking-[0.1em] transition-all ${
                    isActive 
                    ? 'text-brand-text underline underline-offset-[4px] decoration-brand-text/50' 
                    : 'text-brand-text-muted/50 hover:text-brand-text'
                }`}
            >
                {label}
            </button>
        );
    };

    const isCompact = layoutMode === 'minimal';
    const moonInfo = moonPhase !== undefined ? getMoonPhaseInfo(moonPhase) : null;

    return (
        <div className={`bg-brand-surface/40 backdrop-blur-xl rounded-3xl flex flex-col font-display border border-brand-border/5 shadow-sm w-full relative ${isCompact ? 'p-2 gap-2' : 'p-4 gap-4'}`}>
            {/* CABEÇALHO */}
            <div className="flex items-center gap-2">
                {dragHandle}
                <h3 className="text-[10px] font-medium uppercase text-brand-text-muted tracking-wider truncate font-outfit" style={{ letterSpacing: '0.12em' }}>Status</h3>
                <div className="h-px bg-brand-border/10 flex-1 ml-2"></div>
                <button 
                    ref={menuButtonRef}
                    onClick={handleMenuToggle}
                    className={`p-1 rounded-lg transition-colors ${isMenuOpen ? 'bg-brand-surface-highlight text-brand-text' : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-highlight/50'}`}
                >
                    <UI_ICONS.MoreIcon className="w-4 h-4" />
                </button>
            </div>

            {/* SUN & MOON INFO */}
            {(seasonInfo || moonInfo) && (
                <div className={`flex ${isCompact ? 'flex-row items-center gap-2 px-1' : 'flex-col gap-3'} mb-2`}>
                    {seasonInfo && (
                        <div className={`flex items-center gap-2 ${isCompact ? 'w-1/2 min-w-0' : 'bg-brand-surface-highlight/30 p-2 rounded-xl border border-brand-border/5'} min-h-[44px]`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${seasonInfo.color} bg-opacity-20`}>
                                <seasonInfo.icon className={`w-3.5 h-3.5 ${seasonInfo.color}`} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-medium text-brand-text capitalize truncate">{seasonInfo.name}</span>
                                {!isCompact && sunriseTime && sunsetTime && (
                                    <div className="flex items-center gap-2 text-[9px] text-brand-text-muted font-manrope tracking-wider mt-0.5">
                                        <span title="Nascer do Sol">↑ {sunriseTime}</span>
                                        <span title="Pôr do Sol">↓ {sunsetTime}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {moonInfo && (
                        <div className={`flex items-center gap-2 ${isCompact ? 'w-1/2 min-w-0' : 'bg-brand-surface-highlight/30 p-2 rounded-xl border border-brand-border/5'} min-h-[44px]`}>
                            <div className="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-400 text-sm">
                                {moonInfo.icon}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-medium text-brand-text text-left truncate">{moonInfo.name}</span>
                                {!isCompact && moonriseTime && moonsetTime && (
                                    <div className="flex items-center gap-2 text-[9px] text-brand-text-muted font-manrope tracking-wider mt-0.5">
                                        <span title="Nascer da Lua">↑ {moonriseTime}</span>
                                        <span title="Pôr da Lua">↓ {moonsetTime}</span>
                                    </div>
                                )}
                            </div>
                            {!isCompact && onEclipseClick && (
                                <button 
                                    onClick={onEclipseClick}
                                    className="ml-auto p-1.5 rounded-lg bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 transition-colors"
                                    title="Eclipses e Fases"
                                >
                                    <UI_ICONS.MoonIcon className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {isMenuOpen && (
                <PopupMenu onClose={() => setActiveMenu?.(null)} triggerRef={menuButtonRef}>
                    <div className="flex flex-col gap-3">
                        <div>
                            <div className="text-[10px] font-bold uppercase text-brand-text font-outfit tracking-wider mb-2 px-2">Layout</div>
                            <div className="flex flex-col gap-1">
                                {['minimal', 'complete'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => onLayoutChange?.(mode as any)}
                                        className={`px-3 py-2 rounded-lg text-left text-xs font-manrope transition-colors ${layoutMode === mode ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30' : 'hover:bg-brand-surface-highlight text-brand-text-muted border border-transparent'}`}
                                    >
                                        {mode === 'minimal' ? 'Mínimo' : 'Completo'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {onPanelPositionChange && (
                            <>
                                <div className="h-px bg-brand-border/10 my-2"></div>
                                <div className="flex flex-col gap-1">
                                    <div className="text-[10px] font-bold uppercase text-brand-text font-outfit tracking-wider mb-2 px-2">Posição do Painel</div>
                                    <div className="flex gap-1 px-1">
                                        <button 
                                            onClick={() => onPanelPositionChange('left')}
                                            className={`flex-1 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${panelPosition === 'left' ? 'bg-brand-purple text-white shadow-sm' : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-highlight/50 border border-brand-border/10'}`}
                                        >
                                            Esquerda
                                        </button>
                                        <button 
                                            onClick={() => onPanelPositionChange('right')}
                                            className={`flex-1 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${panelPosition === 'right' ? 'bg-brand-purple text-white shadow-sm' : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-highlight/50 border border-brand-border/10'}`}
                                        >
                                            Direita
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </PopupMenu>
            )}
            
            {/* POLARIDADE */}
            <div 
                className={`flex flex-col ${isCompact ? 'gap-0.5' : 'gap-1'} cursor-pointer group`}
                onClick={() => onZodiacColorModeChange?.('polarity')}
            >
                {layoutMode === 'complete' && <h4 className={`text-[9px] font-outfit uppercase tracking-[0.15em] transition-colors ${zodiacColorMode === 'polarity' ? 'text-brand-purple font-bold' : 'text-brand-text-muted/80 group-hover:text-brand-text-muted'}`}>Polaridade</h4>}
                
                {layoutMode === 'minimal' ? (
                    <div className="grid grid-cols-2 gap-1.5">
                        {[
                            { label: 'Feminino', value: stats.feminine, icon: UI_ICONS.PolarityFemaleIcon, color: 'text-blue-400', filter: 'feminine', symbol: GENDER_SYMBOLS.feminine, symColor: 'text-blue-400' },
                            { label: 'Masculino', value: stats.masculine, icon: UI_ICONS.PolarityMaleIcon, color: 'text-red-400', filter: 'masculine', symbol: GENDER_SYMBOLS.masculine, symColor: 'text-red-400' }
                        ].map((item, i) => {
                            const isActive = !highlightFilter || (highlightFilter.type === 'polarity' && highlightFilter.value === item.filter);
                            return (
                                <div
                                    key={i}
                                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all cursor-crosshair ${isActive ? 'bg-brand-surface-highlight/40 border-brand-border/10' : 'opacity-40 border-transparent'}`}
                                    onMouseEnter={() => handleHover('polarity', item.filter)}
                                    onMouseLeave={handleLeave}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-sm ${item.symColor}`}>{item.symbol}</span>
                                        <span className="text-[9px] uppercase tracking-wider text-brand-text-muted font-manrope">{item.label}</span>
                                    </div>
                                    <span className="font-manrope text-xs font-bold text-brand-text tabular-nums" style={{minWidth:'1.5ch',textAlign:'right'}}>{item.value}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: 'Feminino', value: stats.feminine, color: 'bg-blue-500', icon: UI_ICONS.PolarityFemaleIcon, filter: 'feminine', symbol: GENDER_SYMBOLS.feminine },
                            { label: 'Masculino', value: stats.masculine, color: 'bg-red-500', icon: UI_ICONS.PolarityMaleIcon, filter: 'masculine', symbol: GENDER_SYMBOLS.masculine }
                        ].map((item, i) => {
                            const isActive = !highlightFilter || (highlightFilter.type === 'polarity' && highlightFilter.value === item.filter);
                            const width = stats.total > 0 ? (item.value / stats.total) * 100 : 0;
                            return (
                                <div 
                                    key={i}
                                    className={`flex flex-col gap-1.5 p-2 rounded-xl border transition-all ${isActive ? 'bg-brand-surface-highlight/40 border-brand-border/10' : 'opacity-40 border-transparent'}`}
                                    onMouseEnter={() => handleHover('polarity', item.filter)}
                                    onMouseLeave={handleLeave}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-4 h-4 flex items-center justify-center ${item.filter === 'feminine' ? 'text-blue-400' : 'text-red-400'}`}>
                                                {item.symbol}
                                            </div>
                                            <span className="text-[9px] uppercase tracking-wider text-brand-text-muted">{item.label}</span>
                                        </div>
                                        <span className="font-manrope text-xs font-bold text-brand-text tabular-nums" style={{minWidth: '1.5ch', textAlign: 'right'}}>{item.value}</span>
                                    </div>
                                    <div className="h-1 w-full bg-brand-surface-highlight rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color} transition-all duration-700`} style={{ width: `${width}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ELEMENTOS */}
            <div 
                className={`flex flex-col ${isCompact ? 'gap-0.5' : 'gap-1'} cursor-pointer group`}
                onClick={() => onZodiacColorModeChange?.('element')}
            >
                {layoutMode === 'complete' && <h4 className={`text-[9px] font-outfit uppercase tracking-[0.15em] transition-colors ${zodiacColorMode === 'element' ? 'text-brand-purple font-bold' : 'text-brand-text-muted/80 group-hover:text-brand-text-muted'}`}>Elementos</h4>}
                
                {layoutMode === 'minimal' ? (
                    <div className="grid grid-cols-4 gap-1">
                        {[
                            { label: 'Fogo', value: stats.fire, icon: UI_ICONS.ElementFireIcon, color: 'text-orange-400', filter: 'fire', symbol: ELEMENT_SYMBOLS.fire },
                            { label: 'Terra', value: stats.earth, icon: UI_ICONS.ElementEarthIcon, color: 'text-emerald-400', filter: 'earth', symbol: ELEMENT_SYMBOLS.earth },
                            { label: 'Ar', value: stats.air, icon: UI_ICONS.ElementAirIcon, color: 'text-yellow-100', filter: 'air', symbol: ELEMENT_SYMBOLS.air },
                            { label: 'Água', value: stats.water, icon: UI_ICONS.ElementWaterIcon, color: 'text-cyan-400', filter: 'water', symbol: ELEMENT_SYMBOLS.water }
                        ].map((item, i) => {
                            const isActive = !highlightFilter || (highlightFilter.type === 'element' && highlightFilter.value === item.filter);
                            return (
                                <div
                                    key={i}
                                    className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg border transition-all cursor-crosshair ${isActive ? 'bg-brand-surface-highlight/40 border-brand-border/10' : 'opacity-40 border-transparent'}`}
                                    onMouseEnter={() => handleHover('element', item.filter)}
                                    onMouseLeave={handleLeave}
                                >
                                    <span className={`text-sm ${item.color}`}>{item.symbol}</span>
                                    <span className="font-manrope text-xs font-bold text-brand-text tabular-nums" style={{minWidth:'1.5ch',textAlign:'center'}}>{item.value}</span>
                                    <span className="text-[8px] uppercase tracking-wider text-brand-text-muted font-manrope">{item.label}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: 'Fogo', value: stats.fire, color: 'bg-grad-fire', icon: UI_ICONS.ElementFireIcon, filter: 'fire', symbol: ELEMENT_SYMBOLS.fire },
                            { label: 'Terra', value: stats.earth, color: 'bg-grad-earth', icon: UI_ICONS.ElementEarthIcon, filter: 'earth', symbol: ELEMENT_SYMBOLS.earth },
                            { label: 'Ar', value: stats.air, color: 'bg-grad-air', icon: UI_ICONS.ElementAirIcon, filter: 'air', symbol: ELEMENT_SYMBOLS.air },
                            { label: 'Água', value: stats.water, color: 'bg-grad-water', icon: UI_ICONS.ElementWaterIcon, filter: 'water', symbol: ELEMENT_SYMBOLS.water }
                        ].map((item, i) => {
                            const isActive = !highlightFilter || (highlightFilter.type === 'element' && highlightFilter.value === item.filter);
                            const width = stats.total > 0 ? (item.value / stats.total) * 100 : 0;
                            return (
                                <div 
                                    key={i}
                                    className={`flex flex-col gap-1.5 p-2 rounded-xl border transition-all ${isActive ? 'bg-brand-surface-highlight/40 border-brand-border/10' : 'opacity-40 border-transparent'}`}
                                    onMouseEnter={() => handleHover('element', item.filter)}
                                    onMouseLeave={handleLeave}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 flex items-center justify-center text-brand-text-muted">
                                                {item.symbol}
                                            </div>
                                            <span className="text-[9px] uppercase tracking-wider text-brand-text-muted">{item.label}</span>
                                        </div>
                                        <span className="font-manrope text-xs font-bold text-brand-text tabular-nums" style={{minWidth: '1.5ch', textAlign: 'right'}}>{item.value}</span>
                                    </div>
                                    <div className="h-1 w-full bg-brand-surface-highlight rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color} transition-all duration-700`} style={{ width: `${width}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODALIDADES */}
            <div 
                className={`flex flex-col ${isCompact ? 'gap-0.5' : 'gap-1'} cursor-pointer group`}
                onClick={() => onZodiacColorModeChange?.('modality')}
            >
                {layoutMode === 'complete' && <h4 className={`text-[9px] font-outfit uppercase tracking-[0.15em] transition-colors ${zodiacColorMode === 'modality' ? 'text-brand-purple font-bold' : 'text-brand-text-muted/80 group-hover:text-brand-text-muted'}`}>Modalidades</h4>}
                
                {layoutMode === 'minimal' ? (
                    <div className="grid grid-cols-3 gap-1.5" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
                        {[
                            { key: 'cardinal', label: 'Cardinal', color: '#a78bfa', icon: UI_ICONS.ModalityCardinalIcon, value: stats.cardinal, filter: 'cardinal' },
                            { key: 'fixed',    label: 'Fixo',     color: '#60a5fa', icon: UI_ICONS.ModalityFixedIcon,    value: stats.fixed,    filter: 'fixed' },
                            { key: 'mutable',  label: 'Mutável',  color: '#34d399', icon: UI_ICONS.ModalityMutableIcon,  value: stats.mutable,  filter: 'mutable' }
                        ].map((item) => {
                            const isActive = !highlightFilter || (highlightFilter.type === 'modality' && highlightFilter.value === item.filter);
                            return (
                                <div
                                    key={item.key}
                                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all cursor-crosshair min-w-0 ${isActive ? 'bg-brand-surface-highlight/40 border-brand-border/10' : 'opacity-40 border-transparent'}`}
                                    onMouseEnter={() => handleHover('modality', item.filter)}
                                    onMouseLeave={handleLeave}
                                >
                                    <div className="flex items-center gap-1 min-w-0">
                                        <span style={{color: item.color}} className="flex-shrink-0">{MODALITY_SYMBOLS[item.key]}</span>
                                        <span className="text-[8px] text-brand-text-muted truncate font-manrope">{item.label}</span>
                                    </div>
                                    <span className="text-[11px] font-medium text-brand-text tabular-nums flex-shrink-0" style={{fontFamily:"'Michroma',monospace", minWidth:'1.5ch', textAlign:'right'}}>{item.value}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-1.5" style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
                        {[
                            { key: 'cardinal', label: 'Cardinal', color: '#a78bfa' },
                            { key: 'fixed',    label: 'Fixo',     color: '#60a5fa' },
                            { key: 'mutable',  label: 'Mutável',  color: '#34d399' },
                        ].map(({ key, label, color }) => {
                            const count = stats[key as keyof typeof stats] as number;
                            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                            return (
                                <div
                                    key={key}
                                    className={`flex flex-col gap-1.5 px-2 py-2 rounded-lg border transition-all cursor-crosshair min-w-0 ${
                                        !highlightFilter || (highlightFilter.type === 'modality' && highlightFilter.value === key)
                                            ? 'bg-brand-surface-highlight/40 border-brand-border/10'
                                            : 'opacity-40 border-transparent bg-brand-surface/60'
                                    }`}
                                    onMouseEnter={(e) => { e.stopPropagation(); handleHover('modality', key); }}
                                    onMouseLeave={(e) => { e.stopPropagation(); handleLeave(); }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onZodiacColorModeChange?.('modality');
                                    }}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className="flex-shrink-0" style={{color}}>
                                            {MODALITY_SYMBOLS[key]}
                                        </span>
                                        <span className="text-[8px] text-brand-text-muted flex-1 truncate" style={{fontFamily:"'Michroma', monospace"}}>{label}</span>
                                        <span className="text-[11px] font-medium text-brand-text tabular-nums" style={{fontFamily:"'Michroma', monospace", minWidth: '2ch', display: 'inline-block', textAlign: 'right'}}>{count}</span>
                                    </div>
                                    <div className="h-[2px] rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.08)'}}>
                                        <div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`, background:color, opacity:0.7}} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

