import React, { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ZODIAC_DATA, getZodiacColorClass } from './zodiac';
import { ZODIAC_ICONS, UI_ICONS, CELESTIAL_GLYPHS } from './icons';
import { WidgetId } from '../App';
import { toRoman, formatDegrees } from '../lib/astrology/utils';

interface HouseCuspsPanelProps {
    ascendantLongitude: number;
    midheavenLongitude: number;
    descendantLongitude: number;
    imumCoeliLongitude: number;
    houseCusps: number[];
    housePlacements?: Record<string, number>;
    visiblePlanets?: Record<string, boolean>;
    celestialData?: any;
    hoveredHouse: number | null;
    setHoveredHouse: React.Dispatch<React.SetStateAction<number | null>>;
    selectedHouses: number[];
    secondarySelectedHouses?: number[];
    onHouseClick: (houseNumber: number) => void;
    onHouseRightClick: (houseNumber: number) => void;
    dragHandle?: React.ReactNode;
    activeMenu: WidgetId | null;
    setActiveMenu: (id: WidgetId | null) => void;
    houseFormat?: 'arabic' | 'roman';
    onHouseFormatChange?: (format: 'arabic' | 'roman') => void;
    scale?: number;
    showHouseLines?: boolean;
    setShowHouseLines?: React.Dispatch<React.SetStateAction<boolean>>;
    zodiacColorMode?: 'none' | 'element' | 'modality' | 'polarity';
    showSignLines?: boolean;
    setShowSignLines?: React.Dispatch<React.SetStateAction<boolean>>;
    layoutMode?: 'table' | 'cards';
    onLayoutChange?: (mode: 'table' | 'cards') => void;
    columns?: '1col' | '2col';
    onColumnsChange?: (cols: '1col' | '2col') => void;
    panelPosition?: 'left' | 'right';
    isCompact?: boolean;
    onWidthChange?: (width: number) => void;
    onPanelPositionChange?: (pos: 'left' | 'right') => void;
    showCuspDegrees?: boolean;
    planetsInHouse?: string[];
    onToggleCuspDegrees?: () => void;
    hideHeader?: boolean;
    menuButtonRef?: React.RefObject<HTMLButtonElement | null>;
    theme?: 'dark' | 'light';
    isFreeTier?: boolean;
    isFreeTrial?: boolean;
    onOpenPaymentPlans?: () => void;
}

const PopupMenu: React.FC<{ children: React.ReactNode, onClose: () => void, triggerRef: React.RefObject<HTMLElement | null> }> = ({ children, onClose, triggerRef }) => {
    const [coords, setCoords] = React.useState<{top: number, left: number} | null>(null);

    React.useEffect(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const isRightSide = rect.left > window.innerWidth / 2;
            
            setCoords({
                top: rect.top,
                left: isRightSide ? rect.left - 200 : rect.right + 12
            });
        }
    }, [triggerRef]);

    if (!coords) return null;

    return createPortal(
        <React.Fragment>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div 
                className="fixed z-[9999] bg-[#06060a]/95 border border-white/15 backdrop-blur-xl rounded-xl p-3 min-w-[200px] animate-in fade-in zoom-in-95 duration-100 origin-top-right font-sans text-brand-text shadow-2xl"
                style={{ top: coords.top, left: coords.left }}
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </React.Fragment>,
        document.body
    );
};

const HOUSE_KEYWORDS: Record<number, string> = {
    1: "Casa I (Ascendente) · Identidade, Ego e Início",
    2: "Casa II · Recursos, Finanças e Valores",
    3: "Casa III · Mente, Comunicação e Entorno",
    4: "Casa IV (Fundo do Céu) · Lar, Família e Raízes",
    5: "Casa V · Criatividade, Expressão e Prazer",
    6: "Casa VI · Rotina, Trabalho e Saúde",
    7: "Casa VII (Descendente) · Relações, Parcerias e o Outro",
    8: "Casa VIII · Transformação, Recursos Compartilhados e Crises",
    9: "Casa IX · Filosofia, Estudos Superiores e Expansão",
    10: "Casa X (Meio do Céu) · Carreira, Propósito e Reputação",
    11: "Casa XI · Coletivo, Amizades e Projetos",
    12: "Casa XII · Inconsciente, Espiritualidade e Transcendência"
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
    neptune: '#818CF8',
    pluto: '#94A3B8',
    northNode: '#34D399',
    southNode: '#F59E0B',
    lilith: '#E879F9',
    chiron: '#34D399',
    ceres: '#FACC15',
    pallas: '#60A5FA',
    juno: '#F472B6',
    vesta: '#FB923C',
    partOfFortune: '#F59E0B',
};

const HouseCuspCard: React.FC<{
    houseNumber: number;
    longitude: number;
    isSelected: boolean;
    isSecondarySelected?: boolean;
    onHover: (num: number | null) => void;
    onClick: (num: number) => void;
    onRightClick: (num: number) => void;
    houseFormat: 'arabic' | 'roman';
    scale: number;
    zodiacColorMode: 'none' | 'element' | 'modality' | 'polarity';
    layoutMode: 'table' | 'cards';
    isCompact: boolean;
    showCuspDegrees?: boolean;
    planetsInHouse?: string[];
    showPlanetsInHouses?: boolean;
    theme?: 'dark' | 'light';
}> = ({ 
    houseNumber, 
    longitude, 
    isSelected, 
    isSecondarySelected, 
    onHover, 
    onClick, 
    onRightClick, 
    houseFormat, 
    scale, 
    zodiacColorMode, 
    layoutMode, 
    isCompact, 
    showCuspDegrees = false, 
    planetsInHouse = [], 
    showPlanetsInHouses = true, 
    theme = 'dark' 
}) => {
    const isLight = theme === 'light';
    const signIndex = Math.floor(longitude / 30);
    const sign = ZODIAC_DATA[signIndex] || ZODIAC_DATA[0];
    const SignSymbol = ZODIAC_ICONS[sign.id as keyof typeof ZODIAC_ICONS];
    
    const signColorClass = getZodiacColorClass(sign, zodiacColorMode);
    const isAngular = [1, 4, 7, 10].includes(houseNumber);

    const label = houseFormat === 'roman' ? toRoman(houseNumber) : String(houseNumber);
    
    const itemSize = (isCompact ? 12 : 13) * scale;
    const degreeSize = Math.max(10, itemSize * 0.85);
    const signSize = Math.max(12, itemSize * 0.95);
    const fontSize = Math.max(11, itemSize * 0.9);
    const cardHeight = Math.max(26, Math.round(26 * scale));
    const houseColWidth = Math.max(22, Math.round(26 * scale));
    const signColWidth = Math.max(18, Math.round(22 * scale));

    const hasPlanets = showPlanetsInHouses && planetsInHouse && planetsInHouse.length > 0;

    // DS v2 Surface styling matching CelestialBodyPanel & AstroInfoPanel
    let stateClasses = "";
    if (isSelected) {
        stateClasses = isLight
            ? "bg-gradient-to-b from-[#D4AF37]/25 to-[#D4AF37]/10 border-[#8a6d1f]/60 text-amber-950 shadow-sm"
            : "bg-gradient-to-b from-[#D4AF37]/[0.15] to-[#D4AF37]/[0.04] border-[#D4AF37]/60 text-white shadow-[0_0_10px_rgba(212,175,55,0.15)]";
    } else if (isSecondarySelected) {
        stateClasses = isLight
            ? "bg-gradient-to-b from-[#D4AF37]/12 to-transparent border-[#8a6d1f]/35 text-amber-900"
            : "bg-gradient-to-b from-[#D4AF37]/[0.08] to-transparent border-[#D4AF37]/30 text-white";
    } else if (isAngular) {
        stateClasses = isLight
            ? "bg-[#8b8370]/[0.10] border-[#8b8370]/25 hover:bg-[#8b8370]/[0.16] hover:border-[#8b8370]/40 text-amber-950"
            : "bg-white/[0.05] border-white/15 hover:bg-white/[0.09] hover:border-white/25 text-white";
    } else {
        stateClasses = isLight
            ? "bg-[#8b8370]/[0.04] border-[#8b8370]/12 hover:bg-[#8b8370]/[0.09] hover:border-[#8b8370]/25 text-amber-900"
            : "bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/18 text-brand-text-muted hover:text-brand-text";
    }

    return (
        <div 
            className={`
                flex items-center justify-between px-1.5 py-0.5 rounded-[7px] border transition-all duration-150 cursor-pointer select-none group w-full shrink-0 overflow-hidden box-border
                ${stateClasses}
            `}
            style={{
                height: `${cardHeight}px`,
                minHeight: `${cardHeight}px`
            }}
            title={HOUSE_KEYWORDS[houseNumber]}
            onMouseEnter={() => onHover(houseNumber)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onClick(houseNumber)}
            onContextMenu={(e) => { e.preventDefault(); onRightClick(houseNumber); }}
        >
            {/* Coluna Lateral Esquerda: Identificador da Casa Centralizado */}
            <div className="shrink-0 flex items-center justify-center text-center" style={{ width: `${houseColWidth}px` }}>
                <span 
                    className={`font-bold leading-none ${houseFormat === 'roman' ? 'font-display' : 'font-ui'}`}
                    style={{ 
                        fontSize: `${fontSize}px`,
                        color: isSelected 
                            ? (isLight ? '#3B2F14' : '#FFFFFF') 
                            : isAngular 
                                ? (isLight ? '#3B2F14' : '#F5F2EB') 
                                : (isLight ? '#5F4B20' : 'rgba(245, 242, 235, 0.75)')
                    }}
                >
                    {label}
                </span>
            </div>

            {/* Coluna Fixa do Signo (Posição Estável sem Jitter) */}
            <div className="shrink-0 flex items-center justify-center" style={{ width: `${signColWidth}px` }}>
                {SignSymbol && (
                    <SignSymbol 
                        className={`${signColorClass} overflow-visible`} 
                        style={{ width: `${signSize}px`, height: `${signSize}px` }} 
                    />
                )}
            </div>

            {/* Centro Opcional: Graus da Cúspide (DM Mono) se ativado */}
            {showCuspDegrees && (
                <div className="shrink-0 flex items-center justify-center px-1">
                    <span 
                        className="tabular-nums font-mono font-normal tracking-tight whitespace-nowrap" 
                        style={{ 
                            fontSize: `${degreeSize}px`, 
                            fontFamily: "'Azeret Mono', monospace",
                            fontWeight: 400,
                            color: isSelected 
                                ? (isLight ? '#3B2F14' : '#F5F2EB') 
                                : (isLight ? '#423518' : '#F5F2EB')
                        }}
                    >
                        {formatDegrees(longitude % 30)}
                    </span>
                </div>
            )}

            {/* Lado Direito: Astros Ativos na Casa */}
            {showPlanetsInHouses && (
                <div className={`flex-1 min-w-0 flex items-center justify-end gap-0.5 pl-1 border-l ${isLight ? 'border-black/10' : 'border-white/10'}`}>
                    {hasPlanets ? (
                        planetsInHouse.map(p => {
                            const planetGlyph = CELESTIAL_GLYPHS[p as keyof typeof CELESTIAL_GLYPHS] || p.substring(0, 1);
                            const planetHexColor = PLANET_HEX_COLORS[p] || (isLight ? '#3B2F14' : '#FFFFFF');
                            return (
                                <span 
                                    key={p} 
                                    className="leading-none font-semibold hover:scale-110 transition-transform select-none shrink-0"
                                    style={{ 
                                        fontSize: `${Math.max(11, itemSize * 0.9)}px`,
                                        color: isLight && planetHexColor === '#FDE047' ? '#B45309' : planetHexColor,
                                        fontFamily: '"Noto Sans Symbols", "Segoe UI Symbol", sans-serif'
                                    }}
                                    title={p}
                                >
                                    {planetGlyph}
                                </span>
                            );
                        })
                    ) : (
                        <span className="text-[9px] text-brand-text-muted/20 font-mono select-none w-2.5 text-center leading-none">
                            —
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export const HouseCuspsPanel: React.FC<HouseCuspsPanelProps> = ({
    ascendantLongitude, 
    midheavenLongitude, 
    descendantLongitude, 
    imumCoeliLongitude, 
    houseCusps: houseCuspsProp, 
    housePlacements, 
    visiblePlanets, 
    celestialData,
    hoveredHouse, 
    setHoveredHouse, 
    selectedHouses, 
    secondarySelectedHouses = [], 
    onHouseClick, 
    onHouseRightClick,
    dragHandle, 
    houseFormat = 'roman', 
    onHouseFormatChange, 
    scale = 1,
    showHouseLines, 
    setShowHouseLines,
    zodiacColorMode = 'element', 
    showSignLines, 
    setShowSignLines,
    layoutMode = 'table', 
    onLayoutChange, 
    columns = '2col', 
    onColumnsChange, 
    activeMenu, 
    setActiveMenu, 
    panelPosition = 'right', 
    isCompact: isCompactProp,
    onWidthChange, 
    onPanelPositionChange,
    showCuspDegrees = false,
    onToggleCuspDegrees,
    hideHeader,
    menuButtonRef,
    theme = 'dark',
    isFreeTier = false,
    isFreeTrial = false,
    onOpenPaymentPlans
}) => {
    const isFree = Boolean(isFreeTier || isFreeTrial);
    const localMenuButtonRef = React.useRef<HTMLButtonElement>(null);
    const finalMenuButtonRef = menuButtonRef || localMenuButtonRef;
    const isMenuOpen = activeMenu === 'cusps';
    
    const [showPlanetsInHouses, setShowPlanetsInHouses] = useState(true);
    
    useEffect(() => {
        if (onWidthChange) {
            let baseWidth = columns === '1col' ? 140 : 235;
            if (!showCuspDegrees) {
                baseWidth = columns === '1col' ? 115 : 185;
            }
            const w = baseWidth * scale;
            onWidthChange(w);
        }
    }, [layoutMode, columns, onWidthChange, scale, showCuspDegrees]);
    
    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFree) {
            onOpenPaymentPlans?.();
            return;
        }
        setActiveMenu(isMenuOpen ? null : 'cusps');
    };

    const houseCusps = useMemo(() => [
        ascendantLongitude, ...houseCuspsProp.slice(1,3), 
        imumCoeliLongitude, ...houseCuspsProp.slice(4,6), 
        descendantLongitude, ...houseCuspsProp.slice(7,9), 
        midheavenLongitude, ...houseCuspsProp.slice(10,12), 
    ], [ascendantLongitude, midheavenLongitude, descendantLongitude, imumCoeliLongitude, houseCuspsProp]);

    const leftColumnHouses = houseCusps.slice(0, 6);
    const rightColumnHouses = houseCusps.slice(6, 12);

    const isCompact = isCompactProp ?? (layoutMode === 'table');

    return (
        <div 
            className="flex flex-col h-full font-manrope w-full bg-transparent overflow-hidden"
        >
            {!hideHeader && (
                <div className="px-3 py-1.5 flex justify-between items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {dragHandle}
                        <h3 className="truncate" style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--color-panel-header)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>Casas</h3>
                        <div style={{
                          flex: 1,
                          height: '1px',
                          marginLeft: '8px',
                          backgroundColor: theme === 'light' ? '#8b8370' : '#2A2A2A',
                          opacity: 0.4
                        }} />
                    </div>
                    <button 
                        ref={finalMenuButtonRef}
                        onClick={handleMenuToggle}
                        className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-90 ${isMenuOpen ? 'bg-gradient-to-b from-[#D4AF37]/[0.18] to-[#D4AF37]/[0.06] border border-[#D4AF37]/50 text-[#F5D98A]' : 'text-brand-text-muted hover:text-brand-text hover:bg-white/10'}`}
                        title={isFree ? "Opções de Casas (Disponível no Plano Pro)" : "Opções do Painel de Casas"}
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
                <PopupMenu onClose={() => setActiveMenu(null)} triggerRef={finalMenuButtonRef}>
                    <div className="flex flex-col gap-2.5 font-sans text-xs">
                        {/* Banner de Bloqueio Plano Free */}
                        {isFree && (
                            <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-between gap-1.5 shadow-sm">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-amber-400 text-xs shrink-0">🔒</span>
                                    <span className="text-[10px] font-semibold text-amber-200 leading-tight">
                                        Edições de Casas bloqueadas no Free.
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { onOpenPaymentPlans?.(); setActiveMenu(null); }}
                                    className="px-2 py-0.5 rounded-lg bg-amber-500 text-black font-bold text-[9.5px] hover:bg-amber-400 active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm"
                                >
                                    Upgrade
                                </button>
                            </div>
                        )}

                        <div className={isFree ? 'opacity-40 pointer-events-none select-none flex flex-col gap-2.5' : 'flex flex-col gap-2.5'}>
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleCuspDegrees?.(); }}
                            className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-all duration-150 hover:bg-white/10 active:scale-98 text-brand-text-muted hover:text-brand-text cursor-pointer"
                        >
                            <span className="font-manrope font-semibold text-white">Mostrar graus</span>
                            <div className={`w-7 h-4 rounded-full relative transition-all duration-300 ${showCuspDegrees ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.5)] border border-amber-300/40' : 'bg-slate-900 border border-white/15'}`}>
                                <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300" style={{left: showCuspDegrees ? 'calc(100% - 14px)' : '2px'}} />
                            </div>
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); setShowPlanetsInHouses(prev => !prev); }}
                            className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-all duration-150 hover:bg-white/10 active:scale-98 text-brand-text-muted hover:text-brand-text cursor-pointer"
                        >
                            <span className="font-manrope font-semibold text-white">Planetas nas Casas</span>
                            <div className={`w-7 h-4 rounded-full relative transition-all duration-300 ${showPlanetsInHouses ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.5)] border border-amber-300/40' : 'bg-slate-900 border border-white/15'}`}>
                                <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300" style={{left: showPlanetsInHouses ? 'calc(100% - 14px)' : '2px'}} />
                            </div>
                        </button>
                        <div className="h-px bg-white/10 my-0.5" />
                        
                        <div>
                            <div className="text-[9.5px] font-bold uppercase text-white/70 tracking-wider mb-1 px-1 font-sans">Numeração</div>
                            <div className="flex bg-slate-950/60 rounded-lg p-0.5 border border-white/10 shadow-inner">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onHouseFormatChange?.('roman'); }}
                                    className={`flex-1 px-2 py-1 text-[9.5px] font-bold uppercase rounded transition-all duration-150 cursor-pointer active:scale-95 ${houseFormat === 'roman' ? 'bg-gradient-to-b from-[#D4AF37]/[0.22] to-[#D4AF37]/[0.08] border border-[#D4AF37]/50 text-[#F5D98A]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                >
                                    Romano
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onHouseFormatChange?.('arabic'); }}
                                    className={`flex-1 px-2 py-1 text-[9.5px] font-bold uppercase rounded transition-all duration-150 cursor-pointer active:scale-95 ${houseFormat === 'arabic' ? 'bg-gradient-to-b from-[#D4AF37]/[0.22] to-[#D4AF37]/[0.08] border border-[#D4AF37]/50 text-[#F5D98A]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                >
                                    Arábico
                                </button>
                            </div>
                        </div>

                        <div className="h-px bg-white/10 my-0.5" />

                        <div>
                            <div className="text-[9.5px] font-bold uppercase text-white/70 tracking-wider mb-1 px-1 font-sans">Colunas</div>
                            <div className="flex bg-slate-950/60 rounded-lg p-0.5 border border-white/10 shadow-inner">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onColumnsChange?.('2col'); }}
                                    className={`flex-1 px-2 py-1 text-[9.5px] font-bold uppercase rounded transition-all duration-150 cursor-pointer active:scale-95 ${columns === '2col' ? 'bg-gradient-to-b from-[#D4AF37]/[0.22] to-[#D4AF37]/[0.08] border border-[#D4AF37]/50 text-[#F5D98A]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                >
                                    2 Colunas
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onColumnsChange?.('1col'); }}
                                    className={`flex-1 px-2 py-1 text-[9.5px] font-bold uppercase rounded transition-all duration-150 cursor-pointer active:scale-95 ${columns === '1col' ? 'bg-gradient-to-b from-[#D4AF37]/[0.22] to-[#D4AF37]/[0.08] border border-[#D4AF37]/50 text-[#F5D98A]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                >
                                    1 Coluna
                                </button>
                            </div>
                        </div>

                        </div>
                    </div>
                </PopupMenu>
            )}

            {/* Grid de Casas: 2 Colunas (6 Casas por coluna) ou 1 Coluna */}
            <div className="p-1.5 flex flex-1 min-h-0 overflow-y-auto custom-scrollbar gap-1.5">
                {columns === '1col' ? (
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                        {houseCusps.map((longitude, index) => (
                            <HouseCuspCard 
                                key={`h-${index + 1}`}
                                houseNumber={index + 1}
                                longitude={longitude}
                                isSelected={selectedHouses.includes(index + 1)}
                                isSecondarySelected={secondarySelectedHouses.includes(index + 1)}
                                onHover={setHoveredHouse}
                                onClick={onHouseClick}
                                onRightClick={onHouseRightClick}
                                houseFormat={houseFormat}
                                scale={scale}
                                zodiacColorMode={zodiacColorMode}
                                layoutMode={layoutMode}
                                isCompact={isCompact}
                                showCuspDegrees={showCuspDegrees}
                                planetsInHouse={Object.keys(visiblePlanets || {}).filter(p => (visiblePlanets as any)[p] && (housePlacements as any)?.[p] === index + 1)}
                                showPlanetsInHouses={showPlanetsInHouses}
                                theme={theme}
                            />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Coluna 1: Casas 1 a 6 */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                            {leftColumnHouses.map((longitude, index) => (
                                <HouseCuspCard 
                                    key={`h-${index + 1}`}
                                    houseNumber={index + 1}
                                    longitude={longitude}
                                    isSelected={selectedHouses.includes(index + 1)}
                                    isSecondarySelected={secondarySelectedHouses.includes(index + 1)}
                                    onHover={setHoveredHouse}
                                    onClick={onHouseClick}
                                    onRightClick={onHouseRightClick}
                                    houseFormat={houseFormat}
                                    scale={scale}
                                    zodiacColorMode={zodiacColorMode}
                                    layoutMode={layoutMode}
                                    isCompact={isCompact}
                                    showCuspDegrees={showCuspDegrees}
                                    planetsInHouse={Object.keys(visiblePlanets || {}).filter(p => (visiblePlanets as any)[p] && (housePlacements as any)?.[p] === index + 1)}
                                    showPlanetsInHouses={showPlanetsInHouses}
                                    theme={theme}
                                />
                            ))}
                        </div>
                        
                        {/* Coluna 2: Casas 7 a 12 */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                            {rightColumnHouses.map((longitude, index) => (
                                <HouseCuspCard 
                                    key={`h-${index + 7}`}
                                    houseNumber={index + 7}
                                    longitude={longitude}
                                    isSelected={selectedHouses.includes(index + 7)}
                                    isSecondarySelected={secondarySelectedHouses.includes(index + 7)}
                                    onHover={setHoveredHouse}
                                    onClick={onHouseClick}
                                    onRightClick={onHouseRightClick}
                                    houseFormat={houseFormat}
                                    scale={scale}
                                    zodiacColorMode={zodiacColorMode}
                                    layoutMode={layoutMode}
                                    isCompact={isCompact}
                                    showCuspDegrees={showCuspDegrees}
                                    planetsInHouse={Object.keys(visiblePlanets || {}).filter(p => (visiblePlanets as any)[p] && (housePlacements as any)?.[p] === index + 7)}
                                    showPlanetsInHouses={showPlanetsInHouses}
                                    theme={theme}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
