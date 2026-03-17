
import React, { useMemo } from 'react';
import { ZODIAC_DATA, ELEMENT_COLORS, MODALITY_COLORS, POLARITY_COLORS, getZodiacColorClass } from './zodiac';
import { ZODIAC_ICONS } from './icons';
import { normalizeAngle, polarToCartesian } from '../lib/astrology/utils';
import { HighlightFilter } from './ChartStatisticsPanel';

interface ZodiacRingProps {
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
    rotation: number;
    onHover: (id: string) => void;
    onLeave: () => void;
    iconSize?: number;
    colorMode?: 'none' | 'element' | 'modality' | 'polarity';
    highlightFilter?: HighlightFilter;
}

export const ZodiacRing: React.FC<ZodiacRingProps> = ({
    cx, cy, innerRadius, outerRadius, rotation, onHover, onLeave, iconSize = 24, colorMode = 'element', highlightFilter
}) => {
    
    const getAngle = (longitude: number) => {
        // Base angle calculation (rotation = 0)
        // Matches SiderealClock logic: 180 (Left) - longitude
        const angle = 180 - longitude;
        return normalizeAngle(angle);
    };

    const describeSector = (x: number, y: number, r1: number, r2: number, startAngle: number, endAngle: number) => {
        const startOuter = polarToCartesian(x, y, r2, startAngle);
        const endOuter = polarToCartesian(x, y, r2, endAngle);
        const startInner = polarToCartesian(x, y, r1, endAngle);
        const endInner = polarToCartesian(x, y, r1, startAngle);

        // For sweepFlag 0 (counter-clockwise), the positive difference is start - end
        let diff = startAngle - endAngle;
        if (diff < 0) diff += 360;
        const largeArcFlag = diff > 180 ? 1 : 0;
        const sweepFlag = 0; 

        return [
            "M", startOuter.x, startOuter.y,
            "A", r2, r2, 0, largeArcFlag, sweepFlag, endOuter.x, endOuter.y,
            "L", startInner.x, startInner.y,
            "A", r1, r1, 0, largeArcFlag, 1, endInner.x, endInner.y, 
            "Z"
        ].join(" ");
    };

    return (
        <g transform={`rotate(${rotation}, ${cx}, ${cy})`}>
            {ZODIAC_DATA.map((sign, i) => {
                const startLon = i * 30;
                const endLon = (i + 1) * 30;
                
                const startAngle = getAngle(startLon);
                const endAngle = getAngle(endLon);
                
                // Midpoint for icon - slightly closer to inner radius for elegance
                const midAngle = getAngle(startLon + 15);
                const midR = innerRadius + (outerRadius - innerRadius) * 0.5;
                const pos = polarToCartesian(cx, cy, midR, midAngle);

                const SignIcon = ZODIAC_ICONS[sign.id as keyof typeof ZODIAC_ICONS];
                
                // Check Highlight Filter
                let isDimmed = false;
                if (highlightFilter) {
                    if (highlightFilter.type === 'element' && sign.element !== highlightFilter.value) isDimmed = true;
                    if (highlightFilter.type === 'modality' && sign.modality !== highlightFilter.value) isDimmed = true;
                    if (highlightFilter.type === 'polarity' && sign.polarity !== highlightFilter.value) isDimmed = true;
                }

                const opacity = isDimmed ? 0.1 : 1;
                
                const getGradientId = (element: string) => {
                    switch(element) {
                        case 'fire': return 'url(#zodiac-fire)';
                        case 'earth': return 'url(#zodiac-earth)';
                        case 'air': return 'url(#zodiac-air)';
                        case 'water': return 'url(#zodiac-water)';
                        default: return 'currentColor';
                    }
                };

                const getIconGradientId = (element: string) => {
                    switch(element) {
                        case 'fire': return 'url(#zodiac-icon-fire)';
                        case 'earth': return 'url(#zodiac-icon-earth)';
                        case 'air': return 'url(#zodiac-icon-air)';
                        case 'water': return 'url(#zodiac-icon-water)';
                        default: return 'currentColor';
                    }
                };

                let iconFill = 'currentColor';
                let iconColor = 'text-white dark:text-gray-300';
                if (colorMode === 'element') {
                    iconFill = getIconGradientId(sign.element);
                    iconColor = ''; // Clear color class to use fill
                } else if (colorMode === 'modality') {
                    iconColor = MODALITY_COLORS[sign.modality];
                } else if (colorMode === 'polarity') {
                    iconColor = POLARITY_COLORS[sign.polarity];
                } else if (colorMode && colorMode !== 'none') {
                    iconColor = getZodiacColorClass(sign, colorMode as 'element' | 'modality' | 'polarity');
                }

                return (
                    <g 
                        key={sign.id} 
                        className="group"
                        onMouseEnter={() => onHover(sign.id)}
                        onMouseLeave={onLeave}
                        style={{ opacity, transition: 'opacity 0.2s ease-in-out' }}
                    >
                        {/* Background Sector */}
                        <path 
                            d={describeSector(cx, cy, innerRadius, outerRadius, startAngle, endAngle)}
                            fill={colorMode === 'element' ? getGradientId(sign.element) : 'transparent'}
                            fillOpacity="0.15"
                            stroke="none"
                            className="hover:brightness-150 cursor-pointer"
                        />

                        {/* Separator Lines - Subtle for elegance */}
                        <line 
                            x1={polarToCartesian(cx, cy, innerRadius, startAngle).x}
                            y1={polarToCartesian(cx, cy, innerRadius, startAngle).y}
                            x2={polarToCartesian(cx, cy, outerRadius, startAngle).x}
                            y2={polarToCartesian(cx, cy, outerRadius, startAngle).y}
                            stroke="currentColor"
                            className="text-brand-border"
                            strokeOpacity="0.1"
                            strokeWidth="0.5"
                        />

                        {/* Icon Container - Symbols Upright, Scalable */}
                        <g transform={`translate(${pos.x}, ${pos.y}) rotate(${-rotation})`}>
                            <g className="opacity-80 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-2xl">
                                <SignIcon 
                                    className={iconColor} 
                                    width={iconSize} 
                                    height={iconSize} 
                                    x={-iconSize / 2} 
                                    y={-iconSize / 2}
                                    fill={iconFill}
                                    stroke={iconFill === 'currentColor' ? 'currentColor' : 'none'}
                                    strokeWidth="8" 
                                />
                            </g>
                        </g>
                    </g>
                );
            })}
            {/* Outer Border Ring */}
             <circle cx={cx} cy={cy} r={innerRadius} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" className="text-brand-border" />
             <circle cx={cx} cy={cy} r={outerRadius} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" className="text-brand-border" />
        </g>
    );
};
