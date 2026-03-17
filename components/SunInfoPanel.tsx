import React, { useMemo } from 'react';
import { UI_ICONS } from './icons';
import { getDayOfYear, getSeasonInfo, getTzolkinDate } from '../lib/astrology/calendars';

interface SunInfoPanelProps {
    sunriseTime: string;
    sunsetTime: string;
    currentDate: Date;
    className?: string;
}

export const SunInfoPanel: React.FC<SunInfoPanelProps> = ({ sunriseTime, sunsetTime, currentDate, className }) => {
    const dayOfYear = useMemo(() => getDayOfYear(currentDate), [currentDate]);
    const seasonInfo = useMemo(() => getSeasonInfo(currentDate), [currentDate]);
    const tzolkinInfo = useMemo(() => getTzolkinDate(currentDate), [currentDate]);

    return (
        <div className={`flex items-center bg-brand-surface/80 backdrop-blur-xl border border-brand-border/10 rounded-2xl p-3 gap-4 shadow-2xl ring-1 ring-white/5 min-h-[84px] w-[240px] ${className || ''}`}>
            <div className="text-[27px] leading-none select-none flex-shrink-0 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
                ☀️
            </div>
            <div className="flex flex-col justify-center flex-1 overflow-hidden font-manrope">
                <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-xs font-bold text-brand-text uppercase tracking-widest leading-tight truncate">
                        SOL
                    </span>
                </div>
                
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] text-brand-text-muted font-medium tracking-wide tabular-nums">
                        Dia {dayOfYear} - {seasonInfo.day}º dia do {seasonInfo.name}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[10px] text-brand-text-muted font-medium tabular-nums tracking-wide">
                        <span>Nascer: {sunriseTime}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-brand-text-muted font-medium tabular-nums tracking-wide">
                        <span>Pôr: {sunsetTime}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
