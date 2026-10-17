import React, { useRef, useState, useEffect } from 'react';
import { UI_ICONS } from './icons';

interface FloatingWindowProps {
    id: 'celestial' | 'cusps' | 'aspects' | 'statistics';
    title: string;
    isOpen: boolean;
    isCollapsed: boolean;
    onClose: () => void;
    onToggleCollapse: () => void;
    onFocus: () => void;
    left: string | number;
    top: string | number;
    right?: string | number;
    bottom?: string | number;
    zIndex: number;
    width?: number;
    isDocked?: boolean;
    onWidthChange?: (width: number) => void;
    onPositionChange?: (left: number, top: number) => void;
    children: React.ReactNode;
    onPointerDownHeader?: (e: React.PointerEvent) => void;
    onPointerMoveHeader?: (e: React.PointerEvent) => void;
    onPointerUpHeader?: (e: React.PointerEvent) => void;
    menuButtonRef?: React.RefObject<HTMLButtonElement | null>;
    onMenuToggle?: (e: React.MouseEvent) => void;
    isMenuOpen?: boolean;
    theme?: 'dark' | 'light';
    onResizeDockedHeight?: (e: React.PointerEvent) => void;
    hideBottomResizeHandle?: boolean;
    onResetLayout?: () => void;
}

type ResizeDirection = 'e' | 'w' | 's' | 'se' | 'sw';

export const FloatingWindow: React.FC<FloatingWindowProps> = ({
    id,
    title,
    isOpen,
    isCollapsed,
    onClose,
    onToggleCollapse,
    onFocus,
    left,
    top,
    right,
    bottom,
    zIndex,
    width = 280,
    isDocked = false,
    onWidthChange,
    onPositionChange,
    children,
    onPointerDownHeader,
    onPointerMoveHeader,
    onPointerUpHeader,
    menuButtonRef,
    onMenuToggle,
    isMenuOpen,
    theme = 'dark',
    onResizeDockedHeight,
    hideBottomResizeHandle = false,
    onResetLayout,
}) => {
    const isLight = theme === 'light';
    const windowRef = useRef<HTMLDivElement>(null);
    const [customHeight, setCustomHeight] = useState<number | null>(null);
    const [customWidth, setCustomWidth] = useState<number>(width);

    const isResizingRef = useRef(false);
    const resizeDirRef = useRef<ResizeDirection | null>(null);
    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const startWidthRef = useRef(280);
    const startHeightRef = useRef(330);
    const startLeftRef = useRef(0);
    const startTopRef = useRef(0);

    // Keep customWidth synced with prop when not resizing
    useEffect(() => {
        if (!isResizingRef.current) {
            setCustomWidth(width);
        }
    }, [width]);

    if (!isOpen) return null;

    // Double click to reset size and expand panel to initial format
    const handleResetLayout = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCustomWidth(width);
        setCustomHeight(null);
        if (isCollapsed) {
            onToggleCollapse();
        }
        if (onResetLayout) {
            onResetLayout();
        }
    };

    const handleResizePointerDown = (e: React.PointerEvent, dir: ResizeDirection) => {
        e.stopPropagation();
        e.preventDefault();
        isResizingRef.current = true;
        resizeDirRef.current = dir;
        startXRef.current = e.clientX;
        startYRef.current = e.clientY;

        const currentW = windowRef.current?.getBoundingClientRect().width || customWidth || width || 280;
        const currentH = windowRef.current?.getBoundingClientRect().height || customHeight || 330;
        startWidthRef.current = currentW;
        startHeightRef.current = currentH;
        startLeftRef.current = typeof left === 'number' ? left : (parseFloat(String(left)) || 0);
        startTopRef.current = typeof top === 'number' ? top : (parseFloat(String(top)) || 0);

        document.body.style.userSelect = 'none';
        document.body.style.cursor = 
            dir === 'e' || dir === 'w' ? 'ew-resize' :
            dir === 's' ? 'ns-resize' :
            dir === 'se' ? 'nwse-resize' : 'nesw-resize';

        const onPointerMove = (moveEv: PointerEvent) => {
            if (!isResizingRef.current || !resizeDirRef.current) return;
            const currentDir = resizeDirRef.current;
            const dx = moveEv.clientX - startXRef.current;
            const dy = moveEv.clientY - startYRef.current;

            // Width resizing
            if (currentDir === 'e' || currentDir === 'se') {
                const newW = Math.max(160, Math.min(window.innerWidth - 20, startWidthRef.current + dx));
                setCustomWidth(newW);
                onWidthChange?.(newW);
            } else if (currentDir === 'w' || currentDir === 'sw') {
                const maxPossibleW = startLeftRef.current + startWidthRef.current - 10;
                const newW = Math.max(160, Math.min(maxPossibleW, startWidthRef.current - dx));
                const appliedDelta = startWidthRef.current - newW;
                const newLeft = Math.max(10, startLeftRef.current + appliedDelta);
                setCustomWidth(newW);
                onWidthChange?.(newW);
                onPositionChange?.(newLeft, startTopRef.current);
            }

            // Height resizing
            if (currentDir === 's' || currentDir === 'se' || currentDir === 'sw') {
                const newH = Math.max(100, Math.min(window.innerHeight - 60, startHeightRef.current + dy));
                setCustomHeight(newH);
            }
        };

        const onPointerUp = () => {
            isResizingRef.current = false;
            resizeDirRef.current = null;
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
    };

    const activeWidth = customWidth || width;

    if (isDocked) {
        return (
            <section
                ref={windowRef}
                onClick={onFocus}
                onPointerDown={onFocus}
                onDoubleClick={handleResetLayout}
                className={`relative w-full flex flex-col backdrop-blur-xl shadow-xl rounded-xl transition-all duration-200 ease-out overflow-hidden ${
                    isLight 
                        ? 'liquid-glass bg-[#f4f1ea]/95 border border-[#8b8370]/25 text-amber-950 shadow-[0_4px_16px_rgba(110,98,75,0.12)]' 
                        : 'bg-[#06060a]/82 backdrop-blur-2xl border border-white/12 text-white shadow-[0_16px_40px_rgba(0,0,0,0.85)]'
                } ${
                    isCollapsed 
                        ? 'h-[28px] shrink-0' 
                        : customHeight 
                            ? 'shrink-0' 
                            : 'h-full flex-1'
                } ${isMenuOpen ? (isLight ? 'border-amber-600/50 shadow-[0_0_16px_rgba(180,140,80,0.2)]' : 'border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.15)]') : ''}`}
                style={{
                    height: isCollapsed ? '28px' : customHeight ? `${customHeight}px` : undefined,
                    zIndex: zIndex,
                }}
            >
                {/* Header / Bar - Ultra-sleek & Compact */}
                <div
                    onDoubleClick={handleResetLayout}
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 border-b cursor-default select-none backdrop-blur-md shrink-0 relative z-10 transition-colors ${
                        isLight 
                            ? 'border-[#8b8370]/20 bg-[#8b8370]/[0.08] text-amber-950' 
                            : 'border-white/10 bg-white/[0.04] text-brand-text'
                    }`}
                    style={{ height: '28px' }}
                >
                    {/* Title */}
                    <span className={`truncate text-[10px] font-bold uppercase tracking-wider font-manrope flex-grow ${
                        isLight ? 'text-amber-950/90' : 'text-slate-200'
                    }`}>
                        {title}
                    </span>

                    {/* Real ⋮ Button */}
                    {onMenuToggle && (
                        <button
                            ref={menuButtonRef}
                            onClick={onMenuToggle}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                                isMenuOpen
                                    ? (isLight ? 'bg-[#8b8370]/25 text-amber-950 font-bold' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30')
                                    : (isLight ? 'text-[#8b8370] hover:text-amber-950 hover:bg-[#8b8370]/15' : 'text-slate-400 hover:text-white hover:bg-white/10')
                            }`}
                            title="Opções"
                        >
                            <UI_ICONS.MoreIcon className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {/* Collapse Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleCollapse();
                        }}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                            isLight ? 'text-[#8b8370] hover:text-amber-950 hover:bg-[#8b8370]/15' : 'text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                        title={isCollapsed ? 'Expandir' : 'Recolher'}
                    >
                        <UI_ICONS.ChevronDownIcon
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isCollapsed ? '' : 'rotate-180'
                            }`}
                        />
                    </button>

                    {/* Close Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                            isLight ? 'text-[#8b8370] hover:text-red-700 hover:bg-red-500/15' : 'text-slate-400 hover:text-red-300 hover:bg-red-500/20'
                        }`}
                        title="Fechar"
                    >
                        <UI_ICONS.CloseIcon className="w-3 h-3" />
                    </button>
                </div>

                {/* Body */}
                <div
                    className={`flex-1 overflow-y-auto custom-scrollbar w-full min-w-0 ${
                        isCollapsed ? 'hidden' : 'block'
                    }`}
                >
                    {children}
                </div>

                {/* Vertical Height Resize Handle - Minimal Hairline */}
                {!isCollapsed && !hideBottomResizeHandle && (
                    <div
                        onPointerDown={(e) => onResizeDockedHeight ? onResizeDockedHeight(e) : handleResizePointerDown(e, 's')}
                        className="h-1.5 w-full cursor-ns-resize hover:bg-cyan-400/25 active:bg-cyan-400/40 transition-colors flex items-center justify-center shrink-0 border-t border-white/5 group relative select-none z-30"
                        title="Arraste verticalmente para ajustar a altura"
                    >
                        <div className="w-6 h-[2px] rounded-full bg-white/20 group-hover:bg-cyan-300 group-active:bg-cyan-400 transition-colors" />
                    </div>
                )}
            </section>
        );
    }

    return (
        <section
            ref={windowRef}
            onClick={onFocus}
            onPointerDown={onFocus}
            onDoubleClick={handleResetLayout}
            className={`absolute flex flex-col backdrop-blur-xl shadow-2xl rounded-2xl transition-[left,top,border-color,box-shadow,background-color] duration-300 ease-out overflow-hidden ${
                isLight 
                    ? 'liquid-glass bg-[#f4f1ea]/95 border border-[#8b8370]/25 text-amber-950 shadow-[0_12px_36px_rgba(110,98,75,0.18)]' 
                    : 'bg-[#06060a]/82 backdrop-blur-2xl border border-white/12 text-white shadow-[0_16px_40px_rgba(0,0,0,0.85)]'
            } ${
                isCollapsed 
                    ? 'h-[28px]' 
                    : customHeight 
                        ? '' 
                        : id === 'aspects'
                            ? 'max-h-[360px] h-auto'
                            : id === 'cusps'
                                ? 'max-h-[190px] h-auto'
                                : id === 'statistics'
                                    ? 'max-h-[580px] h-auto'
                                    : 'max-h-[390px] h-auto'
            } ${isMenuOpen ? (isLight ? 'border-amber-600/50 shadow-[0_0_20px_rgba(180,140,80,0.25)]' : 'border-cyan-400/40 shadow-[0_0_25px_rgba(34,211,238,0.2)]') : ''}`}
            style={{
                left: left,
                top: top,
                right: right,
                bottom: bottom,
                width: `${activeWidth}px`,
                height: isCollapsed ? '28px' : customHeight ? `${customHeight}px` : undefined,
                zIndex: zIndex,
            }}
        >
            {/* Header / Bar - Floating Window */}
            <div
                onDoubleClick={handleResetLayout}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 border-b cursor-default select-none backdrop-blur-md flex-shrink-0 relative z-10 ${
                    isLight 
                        ? 'border-[#8b8370]/20 bg-[#8b8370]/[0.08] text-amber-950' 
                        : 'border-white/10 bg-white/[0.04] text-brand-text'
                }`}
                style={{ height: '28px' }}
            >
                {/* Title */}
                <span className={`truncate text-[10px] font-bold uppercase tracking-wider font-manrope flex-grow ${
                    isLight ? 'text-amber-950/90' : 'text-slate-200'
                }`}>
                    {title}
                </span>

                {/* Real ⋮ Button */}
                {onMenuToggle && (
                    <button
                        ref={menuButtonRef}
                        onClick={onMenuToggle}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                            isMenuOpen
                                ? (isLight ? 'bg-[#8b8370]/25 text-amber-950 font-bold' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30')
                                : (isLight ? 'text-[#8b8370] hover:text-amber-950 hover:bg-[#8b8370]/15' : 'text-slate-400 hover:text-white hover:bg-white/10')
                        }`}
                        title="Opções"
                    >
                        <UI_ICONS.MoreIcon className="w-3.5 h-3.5" />
                    </button>
                )}

                {/* Collapse Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleCollapse();
                    }}
                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                        isLight ? 'text-[#8b8370] hover:text-amber-950 hover:bg-[#8b8370]/15' : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={isCollapsed ? 'Expandir' : 'Recolher'}
                >
                    <UI_ICONS.ChevronDownIcon
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isCollapsed ? '' : 'rotate-180'
                        }`}
                    />
                </button>

                {/* Close Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                        isLight ? 'text-[#8b8370] hover:text-red-700 hover:bg-red-500/15' : 'text-slate-400 hover:text-red-300 hover:bg-red-500/20'
                    }`}
                    title="Fechar"
                >
                    <UI_ICONS.CloseIcon className="w-3 h-3" />
                </button>
            </div>

            {/* Body */}
            <div
                className={`flex-1 overflow-y-auto custom-scrollbar w-full min-w-0 ${
                    isCollapsed ? 'hidden' : 'block'
                }`}
            >
                {children}
            </div>

            {/* Resize Handles (Only when expanded) */}
            {!isCollapsed && (
                <>
                    {/* Right Edge (East) Handle for Width */}
                    <div
                        onPointerDown={(e) => handleResizePointerDown(e, 'e')}
                        className="absolute right-0 top-10 bottom-3 w-3 cursor-ew-resize hover:bg-cyan-400/20 active:bg-cyan-400/35 transition-colors z-30 group select-none flex items-center justify-end"
                        title="Arraste lateralmente para ajustar a largura"
                    >
                        <div className="w-1 h-8 rounded-full bg-white/20 group-hover:bg-cyan-300 group-active:bg-cyan-400 transition-colors mr-0.5" />
                    </div>

                    {/* Left Edge (West) Handle for Width */}
                    <div
                        onPointerDown={(e) => handleResizePointerDown(e, 'w')}
                        className="absolute left-0 top-10 bottom-3 w-3 cursor-ew-resize hover:bg-cyan-400/20 active:bg-cyan-400/35 transition-colors z-30 group select-none flex items-center justify-start"
                        title="Arraste lateralmente para ajustar a largura"
                    >
                        <div className="w-1 h-8 rounded-full bg-white/20 group-hover:bg-cyan-300 group-active:bg-cyan-400 transition-colors ml-0.5" />
                    </div>

                    {/* Bottom Edge (South) Handle for Height */}
                    <div
                        onPointerDown={(e) => handleResizePointerDown(e, 's')}
                        className="h-3 w-full cursor-ns-resize hover:bg-cyan-400/20 active:bg-cyan-400/35 transition-colors flex items-center justify-center shrink-0 border-t border-white/5 group relative select-none z-30"
                        title="Arraste verticalmente para ajustar a altura"
                    >
                        <div className="w-8 h-1 rounded-full bg-white/20 group-hover:bg-cyan-300 group-active:bg-cyan-400 transition-colors" />
                    </div>

                    {/* Bottom-Right Corner (SouthEast) Handle for Both */}
                    <div
                        onPointerDown={(e) => handleResizePointerDown(e, 'se')}
                        className="absolute right-0 bottom-0 w-5 h-5 cursor-nwse-resize hover:bg-cyan-400/30 active:bg-cyan-400/50 transition-colors z-40 group rounded-br-2xl flex items-center justify-center select-none"
                        title="Arraste para redimensionar largura e altura"
                    >
                        <svg className="w-3 h-3 text-white/30 group-hover:text-cyan-200 transition-colors" viewBox="0 0 6 6" fill="currentColor">
                            <circle cx="5" cy="5" r="0.8" />
                            <circle cx="5" cy="2" r="0.8" />
                            <circle cx="2" cy="5" r="0.8" />
                        </svg>
                    </div>

                    {/* Bottom-Left Corner (SouthWest) Handle for Both */}
                    <div
                        onPointerDown={(e) => handleResizePointerDown(e, 'sw')}
                        className="absolute left-0 bottom-0 w-5 h-5 cursor-nesw-resize hover:bg-cyan-400/30 active:bg-cyan-400/50 transition-colors z-40 group rounded-bl-2xl flex items-center justify-center select-none"
                        title="Arraste para redimensionar largura e altura"
                    >
                        <svg className="w-3 h-3 text-white/30 group-hover:text-cyan-200 transition-colors" viewBox="0 0 6 6" fill="currentColor">
                            <circle cx="1" cy="5" r="0.8" />
                            <circle cx="1" cy="2" r="0.8" />
                            <circle cx="4" cy="5" r="0.8" />
                        </svg>
                    </div>
                </>
            )}
        </section>
    );
};
