import React from 'react';
import { Aspect, ASPECT_ORBS } from '../../lib/astrology/aspects';

interface AspectsLayerProps {
    filteredAspects: Aspect[];
    planetPositions: Record<string, {x: number, y: number, angle: number, r: number}>;
    natalPlanetPositions?: Record<string, {x: number, y: number, angle: number, r: number}>;
    selectedAspects: string[];
    hoveredAspect: string | null;
    selectedPlanets: string[];
    showAspectLines: boolean;
    onAspectClick: (id: string) => void;
    onAspectHover: (e: React.MouseEvent, id: string) => void;
}

const ASPECT_LINE_COLORS: Record<string, string> = {
    conjunction: 'var(--color-aspect-conjunction)',
    opposition: 'var(--color-aspect-opposition)',
    trine: 'var(--color-aspect-trine)',
    square: 'var(--color-aspect-square)',
    sextile: 'var(--color-aspect-sextile)',
};

export const AspectsLayer: React.FC<AspectsLayerProps> = ({
    filteredAspects,
    planetPositions,
    natalPlanetPositions = {},
    selectedAspects,
    hoveredAspect,
    selectedPlanets,
    showAspectLines,
    onAspectClick,
    onAspectHover
}) => {
    if (!showAspectLines || !planetPositions) return null;

    return (
        <g className="aspects-layer">
            {filteredAspects.map((aspect) => {
                const isSelected = selectedAspects.includes(aspect.id);
                const isHovered = hoveredAspect === aspect.id;
                
                // Highlight if connected planets are selected
                const p1Selected = selectedPlanets.includes(aspect.body1.id);
                const p2Selected = selectedPlanets.includes(aspect.body2.id);
                const isConnected = p1Selected || p2Selected;

                // Opacity Logic
                let opacity = 0.3;
                if (isSelected || isHovered) opacity = 1;
                else if (selectedPlanets.length > 0) {
                    opacity = isConnected ? 0.8 : 0.05;
                }

                // Orb Intensity
                const maxOrb = ASPECT_ORBS[aspect.type as keyof typeof ASPECT_ORBS] || 10;
                const orbRatio = Math.max(0, 1 - (aspect.orb / maxOrb));
                
                const color = ASPECT_LINE_COLORS[aspect.type] || '#9ca3af';
                
                // Determine positions
                // Check if it's a transit aspect (id starts with T-)
                const isTransit = aspect.id.startsWith('T-');
                
                let pos1, pos2;
                if (isTransit) {
                    pos1 = planetPositions[aspect.body1.id];
                    pos2 = natalPlanetPositions[aspect.body2.id];
                } else {
                    pos1 = planetPositions[aspect.body1.id];
                    pos2 = planetPositions[aspect.body2.id];
                }

                if (!pos1 || !pos2) return null;

                return (
                    <line 
                        key={aspect.id} 
                        x1={pos1.x} y1={pos1.y} 
                        x2={pos2.x} y2={pos2.y}
                        stroke={color}
                        strokeWidth={(isSelected || isHovered) ? 2.5 : (1 + orbRatio)}
                        strokeOpacity={opacity}
                        onClick={() => onAspectClick(aspect.id)}
                        onMouseEnter={(e) => onAspectHover(e, aspect.id)}
                        className="cursor-pointer transition-all duration-300 hover:stroke-[3px]"
                    />
                );
            })}
        </g>
    );
};
