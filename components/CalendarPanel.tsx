import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_ICONS } from './icons';
import { YearNavigation } from './Controls';
import { getMonthEvents, CalendarEvent } from '../lib/astrology/calendars';

interface CalendarPanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: Date;
    onDateSelect: (date: Date) => void;
    variant?: 'purple' | 'gold';
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
                {/* Header row for days 1-31 */}
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
                                if (!day.exists) {
                                    return <div key={i} className="w-full h-full"></div>;
                                }

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
    baseYear, 
    baseMonth, 
    offset, 
    currentDate, 
    onDateSelect,
    accentColor
}: { 
    baseYear: number, 
    baseMonth: number, 
    offset: number, 
    currentDate: Date, 
    onDateSelect: (d: Date) => void,
    accentColor: string
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

    const getEventsForDay = (date: Date) => {
        return events.filter(e => 
            e.date.getDate() === date.getDate() &&
            e.date.getMonth() === date.getMonth() &&
            e.date.getFullYear() === date.getFullYear()
        );
    };

    return (
        <div className="mb-8" data-month-offset={offset}>
            <h3 className="text-lg font-bold text-brand-text capitalize mb-4 sticky top-0 bg-brand-surface/95 backdrop-blur-xl py-2 z-10 border-b border-white/5">
                {MONTHS[month]} {year}
            </h3>
            <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-brand-text-muted uppercase tracking-wider py-2">
                        {day}
                    </div>
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
                            className={`
                                min-h-[60px] p-1 rounded-lg border transition-all cursor-pointer relative group
                                ${day.currentMonth ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-transparent border-transparent opacity-30'}
                                ${isSelected ? `ring-1 ring-${accentColor} bg-${accentColor}/10` : ''}
                                ${isToday ? 'ring-1 ring-brand-orange/50' : ''}
                            `}
                        >
                            <span className={`text-xs font-medium block mb-1 ${isToday ? 'text-brand-orange' : 'text-brand-text'}`}>
                                {day.day}
                            </span>
                            
                            <div className="flex flex-col gap-0.5">
                                {dayEvents.map((event, idx) => (
                                    <div key={idx} className="flex items-center gap-1 text-[9px] text-brand-text-muted truncate" title={event.name}>
                                        <span>{event.icon}</span>
                                        <span className="truncate">{event.name}</span>
                                    </div>
                                ))}
                                <div className="mt-auto pt-1 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="h-0.5 w-full bg-white/10 rounded-full"></div>
                                </div>
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
    variant = 'purple'
}: CalendarPanelProps) => {
    const [view, setView] = useState<'month' | 'year' | 'lunar'>('month');
    const [displayDate, setDisplayDate] = useState(new Date(currentDate));
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [editTime, setEditTime] = useState({ hours: 0, minutes: 0 });

    const [monthOffsets, setMonthOffsets] = useState<number[]>([-2, -1, 0, 1, 2]);
    const [yearOffsets, setYearOffsets] = useState<number[]>([-1, 0, 1]);

    const accentColor = variant === 'gold' ? 'brand-orange' : 'brand-purple';
    const accentRgb = variant === 'gold' ? '249, 115, 22' : '124, 58, 237';
    const [lunarOffsets, setLunarOffsets] = useState<number[]>([-1, 0, 1, 2, 3]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const lunarScrollRef = useRef<HTMLDivElement>(null);
    const [isPrepending, setIsPrepending] = useState(false);
    const previousScrollHeight = useRef(0);
    const previousScrollTop = useRef(0);
    const previousScrollWidth = useRef(0);
    const previousScrollLeft = useRef(0);

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
                    if (centerEl) {
                        scrollRef.current.scrollTop = (centerEl as HTMLElement).offsetTop;
                    }
                }
            });
        } else if (view === 'year') {
            setYearOffsets([-1, 0, 1]);
            requestAnimationFrame(() => {
                if (scrollRef.current) {
                    const centerEl = scrollRef.current.querySelector('[data-year-offset="0"]');
                    if (centerEl) {
                        scrollRef.current.scrollTop = (centerEl as HTMLElement).offsetTop;
                    }
                }
            });
        } else if (view === 'lunar') {
            setYearOffsets([-1, 0, 1]);
            requestAnimationFrame(() => {
                if (scrollRef.current) {
                    const centerEl = scrollRef.current.querySelector('[data-year-offset="0"]');
                    if (centerEl) {
                        scrollRef.current.scrollTop = (centerEl as HTMLElement).offsetTop;
                    }
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
                
                setMonthOffsets(prev => {
                    const first = prev[0];
                    return [first - 3, first - 2, first - 1, ...prev];
                });
            } else if (target.scrollHeight - target.scrollTop - target.clientHeight < 300) {
                setMonthOffsets(prev => {
                    const last = prev[prev.length - 1];
                    return [...prev, last + 1, last + 2, last + 3];
                });
            }
        } else if (view === 'year' || view === 'lunar') {
            if (target.scrollTop < 300 && !isPrepending) {
                setIsPrepending(true);
                previousScrollHeight.current = target.scrollHeight;
                previousScrollTop.current = target.scrollTop;
                
                setYearOffsets(prev => {
                    const first = prev[0];
                    return [first - 1, ...prev];
                });
            } else if (target.scrollHeight - target.scrollTop - target.clientHeight < 300) {
                setYearOffsets(prev => {
                    const last = prev[prev.length - 1];
                    return [...prev, last + 1];
                });
            }
        }
    };

    const handlePrev = () => {
        const newDate = new Date(displayDate);
        newDate.setFullYear(newDate.getFullYear() - 1);
        setDisplayDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(displayDate);
        newDate.setFullYear(newDate.getFullYear() + 1);
        setDisplayDate(newDate);
    };

    const handleTimeClick = () => {
        setEditTime({
            hours: currentDate.getHours(),
            minutes: currentDate.getMinutes()
        });
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
        if (e.key === 'Enter') {
            handleTimeSave();
        } else if (e.key === 'Escape') {
            setIsEditingTime(false);
        }
    };

    const generateMiniMonth = (year: number, month: number) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];
        const startPadding = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
        
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
            initial={{ opacity: 0, scale: 0.9, x: -20, y: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20, y: -20 }}
            className={`absolute top-0 left-0 bg-brand-surface/95 backdrop-blur-xl border border-brand-border/10 rounded-2xl shadow-2xl z-50 overflow-hidden font-manrope ring-1 ring-brand-border/5 transition-all duration-300 ${view === 'year' || view === 'lunar' ? 'w-[800px] max-w-[90vw]' : 'w-[400px]'}`}
            style={{ transformOrigin: 'top left' }}
        >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-brand-surface-highlight/20">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setView('month')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${view === 'month' ? `bg-${accentColor} text-white shadow-lg` : 'text-brand-text-muted hover:text-brand-text hover:bg-white/5'}`}
                    >
                        Mês
                    </button>
                    <button 
                        onClick={() => setView('year')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${view === 'year' ? `bg-${accentColor} text-white shadow-lg` : 'text-brand-text-muted hover:text-brand-text hover:bg-white/5'}`}
                    >
                        Ano
                    </button>
                    <button 
                        onClick={() => setView('lunar')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${view === 'lunar' ? `bg-${accentColor} text-white shadow-lg` : 'text-brand-text-muted hover:text-brand-text hover:bg-white/5'}`}
                    >
                        Lunar
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Digital Clock */}
                    <div 
                        className="px-3 py-1.5 bg-black/20 rounded-lg border border-white/5 cursor-pointer hover:bg-black/40 transition-colors flex items-center gap-1.5"
                        onClick={!isEditingTime ? handleTimeClick : undefined}
                        title="Clique para editar o horário"
                    >
                        {isEditingTime ? (
                            <div className="flex items-center text-sm font-mono text-brand-text">
                                <style>{`
                                    .no-spinners::-webkit-outer-spin-button,
                                    .no-spinners::-webkit-inner-spin-button {
                                        -webkit-appearance: none;
                                        margin: 0;
                                    }
                                    .no-spinners {
                                        -moz-appearance: textfield;
                                    }
                                `}</style>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={editTime.hours.toString().padStart(2, '0')}
                                    onChange={(e) => setEditTime({ ...editTime, hours: Math.min(23, Math.max(0, parseInt(e.target.value) || 0)) })}
                                    onKeyDown={handleKeyDown}
                                    onWheel={(e) => {
                                        e.preventDefault();
                                        const delta = e.deltaY > 0 ? -1 : 1;
                                        let newHours = editTime.hours + delta;
                                        if (newHours > 23) newHours = 0;
                                        if (newHours < 0) newHours = 23;
                                        setEditTime({ ...editTime, hours: newHours });
                                    }}
                                    className="w-6 bg-transparent text-center focus:outline-none focus:text-brand-orange caret-white no-spinners cursor-ns-resize"
                                    autoFocus
                                />
                                <span className="mx-0.5 animate-pulse">:</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={editTime.minutes.toString().padStart(2, '0')}
                                    onChange={(e) => setEditTime({ ...editTime, minutes: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) })}
                                    onKeyDown={handleKeyDown}
                                    onWheel={(e) => {
                                        e.preventDefault();
                                        const delta = e.deltaY > 0 ? -1 : 1;
                                        let newMins = editTime.minutes + delta;
                                        if (newMins > 59) newMins = 0;
                                        if (newMins < 0) newMins = 59;
                                        setEditTime({ ...editTime, minutes: newMins });
                                    }}
                                    className="w-6 bg-transparent text-center focus:outline-none focus:text-brand-orange caret-white no-spinners cursor-ns-resize"
                                />
                                <button onClick={(e) => { e.stopPropagation(); handleTimeSave(); }} className="ml-2 text-green-400 hover:text-green-300 flex items-center justify-center">
                                    <UI_ICONS.ArrowRightIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <UI_ICONS.ClockIcon className="w-3.5 h-3.5 text-brand-text-muted" />
                                <div className="flex items-center text-sm font-mono font-medium text-brand-text tracking-wider">
                                    <span 
                                        className="hover:text-brand-orange hover:bg-white/5 cursor-ns-resize px-1 rounded transition-all"
                                        onWheel={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const delta = e.deltaY > 0 ? -1 : 1;
                                            const newDate = new Date(currentDate);
                                            newDate.setHours(newDate.getHours() + delta);
                                            onDateSelect(newDate);
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleTimeClick();
                                        }}
                                        title="Role para mudar a hora"
                                    >
                                        {currentDate.getHours().toString().padStart(2, '0')}
                                    </span>
                                    <span className="text-brand-text-muted mx-0.5">:</span>
                                    <span 
                                        className="hover:text-brand-orange hover:bg-white/5 cursor-ns-resize px-1 rounded transition-all"
                                        onWheel={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const delta = e.deltaY > 0 ? -1 : 1;
                                            const newDate = new Date(currentDate);
                                            newDate.setMinutes(newDate.getMinutes() + delta);
                                            onDateSelect(newDate);
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleTimeClick();
                                        }}
                                        title="Role para mudar os minutos"
                                    >
                                        {currentDate.getMinutes().toString().padStart(2, '0')}
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
                        onPrev={handlePrev}
                        onNext={handleNext}
                        onYearClick={(year) => {
                            const newDate = new Date(displayDate);
                            newDate.setFullYear(year);
                            setDisplayDate(newDate);
                        }}
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
                                    <h2 className="text-xl font-bold text-brand-text mb-4 sticky top-0 bg-brand-surface/95 backdrop-blur-xl py-2 z-10 border-b border-white/5">
                                        {year}
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6 pb-4">
                                        {MONTHS.map((month, i) => {
                                            const miniDays = generateMiniMonth(year, i);
                                            return (
                                                <div key={`${year}-${month}`} className="flex flex-col">
                                                    <h3 
                                                        className={`text-sm font-bold text-brand-text mb-3 cursor-pointer hover:text-${accentColor} transition-colors`}
                                                        onClick={() => {
                                                            const newDate = new Date(displayDate);
                                                            newDate.setFullYear(year);
                                                            newDate.setDate(1);
                                                            newDate.setMonth(i);
                                                            setDisplayDate(newDate);
                                                            setView('month');
                                                        }}
                                                    >
                                                        {month}
                                                    </h3>
                                                    <div className="grid grid-cols-7 gap-x-1 gap-y-1 text-center">
                                                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, idx) => (
                                                            <div key={`${year}-${month}-wd-${idx}`} className="text-[10px] text-brand-text-muted mb-1">{d}</div>
                                                        ))}
                                                        {miniDays.map((day, idx) => {
                                                            const isSelected = day.date.toDateString() === currentDate.toDateString();
                                                            const isToday = day.date.toDateString() === new Date().toDateString();
                                                            return (
                                                                <div 
                                                                    key={`${year}-${month}-d-${idx}`} 
                                                                    onClick={() => {
                                                                        const newDate = new Date(day.date);
                                                                        newDate.setHours(currentDate.getHours());
                                                                        newDate.setMinutes(currentDate.getMinutes());
                                                                        newDate.setSeconds(currentDate.getSeconds());
                                                                        onDateSelect(newDate);
                                                                        setDisplayDate(newDate);
                                                                        setView('month');
                                                                    }}
                                                                    className={`
                                                                        text-[11px] py-1 cursor-pointer rounded-full hover:bg-white/10 transition-colors flex items-center justify-center w-6 h-6 mx-auto
                                                                        ${!day.currentMonth ? 'text-brand-text-muted/20' : 'text-brand-text-muted'}
                                                                        ${isSelected ? `bg-${accentColor} text-white font-bold` : ''}
                                                                        ${isToday && !isSelected ? 'text-brand-orange font-bold' : ''}
                                                                    `}
                                                                >
                                                                    {day.day}
                                                                </div>
                                                            )
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
                ) : view === 'lunar' ? (
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
                ) : null}
            </div>
        </motion.div>
    );
};
