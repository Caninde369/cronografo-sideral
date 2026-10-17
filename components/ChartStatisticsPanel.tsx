import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CelestialData } from '../hooks/useCelestialData';
import { ZODIAC_DATA } from './zodiac';
import { UI_ICONS } from './icons';
import { WidgetId } from '../App';
import { CelestialGlyphSvg } from './chart/CelestialGlyphSvg';
import { getMoonPhaseInfo } from '../lib/astrology/moon';
import { CompactToggle } from './Controls';

export type HighlightFilter = {
    type: 'element' | 'modality' | 'polarity';
    value: string;
} | null;

export type StatisticsLayoutMode = 'minimal' | 'ultraslim' | 'complete';

interface ChartStatisticsPanelProps {
    celestialData: CelestialData;
    visiblePlanets?: Record<string, boolean>;
    scale?: number;
    zodiacColorMode?: 'none' | 'element' | 'modality' | 'polarity';
    onZodiacColorModeChange?: (mode: 'none' | 'element' | 'modality' | 'polarity') => void;
    highlightFilter?: HighlightFilter;
    onHighlightFilterChange?: (filter: HighlightFilter) => void;
    layoutMode?: StatisticsLayoutMode;
    onLayoutChange?: (mode: StatisticsLayoutMode) => void;
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
    onLunarCalendarClick?: () => void;
    hideHeader?: boolean;
    menuButtonRef?: React.RefObject<HTMLButtonElement | null>;
    theme?: 'dark' | 'light';
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
                left: isRightSide ? rect.left - 300 : rect.right + 12
            });
        }
    }, [triggerRef]);

    if (!coords) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div 
                className="fixed z-[9999] bg-[#06060a]/95 border border-white/15 backdrop-blur-xl rounded-xl p-3 w-72 animate-in fade-in zoom-in-95 duration-100 font-sans text-white shadow-2xl"
                style={{ top: coords.top, left: coords.left }}
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </>,
        document.body
    );
};

const PLANET_DEFINITIONS: Record<string, { name: string; symbol: string; color: string }> = {
    sun: { name: 'Sol', symbol: '☉', color: '#F59E0B' },
    moon: { name: 'Lua', symbol: '☽', color: '#E2E8F0' },
    mercury: { name: 'Mercúrio', symbol: '☿', color: '#38BDF8' },
    venus: { name: 'Vênus', symbol: '♀', color: '#F472B6' },
    mars: { name: 'Marte', symbol: '♂', color: '#EF4444' },
    jupiter: { name: 'Júpiter', symbol: '♃', color: '#A855F7' },
    saturn: { name: 'Saturno', symbol: '♄', color: '#EAB308' },
    uranus: { name: 'Urano', symbol: '♅', color: '#06B6D4' },
    neptune: { name: 'Netuno', symbol: '♆', color: '#3B82F6' },
    pluto: { name: 'Plutão', symbol: '♇', color: '#8B5CF6' },
};

const getElementSymbols = (isLight: boolean): Record<string, { svg: React.ReactNode; label: string; bg: string; border: string; text: string; bar: string }> => ({
    fire: {
        label: 'Fogo',
        bg: isLight ? 'bg-red-500/15' : 'bg-red-500/10',
        border: isLight ? 'border-red-500/30 hover:border-red-500/60' : 'border-red-500/30 hover:border-red-500/60',
        text: isLight ? 'text-red-700 font-bold' : 'text-red-400',
        bar: 'bg-gradient-to-r from-red-600 to-red-400',
        svg: (
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none" className="shrink-0">
                <path d="M5 1L1 9h8L5 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
        )
    },
    earth: {
        label: 'Terra',
        bg: isLight ? 'bg-emerald-500/15' : 'bg-emerald-500/10',
        border: isLight ? 'border-emerald-500/30 hover:border-emerald-500/60' : 'border-emerald-500/30 hover:border-emerald-500/60',
        text: isLight ? 'text-emerald-800 font-bold' : 'text-emerald-400',
        bar: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
        svg: (
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none" className="shrink-0">
                <path d="M5 9L1 1h8L5 9Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M2.5 4h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
        )
    },
    air: {
        label: 'Ar',
        bg: isLight ? 'bg-sky-500/15' : 'bg-sky-500/10',
        border: isLight ? 'border-sky-500/30 hover:border-sky-500/60' : 'border-sky-300/30 hover:border-sky-300/60',
        text: isLight ? 'text-sky-800 font-bold' : 'text-sky-300',
        bar: isLight ? 'bg-gradient-to-r from-sky-600 to-cyan-600' : 'bg-gradient-to-r from-sky-400 to-cyan-300',
        svg: (
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none" className="shrink-0">
                <path d="M5 1L1 9h8L5 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M2.5 6h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
        )
    },
    water: {
        label: 'Água',
        bg: isLight ? 'bg-indigo-500/15' : 'bg-indigo-500/10',
        border: isLight ? 'border-indigo-500/30 hover:border-indigo-500/60' : 'border-indigo-500/30 hover:border-indigo-500/60',
        text: isLight ? 'text-indigo-800 font-bold' : 'text-indigo-400',
        bar: 'bg-gradient-to-r from-indigo-600 to-blue-400',
        svg: (
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none" className="shrink-0">
                <path d="M5 9L1 1h8L5 9Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
        )
    }
});

const getModalitySymbols = (isLight: boolean): Record<string, { svg: React.ReactNode; label: string; desc: string; text: string; bar: string }> => ({
    cardinal: {
        label: 'Cardinal',
        desc: 'Iniciativa',
        text: isLight ? 'text-red-800 font-bold' : 'text-red-400',
        bar: 'bg-gradient-to-r from-red-600 to-red-400',
        svg: (
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none" className="shrink-0">
                <path d="M1 5h8M5 1v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
        )
    },
    fixed: {
        label: 'Fixo',
        desc: 'Estabilidade',
        text: isLight ? 'text-emerald-800 font-bold' : 'text-emerald-400',
        bar: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
        svg: (
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none" className="shrink-0">
                <rect x="1.5" y="1.5" width="7" height="7" stroke="currentColor" strokeWidth="1.4"/>
                <circle cx="5" cy="5" r="1" fill="currentColor"/>
            </svg>
        )
    },
    mutable: {
        label: 'Mutável',
        desc: 'Transição',
        text: isLight ? 'text-blue-800 font-bold' : 'text-blue-400',
        bar: 'bg-gradient-to-r from-blue-600 to-cyan-400',
        svg: (
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none" className="shrink-0">
                <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
        )
    }
});

/**
 * Faixa de resumo do painel Status.
 * Três linhas densas de ~17px cada — cabem 13 números em 51px de altura.
 * As cores vêm do design system (ELEMENT_COLOR e afins), não são escolha local.
 */
const SUMMARY_ROWS = [
    {
        label: 'Elementos',
        type: 'element' as const,
        items: [
            { key: 'fire',  name: 'Fogo',  symbol: '🔥', color: '#FB923C' },
            { key: 'earth', name: 'Terra', symbol: '🌿', color: '#34D399' },
            { key: 'air',   name: 'Ar',    symbol: '💨', color: '#FEF3C7' },
            { key: 'water', name: 'Água',  symbol: '💧', color: '#60A5FA' },
        ]
    },
    {
        label: 'Ritmo',
        type: 'modality' as const,
        items: [
            { key: 'cardinal', name: 'Cardinal', symbol: '⚡', color: '#FB7185' },
            { key: 'fixed',    name: 'Fixo',     symbol: '🛡️', color: '#A78BFA' },
            { key: 'mutable',  name: 'Mutável',  symbol: '🌀', color: '#5EEAD4' },
        ]
    },
    {
        label: 'Polaridade',
        type: 'polarity' as const,
        items: [
            { key: 'masculine', name: 'Masculina', symbol: '☀️', color: '#EF4444' },
            { key: 'feminine',  name: 'Feminina',  symbol: '🌙', color: '#3B82F6' },
        ]
    },
];

export const ChartStatisticsPanel: React.FC<ChartStatisticsPanelProps> = ({ 
    celestialData, 
    visiblePlanets,
    scale = 1, 
    zodiacColorMode, 
    onZodiacColorModeChange, 
    highlightFilter, 
    onHighlightFilterChange,
    layoutMode = 'minimal',
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
    onEclipseClick,
    onLunarCalendarClick,
    hideHeader,
    menuButtonRef,
    theme = 'dark',
    isFreeTier = false,
    isFreeTrial = false,
    onOpenPaymentPlans
}) => {
    const isFree = Boolean(isFreeTier || isFreeTrial);
    const isLight = theme === 'light';
    const isUltraSlim = layoutMode === 'ultraslim';
    const ELEMENT_SYMBOLS = getElementSymbols(isLight);
    const MODALITY_SYMBOLS = getModalitySymbols(isLight);
    const localMenuButtonRef = useRef<HTMLButtonElement>(null);
    const finalMenuButtonRef = menuButtonRef || localMenuButtonRef;
    const isMenuOpen = activeMenu === 'statistics'; 
    
    useEffect(() => {
        if (onWidthChange) {
            const baseWidth = isUltraSlim ? 185 : 210;
            const w = baseWidth * scale;
            setTimeout(() => onWidthChange(w), 0);
        }
    }, [isUltraSlim, onWidthChange, scale]);

    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFree) {
            onOpenPaymentPlans?.();
            return;
        }
        setActiveMenu?.(isMenuOpen ? null : 'statistics' as any);
    };
    
    const stats = useMemo(() => {
        const ALL_BODIES = [
            'sun', 'moon', 'mercury', 'venus', 'mars', 
            'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
            'lilith', 'northNode', 'southNode', 'partOfFortune'
        ];
        
        const PLANETS = ALL_BODIES.filter(id => {
            if (visiblePlanets) {
                return !!visiblePlanets[id];
            }
            return ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].includes(id);
        });

        const counts = {
            masculine: 0, feminine: 0,
            fire: 0, earth: 0, air: 0, water: 0,
            cardinal: 0, fixed: 0, mutable: 0,
            total: 0
        };

        const planetsByElement: Record<string, Array<{ id: string; name: string; symbol: string; color: string }>> = {
            fire: [], earth: [], air: [], water: []
        };
        const planetsByModality: Record<string, Array<{ id: string; name: string; symbol: string; color: string }>> = {
            cardinal: [], fixed: [], mutable: []
        };
        const planetsByPolarity: Record<string, Array<{ id: string; name: string; symbol: string; color: string }>> = {
            masculine: [], feminine: []
        };

        PLANETS.forEach(planetId => {
            const key = `${planetId}EclipticLongitude` as keyof CelestialData;
            const longitude = celestialData[key] as number;
            const planetDef = PLANET_DEFINITIONS[planetId] || { name: planetId, symbol: '•', color: '#fff' };
            
            if (typeof longitude === 'number') {
                const signIndex = Math.floor(longitude / 30);
                const sign = ZODIAC_DATA[signIndex];
                
                if (sign) {
                    counts.total++;
                    const item = { id: planetId, ...planetDef };

                    if (sign.polarity === 'masculine') {
                        counts.masculine++;
                        planetsByPolarity.masculine.push(item);
                    }
                    if (sign.polarity === 'feminine') {
                        counts.feminine++;
                        planetsByPolarity.feminine.push(item);
                    }
                    
                    if (sign.element === 'fire') {
                        counts.fire++;
                        planetsByElement.fire.push(item);
                    }
                    if (sign.element === 'earth') {
                        counts.earth++;
                        planetsByElement.earth.push(item);
                    }
                    if (sign.element === 'air') {
                        counts.air++;
                        planetsByElement.air.push(item);
                    }
                    if (sign.element === 'water') {
                        counts.water++;
                        planetsByElement.water.push(item);
                    }
                    
                    if (sign.modality === 'cardinal') {
                        counts.cardinal++;
                        planetsByModality.cardinal.push(item);
                    }
                    if (sign.modality === 'fixed') {
                        counts.fixed++;
                        planetsByModality.fixed.push(item);
                    }
                    if (sign.modality === 'mutable') {
                        counts.mutable++;
                        planetsByModality.mutable.push(item);
                    }
                }
            }
        });

        // Determine dominant element
        const elementsList = [
            { key: 'fire', label: 'Fogo', count: counts.fire, icon: '🔥' },
            { key: 'earth', label: 'Terra', count: counts.earth, icon: '🌿' },
            { key: 'air', label: 'Ar', count: counts.air, icon: '💨' },
            { key: 'water', label: 'Água', count: counts.water, icon: '💧' },
        ];
        elementsList.sort((a, b) => b.count - a.count);
        const dominantElement = elementsList[0];

        // Determine dominant modality
        const modalityList = [
            { key: 'cardinal', label: 'Cardinal', count: counts.cardinal },
            { key: 'fixed', label: 'Fixo', count: counts.fixed },
            { key: 'mutable', label: 'Mutável', count: counts.mutable },
        ];
        modalityList.sort((a, b) => b.count - a.count);
        const dominantModality = modalityList[0];

        return {
            counts,
            planetsByElement,
            planetsByModality,
            planetsByPolarity,
            dominantElement,
            dominantModality
        };
    }, [celestialData, visiblePlanets]);

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

    const moonInfo = moonPhase !== undefined ? getMoonPhaseInfo(moonPhase) : null;
    const totalCount = stats.counts.total || 10;

    return (
        <div className={`flex flex-col font-sans w-full bg-transparent relative p-1.5 gap-1.5 ${isLight ? 'text-amber-950' : 'text-white'} overflow-hidden`}>
            {/* CABEÇALHO DO PAINEL */}
            {!hideHeader && (
                <div className={`flex items-center gap-2 select-none border-b ${isLight ? 'border-amber-900/15' : 'border-white/10'} pb-1.5 shrink-0`}>
                    {dragHandle}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <i className="ti ti-chart-dots text-amber-500 text-xs shrink-0" />
                        <h3 className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-amber-950' : 'text-white'} truncate`}>
                            Status Astrológico
                        </h3>
                    </div>
                    <button 
                        ref={finalMenuButtonRef}
                        onClick={handleMenuToggle}
                        className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${isMenuOpen ? (isLight ? 'bg-amber-900/10 text-amber-950' : 'bg-white/20 text-white') : (isLight ? 'text-amber-900/60 hover:text-amber-950 hover:bg-black/5' : 'text-white/60 hover:text-white hover:bg-white/10')}`}
                        title={isFree ? "Opções de Status (Disponível no Plano Pro)" : "Opções do Painel"}
                    >
                        {isFree ? (
                            <i className="ti ti-lock text-amber-400 text-sm" />
                        ) : (
                            <UI_ICONS.MoreIcon className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            )}

            {isMenuOpen && (
                <PopupMenu onClose={() => setActiveMenu?.(null)} triggerRef={finalMenuButtonRef}>
                    <div className="flex flex-col gap-2">
                        {/* Banner de Bloqueio Plano Free */}
                        {isFree && (
                            <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-between gap-1.5 shadow-sm">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-amber-400 text-xs shrink-0">🔒</span>
                                    <span className="text-[10px] font-semibold text-amber-200 leading-tight">
                                        Edições de Status bloqueadas no Free.
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { onOpenPaymentPlans?.(); setActiveMenu?.(null); }}
                                    className="px-2 py-0.5 rounded-lg bg-amber-500 text-black font-bold text-[9.5px] hover:bg-amber-400 active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm"
                                >
                                    Upgrade
                                </button>
                            </div>
                        )}

                        <div className={isFree ? 'opacity-40 pointer-events-none select-none flex flex-col gap-2' : 'flex flex-col gap-2'}>
                        <div className="text-[10px] font-bold uppercase text-white/60 tracking-wider px-1">Visualização</div>
                        <div className="flex flex-col gap-1">
                            {[
                                { id: 'minimal' as const, label: 'Completo (Detalhado)' },
                                { id: 'ultraslim' as const, label: 'Ultra Slim (Símbolos e Contagem)' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={(e) => { e.stopPropagation(); onLayoutChange?.(item.id); setActiveMenu?.(null); }}
                                    className={`px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${layoutMode === item.id || (item.id === 'minimal' && (layoutMode as any) === 'complete') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold' : 'hover:bg-white/10 text-white/80 border border-transparent'}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        </div>
                    </div>
                </PopupMenu>
            )}

            {/* MODO ULTRA SLIM: SOMENTE O SÍMBOLO E O NÚMERO DA QUANTIDADE DE PLANETAS ATIVOS PARA AQUELA ENERGIA */}
            {isUltraSlim ? (
                <div className="flex flex-col gap-1.5 shrink-0 py-0.5">
                    {SUMMARY_ROWS.map(row => (
                        <div key={row.label} className="flex items-center gap-1.5">
                            <span
                                className="text-[8.5px] font-bold uppercase shrink-0 font-sans"
                                style={{ letterSpacing: '.1em', width: 54, color: isLight ? '#8a6d1f' : '#D4AF37', opacity: .9 }}
                            >
                                {row.label}
                            </span>
                            <div className="flex items-center gap-[3px] flex-1 min-w-0">
                                {row.items.map(it => {
                                    const count = (stats.counts as any)[it.key] ?? 0;
                                    const pct = totalCount ? Math.round((count / totalCount) * 100) : 0;
                                    const isHighlighted = !!highlightFilter && highlightFilter.type === row.type && highlightFilter.value === it.key;
                                    const dim = !!highlightFilter && !isHighlighted;
                                    return (
                                        <button
                                            key={it.key}
                                            type="button"
                                            onMouseEnter={() => handleHover(row.type as any, it.key)}
                                            onMouseLeave={handleLeave}
                                            onClick={() => onZodiacColorModeChange?.(row.type as any)}
                                            title={`${it.name}: ${count} de ${totalCount} astros (${pct}%)`}
                                            className={`flex items-center justify-center gap-1 px-1 rounded-md border transition-all cursor-pointer ${
                                                isLight 
                                                    ? (isHighlighted ? 'bg-amber-500/25 border-amber-600/50 shadow-xs' : 'bg-black/[0.04] border-black/10 hover:border-black/25') 
                                                    : (isHighlighted ? 'bg-amber-500/30 border-amber-400/50 shadow-xs' : 'bg-white/[0.05] border-white/10 hover:border-white/25')
                                            } ${dim ? 'opacity-35' : 'opacity-100'}`}
                                            style={{ height: 22, flex: '1 1 0', minWidth: 0 }}
                                        >
                                            <span className="text-[11px] leading-none shrink-0">{it.symbol}</span>
                                            <span
                                                className="font-mono font-extrabold text-[10.5px] tabular-nums"
                                                style={{ color: it.color }}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Compact Summary Chip for Dominant & Rhythm */}
                    <div 
                        className={`flex items-center justify-between px-2 py-1 rounded-lg border font-bold shrink-0 ${isLight ? 'bg-amber-500/10 border-amber-500/25 text-amber-950' : 'bg-amber-500/10 border-amber-500/20 text-amber-200'}`}
                        style={{ fontSize: `${Math.max(9, Math.round(10 * scale))}px` }}
                    >
                        <div className="flex items-center gap-1 min-w-0">
                            <span className="uppercase tracking-wider opacity-60" style={{ fontSize: `${Math.max(7.5, Math.round(8 * scale))}px` }}>Dom:</span>
                            <span className="leading-none" style={{ fontSize: `${Math.max(10, Math.round(12 * scale))}px` }}>{stats.dominantElement.icon}</span>
                            <span className="font-extrabold truncate" style={{ fontSize: `${Math.max(9, Math.round(10 * scale))}px` }}>{stats.dominantElement.label}</span>
                            <span className="font-mono font-extrabold opacity-80" style={{ fontSize: `${Math.max(8, Math.round(9 * scale))}px` }}>({stats.dominantElement.count})</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <span className="uppercase tracking-wider opacity-60" style={{ fontSize: `${Math.max(7.5, Math.round(8 * scale))}px` }}>Ritmo:</span>
                            <span className="font-extrabold" style={{ fontSize: `${Math.max(9, Math.round(10 * scale))}px` }}>{stats.dominantModality.label}</span>
                            <span className="font-mono font-extrabold opacity-80" style={{ fontSize: `${Math.max(8, Math.round(9 * scale))}px` }}>({stats.dominantModality.count})</span>
                        </div>
                    </div>

                    {/* SESSÃO 1: POLARIDADES */}
                    <div className="flex flex-col gap-1 shrink-0">
                        <div 
                            className={`rounded-xl border ${isLight ? 'border-amber-900/15 bg-black/[0.03]' : 'border-white/10 bg-white/[0.03]'} flex flex-col gap-1`}
                            style={{ padding: `${Math.max(4, Math.round(6 * scale))}px` }}
                        >
                            <div className="flex items-center justify-between font-bold" style={{ fontSize: `${Math.max(10, Math.round(11 * scale))}px` }}>
                                {/* Feminino */}
                                <div 
                                    className={`flex items-center gap-1.5 ${isLight ? 'text-blue-800 hover:text-blue-900' : 'text-blue-400 hover:text-blue-300'} cursor-pointer transition-colors`}
                                    onMouseEnter={() => handleHover('polarity', 'feminine')}
                                    onMouseLeave={handleLeave}
                                    title={`Feminino: ${stats.counts.feminine} astros`}
                                >
                                    <CelestialGlyphSvg bodyId="venus" size={Math.max(12, Math.round(14 * scale))} className={`${isLight ? 'text-blue-700' : 'text-blue-400'} shrink-0`} />
                                    <span 
                                        className={`font-mono font-extrabold ${isLight ? 'text-blue-900 bg-blue-500/20 border-blue-500/40' : 'text-blue-300 bg-blue-500/20 border-blue-500/30'} px-1.5 py-0.5 rounded border`}
                                        style={{ fontSize: `${Math.max(9, Math.round(10 * scale))}px` }}
                                    >
                                        {stats.counts.feminine}
                                    </span>
                                </div>

                                {/* Masculino */}
                                <div 
                                    className={`flex items-center gap-1.5 ${isLight ? 'text-red-800 hover:text-red-900' : 'text-red-400 hover:text-red-300'} cursor-pointer transition-colors`}
                                    onMouseEnter={() => handleHover('polarity', 'masculine')}
                                    onMouseLeave={handleLeave}
                                    title={`Masculino: ${stats.counts.masculine} astros`}
                                >
                                    <span 
                                        className={`font-mono font-extrabold ${isLight ? 'text-red-900 bg-red-500/20 border-red-500/40' : 'text-red-300 bg-red-500/20 border-red-500/30'} px-1.5 py-0.5 rounded border`}
                                        style={{ fontSize: `${Math.max(9, Math.round(10 * scale))}px` }}
                                    >
                                        {stats.counts.masculine}
                                    </span>
                                    <CelestialGlyphSvg bodyId="mars" size={Math.max(12, Math.round(14 * scale))} className={`${isLight ? 'text-red-700' : 'text-red-400'} shrink-0`} />
                                </div>
                            </div>

                            {/* Split Dual Bar */}
                            <div 
                                className={`w-full ${isLight ? 'bg-black/10 border-black/5' : 'bg-white/10 border-white/5'} rounded-full overflow-hidden flex p-0 border`}
                                style={{ height: `${Math.max(5, Math.round(6 * scale))}px` }}
                            >
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300 cursor-pointer"
                                    style={{ width: `${(stats.counts.feminine / totalCount) * 100}%` }}
                                    onMouseEnter={() => handleHover('polarity', 'feminine')}
                                    onMouseLeave={handleLeave}
                                    title={`Feminino: ${stats.counts.feminine} astros`}
                                />
                                <div 
                                    className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300 cursor-pointer"
                                    style={{ width: `${(stats.counts.masculine / totalCount) * 100}%` }}
                                    onMouseEnter={() => handleHover('polarity', 'masculine')}
                                    onMouseLeave={handleLeave}
                                    title={`Masculino: ${stats.counts.masculine} astros`}
                                />
                            </div>

                            {/* Planets list below bar using SVG glyphs */}
                            <div 
                                className="flex justify-between items-center pt-0.5"
                                style={{ fontSize: `${Math.max(9, Math.round(10 * scale))}px`, minHeight: `${Math.max(14, Math.round(16 * scale))}px` }}
                            >
                                <div className="flex items-center gap-1 flex-wrap">
                                    {stats.planetsByPolarity.feminine.map(p => (
                                        <span key={p.id} title={`${p.name} (Feminino)`} className="hover:scale-125 transition-transform">
                                            <CelestialGlyphSvg bodyId={p.id} size={Math.max(10, Math.round(11 * scale))} className={isLight ? 'text-blue-700' : 'text-blue-300'} />
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1 flex-wrap justify-end">
                                    {stats.planetsByPolarity.masculine.map(p => (
                                        <span key={p.id} title={`${p.name} (Masculino)`} className="hover:scale-125 transition-transform">
                                            <CelestialGlyphSvg bodyId={p.id} size={Math.max(10, Math.round(11 * scale))} className={isLight ? 'text-red-700' : 'text-red-400'} />
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SESSÃO 2: ELEMENTOS */}
                    <div className="flex flex-col gap-1 shrink-0">
                        <div className="grid grid-cols-2 gap-1">
                            {(['fire', 'earth', 'air', 'water'] as const).map(elKey => {
                                const count = stats.counts[elKey];
                                const style = ELEMENT_SYMBOLS[elKey];
                                const planets = stats.planetsByElement[elKey];
                                const isHighlighted = !highlightFilter || (highlightFilter.type === 'element' && highlightFilter.value === elKey);

                                return (
                                    <div 
                                        key={elKey}
                                        onMouseEnter={() => handleHover('element', elKey)}
                                        onMouseLeave={handleLeave}
                                        title={`${style.label}: ${count} astros`}
                                        className={`flex flex-col rounded-lg border transition-all duration-200 ${style.bg} ${style.border} ${isHighlighted ? 'opacity-100' : 'opacity-40'}`}
                                        style={{ padding: `${Math.max(4, Math.round(6 * scale))}px` }}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-1 min-w-0">
                                                <span className={style.text} style={{ fontSize: `${Math.max(10, Math.round(11 * scale))}px` }}>{style.svg}</span>
                                                <span className={`font-bold tracking-tight truncate ${isLight ? 'text-amber-950' : 'text-white'}`} style={{ fontSize: `${Math.max(9, Math.round(10 * scale))}px` }}>{style.label}</span>
                                            </div>
                                            <span 
                                                className={`font-mono font-extrabold ${style.text} ${isLight ? 'bg-black/10 border-black/10' : 'bg-white/10 border-white/10'} px-1 py-0.2 rounded border`}
                                                style={{ fontSize: `${Math.max(9, Math.round(10 * scale))}px` }}
                                            >
                                                {count}
                                            </span>
                                        </div>

                                        {/* Planet SVG Glyphs List */}
                                        <div 
                                            className={`w-full flex items-center gap-1 flex-wrap content-start mt-1 pt-1 border-t ${isLight ? 'border-amber-900/10' : 'border-white/5'}`}
                                            style={{ minHeight: `${Math.max(14, Math.round(16 * scale))}px` }}
                                        >
                                            {planets.length > 0 ? (
                                                planets.map(p => (
                                                    <span 
                                                        key={p.id} 
                                                        className="inline-flex items-center justify-center hover:scale-125 transition-transform"
                                                        title={`${p.name} (${style.label})`}
                                                    >
                                                        <CelestialGlyphSvg bodyId={p.id} size={Math.max(10, Math.round(11 * scale))} className={style.text} />
                                                    </span>
                                                ))
                                            ) : (
                                                <span className={`italic ${isLight ? 'text-amber-900/40' : 'text-white/30'}`} style={{ fontSize: `${Math.max(7.5, Math.round(8 * scale))}px` }}>—</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Combined Multi-Color Bar */}
                        <div 
                            className={`w-full ${isLight ? 'bg-black/10 border-black/5' : 'bg-white/10 border-white/5'} rounded-full overflow-hidden flex border mt-0.5`}
                            style={{ height: `${Math.max(5, Math.round(6 * scale))}px` }}
                        >
                            {(['fire', 'earth', 'air', 'water'] as const).map(elKey => {
                                const count = stats.counts[elKey];
                                const pct = (count / totalCount) * 100;
                                const style = ELEMENT_SYMBOLS[elKey];
                                return (
                                    <div 
                                        key={elKey}
                                        className={`h-full ${style.bar} transition-all duration-500`}
                                        style={{ width: `${pct}%` }}
                                        onMouseEnter={() => handleHover('element', elKey)}
                                        onMouseLeave={handleLeave}
                                        title={`${style.label}: ${count} astros`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* SESSÃO 3: MODALIDADES */}
                    <div className="flex flex-col gap-1 shrink-0">
                        {/* Compact Bento 3-Column Grid for Modalities with Planet SVG Glyphs */}
                        <div className="grid grid-cols-3 gap-1">
                            {(['cardinal', 'fixed', 'mutable'] as const).map(modKey => {
                                const count = stats.counts[modKey];
                                const style = MODALITY_SYMBOLS[modKey];
                                const planets = stats.planetsByModality[modKey];
                                const isHighlighted = !highlightFilter || (highlightFilter.type === 'modality' && highlightFilter.value === modKey);
                                const shortLabels = { cardinal: 'Card.', fixed: 'Fixo', mutable: 'Mut.' };

                                return (
                                    <div 
                                        key={modKey}
                                        onMouseEnter={() => handleHover('modality', modKey)}
                                        onMouseLeave={handleLeave}
                                        title={`${style.label} (${style.desc}): ${count} astros`}
                                        className={`flex flex-col rounded-lg border ${isLight ? 'border-amber-900/15 bg-black/[0.03]' : 'border-white/10 bg-white/[0.03]'} transition-all duration-200 ${isHighlighted ? 'opacity-100' : 'opacity-40'}`}
                                        style={{ padding: `${Math.max(3, Math.round(4 * scale))}px ${Math.max(4, Math.round(6 * scale))}px` }}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-0.5 min-w-0">
                                                <span className={style.text} style={{ fontSize: `${Math.max(9, Math.round(10 * scale))}px` }}>{style.svg}</span>
                                                <span className={`font-bold truncate ${isLight ? 'text-amber-950' : 'text-white/90'}`} style={{ fontSize: `${Math.max(8, Math.round(9 * scale))}px` }}>{shortLabels[modKey]}</span>
                                            </div>
                                            <span 
                                                className={`font-mono font-extrabold ${style.text} ${isLight ? 'bg-black/10' : 'bg-white/10'} px-1 py-0.2 rounded`}
                                                style={{ fontSize: `${Math.max(8, Math.round(9 * scale))}px` }}
                                            >
                                                {count}
                                            </span>
                                        </div>

                                        {/* Planet SVG Glyphs List */}
                                        <div 
                                            className={`flex items-center gap-0.5 flex-wrap pt-1 mt-1 border-t ${isLight ? 'border-amber-900/10' : 'border-white/5'}`}
                                            style={{ minHeight: `${Math.max(14, Math.round(16 * scale))}px` }}
                                        >
                                            {planets.length > 0 ? (
                                                planets.map(p => (
                                                    <span key={p.id} title={`${p.name} (${style.label})`} className="hover:scale-125 transition-transform">
                                                        <CelestialGlyphSvg bodyId={p.id} size={Math.max(10, Math.round(11 * scale))} className={style.text} />
                                                    </span>
                                                ))
                                            ) : (
                                                <span className={`italic ${isLight ? 'text-amber-900/40' : 'text-white/30'}`} style={{ fontSize: `${Math.max(7.5, Math.round(8 * scale))}px` }}>—</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Combined Multi-Color Bar for Modalities */}
                        <div 
                            className={`w-full ${isLight ? 'bg-black/10 border-black/5' : 'bg-white/10 border-white/5'} rounded-full overflow-hidden flex border mt-0.5`}
                            style={{ height: `${Math.max(5, Math.round(6 * scale))}px` }}
                        >
                            {(['cardinal', 'fixed', 'mutable'] as const).map(modKey => {
                                const count = stats.counts[modKey];
                                const pct = (count / totalCount) * 100;
                                const style = MODALITY_SYMBOLS[modKey];
                                return (
                                    <div 
                                        key={modKey}
                                        className={`h-full ${style.bar} transition-all duration-500`}
                                        style={{ width: `${pct}%` }}
                                        onMouseEnter={() => handleHover('modality', modKey)}
                                        onMouseLeave={handleLeave}
                                        title={`${style.label}: ${count} astros`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
