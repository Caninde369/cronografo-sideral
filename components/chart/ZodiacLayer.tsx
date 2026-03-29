import React from 'react';
import { ZODIAC_DATA, ELEMENT_COLORS } from '../zodiac';
import { ZODIAC_ICONS } from '../icons';
import { normalizeAngle, polarToCartesian } from '../../lib/astrology/utils';

interface ZodiacLayerProps {
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
    seasonsInnerRadius?: number;
    seasonsOuterRadius?: number;
    zodiacRotation: number;
    zodiacSignSize: number;
    zodiacColorMode: 'none' | 'element' | 'modality' | 'polarity';
    showSignLines: boolean;
    signLineThickness: number;
    signLineOpacity: number;
    isZodiacFixed: boolean;
    ascendantLongitude: number;
    showSeasonsRing?: boolean;
    onSignClick?: (signId: string) => void;
    onSignHover?: (e: React.MouseEvent, signId: string) => void;
}

const describeAnnularSector = (x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) => {
    const startOuter = polarToCartesian(x, y, outerRadius, startAngle);
    const endOuter = polarToCartesian(x, y, outerRadius, endAngle);
    const startInner = polarToCartesian(x, y, innerRadius, endAngle);
    const endInner = polarToCartesian(x, y, innerRadius, startAngle);

    let diff = endAngle - startAngle;
    if (diff < 0) diff += 360;
    
    const largeArcFlag = diff > 180 ? "1" : "0";

    return [
        "M", startOuter.x, startOuter.y,
        "A", outerRadius, outerRadius, 0, largeArcFlag, 1, endOuter.x, endOuter.y,
        "L", startInner.x, startInner.y,
        "A", innerRadius, innerRadius, 0, largeArcFlag, 0, endInner.x, endInner.y,
        "Z"
    ].join(" ");
};

const SEASONS = [
    // Southern Hemisphere Seasons (Standard Astrology)
    // Aries Ingress (0°) -> Autumn (Outono)
    { name: 'OUTONO', color: '#fb923c', startLon: 0, endLon: 90 },
    // Cancer Ingress (90°) -> Winter (Inverno)
    { name: 'INVERNO', color: '#60a5fa', startLon: 90, endLon: 180 },
    // Libra Ingress (180°) -> Spring (Primavera)
    { name: 'PRIMAVERA', color: '#4ade80', startLon: 180, endLon: 270 },
    // Capricorn Ingress (270°) -> Summer (Verão)
    { name: 'VERÃO', color: '#facc15', startLon: 270, endLon: 360 },
];

const ELEMENT_HEX_COLORS: Record<string, string> = {
    fire: '#fb923c', // Orange-400 (Copper)
    earth: '#34d399', // Emerald-400 (Emerald)
    air: '#fef3c7', // Amber-100 (Champagne)
    water: '#60a5fa', // Blue-400 (Sapphire)
};

export const ZodiacLayer: React.FC<ZodiacLayerProps> = ({
    cx,
    cy,
    innerRadius,
    outerRadius,
    seasonsInnerRadius,
    seasonsOuterRadius,
    zodiacRotation,
    zodiacSignSize,
    zodiacColorMode,
    showSignLines,
    signLineThickness,
    signLineOpacity,
    isZodiacFixed,
    ascendantLongitude,
    showSeasonsRing,
    onSignClick,
    onSignHover
}) => {
    const getAngle = (longitude: number) => {
        const anchor = isZodiacFixed ? 0 : (ascendantLongitude || 0);
        let angle = 180 - (longitude - anchor);
        return normalizeAngle(angle);
    };

    return (
        <g className="zodiac-layer">
            {/* Seasons Ring */}
            {showSeasonsRing && seasonsInnerRadius && seasonsOuterRadius && SEASONS.map((season, i) => {
                const startAngle = getAngle(season.endLon);
                const endAngle = getAngle(season.startLon);
                
                // Calculate mid angle for label
                let midAngle = (startAngle + endAngle) / 2;
                if (Math.abs(startAngle - endAngle) > 180) {
                    midAngle += 180;
                }
                midAngle = normalizeAngle(midAngle);

                const path = describeAnnularSector(cx, cy, seasonsInnerRadius, seasonsOuterRadius, startAngle, endAngle);
                const labelPos = polarToCartesian(cx, cy, (seasonsInnerRadius + seasonsOuterRadius) / 2, midAngle);

                return (
                    <g key={`season-${i}`}>
                        <path d={path} fill={season.color} fillOpacity={0.2} stroke="none" />
                        <text
                            x={labelPos.x}
                            y={labelPos.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-[10px] font-bold fill-current opacity-80 pointer-events-none uppercase tracking-widest"
                            transform={`rotate(${midAngle + 90}, ${labelPos.x}, ${labelPos.y})`}
                            style={{ fill: season.color }}
                        >
                            {season.name}
                        </text>
                    </g>
                );
            })}

            {ZODIAC_DATA.map((sign, index) => {
                const startAngle = getAngle((index + 1) * 30);
                const endAngle = getAngle(index * 30);
                
                if (isNaN(startAngle) || isNaN(endAngle)) return null;

                // Calculate mid angle for icon placement
                let midAngle = (startAngle + endAngle) / 2;
                // Handle wrap-around case
                if (Math.abs(startAngle - endAngle) > 180) {
                    midAngle += 180;
                }
                midAngle = normalizeAngle(midAngle);

                const path = describeAnnularSector(cx, cy, innerRadius, outerRadius, startAngle, endAngle);
                const iconPos = polarToCartesian(cx, cy, (innerRadius + outerRadius) / 2, midAngle);

                // Determine fill color based on mode
                let fillColor = 'transparent';
                let fillOpacity = 0;

                if (zodiacColorMode === 'element') {
                    fillColor = ELEMENT_HEX_COLORS[sign.element];
                    fillOpacity = 0.15;
                } else if (zodiacColorMode === 'modality') {
                    // Simple modality colors
                    if (sign.modality === 'cardinal') fillColor = '#ef4444'; // Red
                    if (sign.modality === 'fixed') fillColor = '#3b82f6'; // Blue
                    if (sign.modality === 'mutable') fillColor = '#eab308'; // Yellow
                    fillOpacity = 0.15;
                } else if (zodiacColorMode === 'polarity') {
                    fillColor = sign.polarity === 'positive' ? '#f59e0b' : '#6366f1';
                    fillOpacity = 0.15;
                }

                const Icon = ZODIAC_ICONS[sign.id as keyof typeof ZODIAC_ICONS];

                return (
                    <g 
                        key={sign.id} 
                        onClick={() => onSignClick?.(sign.id)}
                        onMouseEnter={(e) => onSignHover?.(e, sign.id)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        <path 
                            d={path} 
                            fill={fillColor} 
                            fillOpacity={fillOpacity}
                            stroke="rgba(255,255,255,0.1)" 
                            strokeWidth="1"
                        />
                        
                        {/* Sign Icon */}
                        <g transform={`translate(${iconPos.x - zodiacSignSize/2}, ${iconPos.y - zodiacSignSize/2})`}>
                            <Icon 
                                width={zodiacSignSize} 
                                height={zodiacSignSize} 
                                className="text-brand-text-muted"
                                style={{ color: zodiacColorMode === 'element' ? ELEMENT_HEX_COLORS[sign.element] : undefined }}
                            />
                        </g>

                        {/* Sign Lines (Cusps) */}
                        {showSignLines && (
                            <line
                                x1={polarToCartesian(cx, cy, innerRadius, startAngle).x}
                                y1={polarToCartesian(cx, cy, innerRadius, startAngle).y}
                                x2={polarToCartesian(cx, cy, innerRadius - 100, startAngle).x} // Extend inwards
                                y2={polarToCartesian(cx, cy, innerRadius - 100, startAngle).y}
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth={signLineThickness}
                                strokeOpacity={signLineOpacity}
                                strokeDasharray="4 4"
                            />
                        )}
                    </g>
                );
            })}
        </g>
    );
};
