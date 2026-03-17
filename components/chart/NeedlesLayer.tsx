import React from 'react';
import { polarToCartesian } from '../../lib/astrology/utils';
import { PLANET_COLORS } from '../../lib/astrology/constants';

interface NeedlesLayerProps {
    cx: number;
    cy: number;
    planetPositions: Record<string, {x: number, y: number, angle: number, r: number}>;
    visiblePlanets: Record<string, boolean>;
    showNeedle: boolean;
    pointerStyle: 'solid' | 'dashed';
    pointerThickness: number;
    pointerHead: 'arrow' | 'circle' | 'diamond' | 'square' | 'none';
    pointerTail: 'arrow' | 'circle' | 'diamond' | 'square' | 'none';
    innerRadius: number;
    outerRadius: number;
}

export const NeedlesLayer: React.FC<NeedlesLayerProps> = ({
    cx,
    cy,
    planetPositions,
    visiblePlanets,
    showNeedle,
    pointerStyle,
    pointerThickness,
    pointerHead,
    pointerTail,
    innerRadius,
    outerRadius
}) => {
    if (!showNeedle || !planetPositions) return null;

    const sortedPlanetIds = Object.keys(planetPositions).sort(); // Order doesn't matter much for needles

    return (
        <g className="needles-layer pointer-events-none">
            {sortedPlanetIds.map(planetId => {
                if (!visiblePlanets[planetId]) return null;
                const { angle } = planetPositions[planetId];
                
                const headSize = 8;
                const tailSize = 6;
                
                const lineStartRadius = innerRadius + (pointerTail !== 'none' ? tailSize : 0);
                const lineEndRadius = outerRadius - (pointerHead !== 'none' ? headSize : 0);
                
                const innerPos = polarToCartesian(cx, cy, lineStartRadius, angle);
                const outerPos = polarToCartesian(cx, cy, lineEndRadius, angle);
                
                const color = PLANET_COLORS[planetId] || '#ffffff';
                
                const renderMarker = (type: string, radius: number, size: number, isHead: boolean) => {
                    const pos = polarToCartesian(cx, cy, radius, angle);
                    switch (type) {
                        case 'arrow':
                            const baseRadius = isHead ? radius - size : radius + size;
                            const baseAngleDelta = 0.8; 
                            const baseLeft = polarToCartesian(cx, cy, baseRadius, angle - baseAngleDelta);
                            const baseRight = polarToCartesian(cx, cy, baseRadius, angle + baseAngleDelta);
                            return <polygon points={`${pos.x},${pos.y} ${baseLeft.x},${baseLeft.y} ${baseRight.x},${baseRight.y}`} fill={color} />;
                        case 'circle':
                            return <circle cx={pos.x} cy={pos.y} r={size/2} fill={color} />;
                        case 'diamond':
                            const dSize = size * 0.7;
                            const p1 = polarToCartesian(cx, cy, radius + (isHead ? 0 : dSize), angle); // Tip
                            const p2 = polarToCartesian(cx, cy, radius - (isHead ? dSize : 0), angle); // Base
                            // Diamond logic simplified:
                            // Actually let's just draw a diamond shape
                            return <rect x={pos.x - dSize/2} y={pos.y - dSize/2} width={dSize} height={dSize} fill={color} transform={`rotate(${angle + 45}, ${pos.x}, ${pos.y})`} />;
                        case 'square':
                            return <rect x={pos.x - size/2} y={pos.y - size/2} width={size} height={size} fill={color} transform={`rotate(${angle}, ${pos.x}, ${pos.y})`} />;
                        default:
                            return null;
                    }
                };

                return (
                    <g key={`needle-${planetId}`}>
                        <line 
                            x1={innerPos.x} y1={innerPos.y} 
                            x2={outerPos.x} y2={outerPos.y} 
                            stroke={color} 
                            strokeWidth={pointerThickness} 
                            strokeDasharray={pointerStyle === 'dashed' ? "4 4" : "none"}
                            opacity={0.6}
                        />
                        {pointerHead !== 'none' && renderMarker(pointerHead, outerRadius, headSize, true)}
                        {pointerTail !== 'none' && renderMarker(pointerTail, innerRadius, tailSize, false)}
                    </g>
                );
            })}
        </g>
    );
};
