import React from 'react';
import { CelestialData } from '../../hooks/useCelestialData';
import { normalizeAngle, polarToCartesian } from '../../lib/astrology/utils';

interface TimeRingLayerProps {
    cx: number;
    cy: number;
    radius: number;
    celestialData: CelestialData;
    showTimeRing: boolean;
    timeRingScale: number;
    isZodiacFixed: boolean;
}

export const TimeRingLayer: React.FC<TimeRingLayerProps> = ({
    cx,
    cy,
    radius,
    celestialData,
    showTimeRing,
    timeRingScale,
    isZodiacFixed
}) => {
    if (!showTimeRing) return null;

    const { 
        ascendantLongitude, midheavenLongitude, descendantLongitude, imumCoeliLongitude,
        currentTime, sunEclipticLongitude
    } = celestialData;

    const getAngle = (longitude: number) => {
        const anchor = isZodiacFixed ? 0 : (ascendantLongitude || 0);
        let angle = 180 - (longitude - anchor);
        return normalizeAngle(angle);
    };

    const getTimeAngle = (h: number) => {
        // Use Sun's current position to determine time angle
        if (typeof celestialData.sunEclipticLongitude === 'number' && celestialData.currentTime) {
            const sunAngle = getAngle(celestialData.sunEclipticLongitude);
            const currentDecimalHour = celestialData.currentTime.getHours() + celestialData.currentTime.getMinutes() / 60 + celestialData.currentTime.getSeconds() / 3600;
            
            const timeDiff = h - currentDecimalHour;
            const angleDiff = timeDiff * 15;
            
            return normalizeAngle(sunAngle + angleDiff);
        }

        const a6 = getAngle(ascendantLongitude);   // 06:00 -> ASC (Left)
        const a12 = getAngle(midheavenLongitude);  // 12:00 -> MC (Top)
        const a18 = getAngle(descendantLongitude); // 18:00 -> DSC (Right)
        const a0 = getAngle(imumCoeliLongitude);   // 00:00 -> IC (Bottom)

        let startA, endA, ratio;
        
        if (h >= 6 && h < 12) {
            startA = a6; endA = a12; ratio = (h - 6) / 6;
        } else if (h >= 12 && h < 18) {
            startA = a12; endA = a18; ratio = (h - 12) / 6;
        } else if (h >= 18 && h < 24) {
            startA = a18; endA = a0; ratio = (h - 18) / 6;
        } else {
            // 0-6
            startA = a0; endA = a6; ratio = h / 6;
        }

        let diff = endA - startA;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        return normalizeAngle(startA + (diff * ratio));
    };

    const timeTicks = [];
    for (let h = 0; h < 24; h++) {
        const angle = getTimeAngle(h);
        // Show all hours
        const isMajor = h % 3 === 0;
        const tickLength = isMajor ? 10 : 5;
        
        const start = polarToCartesian(cx, cy, radius - tickLength, angle);
        const end = polarToCartesian(cx, cy, radius, angle);
        
        timeTicks.push(
            <line 
                key={`tick-${h}`}
                x1={start.x} y1={start.y} 
                x2={end.x} y2={end.y} 
                stroke="currentColor" 
                strokeWidth={isMajor ? 1.5 : 1}
                opacity={isMajor ? 0.6 : 0.3}
            />
        );

        const textPos = polarToCartesian(cx, cy, radius - 20, angle);
        timeTicks.push(
            <text 
                key={`text-${h}`}
                x={textPos.x} y={textPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`text-[8px] font-manrope font-bold fill-current ${isMajor ? 'opacity-80 text-[10px]' : 'opacity-40'}`}
                transform={`rotate(${angle + 90}, ${textPos.x}, ${textPos.y})`}
            >
                {h}h
            </text>
        );
    }

    return (
        <g className="time-ring-layer text-brand-text-muted pointer-events-none" style={{ transform: `scale(${timeRingScale})`, transformOrigin: `${cx}px ${cy}px` }}>
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
            {timeTicks}
        </g>
    );
};
