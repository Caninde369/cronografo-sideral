import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SearchMoonPhase } from 'astronomy-engine';
import { getMoonAge } from '../lib/astrology/calendars';
import { getMoonPhaseInfo } from '../lib/astrology/moon';
import { getYearCycles } from '../lib/astrology/lunarCycles';
import { CalendarPanel, MoonPhaseDisk } from './CalendarPanel';
import { checkIsEclipse } from './SiderealClock';
import { getUpcomingEclipse } from '../lib/astrology/eclipses';

export interface MoonInfoPanelProps {
    moonPhase: number;
    moonIllumination: number;
    moonEclipticLongitude: number;
    moonriseTime: string;
    moonsetTime: string;
    currentDate: Date;
    latitude?: number;
    className?: string;
    scale?: number;
    onClick?: () => void;
    onDateSelect?: (date: Date) => void;
    theme?: 'dark' | 'light';
    isOpen?: boolean;
    onTogglePopover?: () => void;
    onClosePopover?: () => void;
    /** Abre a janela de eclipse (card "Eclipse detectado" / "Eclipse em N dias") */
    onEclipseClick?: () => void;
}

const PHASE_ABBR: Record<string, string> = {
    'Lua Nova':              'Nova',
    'Crescente':             'Cresc.',
    'Quarto Crescente':      'Q. Cresc.',
    'Gibosa Crescente':      'Gib. Cresc.',
    'Lua Cheia':             'Cheia',
    'Gibosa Minguante':      'Gib. Ming.',
    'Quarto Minguante':      'Q. Ming.',
    'Minguante Corcovada':   'Ming. Corco.',
};

export const MoonInfoPanel: React.FC<MoonInfoPanelProps> = ({ 
    moonPhase, 
    moonIllumination, 
    moonEclipticLongitude, 
    moonriseTime, 
    moonsetTime, 
    currentDate, 
    latitude = 0,
    className, 
    scale = 1,
    onClick,
    onDateSelect,
    theme = 'dark',
    isOpen,
    onTogglePopover,
    onClosePopover,
    onEclipseClick
}) => {
    const isLight = theme === 'light';
    const [localShowPopover, setLocalShowPopover] = useState(false);
    const showPopover = isOpen !== undefined ? isOpen : localShowPopover;

    const containerRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const [popoverPos, setPopoverPos] = useState<{ 
        top?: number; 
        bottom?: number; 
        right?: number;
        maxHeight: number;
        width: number;
    }>({ 
        right: 12, 
        maxHeight: 520, 
        width: 650 
    });
    
    const [isMinimized, setIsMinimized] = useState(() => {
        try {
            return localStorage.getItem('moon_card_minimized') === 'true';
        } catch {
            return false;
        }
    });

    const eclipse = useMemo(() => checkIsEclipse(currentDate), [currentDate]);
    // Próximo eclipse em até 15 dias (aviso antecipado quando não é o dia do eclipse)
    const upcomingEclipse = useMemo(() => {
        if (eclipse) return null;
        try {
            const up = getUpcomingEclipse(currentDate);
            return up && up.daysUntil >= 1 && up.daysUntil <= 15 ? up : null;
        } catch {
            return null;
        }
    }, [currentDate, eclipse]);

    const moonAgeRaw = useMemo(() => getMoonAge(moonPhase), [moonPhase]);
    const moonAge = useMemo(() => Math.max(1, Math.min(29, Math.round(moonAgeRaw))), [moonAgeRaw]);
    const moonPhaseInfo = useMemo(() => getMoonPhaseInfo(moonPhase), [moonPhase]);
    const phaseAbbr = PHASE_ABBR[moonPhaseInfo.name] ?? moonPhaseInfo.name;

    const cycleData = useMemo(() => {
        const cycles = getYearCycles(currentDate.getFullYear(), latitude);
        const today = currentDate.getTime();
        let current = cycles[0];
        for (const c of cycles) {
            if (c.start.getTime() <= today) current = c;
            else break;
        }
        return current;
    }, [currentDate, latitude]);

    const cycleName  = cycleData?.name  ?? '—';
    const cycleEmoji = cycleData?.emoji ?? '🌑';
    const cycleIndex = cycleData?.index ?? 1;

    // Countdown até a próxima Lua Nova
    const nextNewMoonInfo = useMemo(() => {
        try {
            const nextPhase = SearchMoonPhase(0, currentDate, 35);
            if (nextPhase && nextPhase.date) {
                const diffMs = nextPhase.date.getTime() - currentDate.getTime();
                if (diffMs > 0) {
                    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const days = Math.floor(totalHours / 24);
                    const hours = totalHours % 24;
                    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    
                    const remainingDays = diffMs / (1000 * 60 * 60 * 24);
                    // Progresso do ciclo completo (0% = início do ciclo, 100% = exatamente na Lua Nova)
                    const cycleProgress = Math.max(0, Math.min(100, Math.round(((29.530588 - remainingDays) / 29.530588) * 100)));

                    const formattedCount = days > 0 
                        ? `${days}d ${hours}h` 
                        : hours > 0 
                            ? `${hours}h ${minutes}m` 
                            : `${minutes}m`;

                    return {
                        date: nextPhase.date,
                        days,
                        hours,
                        minutes,
                        diffMs,
                        formattedCount,
                        cycleProgress
                    };
                }
            }
        } catch (e) {
            console.error('Erro ao calcular próxima Lua Nova:', e);
        }
        return null;
    }, [currentDate]);

    const illumPercent = Math.round(moonIllumination * 100);

    const updatePopoverPos = () => {
        const targetElement = cardRef.current || containerRef.current;
        const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

        let targetRect = { top: 75, bottom: 180, left: screenWidth - 230, right: screenWidth - 18 };
        if (targetElement) {
            targetRect = targetElement.getBoundingClientRect();
        }

        const popoverWidth = Math.min(650, screenWidth - 24);
        
        // Espaço abaixo e acima do card da lua
        // Margem de 16px para evitar encostar no limite da tela ou na barra inferior
        const margin = 16;
        const spaceBelow = screenHeight - targetRect.bottom - margin;
        const spaceAbove = targetRect.top - margin;

        let isBottom = false; // true = abre para cima
        // Se o espaço abaixo for muito apertado (< 340px) e tiver mais espaço acima, abre para cima
        if (spaceBelow < 340 && spaceAbove > spaceBelow) {
            isBottom = true;
        }

        let top: number | undefined = undefined;
        let bottom: number | undefined = undefined;
        let maxHeight = 520;

        if (isBottom) {
            bottom = Math.max(12, screenHeight - targetRect.top + 8);
            maxHeight = Math.max(220, Math.min(520, spaceAbove - 8));
        } else {
            top = Math.max(12, targetRect.bottom + 8);
            maxHeight = Math.max(220, Math.min(520, spaceBelow - 8));
        }

        // Alinhamento horizontal garantindo que não saia nem pela direita nem pela esquerda
        let right = screenWidth - targetRect.right;
        if (screenWidth - right < popoverWidth + 12) {
            right = 12;
        } else if (right < 12) {
            right = 12;
        }

        setPopoverPos({ top, bottom, right, maxHeight, width: popoverWidth });
    };

    const handleTogglePopover = () => {
        if (onClick) {
            onClick();
            return;
        }
        updatePopoverPos();
        if (onTogglePopover) {
            onTogglePopover();
        } else {
            setLocalShowPopover(prev => !prev);
        }
    };

    const handleClosePopover = () => {
        if (onClosePopover) {
            onClosePopover();
        } else {
            setLocalShowPopover(false);
        }
    };

    const handleToggleMinimize = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextVal = !isMinimized;
        setIsMinimized(nextVal);
        try {
            localStorage.setItem('moon_card_minimized', String(nextVal));
        } catch (err) {}
    };

    useEffect(() => {
        if (showPopover) {
            updatePopoverPos();
        }
    }, [showPopover, currentDate]);

    // Fechar ao redimensionar tela
    useEffect(() => {
        const handleResize = () => {
            if (showPopover) {
                updatePopoverPos();
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [showPopover]);

    return (
        <div ref={containerRef} className="relative w-full shrink-0 font-sans">
            {isMinimized ? (
                <div
                    ref={cardRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePopover();
                    }}
                    className={`flex items-center gap-2 px-2.5 rounded-[12px] backdrop-blur-xl transition-all cursor-pointer shrink-0 select-none group ${
                        isLight 
                            ? 'liquid-glass bg-[#f4f1ea]/95 border border-[#8b8370]/25 text-amber-950 hover:bg-[#eae5d8] hover:border-amber-700/40 shadow-[0_4px_16px_rgba(110,98,75,0.18)]' 
                            : 'bg-[#06060a]/95 border border-white/20 text-white/80 hover:bg-[#12101e] hover:text-white hover:border-cyan-400/50 shadow-[0_4px_16px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                    } ${className || ''}`}
                    style={{ height: `${Math.max(26, Math.round(32 * scale))}px` }}
                    title="Clique para abrir o Calendário Lunar"
                >
                    {/* Ícone do Ciclo Lunar */}
                    <span className="shrink-0 leading-none" style={{ fontSize: `${Math.max(12, Math.round(14 * scale))}px` }} title={`Ciclo: ${cycleName}`}>
                        {cycleEmoji}
                    </span>

                    {/* Ícone da Fase da Lua */}
                    <div className="shrink-0 flex items-center" title={`Fase: ${phaseAbbr}`}>
                        <MoonPhaseDisk phase={moonPhase} size={Math.max(14, Math.round(16 * scale))} />
                    </div>

                    {/* Nome da Lua / Fase */}
                    <span 
                        className={`font-bold tracking-tight truncate max-w-[90px] leading-tight ${
                            isLight ? 'text-neutral-800' : 'text-white/95'
                        }`} 
                        style={{ fontSize: `${Math.max(9, Math.round(11 * scale))}px` }}
                        title={phaseAbbr}
                    >
                        {phaseAbbr}
                    </span>

                    {/* Porcentagem de Iluminação */}
                    <span 
                        style={{ 
                            fontFamily: "'DM Mono', ui-monospace, monospace",
                            fontSize: `${Math.max(8.5, Math.round(10 * scale))}px`
                        }}
                        className={`px-1.5 py-0.5 rounded-[5px] font-bold shrink-0 border tabular-nums ${
                            isLight 
                                ? 'bg-cyan-50 border-cyan-400/50 text-cyan-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]' 
                                : 'bg-slate-900 border-cyan-400/40 text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]'
                        }`} 
                        title="Iluminação"
                    >
                        {illumPercent}%
                    </span>

                    {/* Botão de Restaurar / Expandir Card */}
                    <button
                        type="button"
                        data-no-drag="true"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleMinimize(e);
                        }}
                        className={`rounded flex items-center justify-center transition-colors cursor-pointer ml-0.5 shrink-0 ${
                            isLight ? 'text-black/40 hover:text-black/80 hover:bg-black/10' : 'text-white/40 hover:text-white hover:bg-white/15'
                        }`}
                        style={{ width: `${Math.max(14, Math.round(16 * scale))}px`, height: `${Math.max(14, Math.round(16 * scale))}px` }}
                        title="Expandir Card da Lua"
                    >
                        <span className="font-bold leading-none" style={{ fontSize: `${Math.max(8, Math.round(9 * scale))}px` }}>＋</span>
                    </button>
                </div>
            ) : (
                <div 
                    ref={cardRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePopover();
                    }}
                    title="Clique para abrir o Calendário Lunar"
                    className={`flex flex-col gap-1.5 backdrop-blur-xl rounded-[14px] transition-all select-none w-full shrink-0 relative cursor-pointer group ${
                        isLight 
                            ? 'liquid-glass bg-[#f4f1ea]/95 border border-[#8b8370]/25 text-amber-950 shadow-[0_12px_32px_rgba(110,98,75,0.18)] hover:border-amber-700/40 hover:bg-[#eae5d8]' 
                            : 'bg-[#06060a]/95 border border-white/20 shadow-[0_12px_32px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.25)] hover:border-amber-400/40 hover:bg-[#12101e]'
                    } ${className || ''}`}
                    style={{ padding: `${Math.max(6, Math.round(8 * scale))}px` }}
                >
                    {/* Header com botão de minimizar */}
                    <div className="flex items-center justify-between px-1 -mt-0.5 mb-0.5">
                        {/* DS v2 · Playfair Display title */}
                        <span
                            className="flex items-center gap-1.5"
                            style={{
                                fontFamily: "'Playfair Display', Georgia, serif",
                                fontWeight: 600,
                                fontSize: `${Math.max(12, Math.round(15 * scale))}px`,
                                lineHeight: 1,
                                letterSpacing: '.005em',
                                color: isLight ? '#3B2F14' : '#F5F2EB',
                            }}
                        >
                            <span>🌙</span>
                            <span>Calendário Lunar</span>
                        </span>
                        <button
                            type="button"
                            data-no-drag="true"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggleMinimize(e);
                            }}
                            className={`rounded flex items-center justify-center transition-colors cursor-pointer ${
                                isLight ? 'text-black/50 hover:text-black hover:bg-black/10' : 'text-white/50 hover:text-white hover:bg-white/15'
                            }`}
                            style={{ width: `${Math.max(16, Math.round(20 * scale))}px`, height: `${Math.max(16, Math.round(20 * scale))}px` }}
                            title="Minimizar Card da Lua"
                        >
                            <svg width={Math.max(10, Math.round(12 * scale))} height={Math.max(10, Math.round(12 * scale))} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        {eclipse && (
                            <div
                                role={onEclipseClick ? 'button' : undefined}
                                tabIndex={onEclipseClick ? 0 : undefined}
                                data-no-drag="true"
                                onClick={onEclipseClick ? (e) => { e.stopPropagation(); onEclipseClick(); } : undefined}
                                onKeyDown={onEclipseClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onEclipseClick(); } } : undefined}
                                title={onEclipseClick ? 'Ver detalhes do eclipse' : undefined}
                                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 w-full shrink-0 border rounded-[10px] animate-pulse ${onEclipseClick ? 'cursor-pointer hover:brightness-125' : ''} ${
                                    eclipse.type === 'solar'
                                        ? 'bg-gradient-to-r from-orange-950/90 to-red-950/90 border-orange-500/70 text-orange-200 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                                        : 'bg-gradient-to-r from-red-950/90 to-purple-950/90 border-red-500/70 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                                }`}
                            >
                                <div className="flex items-center gap-1">
                                    <span style={{ fontSize: `${Math.max(9, Math.round(11 * scale))}px` }}>🚨</span>
                                    <span className="font-extrabold uppercase tracking-wider" style={{ fontSize: `${Math.max(7.5, Math.round(9 * scale))}px` }}>Eclipse Detectado</span>
                                </div>
                                <span className="font-extrabold text-white text-center leading-tight" style={{ fontSize: `${Math.max(8.5, Math.round(10 * scale))}px` }}>
                                    {eclipse.name}
                                </span>
                                {onEclipseClick && (
                                    <span className="flex items-center gap-1 opacity-90" style={{ fontSize: `${Math.max(7.5, Math.round(9 * scale))}px` }}>
                                        Ver detalhes <i className="ti ti-arrow-right" aria-hidden="true" />
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Aviso antecipado: eclipse nos próximos 15 dias */}
                        {!eclipse && upcomingEclipse && (
                            <div
                                role={onEclipseClick ? 'button' : undefined}
                                tabIndex={onEclipseClick ? 0 : undefined}
                                data-no-drag="true"
                                onClick={onEclipseClick ? (e) => { e.stopPropagation(); onEclipseClick(); } : undefined}
                                onKeyDown={onEclipseClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onEclipseClick(); } } : undefined}
                                title={onEclipseClick ? 'Ver detalhes do eclipse' : undefined}
                                className={`flex items-center justify-between gap-1.5 px-2 py-1.5 w-full shrink-0 border rounded-[10px] transition-colors ${onEclipseClick ? 'cursor-pointer' : ''} ${
                                    isLight
                                        ? 'bg-amber-50/80 border-amber-600/30 text-amber-900 hover:border-amber-600/60'
                                        : (upcomingEclipse.event.type === 'solar'
                                            ? 'bg-orange-950/40 border-orange-500/35 text-orange-200 hover:border-orange-400/70'
                                            : 'bg-red-950/40 border-red-500/35 text-red-200 hover:border-red-400/70')
                                }`}
                            >
                                <span className="font-bold leading-tight truncate" style={{ fontSize: `${Math.max(8.5, Math.round(10 * scale))}px` }}>
                                    {upcomingEclipse.event.name}
                                </span>
                                <span className="font-semibold whitespace-nowrap opacity-90" style={{ fontSize: `${Math.max(8, Math.round(9.5 * scale))}px` }}>
                                    {upcomingEclipse.daysUntil === 1 ? 'amanhã' : `em ${upcomingEclipse.daysUntil} dias`}
                                </span>
                            </div>
                        )}

                        {/* 1. Card Ciclo Lunar com Barra de Progresso */}
                        <div 
                            className={`flex flex-col gap-1 px-2 py-1.5 w-full shrink-0 overflow-hidden rounded-[10px] border transition-all shadow-sm ${
                                isLight 
                                    ? 'bg-gradient-to-b from-black/[0.03] to-black/[0.01] border-black/10 hover:border-black/20' 
                                    : 'bg-gradient-to-b from-white/[0.06] to-white/[0.02] border-white/12 hover:border-white/25'
                            }`}
                        >
                            <div className="flex items-center gap-1.5 w-full">
                                <span style={{ fontSize: `${Math.max(13, Math.round(16 * scale))}px`, flexShrink: 0 }}>{cycleEmoji}</span>
                                <div className="overflow-hidden min-w-0 flex-1">
                                    <div 
                                        className={`font-bold truncate leading-tight ${isLight ? 'text-neutral-800' : 'text-white/95'}`}
                                        style={{ fontSize: `${Math.max(9, Math.round(11 * scale))}px` }}
                                    >
                                        {cycleName}
                                    </div>
                                    <div 
                                        className={`font-medium font-mono tabular-nums truncate leading-tight mt-0.5 ${isLight ? 'text-neutral-500' : 'text-slate-400'}`}
                                        style={{ fontSize: `${Math.max(8, Math.round(10 * scale))}px` }}
                                    >
                                        Ciclo {cycleIndex}, Dia {moonAge}/{cycleData?.totalDays || 29}
                                    </div>
                                </div>
                            </div>

                            {/* Barra 3D de Progresso do Ciclo Lunar */}
                            <div 
                                className={`relative w-full rounded-full overflow-hidden mt-0.5 border ${
                                    isLight 
                                        ? 'bg-neutral-100 border-amber-500/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]' 
                                        : 'bg-slate-950/90 border-amber-500/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]'
                                }`} 
                                style={{ height: `${Math.max(5, Math.round(6 * scale))}px` }}
                                title="Progresso do Ciclo Lunar"
                            >
                                <div 
                                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-all duration-500"
                                    style={{ width: `${Math.max(1, Math.min(100, Math.round(1 + ((moonAge - 1) / ((cycleData?.totalDays || 29) - 1)) * 99)))}%` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none" />
                            </div>
                        </div>

                        {/* 2. Card Fase Lunar */}
                        <div 
                            className={`flex items-center justify-between gap-1.5 px-2 py-1.5 w-full shrink-0 rounded-[10px] border transition-all shadow-sm ${
                                isLight 
                                    ? 'bg-gradient-to-b from-black/[0.03] to-black/[0.01] border-black/10 hover:border-cyan-500/30' 
                                    : 'bg-gradient-to-b from-white/[0.06] to-white/[0.02] border-white/12 hover:border-cyan-400/30'
                            }`}
                        >
                            <div className="flex items-center gap-1.5 min-w-0">
                                <MoonPhaseDisk phase={moonPhase} size={Math.max(16, Math.round(20 * scale))} />
                                <span 
                                    className={`font-bold truncate leading-tight ${isLight ? 'text-neutral-800' : 'text-white/95'}`}
                                    style={{ fontSize: `${Math.max(9, Math.round(11 * scale))}px` }}
                                >
                                    {phaseAbbr}
                                </span>
                            </div>
                            <div 
                                className={`px-1.5 py-0.5 rounded-md font-mono font-extrabold shrink-0 border ${
                                    isLight 
                                        ? 'bg-cyan-50 border-cyan-400/50 text-cyan-700 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)]' 
                                        : 'bg-slate-950 border-cyan-400/50 text-cyan-300 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)]'
                                }`} 
                                style={{ fontSize: `${Math.max(8, Math.round(10 * scale))}px` }}
                                title="Iluminação"
                            >
                                {illumPercent}%
                            </div>
                        </div>

                        {/* 3. Nascer e Pôr da Lua */}
                        <div 
                            className={`flex items-center justify-between px-2 py-1.5 w-full shrink-0 rounded-[10px] border font-sans shadow-inner ${
                                isLight 
                                    ? 'bg-black/[0.04] border-black/5 text-neutral-800' 
                                    : 'bg-black/60 border-white/15 text-white'
                            }`}
                            style={{ fontSize: `${Math.max(8.5, Math.round(10.5 * scale))}px` }}
                        >
                            <div className="flex items-center gap-0.5" title="Horário do Nascer da Lua">
                                <span className={isLight ? 'text-amber-600 font-bold' : 'text-amber-400 font-bold'} style={{ fontSize: `${Math.max(10, Math.round(12 * scale))}px` }}>↑</span>
                                <span className={`${isLight ? 'text-neutral-600' : 'text-amber-300/90'} font-medium mr-0.5`}>Nascer:</span>
                                <span className={`font-bold font-mono ${isLight ? 'text-neutral-900' : 'text-white'}`} style={{ fontSize: `${Math.max(9, Math.round(11 * scale))}px` }}>{moonriseTime || '--:--'}</span>
                            </div>
                            <div className="flex items-center gap-0.5" title="Horário do Pôr da Lua">
                                <span className={isLight ? 'text-sky-600 font-bold' : 'text-sky-400 font-bold'} style={{ fontSize: `${Math.max(10, Math.round(12 * scale))}px` }}>↓</span>
                                <span className={`${isLight ? 'text-neutral-600' : 'text-sky-300/90'} font-medium mr-0.5`}>Pôr:</span>
                                <span className={`font-bold font-mono ${isLight ? 'text-neutral-900' : 'text-white'}`} style={{ fontSize: `${Math.max(9, Math.round(11 * scale))}px` }}>{moonsetTime || '--:--'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Popover Compacto da Lua — Montado via Portal no body para prioridade visual irrestrita e não sofrer overflow */}
            {showPopover && typeof document !== 'undefined' && createPortal(
                <div className="lunar-calendar-popover pointer-events-auto">
                    {/* Backdrop invisível para fechar ao clicar fora */}
                    <div 
                        className="fixed inset-0 z-[999998]"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClosePopover();
                        }}
                    />
                    
                    <div
                        style={{
                            position: 'fixed',
                            top: popoverPos.top !== undefined ? `${popoverPos.top}px` : undefined,
                            bottom: popoverPos.bottom !== undefined ? `${popoverPos.bottom}px` : undefined,
                            right: `${popoverPos.right}px`,
                            zIndex: 999999,
                            width: `${popoverPos.width}px`,
                            height: `${popoverPos.maxHeight}px`,
                            maxHeight: `${popoverPos.maxHeight}px`,
                            background: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(8, 6, 18, 0.98)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            border: isLight ? '1px solid rgba(0, 0, 0, 0.15)' : '1px solid rgba(255, 255, 255, 0.22)',
                            borderRadius: 16,
                            overflow: 'hidden',
                            boxShadow: isLight 
                                ? '0 16px 40px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.08)' 
                                : '0 16px 40px rgba(0, 0, 0, 0.95), 0 0 25px rgba(168, 85, 247, 0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                        className="animate-in fade-in zoom-in-95 duration-150 font-sans pointer-events-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {/* Header do Popover Compacto com Botões de Minimizar e Fechar */}
                        <div className={`px-3.5 py-2 border-b flex items-center justify-between shrink-0 select-none ${
                            isLight ? 'border-black/10 bg-black/[0.03]' : 'border-white/10 bg-white/[0.03]'
                        }`}>
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm">🌙</span>
                                <span
                                    style={{
                                        fontFamily: "'Playfair Display', Georgia, serif",
                                        fontWeight: 600,
                                        fontSize: '15px',
                                        lineHeight: 1,
                                        letterSpacing: '.005em',
                                        color: isLight ? '#3B2F14' : '#F5F2EB',
                                    }}
                                >
                                    Calendário Lunar
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    data-no-drag="true"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMinimized(true);
                                        try {
                                            localStorage.setItem('moon_card_minimized', 'true');
                                        } catch (err) {}
                                        handleClosePopover();
                                    }}
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                        isLight ? 'hover:bg-black/10 text-neutral-600 hover:text-black' : 'hover:bg-white/10 text-white/60 hover:text-white'
                                    }`}
                                    title="Minimizar Calendário Lunar"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    data-no-drag="true"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClosePopover();
                                    }}
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                        isLight ? 'hover:bg-black/10 text-neutral-600 hover:text-black' : 'hover:bg-white/10 text-white/60 hover:text-white'
                                    }`}
                                    title="Fechar"
                                >
                                    <i className="ti ti-x text-xs" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 h-full overflow-hidden flex flex-col">
                            <CalendarPanel
                                isOpen={true}
                                onClose={handleClosePopover}
                                currentDate={currentDate}
                                onDateSelect={(d) => {
                                    if (onDateSelect) onDateSelect(d);
                                }}
                                embedded={true}
                                defaultView="lunar"
                                defaultLunarView="cycles"
                                latitude={latitude}
                                theme={theme}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

