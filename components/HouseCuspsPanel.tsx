
import React, { useMemo, useEffect } from 'react';
import { ZODIAC_DATA, ELEMENT_COLORS, getZodiacColorClass } from './zodiac';
import { ZODIAC_ICONS, UI_ICONS } from './icons';
import { WidgetId } from '../App';
import { toRoman, formatDegrees } from '../lib/astrology/utils';

interface HouseCuspsPanelProps {
    ascendantLongitude: number;
    midheavenLongitude: number;
    descendantLongitude: number;
    imumCoeliLongitude: number;
    houseCusps: number[];
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
    layoutMode?: 'minimal' | 'complete';
    onLayoutChange?: (mode: 'minimal' | 'complete') => void;
    panelPosition?: 'left' | 'right';
    isCompact?: boolean;
    onWidthChange?: (width: number) => void;
    onPanelPositionChange?: (pos: 'left' | 'right') => void;
}

const PopupMenu: React.FC<{ children: React.ReactNode, onClose: () => void, triggerRef: React.RefObject<HTMLElement | null> }> = ({ children, onClose, triggerRef }) => {
    const popupRef = React.useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (triggerRef.current && triggerRef.current.contains(event.target as Node)) {
                return;
            }
            if (popupRef.current && popupRef.current.contains(event.target as Node)) {
                return;
            }
            onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, triggerRef]);

    return (
        <div 
            ref={popupRef}
            className="absolute right-2 top-8 z-50 bg-brand-surface border border-brand-border/10 rounded-xl shadow-2xl p-2 min-w-[120px] animate-in fade-in zoom-in-95 duration-100 origin-top-right"
        >
            {children}
        </div>
    );
};

const HOUSE_KEYWORDS: Record<number, string> = {
    1: "EU - PERSONALIDADE",
    2: "VALORES - RECURSOS",
    3: "MENTE - COMUNICAÇÃO",
    4: "LAR - RAÍZES",
    5: "CRIATIVIDADE - PRAZER",
    6: "ROTINA - SAÚDE",
    7: "O OUTRO - PARCERIAS",
    8: "TRANSFORMAÇÃO - CRISES",
    9: "FILOSOFIA - EXPANSÃO",
    10: "CARREIRA - STATUS",
    11: "COLETIVO - AMIGOS",
    12: "INCONSCIENTE - ESPIRITUALIDADE"
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
    layoutMode: 'minimal' | 'complete';
    isCompact: boolean;
}> = ({ houseNumber, longitude, isSelected, isSecondarySelected, onHover, onClick, onRightClick, houseFormat, scale, zodiacColorMode, layoutMode, isCompact }) => {
    
    const signIndex = Math.floor(longitude / 30);
    const sign = ZODIAC_DATA[signIndex];
    const SignSymbol = ZODIAC_ICONS[sign.id as keyof typeof ZODIAC_ICONS];
    
    const signColorClass = getZodiacColorClass(sign, zodiacColorMode);
    const isAngular = [1, 4, 7, 10].includes(houseNumber);

    let label = '';
    if (houseNumber === 1) label = 'ASC';
    else if (houseNumber === 10) label = 'MC';
    else label = houseFormat === 'roman' ? toRoman(houseNumber) : String(houseNumber);
    
    const itemSize = (isCompact ? 12 : 14) * scale;
    const degreeSize = itemSize * 0.88;
    const signSize = itemSize;
    const fontSize = itemSize * 0.875;

    if (layoutMode === 'complete') {
        return (
            <div 
                className={`
                    flex flex-col p-2 rounded-xl border transition-all duration-200 cursor-pointer group w-full font-manrope gap-1.5
                    ${isSelected 
                        ? 'bg-brand-purple/20 border-brand-purple/50 shadow-[0_0_15px_rgba(124,58,237,0.2)]' 
                        : isSecondarySelected
                            ? 'bg-brand-purple/10 border-brand-purple/30 shadow-[0_0_10px_rgba(124,58,237,0.1)]'
                            : isAngular 
                                ? 'bg-brand-surface-highlight/40 border-white/10 hover:bg-brand-surface-highlight/60' 
                                : 'bg-brand-surface/30 border-white/5 hover:bg-brand-surface-highlight/30'
                    }
                `}
                style={{ minHeight: `${itemSize * 3.2}px` }}
                onMouseEnter={() => onHover(houseNumber)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onClick(houseNumber)}
                onContextMenu={(e) => { e.preventDefault(); onRightClick(houseNumber); }}
            >
                <div className="flex justify-between items-start">
                    <span className={`font-bold text-brand-text ${houseFormat === 'roman' && houseNumber !== 1 && houseNumber !== 10 ? 'font-serif' : ''}`} style={{ fontSize: `${fontSize * 1.2}px` }}>
                        {label}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <SignSymbol className={signColorClass} style={{ width: `${signSize * 1.1}px`, height: `${signSize * 1.1}px` }} />
                        <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">
                            {sign.abbr}
                        </span>
                    </div>
                </div>
                
                <div className="flex justify-between items-end mt-0.5">
                    <span className="text-[8px] text-brand-text-muted uppercase tracking-tight font-medium truncate flex-1 mr-2">
                        {HOUSE_KEYWORDS[houseNumber]}
                    </span>
                    <span className="text-[9px] font-medium text-brand-text/80 tabular-nums bg-brand-surface-highlight/40 px-1.5 py-0.5 rounded border border-white/5">
                        {formatDegrees(longitude % 30)}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div 
            className={`
                flex items-center justify-between ${isCompact ? 'px-1 py-1' : 'px-2 py-1.5'} rounded-xl border transition-all duration-200 cursor-pointer group w-full font-display
                ${isSelected 
                    ? 'bg-gradient-to-r from-brand-purple/20 to-brand-orange/20 border-brand-purple/50 shadow-[0_0_15px_rgba(124,58,237,0.2)]' 
                    : isSecondarySelected
                        ? 'bg-brand-purple/10 border-brand-purple/30 shadow-[0_0_10px_rgba(124,58,237,0.1)]'
                        : isAngular 
                            ? 'bg-brand-surface-highlight/40 border-white/10 hover:bg-brand-surface-highlight/60 hover:shadow-md' 
                            : 'bg-brand-surface/30 border-transparent hover:bg-brand-surface-highlight/30 hover:shadow-md'
                }
            `}
            style={{ minHeight: `${itemSize * 1.8}px` }}
            onMouseEnter={() => onHover(houseNumber)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onClick(houseNumber)}
            onContextMenu={(e) => { e.preventDefault(); onRightClick(houseNumber); }}
        >
            <div 
                className={`font-bold min-w-[1.5rem] text-center ${isSelected ? 'text-violet-300' : 'text-brand-text-muted'} ${houseFormat === 'roman' && houseNumber !== 1 && houseNumber !== 10 ? 'font-serif' : ''}`}
                style={{ fontSize: `${fontSize}px` }}
            >
                {label}
            </div>

             <div className="flex items-center justify-center flex-1 min-w-0">
                  <SignSymbol className={signColorClass} style={{ width: `${signSize}px`, height: `${signSize}px` }} />
            </div>
        </div>
    );
};

export const HouseCuspsPanel: React.FC<HouseCuspsPanelProps> = ({
    ascendantLongitude, midheavenLongitude, descendantLongitude, imumCoeliLongitude, houseCusps: houseCuspsProp,
    hoveredHouse, setHoveredHouse, selectedHouses, secondarySelectedHouses = [], onHouseClick, onHouseRightClick,
    dragHandle, houseFormat = 'arabic', onHouseFormatChange, scale = 1,
    showHouseLines, setShowHouseLines,
    zodiacColorMode = 'element', showSignLines, setShowSignLines,
    layoutMode = 'minimal', onLayoutChange, activeMenu, setActiveMenu, panelPosition = 'right', isCompact: isCompactProp,
    onWidthChange, onPanelPositionChange
}) => {

    const menuButtonRef = React.useRef<HTMLButtonElement>(null);
    const isMenuOpen = activeMenu === 'cusps';
    
    useEffect(() => {
        if (onWidthChange) {
            const baseWidth = layoutMode === 'complete' ? 280 : 160;
            onWidthChange(baseWidth * scale);
        }
    }, [layoutMode, onWidthChange, scale]);
    
    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
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

    const isCompact = isCompactProp ?? (layoutMode === 'minimal');

    return (
        <div className="bg-brand-surface/40 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col h-auto border border-brand-border/5 font-display w-full">
            <div className="px-3 py-2 border-b border-brand-border/5 flex justify-between items-center gap-2 flex-shrink-0 bg-brand-surface-highlight/30 rounded-t-3xl">
                 <div className="flex items-center gap-2 min-w-0 flex-1">
                    {dragHandle}
                    <h3 className="text-[10px] font-medium uppercase text-brand-text-muted tracking-wider truncate font-manrope">Cúspides</h3>
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
                                <div className="h-px bg-brand-border/10"></div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-brand-text-muted mb-2 px-2">Posição do Painel</div>
                                    <div className="flex gap-1">
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

            <div className={`p-2 flex ${layoutMode === 'complete' ? 'gap-2' : 'gap-1'} ${isCompact ? 'gap-0.5 p-1' : ''}`}>
                <div className={`flex-1 min-w-0 flex flex-col ${layoutMode === 'complete' ? 'gap-2' : (isCompact ? 'gap-0.5' : 'gap-1')}`}>
                    {leftColumnHouses.map((longitude, index) => (
                        <HouseCuspCard
                            key={`${index + 1}-${layoutMode}`}
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
                        />
                    ))}
                </div>
                
                <div className={`flex-1 min-w-0 flex flex-col ${layoutMode === 'complete' ? 'gap-2' : (isCompact ? 'gap-0.5' : 'gap-1')}`}>
                    {rightColumnHouses.map((longitude, index) => (
                        <HouseCuspCard
                            key={`${index + 7}-${layoutMode}`}
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
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
