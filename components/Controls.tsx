import { SolarScrubber, getFreeTierSolarYearBounds } from "./SolarScrubber";
import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { UI_ICONS } from './icons';
import { MoonInfoPanel } from './MoonInfoPanel';

export const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; label: string; disabled?: boolean; }> = ({ checked, onChange, label, disabled }) => (
    <label className={`flex items-center justify-between w-full p-2 text-sm rounded-xl transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'}`}>
        <span className={`transition-colors ${disabled ? 'text-brand-text-muted' : 'text-brand-text font-medium'}`}>{label}</span>
        <div className="relative group/toggle">
            <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} disabled={disabled} />
            <div className={`block w-11 h-6 rounded-full transition-all duration-300 ${checked && !disabled ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_12px_rgba(147,51,234,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-purple-400/50' : 'bg-slate-900/90 border border-white/15 shadow-inner'}`}></div>
            <div className={`dot absolute left-1 top-1 w-4 h-4 rounded-full bg-gradient-to-b from-white to-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300 ease-out group-hover/toggle:scale-110 ${checked ? 'transform translate-x-5' : ''}`}></div>
        </div>
    </label>
);

export const SizeControl: React.FC<{ label: string; value: number; onChange: (newValue: number) => void; }> = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between p-2 text-xs text-brand-text">
        <span>{label}</span>
        <div className="flex items-center gap-2">
            <button onClick={() => onChange(value - 1)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 hover:scale-105 transition-all text-white font-bold border border-white/15 shadow-sm cursor-pointer">-</button>
            <span className="w-8 text-center font-source-code-pro font-bold">{value}px</span>
            <button onClick={() => onChange(value + 1)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 hover:scale-105 transition-all text-white font-bold border border-white/15 shadow-sm cursor-pointer">+</button>
        </div>
    </div>
);

export const PopupToggle: React.FC<{ label: string, isChecked: boolean, onToggle: () => void }> = ({ label, isChecked, onToggle }) => (
    <label className="flex items-center justify-between w-full p-2 text-xs rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
        <span className="text-brand-text font-medium">{label}</span>
        <div className="relative group/toggle">
            <input type="checkbox" className="sr-only" checked={isChecked} onChange={onToggle} />
            <div className={`block w-9 h-5 rounded-full transition-all duration-300 ${isChecked ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_10px_rgba(147,51,234,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-purple-400/50' : 'bg-slate-900/90 border border-white/15 shadow-inner'}`}></div>
            <div className={`dot absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-gradient-to-b from-white to-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300 ease-out group-hover/toggle:scale-110 ${isChecked ? 'transform translate-x-4' : ''}`}></div>
        </div>
    </label>
);

export const MicroToggle: React.FC<{ isChecked: boolean, onToggle: () => void, title?: string, theme?: 'dark' | 'light' }> = ({ isChecked, onToggle, title, theme = 'dark' }) => {
    const isLight = theme === 'light';
    return (
        <div 
            className="relative cursor-pointer flex items-center group select-none active:scale-95 transition-transform" 
            onClick={(e) => {
                e.stopPropagation();
                onToggle();
            }}
            title={title}
        >
            <input type="checkbox" className="sr-only" checked={isChecked} readOnly />
            <div className={`relative w-6 h-3 rounded-full transition-all duration-200 ${
                isChecked 
                    ? (isLight ? 'bg-amber-600 shadow-[0_0_6px_rgba(217,119,6,0.4)]' : 'bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.45)] border border-cyan-300/40')
                    : (isLight ? 'bg-stone-300/80 border border-stone-400/40' : 'bg-slate-900/90 border border-white/20')
            }`}>
                <div className={`dot absolute top-[1px] w-2 h-2 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${isChecked ? 'left-0.5 transform translate-x-[11px]' : 'left-[2px]'}`} />
            </div>
        </div>
    );
};

export const CompactToggle: React.FC<{ isChecked: boolean, onToggle: () => void }> = ({ isChecked, onToggle }) => (
    <div className="relative cursor-pointer flex items-center gap-1.5 group select-none active:scale-95 transition-transform" onClick={onToggle}>
        <input type="checkbox" className="sr-only" checked={isChecked} readOnly />
        <div className={`relative w-10 h-5 rounded-full transition-all duration-300 ${isChecked ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.45),0_2px_6px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.6)] border border-cyan-300/50' : 'bg-slate-950/80 border border-white/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]'}`}>
            <span className={`absolute left-1.5 top-1/2 -translate-y-1/2 text-[7px] font-extrabold tracking-wider transition-opacity duration-300 ${isChecked ? 'opacity-100 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]' : 'opacity-0'}`}>ON</span>
            <span className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-[7px] font-extrabold tracking-wider transition-opacity duration-300 ${isChecked ? 'opacity-0' : 'opacity-100 text-white/50'}`}>OFF</span>
            <div className={`dot absolute top-0.5 w-4 h-4 rounded-full bg-gradient-to-b from-white via-slate-100 to-slate-300 shadow-[0_2px_5px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,1)] transition-all duration-300 ease-out group-hover:scale-110 ${isChecked ? 'transform translate-x-[20px]' : 'left-0.5'}`}></div>
        </div>
    </div>
);

export const SegmentedControl: React.FC<{
    options: { label: string; value: string }[];
    value: string;
    onChange: (val: string) => void;
}> = ({ options, value, onChange }) => (
    <div className="flex bg-slate-950/60 rounded-xl p-1 select-none w-full border border-white/10 shadow-inner">
        {options.map((opt) => (
            <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`flex-1 px-2.5 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
                    value === opt.value
                        ? 'btn-3d-glow btn-3d-purple shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

const useHoldAction = (callback: () => void) => {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    const timerRef = useRef<number | null>(null);
    const intervalRef = useRef<number | null>(null);

    const start = () => {
        callbackRef.current();
        timerRef.current = window.setTimeout(() => {
            intervalRef.current = window.setInterval(() => {
                callbackRef.current();
            }, 60);
        }, 350);
    };

    const stop = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        return stop;
    }, []);

    return {
        onMouseDown: (e: React.MouseEvent) => {
            if (e.button === 0) start();
        },
        onMouseUp: stop,
        onMouseLeave: stop,
        onTouchStart: () => {
            start();
        },
        onTouchEnd: stop,
    };
};

const ArrowButton: React.FC<{
    direction: 'up' | 'down';
    onClick: () => void;
}> = ({ direction, onClick }) => {
    const holdHandlers = useHoldAction(onClick);
    return (
        <button
            {...holdHandlers}
            className="text-white/40 hover:text-white active:scale-95 transition-all p-0.5 select-none focus:outline-none flex items-center justify-center cursor-pointer"
            style={{ background: 'none', border: 'none' }}
        >
            {direction === 'up' ? (
                <svg className="w-3.5 h-1.5 fill-current" viewBox="0 0 24 10">
                    <path d="M12 0L24 10H0Z" />
                </svg>
            ) : (
                <svg className="w-3.5 h-1.5 fill-current" viewBox="0 0 24 10">
                    <path d="M12 10L0 0H24Z" />
                </svg>
            )}
        </button>
    );
};

// Steps & Multipliers config
export interface SpeedPreset {
    step: 'sec' | 'min' | 'hour' | 'day' | 'month' | 'year';
    mult: number;
}

export const SPEED_LADDER: SpeedPreset[] = [
    { step: 'sec', mult: 1 },
    { step: 'sec', mult: 2 },
    { step: 'sec', mult: 5 },
    { step: 'sec', mult: 10 },
    { step: 'sec', mult: 30 },
    { step: 'min', mult: 1 },
    { step: 'min', mult: 2 },
    { step: 'min', mult: 5 },
    { step: 'min', mult: 10 },
    { step: 'min', mult: 30 },
    { step: 'hour', mult: 1 },
    { step: 'hour', mult: 2 },
    { step: 'hour', mult: 6 },
    { step: 'hour', mult: 12 },
    { step: 'day', mult: 1 },
    { step: 'day', mult: 2 },
    { step: 'day', mult: 5 },
    { step: 'day', mult: 10 },
    { step: 'day', mult: 15 },
    { step: 'month', mult: 1 },
    { step: 'month', mult: 2 },
    { step: 'month', mult: 3 },
    { step: 'month', mult: 6 },
    { step: 'year', mult: 1 },
    { step: 'year', mult: 2 },
    { step: 'year', mult: 5 },
    { step: 'year', mult: 10 },
];

export const STEP_LABELS: Record<'sec' | 'min' | 'hour' | 'day' | 'month' | 'year', string> = {
    sec: 'SEG',
    min: 'MIN',
    hour: 'HORA',
    day: 'DIA',
    month: 'MÊS',
    year: 'ANO',
};

export const findSpeedIndex = (step: string, mult: number): number => {
    const idx = SPEED_LADDER.findIndex(p => p.step === step && p.mult === mult);
    if (idx !== -1) return idx;
    const stepIdx = SPEED_LADDER.findIndex(p => p.step === step);
    return stepIdx !== -1 ? stepIdx : 0;
};

export const TimeControls: React.FC<{
    currentTime: Date;
    onTimeChange: (newTime: Date) => void;
    isRealTime: boolean;
    onSetRealTime: (val: boolean) => void;
    speedMultiplier: number;
    onSpeedMultiplierChange: (speed: number) => void;
    timeStep: 'sec' | 'min' | 'hour' | 'day' | 'month' | 'year';
    onTimeStepChange: (step: 'sec' | 'min' | 'hour' | 'day' | 'month' | 'year') => void;
    isZodiacFixed: boolean;
    onToggleZodiacFixed: () => void;
    onToggleFullscreen: () => void;
    isFullscreen: boolean;
    onOpenSettings: () => void;
    onOpenNatalSettings: () => void;
    onOpenLunarCalendar: () => void;
    celestialData: any;
    location: any;
    theme?: 'dark' | 'light';
    isQuickToolsSidebarOpen?: boolean;
    isOptionsRailOpen?: boolean;
    leftDockOffset?: number;
    rightDockOffset?: number;
    isFreeTier?: boolean;
    onOpenPaymentPlans?: () => void;
}> = ({
    currentTime,
    onTimeChange,
    isRealTime,
    onSetRealTime,
    speedMultiplier,
    onSpeedMultiplierChange,
    timeStep,
    onTimeStepChange,
    isZodiacFixed,
    onToggleZodiacFixed,
    onToggleFullscreen,
    isFullscreen,
    onOpenSettings,
    onOpenNatalSettings,
    onOpenLunarCalendar,
    celestialData,
    location,
    theme = 'dark',
    isQuickToolsSidebarOpen = false,
    isOptionsRailOpen = false,
    leftDockOffset,
    rightDockOffset,
    isFreeTier = false,
    onOpenPaymentPlans
}) => {
    const isLight = theme === 'light';
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackDirection, setPlaybackDirection] = useState<1 | -1>(1);
    const [isSpeedStepExpanded, setIsSpeedStepExpanded] = useState(false);
    const [selectedStampUnit, setSelectedStampUnit] = useState<'d' | 'm' | 'y' | 'h' | 'i' | 's' | null>(null);
    const [loopA, setLoopA] = useState<Date | null>(null);
    const [loopB, setLoopB] = useState<Date | null>(null);
    const [isTimelineMinimized, setIsTimelineMinimized] = useState(false);
    // Inicia maximizado conforme solicitação do usuário
    const [isFullWidth, setIsFullWidth] = useState<boolean>(true);

    const toolbarContainerRef = useRef<HTMLDivElement>(null);
    const [toolbarWidth, setToolbarWidth] = useState<number>(800);

    useEffect(() => {
        if (!toolbarContainerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setToolbarWidth(entry.contentRect.width);
            }
        });
        observer.observe(toolbarContainerRef.current);
        return () => observer.disconnect();
    }, []);

    const showHojeText = toolbarWidth >= 520;
    const showTimelineText = toolbarWidth >= 620;
    const showFullscreenText = toolbarWidth >= 700;
    const showZodiacText = toolbarWidth >= 780;

    const toggleFullWidth = () => {
        setIsFullWidth(prev => !prev);
    };

    // Sync isPlaying with isRealTime
    useEffect(() => {
        if (isRealTime) {
            setIsPlaying(false);
        }
    }, [isRealTime]);

    // Calculate next date helper
    const getNextTime = (current: Date, step: string, mult: number, direction: number = 1): Date => {
        const next = new Date(current);
        const amount = direction * mult;
        switch (step) {
            case 'sec': next.setSeconds(next.getSeconds() + amount); break;
            case 'min': next.setMinutes(next.getMinutes() + amount); break;
            case 'hour': next.setHours(next.getHours() + amount); break;
            case 'day': next.setDate(next.getDate() + amount); break;
            case 'month': next.setMonth(next.getMonth() + amount); break;
            case 'year': 
                if (isFreeTier) {
                    onOpenPaymentPlans?.();
                    return next;
                }
                next.setFullYear(next.getFullYear() + amount); 
                break;
        }
        if (isFreeTier) {
            const { startDate, endDate } = getFreeTierSolarYearBounds(next);
            if (next.getTime() < startDate.getTime() || next.getTime() > endDate.getTime()) {
                onOpenPaymentPlans?.();
                return current;
            }
        }
        return next;
    };

    // Continuous smooth animation loop using requestAnimationFrame
    const animationFrameIdRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number | null>(null);
    const accumulatedTimeMsRef = useRef<number>(currentTime.getTime());

    const isPlayingRef = useRef(isPlaying);
    isPlayingRef.current = isPlaying;

    const playbackDirectionRef = useRef(playbackDirection);
    playbackDirectionRef.current = playbackDirection;

    const timeStepRef = useRef(timeStep);
    timeStepRef.current = timeStep;

    const speedMultiplierRef = useRef(speedMultiplier);
    speedMultiplierRef.current = speedMultiplier;

    const onTimeChangeRef = useRef(onTimeChange);
    onTimeChangeRef.current = onTimeChange;

    const currentTimeRef = useRef(currentTime);
    currentTimeRef.current = currentTime;

    const loopARef = useRef(loopA);
    loopARef.current = loopA;

    const loopBRef = useRef(loopB);
    loopBRef.current = loopB;

    // Press-and-hold (hold-to-repeat) logic for Step Back and Step Forward
    const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopHold = useCallback(() => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        if (holdIntervalRef.current) {
            clearInterval(holdIntervalRef.current);
            holdIntervalRef.current = null;
        }
    }, []);

    const startHold = (direction: 1 | -1) => {
        stopHold();
        onSetRealTime(false);
        // Immediate step
        onTimeChangeRef.current(getNextTime(currentTimeRef.current, timeStepRef.current, speedMultiplierRef.current, direction));

        // After initial delay of 280ms, repeat every 70ms
        holdTimerRef.current = setTimeout(() => {
            holdIntervalRef.current = setInterval(() => {
                onTimeChangeRef.current(getNextTime(currentTimeRef.current, timeStepRef.current, speedMultiplierRef.current, direction));
            }, 70);
        }, 280);
    };

    useEffect(() => {
        return () => stopHold();
    }, [stopHold]);

    // Sync accumulated time when not playing or when currentTime is manually changed
    useEffect(() => {
        if (!isPlaying) {
            accumulatedTimeMsRef.current = currentTime.getTime();
        }
    }, [currentTime, isPlaying]);

    // Play loop (silky smooth continuous 60fps rotation)
    useEffect(() => {
        if (isPlaying) {
            onSetRealTime(false);
            lastTimestampRef.current = performance.now();

            let initialMs = currentTime.getTime();
            if (loopARef.current && loopBRef.current) {
                const startMs = Math.min(loopARef.current.getTime(), loopBRef.current.getTime());
                const endMs = Math.max(loopARef.current.getTime(), loopBRef.current.getTime());
                if (initialMs < startMs || initialMs > endMs) {
                    initialMs = playbackDirectionRef.current === -1 ? endMs : startMs;
                }
            }
            accumulatedTimeMsRef.current = initialMs;

            const getStepMs = (step: string): number => {
                switch (step) {
                    case 'sec': return 1000;
                    case 'min': return 60 * 1000;
                    case 'hour': return 60 * 60 * 1000;
                    case 'day': return 24 * 60 * 60 * 1000;
                    case 'month': return 30 * 24 * 60 * 60 * 1000;
                    case 'year': return 365.25 * 24 * 60 * 60 * 1000;
                    default: return 60 * 60 * 1000;
                }
            };

            const animate = (now: number) => {
                if (!isPlayingRef.current) return;

                if (lastTimestampRef.current !== null) {
                    const deltaRealMs = Math.min(100, now - lastTimestampRef.current);
                    const stepMs = getStepMs(timeStepRef.current);
                    // Base rate: 1 step unit per 150ms of real time
                    const simulatedMsPerRealMs = (stepMs / 150) * speedMultiplierRef.current;
                    const simulatedDeltaMs = deltaRealMs * simulatedMsPerRealMs * playbackDirectionRef.current;

                    accumulatedTimeMsRef.current += simulatedDeltaMs;

                    // Handle A-B loop boundaries
                    const curA = loopARef.current;
                    const curB = loopBRef.current;
                    if (curA && curB) {
                        const startMs = Math.min(curA.getTime(), curB.getTime());
                        const endMs = Math.max(curA.getTime(), curB.getTime());
                        const loopSpan = endMs - startMs;
                        if (loopSpan > 0) {
                            if (accumulatedTimeMsRef.current >= endMs) {
                                const overflow = accumulatedTimeMsRef.current - endMs;
                                accumulatedTimeMsRef.current = startMs + (overflow % loopSpan);
                            } else if (accumulatedTimeMsRef.current < startMs) {
                                const underflow = startMs - accumulatedTimeMsRef.current;
                                accumulatedTimeMsRef.current = endMs - (underflow % loopSpan);
                            }
                        }
                    }

                    onTimeChangeRef.current(new Date(accumulatedTimeMsRef.current));
                }

                lastTimestampRef.current = now;
                animationFrameIdRef.current = requestAnimationFrame(animate);
            };

            animationFrameIdRef.current = requestAnimationFrame(animate);
        } else {
            if (animationFrameIdRef.current !== null) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
        }

        return () => {
            if (animationFrameIdRef.current !== null) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
        };
    }, [isPlaying]);

    const speedBtnRef = useRef<HTMLDivElement>(null);
    const [isDraggingSpeed, setIsDraggingSpeed] = useState(false);
    const dragStartYRef = useRef<number>(0);
    const dragStartIdxRef = useRef<number>(0);
    const hasDraggedRef = useRef<boolean>(false);

    const setSpeedByIndex = (index: number) => {
        const clamped = Math.max(0, Math.min(SPEED_LADDER.length - 1, index));
        const target = SPEED_LADDER[clamped];
        if (target.step !== timeStepRef.current) {
            onTimeStepChange(target.step);
        }
        if (target.mult !== speedMultiplierRef.current) {
            onSpeedMultiplierChange(target.mult);
        }
    };

    useEffect(() => {
        const el = speedBtnRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const currentIdx = findSpeedIndex(timeStepRef.current, speedMultiplierRef.current);
            const dir = e.deltaY < 0 ? 1 : -1;
            setSpeedByIndex(currentIdx + dir);
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            el.removeEventListener('wheel', handleWheel);
        };
    }, [onTimeStepChange, onSpeedMultiplierChange]);

    const handleSpeedPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;

        dragStartYRef.current = e.clientY;
        dragStartIdxRef.current = findSpeedIndex(timeStepRef.current, speedMultiplierRef.current);
        hasDraggedRef.current = false;

        const handlePointerMove = (moveEv: PointerEvent) => {
            const deltaY = dragStartYRef.current - moveEv.clientY;
            if (Math.abs(deltaY) > 4) {
                hasDraggedRef.current = true;
                setIsDraggingSpeed(true);
            }
            if (hasDraggedRef.current) {
                const STEP_SENSITIVITY = 16;
                const steps = Math.trunc(deltaY / STEP_SENSITIVITY);
                setSpeedByIndex(dragStartIdxRef.current + steps);
            }
        };

        const handlePointerUp = () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);

            if (!hasDraggedRef.current) {
                const currentIdx = findSpeedIndex(timeStepRef.current, speedMultiplierRef.current);
                const nextIdx = (currentIdx + 1) % SPEED_LADDER.length;
                setSpeedByIndex(nextIdx);
            }
            setIsDraggingSpeed(false);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
    };

    const nudge = (unit: 'd' | 'm' | 'y' | 'h' | 'i' | 's', direction: number) => {
        onSetRealTime(false);
        const next = new Date(currentTime);
        switch (unit) {
            case 'd': next.setDate(next.getDate() + direction); break;
            case 'm': next.setMonth(next.getMonth() + direction); break;
            case 'y': 
                if (isFreeTier) {
                    onOpenPaymentPlans?.();
                    return;
                }
                next.setFullYear(next.getFullYear() + direction); 
                break;
            case 'h': next.setHours(next.getHours() + direction); break;
            case 'i': next.setMinutes(next.getMinutes() + direction); break;
            case 's': next.setSeconds(next.getSeconds() + direction); break;
        }
        if (isFreeTier) {
            const { startDate, endDate } = getFreeTierSolarYearBounds(next);
            if (next.getTime() < startDate.getTime() || next.getTime() > endDate.getTime()) {
                onOpenPaymentPlans?.();
                return;
            }
        }
        onTimeChange(next);
    };

    // Formatted time components for timestamp
    const pad = (n: number) => String(n).padStart(2, '0');
    const dayVal = pad(currentTime.getDate());
    const monthVal = pad(currentTime.getMonth() + 1);
    const yearVal = String(currentTime.getFullYear());
    const hourVal = pad(currentTime.getHours());
    const minVal = pad(currentTime.getMinutes());
    const segVal = pad(currentTime.getSeconds());

    const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 640);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const effectiveLeftOffset = isDesktop ? (leftDockOffset ?? 242) : 0;
    const effectiveRightOffset = isDesktop ? (rightDockOffset ?? (isQuickToolsSidebarOpen ? 304 : 248)) : 0;

    return (
        <div 
            className={`fixed bottom-0 z-30 flex flex-col justify-end font-sans selection:bg-brand-purple/30 select-none transition-all duration-300 pointer-events-none ${
                isLight ? 'text-neutral-800' : 'text-[#F5F2EB]'
            }`}
            style={{
                left: `${effectiveLeftOffset}px`,
                right: `${effectiveRightOffset}px`
            }}
        >
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: isLight 
                        ? 'linear-gradient(to top, rgba(244, 241, 234, 0.96) 0%, rgba(244, 241, 234, 0.85) 60%, rgba(244, 241, 234, 0) 100%)'
                        : 'linear-gradient(to top, rgba(3, 3, 10, 0.98) 0%, rgba(3, 3, 10, 0.85) 60%, rgba(3, 3, 10, 0) 100%)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    maskImage: 'linear-gradient(to top, black 40%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 100%)'
                }}
            />
            <div 
                ref={toolbarContainerRef}
                className={`z-10 flex flex-col gap-1.5 w-full pointer-events-auto pb-2.5 sm:pb-3.5 transition-all mx-auto ${
                isFullWidth 
                    ? 'px-3 sm:px-4 md:px-6 max-w-none' 
                    : 'max-w-[780px] sm:max-w-[760px] md:max-w-[780px] lg:max-w-[840px] px-2 sm:px-3'
            }`}>
                <div className={`w-full transition-all duration-300 pt-1 ${isTimelineMinimized ? 'max-h-0 opacity-0 overflow-hidden pointer-events-none' : 'max-h-[320px] opacity-100 overflow-visible'}`}>
                    <SolarScrubber 
                        currentDate={currentTime} 
                        onChange={(date) => { onSetRealTime(false); onTimeChange(date); }} 
                        onOpenDatePicker={onOpenSettings}
                        onMinimizeTimeline={() => setIsTimelineMinimized(true)}
                        isRealTime={isRealTime}
                        loopA={loopA}
                        loopB={loopB}
                        onSetLoopA={setLoopA}
                        onSetLoopB={setLoopB}
                        onClearLoop={() => { setLoopA(null); setLoopB(null); }}
                        isLight={isLight}
                        isFreeTier={isFreeTier}
                        onOpenPaymentPlans={onOpenPaymentPlans}
                        headerRight={
                            <div className="flex flex-col items-end justify-center font-sans leading-tight select-none py-0.5">
                                <div className={`flex items-center gap-0.5 text-[14px] font-bold tracking-wider ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                                    <UnitCell value={hourVal} isSelected={selectedStampUnit === 'h'} onClick={() => setSelectedStampUnit(prev => prev === 'h' ? null : 'h')} onNudge={(dir) => nudge('h', dir)} isLight={isLight} textSizeClass="text-[14px]" />
                                    <span className={`${isLight ? 'text-neutral-400' : 'text-white/40'} font-bold text-[14px]`}>:</span>
                                    <UnitCell value={minVal} isSelected={selectedStampUnit === 'i'} onClick={() => setSelectedStampUnit(prev => prev === 'i' ? null : 'i')} onNudge={(dir) => nudge('i', dir)} isLight={isLight} textSizeClass="text-[14px]" />
                                </div>
                                <div className={`flex items-center gap-0.5 text-[14px] font-normal tracking-wide ${isLight ? 'text-neutral-800' : 'text-white/80'}`}>
                                    <UnitCell value={dayVal} isSelected={selectedStampUnit === 'd'} onClick={() => setSelectedStampUnit(prev => prev === 'd' ? null : 'd')} onNudge={(dir) => nudge('d', dir)} isLight={isLight} textSizeClass="text-[14px]" useRegularFont />
                                    <span className={`${isLight ? 'text-neutral-400' : 'text-white/40'} text-[12px] font-normal`}>/</span>
                                    <UnitCell value={monthVal} isSelected={selectedStampUnit === 'm'} onClick={() => setSelectedStampUnit(prev => prev === 'm' ? null : 'm')} onNudge={(dir) => nudge('m', dir)} isLight={isLight} textSizeClass="text-[14px]" useRegularFont />
                                    <span className={`${isLight ? 'text-neutral-400' : 'text-white/40'} text-[12px] font-normal`}>/</span>
                                    <UnitCell 
                                        value={yearVal} 
                                        isSelected={selectedStampUnit === 'y'} 
                                        onClick={() => {
                                            if (isFreeTier) {
                                                onOpenPaymentPlans?.();
                                                return;
                                            }
                                            setSelectedStampUnit(prev => prev === 'y' ? null : 'y');
                                        }} 
                                        onNudge={(dir) => nudge('y', dir)} 
                                        isLight={isLight} 
                                        textSizeClass="text-[14px]" 
                                        useRegularFont 
                                    />
                                </div>
                            </div>
                        }
                    />
                </div>
                <div className="relative flex items-center justify-between gap-1 sm:gap-2 w-full h-9 min-w-0">
                    {/* Left corner: Hoje button & Minimize Timeline button */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 z-20">
                        <button
                            onClick={() => { onSetRealTime(true); setIsPlaying(false); }}
                            className={`btn-3d-glow flex items-center justify-center gap-1.5 ${showHojeText ? 'px-3 sm:px-3.5' : 'w-9 px-0'} h-9 rounded-full text-xs font-bold active:scale-95 cursor-pointer shrink-0 ${
                                isRealTime 
                                    ? 'btn-3d-red'
                                    : (isLight ? 'btn-3d-white' : 'btn-3d-dark')
                            }`}
                            title="Tempo Real (Sincronizar Agora - Hoje)"
                        >
                            <span className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${isRealTime ? 'bg-red-400 animate-pulse' : 'bg-red-400'}`} />
                            {showHojeText && <span className="text-xs font-bold hidden min-[480px]:inline">Hoje</span>}
                        </button>
                        <button
                            onClick={() => setIsTimelineMinimized(!isTimelineMinimized)}
                            className={`btn-3d-glow ${isLight ? 'btn-3d-white' : 'btn-3d-dark'} flex items-center justify-center gap-1.5 ${showTimelineText ? 'px-3 sm:px-3.5' : 'w-9 px-0'} h-9 rounded-full text-xs font-bold active:scale-95 cursor-pointer shrink-0`}
                            title={isTimelineMinimized ? "Ver linha do tempo" : "Ocultar linha do tempo"}
                        >
                            <i className={`ti ${isTimelineMinimized ? 'ti-chevron-up' : 'ti-chevron-down'} text-sm shrink-0`} />
                            {showTimelineText && (
                                <span className="text-xs font-bold hidden min-[600px]:inline">
                                    {isTimelineMinimized ? 'Ver linha do tempo' : 'Linha do tempo'}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Center: Step Back (holdable), Play Reverse, Play Forward, Step Forward (holdable), and Marcha (speed) */}
                    <div className="flex items-center justify-center shrink-0 z-20 gap-1 sm:gap-1.5 mx-auto">                        {/* Step Back (Press and hold to rewind continuously) */}
                        <button
                            onPointerDown={(e) => {
                                if (e.button !== 0 && e.pointerType === 'mouse') return;
                                startHold(-1);
                            }}
                            onPointerUp={stopHold}
                            onPointerLeave={stopHold}
                            onPointerCancel={stopHold}
                            className={`btn-3d-glow ${isLight ? 'btn-3d-white' : 'btn-3d-dark'} w-9 h-9 rounded-full active:scale-95 flex items-center justify-center cursor-pointer select-none touch-none`}
                            title="Voltar Passo (Pressione e segure para retroceder)"
                        >
                            <svg className={`w-4 h-4 ${isLight ? 'text-neutral-800' : 'text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="19 20 9 12 19 4 19 20" fill="currentColor" />
                                <line x1="5" y1="5" x2="5" y2="19" />
                            </svg>
                        </button>

                        {/* Play Reverse (Voltar no Tempo Continuamente) */}
                        <button
                            onClick={() => {
                                if (isPlaying && playbackDirection === -1) {
                                    setIsPlaying(false);
                                } else {
                                    setPlaybackDirection(-1);
                                    setIsPlaying(true);
                                }
                            }}
                            className={`btn-3d-glow w-9 h-9 rounded-full flex items-center justify-center active:scale-95 cursor-pointer ${
                                isPlaying && playbackDirection === -1 
                                    ? 'btn-3d-purple'
                                    : (isLight ? 'btn-3d-white' : 'btn-3d-dark')
                            }`}
                            title={isPlaying && playbackDirection === -1 ? "Pausar Reversão" : "Voltar no Tempo Continuamente (Play Reverso)"}
                        >
                            {isPlaying && playbackDirection === -1 ? (
                                <svg className="w-4 h-4 text-purple-300 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" rx="1" />
                                    <rect x="14" y="4" width="4" height="16" rx="1" />
                                </svg>
                            ) : (
                                <svg className={`w-4 h-4 ${isLight ? 'text-neutral-800' : 'text-white'}`} viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="18 4 6 12 18 20 18 4" />
                                </svg>
                            )}
                        </button>

                        {/* Play Forward (Avançar no Tempo Continuamente) */}
                        <button
                            onClick={() => {
                                if (isPlaying && playbackDirection === 1) {
                                    setIsPlaying(false);
                                } else {
                                    setPlaybackDirection(1);
                                    setIsPlaying(true);
                                }
                            }}
                            className={`btn-3d-glow w-9 h-9 rounded-full flex items-center justify-center active:scale-95 cursor-pointer ${
                                isPlaying && playbackDirection === 1 
                                    ? 'btn-3d-amber'
                                    : (isLight ? 'btn-3d-white' : 'btn-3d-dark')
                            }`}
                            title={isPlaying && playbackDirection === 1 ? "Pausar" : "Avançar no Tempo Continuamente (Play)"}
                        >
                            {isPlaying && playbackDirection === 1 ? (
                                <svg className="w-4 h-4 text-amber-300 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" rx="1" />
                                    <rect x="14" y="4" width="4" height="16" rx="1" />
                                </svg>
                            ) : (
                                <svg className={`w-4 h-4 ${isLight ? 'text-neutral-800' : 'text-white'}`} viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="6 3 20 12 6 21 6 3" />
                                </svg>
                            )}
                        </button>

                        {/* Step Forward (Press and hold to advance continuously) */}
                        <button
                            onPointerDown={(e) => {
                                if (e.button !== 0 && e.pointerType === 'mouse') return;
                                startHold(1);
                            }}
                            onPointerUp={stopHold}
                            onPointerLeave={stopHold}
                            onPointerCancel={stopHold}
                            className={`btn-3d-glow ${isLight ? 'btn-3d-white' : 'btn-3d-dark'} w-9 h-9 rounded-full active:scale-95 flex items-center justify-center cursor-pointer select-none touch-none`}
                            title="Avançar Passo (Pressione e segure para avançar)"
                        >
                            <svg className={`w-4 h-4 ${isLight ? 'text-neutral-800' : 'text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" />
                                <line x1="19" y1="5" x2="19" y2="19" />
                            </svg>
                        </button>

                        {/* Marcha (Speed) next to play controls */}
                        <div className="relative shrink-0 flex items-center ml-0.5">
                            <div
                                ref={speedBtnRef}
                                onPointerDown={handleSpeedPointerDown}
                                className={`btn-3d-glow flex items-center gap-1.5 px-3 sm:px-3.5 h-9 rounded-full select-none touch-none cursor-ns-resize active:scale-95 ${
                                    isDraggingSpeed
                                        ? 'btn-3d-amber'
                                        : (isLight ? 'btn-3d-white' : 'btn-3d-dark')
                                }`}
                                title="Velocidade / Marcha (Role ou Arraste ↑/↓ para alterar)"
                            >
                                <span className={`font-mono font-extrabold uppercase text-xs tracking-wider ${isLight ? 'text-amber-600' : 'text-amber-300'}`}>
                                    {STEP_LABELS[timeStep]} x{speedMultiplier}
                                </span>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSpeedStepExpanded(!isSpeedStepExpanded);
                                    }}
                                    className={`p-0.5 ${isLight ? 'text-neutral-500 hover:text-neutral-900' : 'text-white/60 hover:text-white'} transition-colors cursor-pointer`}
                                    title="Grade de marchas"
                                >
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </button>
                            </div>

                            {isSpeedStepExpanded && (
                                <div className={`absolute bottom-12 left-1/2 -translate-x-1/2 z-[70] p-3 rounded-2xl border shadow-2xl backdrop-blur-2xl flex flex-col gap-2.5 min-w-[300px] max-h-[380px] overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-150 ${
                                    isLight 
                                        ? 'bg-white/98 border-black/15 shadow-[0_10px_30px_rgba(0,0,0,0.15)] text-neutral-800' 
                                        : 'bg-[rgba(10,8,22,0.98)] border-white/15 shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-white'
                                }`}>
                                    <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                                            Seleção de Marcha
                                        </span>
                                        <button 
                                            onClick={() => setIsSpeedStepExpanded(false)}
                                            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white text-xs"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {(['sec', 'min', 'hour', 'day', 'month', 'year'] as const).map(stepKey => {
                                            const stepPresets = SPEED_LADDER.filter(p => p.step === stepKey);
                                            return (
                                                <div key={stepKey} className="flex flex-col gap-1">
                                                    <span className={`text-[9px] font-bold tracking-widest uppercase ${isLight ? 'text-neutral-500' : 'text-white/40'}`}>
                                                        {STEP_LABELS[stepKey]}
                                                    </span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {stepPresets.map(preset => {
                                                            const isActive = timeStep === preset.step && speedMultiplier === preset.mult;
                                                            return (
                                                                <button
                                                                    key={`${preset.step}-${preset.mult}`}
                                                                    onClick={() => {
                                                                        onTimeStepChange(preset.step);
                                                                        onSpeedMultiplierChange(preset.mult);
                                                                        setIsSpeedStepExpanded(false);
                                                                    }}
                                                                    className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                                                                        isActive
                                                                            ? 'bg-amber-500 border-amber-400 text-black shadow-md font-extrabold scale-105'
                                                                            : isLight
                                                                                ? 'bg-black/5 border-black/10 text-neutral-700 hover:bg-black/10'
                                                                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                                                                    }`}
                                                                >
                                                                    {STEP_LABELS[preset.step]} x{preset.mult}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right corner: Bloquear Zodíaco + Apresentar + Minimizar/Maximizar icon button */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 z-20">
                        <button
                            onClick={onToggleZodiacFixed}
                            className={`btn-3d-glow h-9 ${showZodiacText ? 'px-3 sm:px-3.5' : 'w-9 px-0'} rounded-full flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer text-xs font-bold ${
                                isZodiacFixed 
                                    ? 'btn-3d-amber'
                                    : (isLight ? 'btn-3d-white' : 'btn-3d-dark')
                            }`}
                            title={isZodiacFixed ? "Desbloquear Zodíaco" : "Bloquear Zodíaco"}
                        >
                            <i className="ti ti-lock text-xs shrink-0" />
                            {showZodiacText && (
                                <span className="hidden min-[780px]:inline">Bloquear Zodíaco</span>
                            )}
                        </button>

                        {/* Botão Apresentar no controle central ao lado direito do Bloquear Zodíaco */}
                        {onToggleFullscreen && (
                            <button
                                onClick={onToggleFullscreen}
                                className={`btn-3d-glow h-9 ${showFullscreenText ? 'px-3 sm:px-3.5' : 'w-9 px-0'} rounded-full flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer text-xs font-bold ${
                                    isFullscreen
                                        ? 'btn-3d-amber'
                                        : (isLight ? 'btn-3d-white' : 'btn-3d-dark')
                                }`}
                                title="Alternar Modo Apresentação (Tela Cheia)"
                            >
                                <i className="ti ti-maximize text-xs sm:text-sm shrink-0" />
                                {showFullscreenText && (
                                    <span className="hidden min-[700px]:inline">Apresentar</span>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const UnitCell: React.FC<{
    label?: string;
    value: string | number;
    isSelected: boolean;
    onClick: () => void;
    onNudge: (dir: number) => void;
    isLight?: boolean;
    textSizeClass?: string;
    useRegularFont?: boolean;
}> = ({ value, isSelected, onClick, onNudge, isLight, textSizeClass = "text-xs", useRegularFont = false }) => {
    const ref = useRef<HTMLDivElement>(null);
    const onNudgeRef = useRef(onNudge);
    onNudgeRef.current = onNudge;

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            onNudgeRef.current(e.deltaY < 0 ? 1 : -1);
        };
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            el.removeEventListener('wheel', handleWheel);
        };
    }, []);

    return (
        <div
            ref={ref}
            onClick={onClick}
            className={`flex items-center justify-center h-6 px-1 rounded transition-all cursor-ns-resize ${
                isSelected 
                    ? (isLight ? 'bg-black/10 ring-1 ring-black/25 text-neutral-900' : 'bg-white/20 ring-1 ring-white/40 text-white')
                    : (isLight ? 'hover:bg-black/[0.06] text-neutral-800' : 'hover:bg-white/[0.06] text-white/80')
            }`}
        >
            <span className={`${textSizeClass} ${useRegularFont ? 'font-sans font-normal' : 'font-mono'} leading-none ${
                isSelected 
                    ? (isLight ? 'text-neutral-900 font-bold' : 'text-white font-bold') 
                    : (isLight ? 'text-neutral-800 font-normal' : 'text-white/80 font-normal')
            }`}>{value}</span>
        </div>
    );
};
export const YearNavigation: React.FC<{
    year: number;
    onPrev: () => void;
    onNext: () => void;
    onYearClick: (year: number) => void;
}> = ({ year, onPrev, onNext, onYearClick }) => {
    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        if (e.deltaY > 0) {
            onPrev();
        } else if (e.deltaY < 0) {
            onNext();
        }
    };

    return (
        <div
            className="flex items-center gap-4 bg-brand-surface-highlight/20 p-1.5 rounded-xl border border-white/5 shadow-inner"
            onWheel={handleWheel}
        >
            <button
                onClick={onPrev}
                className="p-2 rounded-lg hover:bg-white/10 text-brand-text-muted hover:text-brand-text transition-all active:scale-90"
                title="Ano Anterior"
            >
                <UI_ICONS.StepBackIcon className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4 px-2 overflow-hidden">
                {[year - 3, year - 2, year - 1].map(y => (
                    <span
                        key={y}
                        className="text-[10px] font-bold text-brand-text-muted/20 cursor-pointer hover:text-brand-text-muted/50 transition-colors uppercase tracking-widest"
                        onClick={() => onYearClick(y)}
                    >
                        {y}
                    </span>
                ))}

                <h2 className="text-xl font-black text-brand-text min-w-[60px] text-center tracking-tighter">
                    {year}
                </h2>

                {[year + 1, year + 2, year + 3].map(y => (
                    <span
                        key={y}
                        className="text-[10px] font-bold text-brand-text-muted/20 cursor-pointer hover:text-brand-text-muted/50 transition-colors uppercase tracking-widest"
                        onClick={() => onYearClick(y)}
                    >
                        {y}
                    </span>
                ))}
            </div>

            <button
                onClick={onNext}
                className="p-2 rounded-lg hover:bg-white/10 text-brand-text-muted hover:text-brand-text transition-all active:scale-90"
                title="Próximo Ano"
            >
                <UI_ICONS.StepForwardIcon className="w-4 h-4" />
            </button>
        </div>
    );
};