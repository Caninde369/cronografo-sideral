import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CelestialData } from '../hooks/useCelestialData';
import { ZODIAC_DATA } from './zodiac';
import { UI_ICONS } from './icons';
import { WidgetId } from '../App';
import { CelestialGlyphSvg } from './chart/CelestialGlyphSvg';
import { getMoonPhaseInfo } from '../lib/astrology/moon';
import { CompactToggle } from './Controls';
import { useRingColors, elementHex } from '../lib/appearance';

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
    northNode: { name: 'Nodo Norte', symbol: '☊', color: '#94A3B8' },
    southNode: { name: 'Nodo Sul', symbol: '☋', color: '#94A3B8' },
    lilith: { name: 'Lilith', symbol: '⚸', color: '#94A3B8' },
    chiron: { name: 'Quíron', symbol: '⚷', color: '#5EA18D' },
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
    const ringColors = useRingColors();
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
            const baseWidth = isUltraSlim ? 185 : 240;
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
        // As faixas contam sempre os mesmos 14 astros (não mudam ao ligar/desligar no painel Astros):
        // 10 planetas + Nodo Norte, Nodo Sul, Lilith e Quíron.
        const PLANETS = [
            'sun', 'moon', 'mercury', 'venus', 'mars',
            'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
            'northNode', 'southNode', 'lilith', 'chiron'
        ];

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

    // Passar o mouse: destaque temporário. Clicar num card: destaque FIXO (clique de novo solta).
    const [pinnedFilter, setPinnedFilter] = React.useState<HighlightFilter>(null);

    const handleHover = (type: 'element' | 'modality' | 'polarity', value: string) => {
        if (onHighlightFilterChange) {
            onHighlightFilterChange({ type, value });
        }
    };

    const handleLeave = () => {
        if (onHighlightFilterChange) {
            onHighlightFilterChange(pinnedFilter);
        }
    };

    const handleCardClick = (type: 'element' | 'modality' | 'polarity', value: string) => {
        const same = !!pinnedFilter && pinnedFilter.type === type && pinnedFilter.value === value;
        const next: HighlightFilter = same ? null : { type, value };
        setPinnedFilter(next);
        onHighlightFilterChange?.(next ?? { type, value });
    };
    const isPinned = (type: string, value: string) => !!pinnedFilter && pinnedFilter.type === type && pinnedFilter.value === value;

    /** Cada seção é um cartão grande; o título é um botão que colore o zodíaco (clique de novo desliga). */
    const groupClass = (mode: 'element' | 'modality' | 'polarity') => {
        const active = zodiacColorMode === mode;
        return `flex flex-col gap-1.5 shrink-0 rounded-xl p-1.5 border transition-colors ${
            active
                ? (isLight ? 'border-amber-600/50 bg-amber-500/[0.07]' : 'border-amber-300/45 bg-amber-300/[0.05]')
                : (isLight ? 'border-black/10 bg-black/[0.02]' : 'border-white/10 bg-white/[0.02]')
        }`;
    };
    const renderSectionHeader = (label: string, mode: 'element' | 'modality' | 'polarity', icon: string) => {
        const active = zodiacColorMode === mode;
        return (
            <button
                type="button"
                data-status-section={mode}
                data-tour={`status-${mode}`}
                onClick={() => onZodiacColorModeChange?.(active ? 'none' : mode)}
                title={active ? 'Clique para tirar as cores do zodíaco' : `Clique para colorir o zodíaco por ${label.toLowerCase()}`}
                className={`w-full flex items-center justify-between px-2 rounded-lg border transition-colors cursor-pointer ${
                    active
                        ? (isLight ? 'bg-amber-500/15 border-amber-600/40 text-amber-900' : 'bg-amber-400/15 border-amber-300/40 text-amber-100')
                        : (isLight ? 'bg-white/60 border-black/10 text-amber-950/80 hover:bg-black/5' : 'bg-white/[0.04] border-white/10 text-white/80 hover:bg-white/[0.08] hover:text-white')
                }`}
                style={{ height: `${Math.max(24, Math.round(28 * scale))}px` }}
            >
                <span className="font-bold flex items-center gap-1.5" style={{ fontSize: `${Math.max(11, Math.round(12.5 * scale))}px` }}>
                    <i className={`ti ${icon}`} style={{ fontSize: `${Math.max(13, Math.round(15 * scale))}px` }} />
                    {label}
                </span>
                {active && <i className="ti ti-check" style={{ fontSize: `${Math.max(12, Math.round(13 * scale))}px` }} />}
            </button>
        );
    };

    const moonInfo = moonPhase !== undefined ? getMoonPhaseInfo(moonPhase) : null;
    const totalCount = stats.counts.total || 14;

    return (
        <div data-tour="status" className={`flex flex-col font-sans w-full bg-transparent relative p-1.5 gap-1.5 ${isLight ? 'text-amber-950' : 'text-white'} overflow-hidden`}>
            <style>{`[data-status-card]{cursor:pointer}
[data-status-card][data-pinned="true"]{outline:1.5px solid rgba(245,217,138,.85);outline-offset:1px;border-radius:8px;box-shadow:0 0 12px rgba(212,175,55,.25)}`}</style>
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
                <div className="flex flex-col gap-2.5">
                    <style>{`
.sb-card{border-radius:12px;padding:${Math.max(6, Math.round(7 * scale))}px;border:1px solid ${isLight ? 'rgba(35,23,20,.14)' : '#221d27'};transition:border-color .25s}
.sb-card.on{border-color:${isLight ? 'rgba(138,106,18,.55)' : 'rgba(212,175,55,.5)'}}
.sb-head{width:100%;display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;column-gap:6px;row-gap:5px;background:none;border:0;padding:0 2px;margin-bottom:${Math.max(6, Math.round(8 * scale))}px;cursor:pointer;color:inherit;text-align:left;min-width:0}
.sb-title{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;line-height:1;white-space:nowrap;flex:none}
.sb-stats{font-family:'DM Sans',system-ui,sans-serif;font-size:${Math.max(8, Math.round(8.5 * scale * 10) / 10)}px;font-weight:500;letter-spacing:.07em;text-transform:uppercase;white-space:nowrap;text-align:left;flex-basis:100%;overflow:hidden;text-overflow:ellipsis}
.sb-stats b{font-family:'DM Mono',ui-monospace,monospace;font-weight:400;letter-spacing:0;color:${isLight ? '#231714' : '#EDE9E3'}}
.sb-stats i{font-style:normal;margin:0 3px;color:${isLight ? 'rgba(35,23,20,.3)' : '#3A3440'}}
.sb-strip{display:flex;gap:3px}
.sb-fx{border-radius:9px;border:1px solid;display:flex;align-items:center;justify-content:space-around;gap:0;min-width:0;padding:0 3px;cursor:pointer;overflow:hidden;transition:flex-grow .6s cubic-bezier(.16,1,.3,1),filter .2s,transform .2s,opacity .2s,background-color .2s,border-color .2s}
.sb-fx:hover{filter:${isLight ? 'brightness(.94) saturate(1.15)' : 'brightness(1.25)'};transform:translateY(-1px)}
.sb-fx.dim{opacity:.35}
.sb-fx.pin{outline:1.5px solid ${isLight ? 'rgba(138,106,18,.8)' : 'rgba(245,217,138,.85)'};outline-offset:1px}
`}</style>
                    {(() => {
                        const glyph = Math.max(10.5, Math.round(11.5 * scale));
                        const stripH = Math.max(24, Math.round(27 * scale));
                        const titleFs = Math.max(14, Math.round(15.5 * scale));
                        const glyphColor = isLight ? '#231714' : '#EDE9E3';
                        const anyFilter = !!highlightFilter;
                        const POL = { feminine: isLight ? '#1d4ed8' : '#60A5FA', masculine: isLight ? '#b91c1c' : '#F87171' } as Record<string, string>;
                        const EL = { fire: elementHex('fire', isLight, ringColors), earth: elementHex('earth', isLight, ringColors), air: elementHex('air', isLight, ringColors), water: elementHex('water', isLight, ringColors) } as Record<string, string>;
                        const MO = { cardinal: isLight ? '#b91c1c' : '#F87171', fixed: isLight ? '#15803d' : '#4ADE80', mutable: isLight ? '#1d4ed8' : '#60A5FA' } as Record<string, string>;
                        const GROUPS: Array<{ mode: 'polarity' | 'element' | 'modality'; title: string; order: string[]; names: Record<string, string>; colors: Record<string, string>; planets: Record<string, Array<{ id: string; name: string }>> }> = [
                            { mode: 'polarity', title: 'Polaridades', order: ['feminine', 'masculine'], names: { feminine: 'Feminino', masculine: 'Masculino' }, colors: POL, planets: stats.planetsByPolarity },
                            { mode: 'element', title: 'Elementos', order: ['water', 'earth', 'fire', 'air'], names: { fire: 'Fogo', earth: 'Terra', air: 'Ar', water: 'Água' }, colors: EL, planets: stats.planetsByElement },
                            { mode: 'modality', title: 'Modalidades', order: ['cardinal', 'fixed', 'mutable'], names: { cardinal: 'Cardinal', fixed: 'Fixo', mutable: 'Mutável' }, colors: MO, planets: stats.planetsByModality },
                        ];
                        return (
                            <>
                                {GROUPS.map(G => {
                                    const active = zodiacColorMode === G.mode;
                                    return (
                                        <div key={G.mode} data-status-group={G.mode} className={`sb-card ${active ? 'on' : ''}`}>
                                            <button
                                                type="button"
                                                className="sb-head"
                                                data-status-section={G.mode}
                                                data-tour={`status-${G.mode}`}
                                                onClick={() => onZodiacColorModeChange?.(active ? 'none' : G.mode)}
                                                title={active ? 'Clique para tirar as cores do zodíaco' : `Clique para colorir o zodíaco por ${G.title.toLowerCase()}`}
                                            >
                                                <span className="sb-title" style={{ fontSize: titleFs }}>{G.title}</span>
                                                <span className="sb-stats">
                                                    {G.order.map((k, i) => (
                                                        <React.Fragment key={k}>
                                                            {i > 0 && <i>·</i>}
                                                            <span style={{ color: G.colors[k] }}>{G.names[k]} <b>{(G.planets[k] || []).length}</b></span>
                                                        </React.Fragment>
                                                    ))}
                                                </span>
                                            </button>
                                            <div className="sb-strip">
                                                {G.order.filter(k => (G.planets[k] || []).length > 0).map(k => {
                                                    const list = G.planets[k];
                                                    const color = G.colors[k];
                                                    const hl = anyFilter && highlightFilter!.type === G.mode && highlightFilter!.value === k;
                                                    const dim = anyFilter && highlightFilter!.type === G.mode && !hl;
                                                    return (
                                                        <div
                                                            key={k}
                                                            className={`sb-fx ${dim ? 'dim' : ''} ${isPinned(G.mode, k) ? 'pin' : ''}`}
                                                            data-status-card={G.mode}
                                                            data-pinned={isPinned(G.mode, k) ? 'true' : undefined}
                                                            onMouseEnter={() => handleHover(G.mode, k)}
                                                            onMouseLeave={handleLeave}
                                                            onClick={() => handleCardClick(G.mode, k)}
                                                            title={`${G.names[k]}: ${list.length} de ${totalCount} astros`}
                                                            style={{
                                                                flex: `${list.length} 1 0`,
                                                                height: stripH,
                                                                borderColor: hl ? color : `${color}80`,
                                                                background: hl ? `${color}40` : `${color}26`,
                                                            }}
                                                        >
                                                            {list.map(p => (
                                                                <span key={p.id} title={p.name} className="inline-flex">
                                                                    <CelestialGlyphSvg bodyId={p.id} size={glyph} style={{ color: glyphColor } as any} className="shrink-0" />
                                                                </span>
                                                            ))}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};
