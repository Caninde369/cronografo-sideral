import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_ICONS } from './icons';
import { YearNavigation } from './Controls';
import { LocationSearchInput } from './LocationSearchInput';
import { getMonthEvents, CalendarEvent } from '../lib/astrology/calendars';

interface CalendarPanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: Date;
    onDateSelect: (date: Date) => void;
    variant?: 'purple' | 'gold';
    defaultView?: 'month' | 'year' | 'lunar';
    onlyYearView?: boolean;
    locationName?: string;
    onLocationChange?: (location: { latitude: number; longitude: number; displayName: string }) => void;
    theme?: 'dark' | 'light';
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

import { MoonPhase } from 'astronomy-engine';

const getMoonIcon = (phase: number) => {
    if (phase < 22.5 || phase >= 337.5) return '🌑';
    if (phase < 67.5) return '🌒';
    if (phase < 112.5) return '🌓';
    if (phase < 157.5) return '🌔';
    if (phase < 202.5) return '🌕';
    if (phase < 247.5) return '🌖';
    if (phase < 292.5) return '🌗';
    return '🌘';
};

const LunarYearGrid = React.memo(({ 
    year, 
    currentDate, 
    onDateSelect,
    accentColor,
    accentRgb
}: { 
    year: number, 
    currentDate: Date, 
    onDateSelect: (d: Date) => void,
    accentColor: string,
    accentRgb: string
}) => {
    const months = useMemo(() => {
        const result: { month: number, days: any[] }[] = [];
        for (let m = 0; m < 12; m++) {
            const daysInMonth = new Date(year, m + 1, 0).getDate();
            const days = [];
            for (let d = 1; d <= 31; d++) {
                if (d <= daysInMonth) {
                    const date = new Date(year, m, d);
                    const phase = MoonPhase(date);
                    days.push({ date, phase, exists: true });
                } else {
                    days.push({ exists: false });
                }
            }
            result.push({ month: m, days });
        }
        return result;
    }, [year]);

    return (
        <div className="flex flex-col w-full h-full pb-4" data-year-offset={year}>
            <div className="flex flex-col w-full h-full bg-black/20 p-2 sm:p-4 rounded-2xl border border-white/5">
                <div className="flex items-center w-full mb-1">
                    <div className="w-8 sm:w-10 flex-shrink-0"></div>
                    <div className="grid grid-cols-[repeat(31,minmax(0,1fr))] flex-1 gap-0.5 sm:gap-1">
                        {Array.from({ length: 31 }, (_, i) => (
                            <div key={i} className="text-center text-[8px] sm:text-[10px] text-brand-text-muted font-bold">
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
                {months.map((monthData, monthIdx) => (
                    <div key={monthIdx} className="flex items-center w-full flex-1 min-h-0 py-0.5">
                        <div className="w-8 sm:w-10 flex-shrink-0 text-[9px] sm:text-xs font-bold text-brand-text-muted capitalize tracking-wider">
                            {MONTHS[monthData.month].substring(0, 3)}
                        </div>
                        <div className="grid grid-cols-[repeat(31,minmax(0,1fr))] flex-1 h-full items-center gap-0.5 sm:gap-1">
                            {monthData.days.map((day, i) => {
                                if (!day.exists) return <div key={i} className="w-full h-full"></div>;
                                const isSelected = day.date.toDateString() === currentDate.toDateString();
                                const isToday = day.date.toDateString() === new Date().toDateString();
                                return (
                                    <div 
                                        key={i}
                                        onClick={() => {
                                            const newDate = new Date(day.date);
                                            newDate.setHours(currentDate.getHours());
                                            newDate.setMinutes(currentDate.getMinutes());
                                            newDate.setSeconds(currentDate.getSeconds());
                                            onDateSelect(newDate);
                                        }}
                                        className={`w-full aspect-square flex items-center justify-center cursor-pointer transition-all rounded-full overflow-hidden
                                            ${isSelected ? `bg-${accentColor}/30 ring-1 ring-${accentColor} shadow-[0_0_10px_rgba(${accentRgb},0.3)]` : 'hover:bg-white/10'}
                                            ${isToday ? 'ring-1 ring-brand-orange/50' : ''}
                                        `}
                                        title={day.date.toLocaleDateString('pt-BR')}
                                    >
                                        <span className="text-[7px] sm:text-[9px] md:text-[11px] drop-shadow-md leading-none flex-shrink-0">{getMoonIcon(day.phase)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

const MonthGrid = React.memo(({ 
    baseYear, baseMonth, offset, currentDate, onDateSelect, accentColor
}: { 
    baseYear: number, baseMonth: number, offset: number, 
    currentDate: Date, onDateSelect: (d: Date) => void, accentColor: string
}) => {
    const targetDate = new Date(baseYear, baseMonth + offset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];
        const startPadding = firstDay.getDay();
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startPadding - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDay - i, currentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
        }
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
        }
        return days;
    }, [year, month]);

    const events = useMemo(() => getMonthEvents(year, month), [year, month]);

    const getEventsForDay = (date: Date) => events.filter(e => 
        e.date.getDate() === date.getDate() &&
        e.date.getMonth() === date.getMonth() &&
        e.date.getFullYear() === date.getFullYear()
    );

    return (
        <div className="mb-8" data-month-offset={offset}>
            <h3 className="text-lg font-bold text-brand-text capitalize mb-4 sticky top-0 bg-brand-surface/95 backdrop-blur-xl py-2 z-10 border-b border-white/5 font-outfit">
                {MONTHS[month]} {year}
            </h3>
            <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-brand-text-muted uppercase tracking-wider py-2">{day}</div>
                ))}
                {calendarDays.map((day, i) => {
                    const dayEvents = getEventsForDay(day.date);
                    const isToday = day.date.toDateString() === new Date().toDateString();
                    const isSelected = day.date.toDateString() === currentDate.toDateString();
                    return (
                        <div 
                            key={i}
                            onClick={() => {
                                const newDate = new Date(day.date);
                                newDate.setHours(currentDate.getHours());
                                newDate.setMinutes(currentDate.getMinutes());
                                newDate.setSeconds(currentDate.getSeconds());
                                onDateSelect(newDate);
                            }}
                            className={`min-h-[60px] p-1 rounded-lg border transition-all cursor-pointer relative group
                                ${day.currentMonth ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-transparent border-transparent opacity-30'}
                                ${isSelected ? `ring-1 ring-${accentColor} bg-${accentColor}/10` : ''}
                                ${isToday ? 'ring-1 ring-brand-orange/50' : ''}
                            `}
                        >
                            <span className={`text-xs font-medium block mb-1 ${isToday ? 'text-brand-orange' : 'text-brand-text'}`}>{day.day}</span>
                            <div className="flex flex-col gap-0.5">
                                {dayEvents.map((event, idx) => (
                                    <div key={idx} className="flex items-center gap-1 text-[9px] text-brand-text-muted truncate" title={event.name}>
                                        <span>{event.icon}</span>
                                        <span className="truncate">{event.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

export const CalendarPanel = ({ 
    isOpen, 
    onClose, 
    currentDate, 
    onDateSelect, 
    variant = 'purple', 
    defaultView, 
    onlyYearView = false,
    locationName = '',
    onLocationChange,
    theme = 'dark',
}: CalendarPanelProps) => {
    const [view, setView] = useState<'month' | 'year' | 'lunar'>(defaultView ?? 'month');
    const [displayDate, setDisplayDate] = useState(new Date(currentDate));
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [editTime, setEditTime] = useState({ hours: 0, minutes: 0 });
    const [monthOffsets, setMonthOffsets] = useState<number[]>([-2, -1, 0, 1, 2]);
    const [yearOffsets, setYearOffsets] = useState<number[]>([-1, 0, 1]);
    const accentColor = variant === 'gold' ? 'brand-orange' : 'brand-purple';
    const accentRgb = variant === 'gold' ? '249, 115, 22' : '124, 58, 237';
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPrepending, setIsPrepending] = useState(false);
    const previousScrollHeight = useRef(0);
    const previousScrollTop = useRef(0);

    const prevIsOpen = useRef(isOpen);
    useEffect(() => {
        if (isOpen && !prevIsOpen.current) {
            setDisplayDate(new Date(currentDate));
            setView('month');
        }
        prevIsOpen.current = isOpen;
    }, [isOpen, currentDate]);

    useEffect(() => {
        if (view === 'month') {
            setMonthOffsets([-2, -1, 0, 1, 2]);
            requestAnimationFrame(() => {
                if (scrollRef.current) {
                    const centerEl = scrollRef.current.querySelector('[data-month-offset="0"]');
                    if (centerEl) scrollRef.current.scrollTop = (centerEl as HTMLElement).offsetTop;
                }
            });
        } else {
            setYearOffsets([-1, 0, 1]);
            requestAnimationFrame(() => {
                if (scrollRef.current) {
                    const centerEl = scrollRef.current.querySelector('[data-year-offset="0"]');
                    if (centerEl) scrollRef.current.scrollTop = (centerEl as HTMLElement).offsetTop;
                }
            });
        }
    }, [view, displayDate]);

    useLayoutEffect(() => {
        if (isPrepending && scrollRef.current) {
            const newScrollHeight = scrollRef.current.scrollHeight;
            const heightDiff = newScrollHeight - previousScrollHeight.current;
            scrollRef.current.scrollTop = previousScrollTop.current + heightDiff;
            setIsPrepending(false);
        }
    }, [monthOffsets, yearOffsets, isPrepending, view]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (view === 'month') {
            if (target.scrollTop < 300 && !isPrepending) {
                setIsPrepending(true);
                previousScrollHeight.current = target.scrollHeight;
                previousScrollTop.current = target.scrollTop;
                setMonthOffsets(prev => { const f = prev[0]; return [f-3, f-2, f-1, ...prev]; });
            } else if (target.scrollHeight - target.scrollTop - target.clientHeight < 300) {
                setMonthOffsets(prev => { const l = prev[prev.length-1]; return [...prev, l+1, l+2, l+3]; });
            }
        } else {
            if (target.scrollTop < 300 && !isPrepending) {
                setIsPrepending(true);
                previousScrollHeight.current = target.scrollHeight;
                previousScrollTop.current = target.scrollTop;
                setYearOffsets(prev => { const f = prev[0]; return [f-1, ...prev]; });
            } else if (target.scrollHeight - target.scrollTop - target.clientHeight < 300) {
                setYearOffsets(prev => { const l = prev[prev.length-1]; return [...prev, l+1]; });
            }
        }
    };

    const handleTimeClick = () => {
        setEditTime({ hours: currentDate.getHours(), minutes: currentDate.getMinutes() });
        setIsEditingTime(true);
    };

    const handleTimeSave = () => {
        const newDate = new Date(currentDate);
        newDate.setHours(editTime.hours);
        newDate.setMinutes(editTime.minutes);
        onDateSelect(newDate);
        setIsEditingTime(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleTimeSave();
        else if (e.key === 'Escape') setIsEditingTime(false);
    };

    const generateMiniMonth = (year: number, month: number) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];
        const startPadding = firstDay.getDay();
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startPadding - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDay - i, currentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
        }
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
        }
        return days;
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`bg-brand-surface/95 backdrop-blur-xl border border-brand-border/10 rounded-2xl shadow-2xl overflow-hidden font-manrope ring-1 ring-brand-border/5 ${view === 'year' || view === 'lunar' ? 'w-[800px] max-w-[90vw]' : 'w-[400px]'}`}
        >
            {/* Header de localização — acima das abas */}
            <div style={{
                borderBottom: theme === 'dark'
                    ? '0.5px solid rgba(255,255,255,0.07)'
                    : '0.5px solid rgba(53,81,112,0.12)',
                padding: '10px 16px',
            }}>
                {!isEditingLocation ? (
                    /* MODO VISUALIZAÇÃO — clicável */
                    <button
                        onClick={() => setIsEditingLocation(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = theme === 'dark'
                                ? 'rgba(255,255,255,0.05)'
                                : 'rgba(53,81,112,0.06)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                    >
                        {/* Ícone de pin */}
                        <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                            <path
                                d="M6 0C3.79 0 2 1.79 2 4c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4z"
                                fill={theme === 'dark' ? '#8B5CF6' : '#6B5CF6'}
                            />
                            <circle cx="6" cy="4" r="1.5" fill={theme === 'dark' ? '#080810' : '#f0ede6'} />
                        </svg>

                        <span style={{
                            fontFamily: "'DM Sans', system-ui, sans-serif",
                            fontSize: '12px',
                            fontWeight: 500,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: theme === 'dark' ? '#9CA3AF' : '#355170',
                            flex: 1,
                            textAlign: 'left',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {locationName || 'Definir localização'}
                        </span>

                        {/* Ícone de editar */}
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                            <path
                                d="M7 1L9 3L3 9H1V7L7 1Z"
                                stroke={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                ) : (
                    /* MODO EDIÇÃO — input de busca */
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="12" height="14" viewBox="0 0 12 14" fill="none" style={{ flexShrink: 0 }}>
                            <path
                                d="M6 0C3.79 0 2 1.79 2 4c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4z"
                                fill="#8B5CF6"
                            />
                            <circle cx="6" cy="4" r="1.5" fill={theme === 'dark' ? '#080810' : '#f0ede6'} />
                        </svg>

                        <div style={{ flex: 1 }}>
                            <LocationSearchInput
                                value={locationName}
                                theme={theme}
                                placeholder="Buscar cidade..."
                                onChange={(loc) => {
                                    if (onLocationChange) {
                                        onLocationChange({
                                            latitude: loc.latitude,
                                            longitude: loc.longitude,
                                            displayName: loc.displayName,
                                        });
                                    }
                                    setIsEditingLocation(false);
                                }}
                            />
                        </div>

                        {/* Botão cancelar */}
                        <button
                            onClick={() => setIsEditingLocation(false)}
                            style={{
                                flexShrink: 0,
                                width: '24px', height: '24px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'transparent',
                                border: `0.5px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(53,81,112,0.15)'}`,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                            }}
                        >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-brand-surface-highlight/20">
                <div className="flex items-center gap-2">
                    {(['month', 'year', 'lunar'] as const)
                        .filter(v => !onlyYearView || v === 'year')
                        .map(v => (
                            <button 
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${view === v ? `bg-${accentColor} text-white shadow-lg` : 'text-brand-text-muted hover:text-brand-text hover:bg-white/5'}`}
                            >
                                {v === 'month' ? 'Mês' : v === 'year' ? 'Ano' : 'Lunar'}
                            </button>
                        ))}
                </div>
                <div className="flex items-center gap-2">
                    <div 
                        className="px-3 py-1.5 bg-black/20 rounded-lg border border-white/5 cursor-pointer hover:bg-black/40 transition-colors flex items-center gap-1.5"
                        onClick={!isEditingTime ? handleTimeClick : undefined}
                    >
                        {isEditingTime ? (
                            <div className="flex items-center text-sm font-mono text-brand-text">
                                <style>{`.no-spinners::-webkit-outer-spin-button,.no-spinners::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}.no-spinners{-moz-appearance:textfield}`}</style>
                                <input type="number" min="0" max="23" value={editTime.hours.toString().padStart(2,'0')}
                                    onChange={e => setEditTime({...editTime, hours: Math.min(23, Math.max(0, parseInt(e.target.value)||0))})}
                                    onKeyDown={handleKeyDown}
                                    onWheel={e => { e.preventDefault(); let h = editTime.hours + (e.deltaY > 0 ? -1 : 1); if(h>23)h=0; if(h<0)h=23; setEditTime({...editTime,hours:h}); }}
                                    className="w-6 bg-transparent text-center focus:outline-none focus:text-brand-orange caret-white no-spinners cursor-ns-resize" autoFocus />
                                <span className="mx-0.5 animate-pulse">:</span>
                                <input type="number" min="0" max="59" value={editTime.minutes.toString().padStart(2,'0')}
                                    onChange={e => setEditTime({...editTime, minutes: Math.min(59, Math.max(0, parseInt(e.target.value)||0))})}
                                    onKeyDown={handleKeyDown}
                                    onWheel={e => { e.preventDefault(); let m = editTime.minutes + (e.deltaY > 0 ? -1 : 1); if(m>59)m=0; if(m<0)m=59; setEditTime({...editTime,minutes:m}); }}
                                    className="w-6 bg-transparent text-center focus:outline-none focus:text-brand-orange caret-white no-spinners cursor-ns-resize" />
                                <button onClick={e => { e.stopPropagation(); handleTimeSave(); }} className="ml-2 text-green-400 hover:text-green-300">
                                    <UI_ICONS.ArrowRightIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <UI_ICONS.ClockIcon className="w-3.5 h-3.5 text-brand-text-muted" />
                                <div className="flex items-center text-sm font-mono font-medium text-brand-text tracking-wider">
                                    <span className="hover:text-brand-orange hover:bg-white/5 cursor-ns-resize px-1 rounded transition-all"
                                        onWheel={e => { e.preventDefault(); e.stopPropagation(); const d = new Date(currentDate); d.setHours(d.getHours()+(e.deltaY>0?-1:1)); onDateSelect(d); }}
                                        onClick={e => { e.stopPropagation(); handleTimeClick(); }}>
                                        {currentDate.getHours().toString().padStart(2,'0')}
                                    </span>
                                    <span className="text-brand-text-muted mx-0.5">:</span>
                                    <span className="hover:text-brand-orange hover:bg-white/5 cursor-ns-resize px-1 rounded transition-all"
                                        onWheel={e => { e.preventDefault(); e.stopPropagation(); const d = new Date(currentDate); d.setMinutes(d.getMinutes()+(e.deltaY>0?-1:1)); onDateSelect(d); }}
                                        onClick={e => { e.stopPropagation(); handleTimeClick(); }}>
                                        {currentDate.getMinutes().toString().padStart(2,'0')}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="text-brand-text-muted hover:text-brand-text transition-colors p-1.5 hover:bg-white/10 rounded-lg">
                        <UI_ICONS.CloseIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Navigation */}
            {(view === 'year' || view === 'lunar') && (
                <div className="p-4 flex items-center justify-center">
                    <YearNavigation 
                        year={displayDate.getFullYear()}
                        onPrev={() => { const d = new Date(displayDate); d.setFullYear(d.getFullYear()-1); setDisplayDate(d); }}
                        onNext={() => { const d = new Date(displayDate); d.setFullYear(d.getFullYear()+1); setDisplayDate(d); }}
                        onYearClick={y => { const d = new Date(displayDate); d.setFullYear(y); setDisplayDate(d); }}
                    />
                </div>
            )}

            {/* Content */}
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className={`p-4 pt-0 custom-scrollbar ${view === 'year' ? 'h-[600px] max-h-[70vh] overflow-y-auto' : view === 'lunar' ? 'h-[600px] max-h-[70vh] flex flex-col overflow-hidden' : 'h-[500px] overflow-y-auto'}`}
            >
                {view === 'month' ? (
                    <div className="flex flex-col">
                        {monthOffsets.map(offset => (
                            <MonthGrid 
                                key={`${displayDate.getFullYear()}-${displayDate.getMonth()}-${offset}`}
                                baseYear={displayDate.getFullYear()}
                                baseMonth={displayDate.getMonth()}
                                offset={offset}
                                currentDate={currentDate}
                                onDateSelect={onDateSelect}
                                accentColor={accentColor}
                            />
                        ))}
                    </div>
                ) : view === 'year' ? (
                    <div className="flex flex-col gap-8">
                        {yearOffsets.map(offset => {
                            const year = displayDate.getFullYear() + offset;
                            return (
                                <div key={year} data-year-offset={offset}>
                                    <h2 className="text-xl font-bold text-brand-text mb-4 sticky top-0 bg-brand-surface/95 backdrop-blur-xl py-2 z-10 border-b border-white/5">{year}</h2>
                                    <div className="grid grid-cols-3 gap-4 pb-4">
                                        {MONTHS.map((month, i) => {
                                            const miniDays = generateMiniMonth(year, i);
                                            return (
                                                <div key={`${year}-${month}`} className="flex flex-col">
                                                    <h3 className={`text-sm font-bold text-brand-text mb-3 cursor-pointer hover:text-${accentColor} transition-colors font-outfit`}
                                                        onClick={() => { const d = new Date(displayDate); d.setFullYear(year); d.setDate(1); d.setMonth(i); setDisplayDate(d); if (!onlyYearView) setView('month'); }}>
                                                        {month}
                                                    </h3>
                                                    <div className="grid grid-cols-7 gap-x-1 gap-y-1 text-center">
                                                        {['D','S','T','Q','Q','S','S'].map((d,idx) => (
                                                            <div key={`${year}-${month}-wd-${idx}`} className="text-[10px] text-brand-text-muted mb-1">{d}</div>
                                                        ))}
                                                        {miniDays.map((day, idx) => {
                                                            const isSelected = day.date.toDateString() === currentDate.toDateString();
                                                            const isToday = day.date.toDateString() === new Date().toDateString();
                                                            return (
                                                                <div key={`${year}-${month}-d-${idx}`}
                                                                    onClick={() => { const d = new Date(day.date); d.setHours(currentDate.getHours()); d.setMinutes(currentDate.getMinutes()); d.setSeconds(currentDate.getSeconds()); onDateSelect(d); setDisplayDate(d); if (!onlyYearView) setView('month'); }}
                                                                    className={`text-[11px] py-1 cursor-pointer rounded-full hover:bg-white/10 transition-colors flex items-center justify-center w-6 h-6 mx-auto
                                                                        ${!day.currentMonth ? 'text-brand-text-muted/20' : 'text-brand-text-muted'}
                                                                        ${isSelected ? `bg-${accentColor} text-white font-bold` : ''}
                                                                        ${isToday && !isSelected ? 'text-brand-orange font-bold' : ''}
                                                                    `}>
                                                                    {day.day}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <LunarYearGrid 
                            key={`lunar-${displayDate.getFullYear()}`}
                            year={displayDate.getFullYear()}
                            currentDate={currentDate}
                            onDateSelect={onDateSelect}
                            accentColor={accentColor}
                            accentRgb={accentRgb}
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
};