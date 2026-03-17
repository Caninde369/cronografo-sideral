
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CelestialData } from '../hooks/useCelestialData';
import { ZODIAC_DATA } from './zodiac';
import { UI_ICONS } from './icons';
import { WidgetId } from '../App';

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
                                <span className="font-manrope text-[9px] text-brand-text">{seg.value}</span>
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
    onWidthChange
}) => {
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const isMenuOpen = activeMenu === 'statistics'; 
    
    useEffect(() => {
        if (onWidthChange) {
            const baseWidth = layoutMode === 'complete' ? 320 : 160;
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

    return (
        <div className={`bg-brand-surface/40 backdrop-blur-xl rounded-3xl flex flex-col font-display border border-brand-border/5 shadow-2xl w-full relative ${isCompact ? 'p-2 gap-2' : 'p-4 gap-4'}`}>
            {/* CABEÇALHO */}
            <div className="flex items-center gap-2">
                {dragHandle}
                <h3 className="text-[10px] font-medium uppercase text-brand-text-muted tracking-wider truncate font-manrope">Estatísticas</h3>
                <div className="h-px bg-brand-border/10 flex-1 ml-2"></div>
                <button 
                    ref={menuButtonRef}
                    onClick={handleMenuToggle}
                    className={`p-1 rounded-lg transition-colors ${isMenuOpen ? 'bg-brand-surface-highlight text-brand-text' : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-highlight/50'}`}
                >
                    <UI_ICONS.MoreIcon className="w-4 h-4" />
                </button>
            </div>

            {isMenuOpen && (
                <PopupMenu onClose={() => setActiveMenu?.(null)} triggerRef={menuButtonRef}>
                    <div className="flex flex-col gap-3">
                        <div>
                            <div className="text-[10px] font-bold uppercase text-brand-text-muted mb-2 px-2">Layout</div>
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
                                    <div className="text-[9px] uppercase text-brand-text-muted font-bold px-2 py-1">Posição do Painel</div>
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
                {layoutMode === 'complete' && <h4 className={`text-[8px] uppercase tracking-[0.15em] transition-colors ${zodiacColorMode === 'polarity' ? 'text-brand-purple font-bold' : 'text-brand-text-muted/50 group-hover:text-brand-text-muted'}`}>Polaridade</h4>}
                
                {layoutMode === 'minimal' ? (
                    <div className="flex items-center justify-center gap-6 px-1">
                        <div 
                            className="flex items-center gap-1.5 cursor-crosshair hover:opacity-80 transition-opacity"
                            onMouseEnter={() => handleHover('polarity', 'feminine')}
                            onMouseLeave={handleLeave}
                        >
                            <UI_ICONS.PolarityFemaleIcon className="w-4 h-4 text-blue-500" />
                            <span className="font-manrope text-xs text-brand-text">{stats.feminine}</span>
                        </div>
                        <div className="w-px h-3 bg-brand-border/10"></div>
                        <div 
                            className="flex items-center gap-1.5 cursor-crosshair hover:opacity-80 transition-opacity"
                            onMouseEnter={() => handleHover('polarity', 'masculine')}
                            onMouseLeave={handleLeave}
                        >
                            <UI_ICONS.PolarityMaleIcon className="w-4 h-4 text-red-500" />
                            <span className="font-manrope text-xs text-brand-text">{stats.masculine}</span>
                        </div>
                    </div>
                ) : (
                    <ThinMultiBar 
                        total={stats.total}
                        filterType="polarity"
                        activeFilter={highlightFilter?.type === 'polarity' ? highlightFilter.value : null}
                        onHover={(val) => handleHover('polarity', val)}
                        onLeave={handleLeave}
                        compact={false}
                        isCompactPanel={isCompact}
                        segments={[
                            { value: stats.feminine, colorClass: 'bg-blue-500', label: 'Fem', filterValue: 'feminine' },
                            { value: stats.masculine, colorClass: 'bg-red-500', label: 'Masc', filterValue: 'masculine' }
                        ]}
                    />
                )}
            </div>

            {/* ELEMENTOS */}
            <div 
                className={`flex flex-col ${isCompact ? 'gap-0.5' : 'gap-1'} cursor-pointer group`}
                onClick={() => onZodiacColorModeChange?.('element')}
            >
                {layoutMode === 'complete' && <h4 className={`text-[8px] uppercase tracking-[0.15em] transition-colors ${zodiacColorMode === 'element' ? 'text-brand-purple font-bold' : 'text-brand-text-muted/50 group-hover:text-brand-text-muted'}`}>Elementos</h4>}
                
                {layoutMode === 'minimal' ? (
                    <div className="flex items-center justify-between px-2 gap-2">
                        {[
                            { icon: UI_ICONS.ElementFireIcon, value: stats.fire, color: 'text-orange-400', filter: 'fire' },
                            { icon: UI_ICONS.ElementWaterIcon, value: stats.water, color: 'text-cyan-400', filter: 'water' },
                            { icon: UI_ICONS.ElementEarthIcon, value: stats.earth, color: 'text-emerald-400', filter: 'earth' },
                            { icon: UI_ICONS.ElementAirIcon, value: stats.air, color: 'text-yellow-100', filter: 'air' }
                        ].map((item, i) => (
                            <div 
                                key={i}
                                className="flex items-center gap-1 cursor-crosshair hover:opacity-80 transition-opacity"
                                onMouseEnter={() => handleHover('element', item.filter)}
                                onMouseLeave={handleLeave}
                            >
                                <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                                <span className="font-manrope text-xs text-brand-text">{item.value}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <ThinMultiBar 
                        total={stats.total}
                        filterType="element"
                        activeFilter={highlightFilter?.type === 'element' ? highlightFilter.value : null}
                        onHover={(val) => handleHover('element', val)}
                        onLeave={handleLeave}
                        compact={false}
                        isCompactPanel={isCompact}
                        segments={[
                            { value: stats.fire, colorClass: 'bg-grad-fire', label: 'Fogo', filterValue: 'fire' },
                            { value: stats.earth, colorClass: 'bg-grad-earth', label: 'Terra', filterValue: 'earth' },
                            { value: stats.air, colorClass: 'bg-grad-air', label: 'Ar', filterValue: 'air' },
                            { value: stats.water, colorClass: 'bg-grad-water', label: 'Água', filterValue: 'water' }
                        ]}
                    />
                )}
            </div>

            {/* MODALIDADES */}
            <div 
                className={`flex flex-col ${isCompact ? 'gap-0.5' : 'gap-1'} cursor-pointer group`}
                onClick={() => onZodiacColorModeChange?.('modality')}
            >
                {layoutMode === 'complete' && <h4 className={`text-[8px] uppercase tracking-[0.15em] transition-colors ${zodiacColorMode === 'modality' ? 'text-brand-purple font-bold' : 'text-brand-text-muted/50 group-hover:text-brand-text-muted'}`}>Modalidades</h4>}
                
                {layoutMode === 'minimal' ? (
                    <div className="flex items-center justify-between px-4 gap-2">
                         {[
                            { icon: UI_ICONS.ModalityCardinalIcon, value: stats.cardinal, color: 'text-rose-400', filter: 'cardinal' },
                            { icon: UI_ICONS.ModalityFixedIcon, value: stats.fixed, color: 'text-violet-400', filter: 'fixed' },
                            { icon: UI_ICONS.ModalityMutableIcon, value: stats.mutable, color: 'text-teal-300', filter: 'mutable' }
                        ].map((item, i) => (
                            <div 
                                key={i}
                                className="flex items-center gap-1 cursor-crosshair hover:opacity-80 transition-opacity"
                                onMouseEnter={() => handleHover('modality', item.filter)}
                                onMouseLeave={handleLeave}
                            >
                                <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                                <span className="font-manrope text-xs text-brand-text">{item.value}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <ThinMultiBar 
                        total={stats.total}
                        filterType="modality"
                        activeFilter={highlightFilter?.type === 'modality' ? highlightFilter.value : null}
                        onHover={(val) => handleHover('modality', val)}
                        onLeave={handleLeave}
                        compact={false}
                        isCompactPanel={isCompact}
                        segments={[
                            { value: stats.cardinal, colorClass: 'bg-rose-400', label: 'Card', filterValue: 'cardinal' },
                            { value: stats.fixed, colorClass: 'bg-violet-400', label: 'Fixo', filterValue: 'fixed' },
                            { value: stats.mutable, colorClass: 'bg-teal-300', label: 'Mut', filterValue: 'mutable' }
                        ]}
                    />
                )}
            </div>
        </div>
    );
};

