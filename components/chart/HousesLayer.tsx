import React from 'react';
import { CelestialData } from '../../hooks/useCelestialData';
import { normalizeAngle, polarToCartesian, toRoman } from '../../lib/astrology/utils';
import { HOUSE_RULERS } from '../../lib/astrology/constants';
import { CELESTIAL_GLYPHS } from '../icons';

interface HousesLayerProps {
    cx: number;
    cy: number;
    radius: number;
    celestialData: CelestialData;
    houseFormat: 'arabic' | 'roman';
    houseLineFormat: 'solid' | 'dashed';
    houseLineThickness: number;
    houseLineOpacity: number;
    showHouseLines: boolean;
    onHouseClick?: (house: number) => void;
    onHouseHover?: (e: React.MouseEvent, house: number) => void;
    selectedHouses: number[];
    hoveredHouse: number | null;
    isZodiacFixed: boolean;
}

export const HousesLayer: React.FC<HousesLayerProps> = ({
    cx,
    cy,
    radius,
    celestialData,
    houseFormat,
    houseLineFormat,
    houseLineThickness,
    houseLineOpacity,
    showHouseLines,
    onHouseClick,
    onHouseHover,
    selectedHouses,
    hoveredHouse,
    isZodiacFixed
}) => {
    const { houseCusps, ascendantLongitude } = celestialData;

    const getAngle = (longitude: number) => {
        const anchor = isZodiacFixed ? 0 : ascendantLongitude;
        let angle = 180 - (longitude - anchor);
        return normalizeAngle(angle);
    };

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

    const innerVoidRadius = 108;
    const numbersProtectionRadius = innerVoidRadius + 25;

    return (
        <g className="houses-layer">
            {houseCusps.map((cusp, i) => {
                const houseNumber = i + 1;
                const nextCusp = houseCusps[(i + 1) % 12];
                
                const startAngle = getAngle(cusp);
                const endAngle = getAngle(nextCusp);
                
                // Calculate mid angle for label
                let midAngle = (startAngle + endAngle) / 2;
                if (Math.abs(startAngle - endAngle) > 180) {
                    midAngle += 180;
                }
                midAngle = normalizeAngle(midAngle);

                const isSelected = selectedHouses.includes(houseNumber);
                const isHovered = hoveredHouse === houseNumber;
                
                // House Wedge (Interactive Area)
                const wedgePath = describeAnnularSector(cx, cy, innerVoidRadius, radius, startAngle, endAngle);

                return (
                    <g 
                        key={`house-${houseNumber}`}
                        onClick={() => onHouseClick?.(houseNumber)}
                        onMouseEnter={(e) => onHouseHover?.(e, houseNumber)}
                        className="cursor-pointer"
                    >
                        {/* Interactive Wedge (Transparent but captures events) */}
                        <path 
                            d={wedgePath}
                            fill={isSelected || isHovered ? "white" : "transparent"}
                            fillOpacity={isSelected ? 0.1 : (isHovered ? 0.05 : 0)}
                            stroke="none"
                            className="transition-all duration-200"
                        />

                        {/* House Line (Cusp) */}
                        {showHouseLines && (
                            <line
                                x1={polarToCartesian(cx, cy, innerVoidRadius, startAngle).x}
                                y1={polarToCartesian(cx, cy, innerVoidRadius, startAngle).y}
                                x2={polarToCartesian(cx, cy, radius, startAngle).x}
                                y2={polarToCartesian(cx, cy, radius, startAngle).y}
                                stroke="currentColor"
                                strokeWidth={houseLineThickness}
                                strokeOpacity={houseLineOpacity}
                                strokeDasharray={houseLineFormat === 'dashed' ? "4 4" : "none"}
                                className="text-brand-text-muted"
                            />
                        )}

                        {/* House Number */}
                        {showHouseLines && (
                            <g transform={`translate(${polarToCartesian(cx, cy, numbersProtectionRadius, midAngle).x}, ${polarToCartesian(cx, cy, numbersProtectionRadius, midAngle).y})`}>
                                <text
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className={`text-[10px] font-manrope font-bold fill-current ${isSelected || isHovered ? 'text-brand-purple scale-125' : 'text-brand-text-muted opacity-60'}`}
                                    style={{ transition: 'all 0.2s' }}
                                >
                                    {houseFormat === 'roman' ? toRoman(houseNumber) : houseNumber}
                                </text>
                            </g>
                        )}
                    </g>
                );
            })}
        </g>
    );
};
