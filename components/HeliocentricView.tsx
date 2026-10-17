import React, { useMemo } from 'react';
import * as Astronomy from 'astronomy-engine';
import { CelestialData } from '../hooks/useCelestialData';
import { PlanetSphere } from './CelestialBodyPanel';
import { ZodiacRing } from './ZodiacRing';
import { normalizeAngle } from '../lib/astrology/utils';

const PLANET_SIZES: Record<string, number> = {
    sun:       20,
    mercury:    5,
    venus:      7,
    earth:      8,
    moon:       4,
    mars:       6,
    jupiter:   13,
    saturn:    11,
    uranus:     9,
    neptune:    9,
    pluto:      4,
    chiron:     4,
    ceres:      4,
    pallas:     4,
    juno:       4,
    vesta:      4,
    lilith:     4,
    northNode:  5,
    southNode:  5,
};

const ORBIT_RADII: Record<string, number> = {
    mercury:   44,
    venus:     72,
    earth:    100,
    mars:     138,
    ceres:    152,
    vesta:    155,
    juno:     158,
    pallas:   161,
    chiron:   175,
    jupiter:  190,
    saturn:   228,
    uranus:   258,
    neptune:  282,
    pluto:    300,
};

const DARK_PLANET_COLORS: Record<string, string> = {
    sun: "#FFFBEC",
    moon: "#FFFFFF",
    mercury: "#E2E8F0",
    venus: "#FFEDD5",
    earth: "#6495ED",
    mars: "#FCA5A5",
    jupiter: "#FDE68A",
    saturn: "#FEF3C7",
    uranus: "#CCFBF1",
    neptune: "#DBEAFE",
    pluto: "#F1F5F9",
    chiron: "#90EE90",
    ceres: "#FFD700",
    pallas: "#F0F8FF",
    juno: "#FFB6C1",
    vesta: "#FFA500",
    lilith: "#4B0082",
    northNode: "#E0FFFF",
    southNode: "#D2691E",
};

const LIGHT_PLANET_COLORS: Record<string, string> = {
    sun: "#B45309",         // Rich amber/gold
    moon: "#475569",        // Deep lunar silver-slate
    mercury: "#4B5563",     // Metallic dark gray
    venus: "#BE185D",       // Deep rose/pink
    earth: "#2563EB",       // Earth blue
    mars: "#B91C1C",        // Rich crimson red
    jupiter: "#C2410C",     // Rich royal orange/ochre
    saturn: "#92400E",      // Dark golden-brown
    uranus: "#0E7490",      // Deep teal-cyan
    neptune: "#1D4ED8",     // Rich royal blue
    pluto: "#4B5563",       // Dark charcoal slate
    chiron: "#047857",      // Rich emerald green
    ceres: "#854D0E",       // Deep olive gold
    pallas: "#1E40AF",      // Deep sapphire blue
    juno: "#A21CAF",        // Rich fuchsia
    vesta: "#9A3412",       // Dark hearth copper
    lilith: "#6D28D9",      // Deep violet
    northNode: "#047857",   // Rich emerald green
    southNode: "#047857",   // Rich emerald green
};

const PLANET_GLYPHS: Record<string, string> = {
    sun: "☉",
    moon: "☽",
    mercury: "☿",
    venus: "♀",
    earth: "⊕",
    mars: "♂",
    jupiter: "♃",
    saturn: "♄",
    uranus: "♅",
    neptune: "♆",
    pluto: "♇",
    chiron: "⚷",
    ceres: "⚳",
    pallas: "⚴",
    juno: "⚵",
    vesta: "⚶",
    lilith: "⚸",
    northNode: "☊",
    southNode: "☋"
};

const ASTRONOMY_ENGINE_BODIES: Record<string, Astronomy.Body> = {
    mercury: Astronomy.Body.Mercury,
    venus:   Astronomy.Body.Venus,
    earth:   Astronomy.Body.Earth,
    mars:    Astronomy.Body.Mars,
    jupiter: Astronomy.Body.Jupiter,
    saturn:  Astronomy.Body.Saturn,
    uranus:  Astronomy.Body.Uranus,
    neptune: Astronomy.Body.Neptune,
    pluto:   Astronomy.Body.Pluto,
};

const getHeliocentricLongitude = (body: Astronomy.Body, date: Date): number => {
    const vec = Astronomy.HelioVector(body, date);
    const lon = Math.atan2(vec.y, vec.x) * (180 / Math.PI);
    return (lon + 360) % 360;
};

interface HeliocentricViewProps {
    celestialData: CelestialData;
    visiblePlanets: Record<string, boolean>;
    size?: number;
    theme?: 'dark' | 'light';
}

export const HeliocentricView: React.FC<HeliocentricViewProps> = ({
    celestialData,
    visiblePlanets,
    size = 700,
    theme = 'dark'
}) => {
    const cx = size / 2;
    const cy = size / 2;

    const planetColors = theme === 'light' ? LIGHT_PLANET_COLORS : DARK_PLANET_COLORS;

    const lonToXY = (lon: number, radius: number) => {
        const angle = (lon - 90) * (Math.PI / 180);
        return {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
        };
    };

    const planetsToRender = useMemo(() => {
        const planets = [
            'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
            'chiron', 'ceres', 'pallas', 'juno', 'vesta', 'lilith', 'northNode', 'southNode'
        ];
        
        return planets.map(planetId => {
            if (planetId !== 'earth' && visiblePlanets && visiblePlanets[planetId] === false) {
                return null;
            }

            const usesGeocentricLon = ['lilith', 'northNode', 'southNode', 'chiron', 'ceres', 'pallas', 'juno', 'vesta'].includes(planetId);

            let longitude = 0;
            const date = celestialData.currentTime;

            if (usesGeocentricLon) {
                const key = `${planetId}EclipticLongitude` as keyof CelestialData;
                const val = celestialData[key];
                if (typeof val !== 'number') return null;
                longitude = val;
            } else if (ASTRONOMY_ENGINE_BODIES[planetId]) {
                try {
                    longitude = getHeliocentricLongitude(ASTRONOMY_ENGINE_BODIES[planetId], date);
                } catch {
                    return null;
                }
            } else {
                return null;
            }

            // Geocentric points are plotted at Earth's radius
            const isGeocentricPoint = ['lilith', 'northNode', 'southNode'].includes(planetId);
            const radius = isGeocentricPoint ? ORBIT_RADII.earth : (ORBIT_RADII[planetId] || 100);
            const pos = lonToXY(longitude, radius);

            return {
                id: planetId,
                x: pos.x,
                y: pos.y,
                radius,
                size: PLANET_SIZES[planetId] || 4,
                hasOrbit: !isGeocentricPoint && planetId !== 'earth'
            };
        }).filter(Boolean);
    }, [celestialData, visiblePlanets, cx, cy]);

    const earthLon = normalizeAngle(celestialData.sunEclipticLongitude + 180);
    const earthPos = lonToXY(earthLon, ORBIT_RADII.earth);

    const moonOrbitRadius = 16;
    const moonAngle = (celestialData.moonEclipticLongitude - 90) * (Math.PI / 180);
    const moonPos = {
        x: earthPos.x + moonOrbitRadius * Math.cos(moonAngle),
        y: earthPos.y + moonOrbitRadius * Math.sin(moonAngle),
    };

    return (
        <div 
            className="relative flex items-center justify-center w-full h-full" 
            style={{ backgroundColor: '#040004', minHeight: size }}
        >
            <svg 
                width={size} 
                height={size} 
                viewBox={`0 0 ${size} ${size}`} 
                className="overflow-visible"
            >
                <defs>
                  <filter id="panel-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1" result="blur"/>
                    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                  </filter>
                  <filter id="sun-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur"/>
                    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                  </filter>
                  <radialGradient id="panel-grad-sun" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#FFFACD"/><stop offset="40%" stopColor="#FFD700"/><stop offset="100%" stopColor="#FF8C00"/></radialGradient>
                  <radialGradient id="panel-grad-moon" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#F5F5F5"/><stop offset="50%" stopColor="#D3D3D3"/><stop offset="100%" stopColor="#808080"/></radialGradient>
                  <radialGradient id="panel-grad-mercury" cx="40%" cy="40%" r="60%"><stop offset="0%" stopColor="#E0E0E0"/><stop offset="60%" stopColor="#A9A9A9"/><stop offset="100%" stopColor="#757575"/></radialGradient>
                  <radialGradient id="panel-grad-venus" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#E9D5FF"/><stop offset="50%" stopColor="#C084FC"/><stop offset="100%" stopColor="#9333EA"/></radialGradient>
                  <radialGradient id="panel-grad-earth" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#93C5FD"/><stop offset="40%" stopColor="#2563EB"/><stop offset="70%" stopColor="#1E40AF"/><stop offset="100%" stopColor="#166534"/></radialGradient>
                  <radialGradient id="panel-grad-mars" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#FF7F50"/><stop offset="60%" stopColor="#CD5C5C"/><stop offset="100%" stopColor="#8B0000"/></radialGradient>
                  <linearGradient id="panel-grad-jupiter-stripes" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFF8DC"/><stop offset="20%" stopColor="#CD853F"/><stop offset="40%" stopColor="#FFF8DC"/><stop offset="60%" stopColor="#D2691E"/><stop offset="80%" stopColor="#FFF8DC"/><stop offset="100%" stopColor="#CD853F"/></linearGradient>
                  <radialGradient id="panel-grad-jupiter-overlay" cx="35%" cy="35%" r="70%"><stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4"/><stop offset="100%" stopColor="#000000" stopOpacity="0.2"/></radialGradient>
                  <radialGradient id="panel-grad-saturn" cx="40%" cy="30%" r="70%"><stop offset="0%" stopColor="#F0E68C"/><stop offset="100%" stopColor="#DAA520"/></radialGradient>
                  <radialGradient id="panel-grad-uranus" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#AFEEEE"/><stop offset="100%" stopColor="#00CED1"/></radialGradient>
                  <radialGradient id="panel-grad-neptune" cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#4169E1"/><stop offset="100%" stopColor="#00008B"/></radialGradient>
                  <radialGradient id="panel-grad-pluto" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#8B0000"/><stop offset="50%" stopColor="#708090"/><stop offset="100%" stopColor="#2F4F4F"/></radialGradient>
                  <radialGradient id="panel-grad-chiron" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#90EE90"/><stop offset="100%" stopColor="#2E8B57"/></radialGradient>
                  <radialGradient id="panel-grad-ceres" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFD700"/><stop offset="100%" stopColor="#556B2F"/></radialGradient>
                  <radialGradient id="panel-grad-pallas" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#F0F8FF"/><stop offset="100%" stopColor="#4682B4"/></radialGradient>
                  <radialGradient id="panel-grad-juno" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFB6C1"/><stop offset="100%" stopColor="#C71585"/></radialGradient>
                  <radialGradient id="panel-grad-vesta" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFA500"/><stop offset="100%" stopColor="#FF4500"/></radialGradient>
                  <radialGradient id="panel-grad-lilith" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#4B0082"/><stop offset="60%" stopColor="#000000"/><stop offset="100%" stopColor="#2e022e"/></radialGradient>
                  <radialGradient id="panel-grad-northNode" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#E0FFFF"/><stop offset="100%" stopColor="#00CED1"/></radialGradient>
                  <radialGradient id="panel-grad-southNode" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#D2691E"/><stop offset="100%" stopColor="#8B4513"/></radialGradient>
                  <linearGradient id="zodiac-fire" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.9"/><stop offset="100%" stopColor="#f97316" stopOpacity="0.7"/></linearGradient>
                  <linearGradient id="zodiac-earth" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#84cc16" stopOpacity="0.9"/><stop offset="100%" stopColor="#a3a300" stopOpacity="0.7"/></linearGradient>
                  <linearGradient id="zodiac-air" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9"/><stop offset="100%" stopColor="#a78bfa" stopOpacity="0.7"/></linearGradient>
                  <linearGradient id="zodiac-water" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#818cf8" stopOpacity="0.9"/><stop offset="100%" stopColor="#06b6d4" stopOpacity="0.7"/></linearGradient>
                  <linearGradient id="zodiac-icon-fire" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#ef4444"/></linearGradient>
                  <linearGradient id="zodiac-icon-earth" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#86efac"/><stop offset="100%" stopColor="#a3a300"/></linearGradient>
                  <linearGradient id="zodiac-icon-air" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#bfdbfe"/><stop offset="100%" stopColor="#818cf8"/></linearGradient>
                  <linearGradient id="zodiac-icon-water" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#c7d2fe"/><stop offset="100%" stopColor="#06b6d4"/></linearGradient>
                </defs>

                {/* 1. Orbits */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={ORBIT_RADII.earth}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                />
                {planetsToRender.map((p) => p && p.hasOrbit && (
                    <circle
                        key={`orbit-${p.id}`}
                        cx={cx}
                        cy={cy}
                        r={p.radius}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                ))}

                {/* 2. Zodiac Ring */}
                <ZodiacRing
                    cx={cx}
                    cy={cy}
                    innerRadius={315}
                    outerRadius={345}
                    rotation={270}
                    onHover={() => {}}
                    onLeave={() => {}}
                    iconSize={12}
                    colorMode="element"
                />

                {/* 3. Moon Orbit */}
                <circle cx={earthPos.x} cy={earthPos.y} r={moonOrbitRadius}
                    fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" strokeDasharray="2 3" />

                {/* 4. Planets */}
                {planetsToRender.map((p) => p && (
                    <g key={`planet-group-${p.id}`}>
                        <foreignObject 
                            x={p.x - p.size} 
                            y={p.y - p.size} 
                            width={p.size * 2} 
                            height={p.size * 2} 
                            style={{ overflow: 'visible' }}
                        >
                            <div xmlns="http://www.w3.org/1999/xhtml"
                                 style={{ width: p.size*2, height: p.size*2, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <PlanetSphere 
                                    id={p.id} 
                                    size={p.size * 2}
                                />
                            </div>
                        </foreignObject>
                        <text
                            x={p.x + p.size + 2}
                            y={p.y + p.size + 2}
                            fill={planetColors[p.id]}
                            fontSize="10"
                            fontFamily='"Noto Sans Symbols", "Segoe UI Symbol", sans-serif'
                            opacity={0.85}
                        >
                            {PLANET_GLYPHS[p.id]}
                        </text>
                    </g>
                ))}

                {/* 5. Moon */}
                <foreignObject x={moonPos.x - PLANET_SIZES.moon} y={moonPos.y - PLANET_SIZES.moon} width={PLANET_SIZES.moon * 2} height={PLANET_SIZES.moon * 2} style={{ overflow: 'visible' }}>
                    <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: PLANET_SIZES.moon * 2, height: PLANET_SIZES.moon * 2 }}>
                        <PlanetSphere id="moon" size={PLANET_SIZES.moon * 2} moonPhase={celestialData.moonPhase} />
                    </div>
                </foreignObject>

                {/* 6. Sun (Center) */}
                <circle cx={cx} cy={cy} r={24} fill="rgba(255,200,0,0.08)" />
                <foreignObject x={cx - 20} y={cy - 20} width={40} height={40} style={{ overflow: 'visible' }}>
                    <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: 40, height: 40 }}>
                        <PlanetSphere id="sun" size={40} />
                    </div>
                </foreignObject>

            </svg>
        </div>
    );
};
