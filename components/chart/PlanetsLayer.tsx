import React, { useMemo } from 'react';
import { CelestialData } from '../../hooks/useCelestialData';
import { getMoonPhaseEmoji } from '../../lib/astrology/utils';
import { PLANET_COLORS, SPHERE_GLYPH_COLORS, getPlanetRadialIndex } from '../../lib/astrology/constants';
import { CELESTIAL_GLYPHS } from '../icons';

interface PlanetsLayerProps {
    cx: number;
    cy: number;
    celestialData: CelestialData;
    visiblePlanets: Record<string, boolean>;
    selectedPlanets: string[];
    hoveredPlanet: string | null;
    planetSize: number;
    showPlanetSpheres: boolean;
    showOrbits: boolean;
    ghostPlanets: string[];
    onPlanetClick: (id: string) => void;
    onPlanetHover: (e: React.MouseEvent, id: string) => void;
    planetPositions: Record<string, {x: number, y: number, angle: number, r: number}>;
}

export const PlanetsLayer: React.FC<PlanetsLayerProps> = ({
    cx,
    cy,
    celestialData,
    visiblePlanets,
    selectedPlanets,
    hoveredPlanet,
    planetSize,
    showPlanetSpheres,
    showOrbits,
    ghostPlanets,
    onPlanetClick,
    onPlanetHover,
    planetPositions
}) => {
    const sortedPlanetIds = useMemo(() => {
        if (!planetPositions) return [];
        const ids = Object.keys(planetPositions);
        ids.sort((a, b) => getPlanetRadialIndex(a) - getPlanetRadialIndex(b));
        return ids;
    }, [planetPositions]);

    if (!planetPositions) return null;

    return (
        <g className="planets-layer">
            {/* Orbits */}
            {showOrbits && sortedPlanetIds.map(planetId => {
                const pos = planetPositions[planetId];
                if (!pos) return null;
                const { r } = pos;
                const isSelected = selectedPlanets.includes(planetId);
                const isHovered = hoveredPlanet === planetId;
                
                return (
                    <circle 
                        key={`orbit-${planetId}`}
                        cx={cx} cy={cy} r={r} 
                        fill="none" 
                        stroke={isSelected || isHovered ? PLANET_COLORS[planetId] : "currentColor"}
                        strokeOpacity={isSelected || isHovered ? 0.3 : 0.05}
                        strokeWidth={isSelected || isHovered ? 1.5 : 1}
                        className="transition-all duration-300 pointer-events-none"
                    />
                );
            })}

            {/* Planets */}
            {sortedPlanetIds.map(planetId => {
                const pos = planetPositions[planetId];
                if (!pos) return null;
                const isSelected = selectedPlanets.includes(planetId);
                const isHovered = hoveredPlanet === planetId;
                const isGhost = ghostPlanets.includes(planetId);
                
                const isRetrograde = celestialData.retrogradeStatus[planetId];
                const baseColor = PLANET_COLORS[planetId] || '#fff';
                
                // Sphere Gradient ID
                const gradId = `sphere-grad-${planetId}`;

                return (
                    <g 
                        key={`planet-${planetId}`}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => onPlanetClick(planetId)}
                        onMouseEnter={(e) => onPlanetHover(e, planetId)}
                        className={`cursor-pointer transition-all duration-300 ${isGhost ? 'opacity-40 grayscale' : ''}`}
                        style={{ filter: isSelected || isHovered ? `drop-shadow(0 0 10px ${baseColor})` : 'none' }}
                    >
                        {/* Define Gradient for Sphere */}
                        <defs>
                            <radialGradient id={gradId} cx="30%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                                <stop offset="50%" stopColor={baseColor} stopOpacity="1" />
                                <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
                            </radialGradient>
                        </defs>

                        {/* Planet Body */}
                        {showPlanetSpheres ? (
                            <circle 
                                r={planetSize / 2} 
                                fill={`url(#${gradId})`}
                                stroke={isSelected ? '#fff' : 'none'}
                                strokeWidth={isSelected ? 2 : 0}
                            />
                        ) : (
                            <circle 
                                r={planetSize / 2} 
                                fill={baseColor}
                                fillOpacity="0.2"
                                stroke={baseColor}
                                strokeWidth="1.5"
                            />
                        )}

                        {/* Glyph */}
                        <text
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="font-astro select-none pointer-events-none"
                            fill={showPlanetSpheres ? (SPHERE_GLYPH_COLORS[planetId] || '#000') : baseColor}
                            style={{ 
                                fontSize: planetSize * 0.6,
                                textShadow: showPlanetSpheres ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                            }}
                        >
                            {CELESTIAL_GLYPHS[planetId]}
                        </text>

                        {/* Retrograde Indicator */}
                        {isRetrograde && (
                            <text
                                x={planetSize/2 + 4}
                                y={-planetSize/2}
                                className="text-[8px] font-bold fill-red-500 pointer-events-none"
                            >
                                Rx
                            </text>
                        )}

                        {/* Moon Phase (if Moon) */}
                        {planetId === 'moon' && !showPlanetSpheres && (
                            <text
                                x={planetSize/2 + 8}
                                y={0}
                                dominantBaseline="middle"
                                className="text-[10px] pointer-events-none"
                            >
                                {getMoonPhaseEmoji(celestialData.moonPhase)}
                            </text>
                        )}
                    </g>
                );
            })}
        </g>
    );
};
