import React, { useMemo } from 'react';
import { UI_ICONS, ZODIAC_ICONS } from './icons';
import { getMoonAge } from '../lib/astrology/calendars';
import { getMoonPhaseInfo } from '../lib/astrology/moon';
import { ZODIAC_DATA } from './zodiac';

interface MoonInfoPanelProps {
    moonPhase: number;
    moonIllumination: number;
    moonEclipticLongitude: number;
    moonriseTime: string;
    moonsetTime: string;
    currentDate: Date;
    className?: string;
    onClick?: () => void;
}

export const MoonInfoPanel: React.FC<MoonInfoPanelProps> = ({ moonPhase, moonIllumination, moonEclipticLongitude, moonriseTime, moonsetTime, currentDate, className, onClick }) => {
    const moonAge = useMemo(() => getMoonAge(moonPhase), [moonPhase]);
    const moonPhaseInfo = useMemo(() => getMoonPhaseInfo(moonPhase), [moonPhase]);
    const zodiacSign = useMemo(() => {
        const signIndex = Math.floor(moonEclipticLongitude / 30);
        return ZODIAC_DATA[signIndex];
    }, [moonEclipticLongitude]);

    return (
        <div 
            onClick={onClick}
            className={`flex items-center bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-2xl p-3 gap-4 shadow-2xl ring-1 ring-white/5 min-h-[84px] w-[240px] ${onClick ? 'cursor-pointer hover:bg-brand-surface-highlight/50 transition-colors' : ''} ${className || ''}`}
        >
            <div className="text-[27px] leading-none select-none flex-shrink-0 text-slate-200 drop-shadow-[0_0_12px_rgba(203,213,225,0.5)]">
                {moonPhaseInfo.icon}
            </div>
            <div className="flex flex-col justify-center flex-1 overflow-hidden font-manrope">
                <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-xs font-bold text-brand-text uppercase tracking-widest leading-tight truncate">
                        {moonPhaseInfo.name}
                    </span>
                </div>

                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] text-brand-text-muted font-medium tracking-wide tabular-nums">
                        Dia {moonAge} - {Math.round(moonIllumination * 100)}%
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[10px] text-brand-text-muted font-medium tabular-nums tracking-wide">
                        <span>Nascer: {moonriseTime}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-brand-text-muted font-medium tabular-nums tracking-wide">
                        <span>Pôr: {moonsetTime}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
