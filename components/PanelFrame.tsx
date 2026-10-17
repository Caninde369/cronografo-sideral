import React, { useRef, useState, useEffect } from 'react';
import { UI_ICONS } from './icons';

interface PanelFrameProps {
    title: string;
    isOpen: boolean;
    isCollapsed: boolean;
    onClose: () => void;
    onToggleCollapse: () => void;
    onFocus: () => void;
    zIndex: number;
    width?: number;
    scale?: number;
    children: React.ReactNode;
    menuButtonRef?: React.RefObject<HTMLButtonElement | null>;
    onMenuToggle?: (e: React.MouseEvent) => void;
    isMenuOpen?: boolean;
    isLocked?: boolean;
    onLockedClick?: () => void;
    theme?: 'dark' | 'light';
    onResizeDockedHeight?: (e: React.PointerEvent) => void;
    hideBottomResizeHandle?: boolean;
    onResetLayout?: () => void;
}

export const PanelFrame: React.FC<PanelFrameProps> = ({
    title,
    isOpen,
    isCollapsed,
    onClose,
    onToggleCollapse,
    onFocus,
    zIndex,
    width = 280,
    scale = 1,
    children,
    menuButtonRef,
    onMenuToggle,
    isMenuOpen,
    isLocked = false,
    onLockedClick,
    theme = 'dark',
    onResizeDockedHeight,
    hideBottomResizeHandle = false,
    onResetLayout,
}) => {
    const isLight = theme === 'light';
    const windowRef = useRef<HTMLDivElement>(null);
    // A largura vem da doca (prop `width`); só a altura é ajustável pelo usuário.
    const [customHeight, setCustomHeight] = useState<number | null>(null);

    const isResizingRef = useRef(false);
    const startYRef = useRef(0);
    const startHeightRef = useRef(330);

    // Altura volta ao automático quando a doca muda de largura.
    useEffect(() => {
        setCustomHeight(null);
    }, [width]);

    if (!isOpen) return null;

    // Double click to reset size and expand panel to initial format
    const handleResetLayout = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCustomHeight(null);
        if (isCollapsed) {
            onToggleCollapse();
        }
        if (onResetLayout) {
            onResetLayout();
        }
    };

    // Só o redimensionamento vertical é alcançável: o painel ancorado
    // tem a largura definida pela doca, não pelo arraste.
    const handleResizeHeightPointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        isResizingRef.current = true;
        startYRef.current = e.clientY;
        startHeightRef.current = windowRef.current?.getBoundingClientRect().height || customHeight || 330;

        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ns-resize';

        const onPointerMove = (moveEv: PointerEvent) => {
            if (!isResizingRef.current) return;
            const dy = moveEv.clientY - startYRef.current;
            const newH = Math.max(100, Math.min(window.innerHeight - 60, startHeightRef.current + dy));
            setCustomHeight(newH);
        };

        const onPointerUp = () => {
            isResizingRef.current = false;
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

    const headerHeight = Math.round(30 * scale);
    const titleFontSize = Math.round(15 * scale);
    const btnSize = Math.max(20, Math.round(20 * scale));
    const iconSize = Math.max(13, Math.round(14 * scale));

    return (
        <section
            ref={windowRef}
            onClick={onFocus}
            onPointerDown={onFocus}
            onDoubleClick={handleResetLayout}
            className={`relative w-full flex flex-col backdrop-blur-xl rounded-[14px] transition-all duration-200 ease-out overflow-hidden ${
                isLight 
                    ? 'liquid-glass bg-[#f4f1ea]/95 border border-[#8b8370]/25 text-amber-950 shadow-[0_4px_16px_rgba(110,98,75,0.12)]' 
                    : 'bg-[#06060a]/85 backdrop-blur-2xl border border-white/15 text-white shadow-[0_12px_36px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)]'
            } ${
                isCollapsed 
                    ? 'shrink-0' 
                    : customHeight 
                        ? 'shrink-0' 
                        : 'h-full flex-1'
            } ${isMenuOpen ? (isLight ? 'border-amber-600/50 shadow-[0_0_16px_rgba(180,140,80,0.2)]' : 'border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.15)]') : ''}`}
            style={{
                height: isCollapsed ? `${headerHeight}px` : customHeight ? `${customHeight}px` : undefined,
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
                style={{ height: `${headerHeight}px` }}
            >
                {/* Título — DS v2: Playfair Display 600 em creme.
                    Peso 600 e não 500: as hastes finas da Playfair somem sobre #080612.
                    Nunca dourado — o ouro desce um nível e marca os rótulos de seção. */}
                <span
                    className="truncate flex-grow"
                    style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontWeight: 600,
                        fontSize: `${titleFontSize}px`,
                        lineHeight: 1,
                        letterSpacing: '.005em',
                        color: isLight ? '#3B2F14' : '#F5F2EB',
                    }}
                >
                    {title}
                </span>

                {/* Real ⋮ Button */}
                {onMenuToggle && (
                    <button
                        ref={menuButtonRef}
                        onClick={(e) => {
                            if (isLocked) {
                                e.stopPropagation();
                                if (onLockedClick) {
                                    onLockedClick();
                                    return;
                                }
                            }
                            onMenuToggle(e);
                        }}
                        style={{ width: `${btnSize}px`, height: `${btnSize}px` }}
                        className={`rounded flex items-center justify-center transition-colors cursor-pointer relative ${
                            isMenuOpen
                                ? (isLight ? 'bg-[#8b8370]/25 text-amber-950 font-bold' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30')
                                : isLocked
                                    ? (isLight ? 'text-amber-800 hover:bg-amber-100/50' : 'text-amber-400 hover:bg-amber-400/15')
                                    : (isLight ? 'text-[#8b8370] hover:text-amber-950 hover:bg-[#8b8370]/15' : 'text-slate-400 hover:text-white hover:bg-white/10')
                        }`}
                        title={isLocked ? "Edições do painel bloqueadas no Plano Gratuito (Clique para desbloquear)" : "Opções"}
                    >
                        {isLocked ? (
                            <i className="ti ti-lock text-xs text-[#D4AF37]" />
                        ) : (
                            <UI_ICONS.MoreIcon style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />
                        )}
                    </button>
                )}

                {/* Collapse Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleCollapse();
                    }}
                    style={{ width: `${btnSize}px`, height: `${btnSize}px` }}
                    className={`rounded flex items-center justify-center transition-colors cursor-pointer ${
                        isLight ? 'text-[#8b8370] hover:text-amber-950 hover:bg-[#8b8370]/15' : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={isCollapsed ? 'Expandir' : 'Recolher'}
                >
                    <UI_ICONS.ChevronDownIcon
                        style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                        className={`transition-transform duration-200 ${
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
                    style={{ width: `${btnSize}px`, height: `${btnSize}px` }}
                    className={`rounded flex items-center justify-center transition-colors cursor-pointer ${
                        isLight ? 'text-[#8b8370] hover:text-red-700 hover:bg-red-500/15' : 'text-slate-400 hover:text-red-300 hover:bg-red-500/20'
                    }`}
                    title="Fechar"
                >
                    <UI_ICONS.CloseIcon style={{ width: `${iconSize - 2}px`, height: `${iconSize - 2}px` }} />
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
                    onPointerDown={(e) => onResizeDockedHeight ? onResizeDockedHeight(e) : handleResizeHeightPointerDown(e)}
                    className="h-1.5 w-full cursor-ns-resize hover:bg-cyan-400/25 active:bg-cyan-400/40 transition-colors flex items-center justify-center shrink-0 border-t border-white/5 group relative select-none z-30"
                    title="Arraste verticalmente para ajustar a altura"
                >
                    <div className="w-6 h-[2px] rounded-full bg-white/20 group-hover:bg-cyan-300 group-active:bg-cyan-400 transition-colors" />
                </div>
            )}
        </section>
    );
};
