
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CelestialData } from '../hooks/useCelestialData';
import { ZODIAC_DATA, ELEMENT_COLORS } from './zodiac';
import { CELESTIAL_GLYPHS, ZODIAC_ICONS, UI_ICONS } from './icons';
import { normalizeAngle, polarToCartesian, toRoman, toRad } from '../lib/astrology/utils';
import { Aspect, ASPECT_ORBS } from '../lib/astrology/aspects';
import { PLANET_DESCRIPTIONS, SIGN_DESCRIPTIONS, HOUSE_DESCRIPTIONS } from './astro-descriptions';
import { ZodiacRing } from './ZodiacRing';
import { HighlightFilter } from './ChartStatisticsPanel';

import { Tooltip } from './Tooltip';

interface SiderealClockProps {
    celestialData: CelestialData;
    natalData?: CelestialData;
    filteredAspects: Aspect[];
    ghostPlanets: string[];
    visiblePlanets: Record<string, boolean>;
    selectedPlanets: string[];
    selectedAspects: string[];
    selectedHouses: number[];
    hoveredPlanet: string | null;
    hoveredAspect: string | null;
    hoveredHouse: number | null;
    onPlanetClick: (id: string) => void;
    onAspectClick: (id: string) => void;
    onHouseClick: (houseNumber: number) => void;
    setHoveredHouse: React.Dispatch<React.SetStateAction<number | null>>;
    planetSize?: number;
    zodiacSignSize?: number;
    showPlanetSpheres?: boolean;
    showAspectLines?: boolean;
    showNeedle?: boolean;
    isZodiacFixed?: boolean;
    locationName?: string;
    isNatalMode?: boolean;
    showAtmosphere?: boolean;
    houseFormat?: 'arabic' | 'roman';
    houseLineFormat?: 'solid' | 'dashed';
    showHouseLines?: boolean;
    showHouseMarkers?: boolean;
    showMcIcArrows?: boolean;
    showTimeRing?: boolean;
    showOrbits?: boolean;
    showStars?: boolean;
    showSeasonsRing?: boolean;
    showDegreeLabels?: boolean;
    degreeLabelSize?: number;
    zodiacColorMode?: 'none' | 'element' | 'modality' | 'polarity';
    highlightFilter?: HighlightFilter;
    showSignLines?: boolean;
    signLineThickness?: number;
    signLineOpacity?: number;
    pointerStyle?: 'solid' | 'dashed';
    pointerThickness?: number;
    pointerHead?: 'arrow' | 'circle' | 'diamond' | 'square' | 'none';
    pointerTail?: 'arrow' | 'circle' | 'diamond' | 'square' | 'none';
    showConstellations?: boolean;
    customBackgroundImage?: string | null;
    showMagneticField?: boolean;
    magneticFieldSize?: number;
    magneticFieldOpacity?: number;
    timeRingScale?: number;
    theme?: 'dark' | 'light';
    onClockClick?: () => void;
    houseLineThickness?: number;
    houseLineOpacity?: number;
}

type TooltipData = {
    type: 'planet' | 'sign' | 'house';
    title: string;
    description: React.ReactNode;
    x: number;
    y: number;
};

// --- PALETTE DEFINITIONS BASED ON REFERENCE IMAGES ---
const SEASON_COLORS_LIGHT = {
    'VERÃO':     { bg: '#c8e6c9', text: '#1b5e20', border: '#81c784' },  // verde-esmeralda suave
    'OUTONO':    { bg: '#ffe0b2', text: '#bf360c', border: '#ffb74d' },  // âmbar queimado
    'INVERNO':   { bg: '#e3f2fd', text: '#0d47a1', border: '#90caf9' },  // azul-gelo
    'PRIMAVERA': { bg: '#fce4ec', text: '#880e4f', border: '#f48fb1' },  // rosa-floral
};

// Stops: 0% (Sun Center), 35% (Halo), 70% (Mid Sky), 100% (Far/Dark)
const ATMOSPHERE_PALETTE = {
    NIGHT: {
        sky: ['#0a0f28', '#06091f', '#030408', '#000000'],
        ground: ['#0a1905', '#19320f']
    },
    DAWN: {
        sky: ['#f0c064', '#d26448', '#543a76', '#1c1434'],
        ground: ['#1e1a0a', '#2c2a12']
    },
    DAY: {
        sky: ['#d4e8f4', '#a0c8e0', '#5090b8', '#1e5080'],
        ground: ['#2a3018', '#404828']
    },
    FULL_DAY: {
        sky: ['#b4d2e6', '#78a8ce', '#3a6e9e', '#143a66'],
        ground: ['#303820', '#46502c']
    },
    DUSK: {
        sky: ['#f0c064', '#d26448', '#543a76', '#1c1434'],
        ground: ['#1a1208', '#100c06']
    }
};

// --- COLOR HELPERS ---
const parseHex = (color: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

const interpolateColor = (color1: string, color2: string, factor: number) => {
    const c1 = parseHex(color1);
    const c2 = parseHex(color2);
    
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);

    return `rgb(${r}, ${g}, ${b})`;
};

const interpolatePalette = (
    state1: typeof ATMOSPHERE_PALETTE.NIGHT, 
    state2: typeof ATMOSPHERE_PALETTE.NIGHT, 
    factor: number
) => {
    return {
        sky: [
            interpolateColor(state1.sky[0], state2.sky[0], factor),
            interpolateColor(state1.sky[1], state2.sky[1], factor),
            interpolateColor(state1.sky[2], state2.sky[2], factor),
            interpolateColor(state1.sky[3], state2.sky[3], factor)
        ],
        ground: [
            interpolateColor(state1.ground[0], state2.ground[0], factor),
            interpolateColor(state1.ground[1], state2.ground[1], factor)
        ]
    };
};

const isAngleBetween = (angle: number, start: number, end: number) => {
    const a = normalizeAngle(angle);
    const s = normalizeAngle(start);
    const e = normalizeAngle(end);
    
    if (s < e) {
        return a >= s && a <= e;
    } else {
        return a >= s || a <= e;
    }
};


const MAJOR_PLANET_IDS = [
    'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'sun'
];

const ELEMENT_HEX_COLORS: Record<string, string> = {
    fire: '#fb923c', // Orange-400 (Copper)
    earth: '#34d399', // Emerald-400 (Emerald)
    air: '#fef3c7', // Amber-100 (Champagne)
    water: '#60a5fa', // Blue-400 (Sapphire)
};

const getPlanetRadialIndex = (id: string): number => {
    switch (id) {
        case 'moon':       return 0;
        case 'lilith':     return 0.45;
        case 'northNode':  return 0.45;
        case 'southNode':  return 0.45;
        case 'mercury':    return 0.88;
        case 'venus':      return 1.75;
        case 'mars':       return 2.63;
        case 'vesta':      return 3.05;
        case 'juno':       return 3.05;
        case 'ceres':      return 3.05;
        case 'pallas':     return 3.05;
        case 'jupiter':    return 3.50;
        case 'saturn':     return 4.38;
        case 'chiron':     return 4.80;
        case 'uranus':     return 5.25;
        case 'neptune':    return 6.13;
        case 'pluto':      return 7.00;
        case 'sun':        return 7.88;
        default:           return 8.5;
    }
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

const describeTextArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    let diff = endAngle - startAngle;
    if (diff > 0) diff -= 360;
    
    const midAngle = normalizeAngle(startAngle + diff / 2);
    const isBottom = midAngle > 90 && midAngle < 270;
    
    if (isBottom) {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        return [
            "M", start.x, start.y,
            "A", radius, radius, 0, 0, 1, end.x, end.y
        ].join(" ");
    } else {
        const start = polarToCartesian(x, y, radius, startAngle);
        const end = polarToCartesian(x, y, radius, endAngle);
        return [
            "M", start.x, start.y,
            "A", radius, radius, 0, 0, 0, end.x, end.y
        ].join(" ");
    }
};

const getMoonPhaseEmoji = (phase: number) => {
    if (phase <= 0.03 || phase >= 0.97) return '🌑';
    if (phase < 0.22) return '🌒';
    if (phase < 0.28) return '🌓';
    if (phase < 0.47) return '🌔';
    if (phase < 0.53) return '🌕';
    if (phase < 0.72) return '🌖';
    if (phase < 0.78) return '🌗';
    return '🌘';
};

const PLANET_COLORS: Record<string, string> = {
    sun: '#FDE047', // Solar Gold
    moon: '#F1F5F9', // Lunar Pearl
    mercury: '#CBD5E1', // Mercurial Silver (Lighter)
    venus: '#FDA4AF', // Venusian Rose
    mars: '#EF4444', // Martian Red
    jupiter: '#FB923C', // Jovian Amber
    saturn: '#FACC15', // Saturnian Gold (Brighter)
    uranus: '#22D3EE', // Uranian Cyan
    neptune: '#6366F1', // Neptunian Indigo
    pluto: '#94A3B8', // Plutonian Slate (Lighter)
    northNode: '#99F6E4', // Dragon's Head (Teal)
    southNode: '#D97706', // Dragon's Tail (Amber/Brown)
    lilith: '#E879F9', // Black Moon (Fuchsia - High Vis)
    chiron: '#10B981', // Healer's Emerald
    ceres: '#FACC15', // Harvest Gold (Brighter)
    pallas: '#818CF8', // Wisdom Blue
    juno: '#F472B6', // Union Pink
    vesta: '#FB923C' // Hearth Orange
};

// Map for glyph colors inside spheres to ensure contrast
const SPHERE_GLYPH_COLORS: Record<string, string> = {
    sun: '#422006', // Dark Brown
    moon: '#1e293b', // Dark Slate
    mercury: '#1e293b', // Dark Slate (Requested)
    venus: '#4c0519', // Dark Rose
    mars: '#ffffff', // White
    jupiter: '#ffffff', // White (Requested)
    saturn: '#422006', // Dark Brown
    uranus: '#0e7490', // Dark Cyan
    neptune: '#ffffff', // White
    pluto: '#ffffff', // White
    northNode: '#0f766e', // Dark Teal
    southNode: '#ffffff', // White
    lilith: '#e879f9', // Light Fuchsia
    chiron: '#064e3b', // Dark Emerald
    ceres: '#3f6212', // Dark Yellow/Green
    pallas: '#1e3a8a', // Dark Blue
    juno: '#831843', // Dark Pink
    vesta: '#7c2d12' // Dark Orange
};

export const HOUSE_RULERS: Record<number, string> = {
    1: 'mars',
    2: 'venus',
    3: 'mercury',
    4: 'moon',
    5: 'sun',
    6: 'mercury',
    7: 'venus',
    8: 'pluto',
    9: 'jupiter',
    10: 'saturn',
    11: 'uranus',
    12: 'neptune'
};

export const SiderealClock: React.FC<SiderealClockProps> = ({
    celestialData,
    natalData,
    filteredAspects,
    ghostPlanets,
    visiblePlanets,
    selectedPlanets,
    selectedAspects,
    selectedHouses,
    hoveredPlanet,
    hoveredAspect,
    hoveredHouse,
    onPlanetClick,
    onAspectClick,
    onHouseClick,
    setHoveredHouse,
    planetSize = 30,
    zodiacSignSize = 24,
    showPlanetSpheres = false,
    showAspectLines = true,
    showNeedle = false,
    isZodiacFixed = false,
    locationName = '',
    isNatalMode = false,
    showAtmosphere = true,
    houseFormat = 'arabic',
    houseLineFormat = 'solid',
    showHouseLines = true,
    showHouseMarkers = true,
    houseLineThickness = 1,
    houseLineOpacity = 0.4,
    showMcIcArrows = false,
    showTimeRing = true,
    showOrbits = true,
    showStars = true,
    showSeasonsRing = false,
    showDegreeLabels = false,
    degreeLabelSize = 9,
    zodiacColorMode = 'element',
    highlightFilter,
    showSignLines = false,
    signLineThickness = 1,
    signLineOpacity = 0.3,
    pointerStyle = 'solid',
    pointerThickness = 1,
    pointerHead = 'arrow',
    pointerTail = 'none',
    showConstellations = true,
    customBackgroundImage = null,
    showMagneticField = false,
    magneticFieldSize = 1,
    magneticFieldOpacity = 0.5,
    timeRingScale = 1,
    theme = 'dark',
    onClockClick
}) => {
    const {
        ascendantLongitude, midheavenLongitude, descendantLongitude, imumCoeliLongitude,
        houseCusps, zodiacRotation, retrogradeStatus, currentTime, housePlacements,
        sunriseHour, sunsetHour, sunDisplayHour, solarNoonHour, gradientStatus, gradientProgress, isDayTime
    } = celestialData;

    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const hoverTimeout = useRef<number | null>(null);
    const mousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        return () => {
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        };
    }, []);

    const cx = 500;
    const cy = 500;
    
    const zodiacRingOuter = 505;
    const zodiacRingInner = 465; 
    const graduationRingRadius = showSeasonsRing ? 442.5 : 450; 
    const graduationTickLength = 12;
    const graduationRingInner = graduationRingRadius - graduationTickLength; 
    
    // Time Ring Config
    const timeRingRadius = showSeasonsRing ? 417.5 : 425; 
    
    const housesRingInner = graduationRingInner;
    const innerVoidRadius = 108; 
    const numbersProtectionRadius = innerVoidRadius + 25; 
    const innerGraduationRadius = 145; 
    const planetsStackBaseRadius = 188; 
    const planetStackStep = 25; 
    
    if (isNaN(zodiacRotation) || isNaN(ascendantLongitude)) {
        return null;
    }

    const getAngle = React.useCallback((longitude: number) => {
        const anchor = isZodiacFixed ? 0 : ascendantLongitude;
        let angle = 180 - (longitude - anchor);
        return normalizeAngle(angle);
    }, [isZodiacFixed, ascendantLongitude]);

    const getPlanetRadius = (planetId: string) => {
        const index = getPlanetRadialIndex(planetId);
        return planetsStackBaseRadius + (index * planetStackStep);
    };

    const getTimeAngle = (h: number) => {
        // Use Sun's current position to determine time angle
        // This ensures the 24h ring is aligned with the Sun's current position
        const sunLongitude = celestialData.sunEclipticLongitude;
        
        if (typeof sunLongitude === 'number' && currentTime) {
            const sunAngle = getAngle(sunLongitude);
            const currentDecimalHour = currentTime.getHours() + currentTime.getMinutes() / 60 + currentTime.getSeconds() / 3600;
            
            // Calculate angle difference based on time difference (15 degrees per hour)
            // Time moves clockwise (angle increases) in this coordinate system
            // If h > currentDecimalHour, angle should be greater (clockwise)
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

    const planetPositions = useMemo(() => {
        const positions: Record<string, {x: number, y: number, angle: number}> = {};
        Object.keys(visiblePlanets).forEach(planetId => {
            if (!visiblePlanets[planetId]) return;
             const key = `${planetId}EclipticLongitude` as keyof CelestialData;
             const longitude = celestialData[key] as number;
             if (longitude !== undefined) {
                 const angle = getAngle(longitude);
                 const r = getPlanetRadius(planetId);
                 const pos = polarToCartesian(cx, cy, r, angle);
                 positions[planetId] = { x: pos.x, y: pos.y, angle };
             }
        });
        return positions;
    }, [celestialData, visiblePlanets, ascendantLongitude, isZodiacFixed]);

    const stars = useMemo(() => {
        const generated = [];
        for(let i = 0; i < 400; i++) {
            generated.push({
                x: Math.random() * 1000,
                y: Math.random() * 1000,
                size: Math.random() * 1.5 + 0.5, 
                twinkleDuration: Math.random() * 3 + 2,
                delay: Math.random() * 3,
                opacity: Math.random() * 0.6 + 0.4
            });
        }
        return generated;
    }, []);

    // --- ATMOSPHERE & GROUND CALCULATION ---
    
    // The sun rises and sets based on the 24h clock times
    const sunriseAngle = getTimeAngle(sunriseHour);
    const sunsetAngle = getTimeAngle(sunsetHour);
    const mcAngle = getAngle(midheavenLongitude); 
    
    const horizonRadius = housesRingInner;
    const sunrisePoint = polarToCartesian(cx, cy, horizonRadius, sunriseAngle);
    const sunsetPoint = polarToCartesian(cx, cy, horizonRadius, sunsetAngle);

    const midX = (sunrisePoint.x + sunsetPoint.x) / 2;
    const midY = (sunrisePoint.y + sunsetPoint.y) / 2;

    // Apply a slight curvature for an elegant, technological, and innovative look
    // Using mcAngle curves it to the opposite side of icAngle
    const curvatureIntensity = 40; 
    const controlPoint = polarToCartesian(midX, midY, curvatureIntensity, mcAngle);

    let sweepAngle = sunriseAngle - sunsetAngle;
    if (sweepAngle < 0) sweepAngle += 360;
    const earthLargeArc = sweepAngle > 180 ? 1 : 0;

    const earthPath = `
        M ${sunsetPoint.x} ${sunsetPoint.y}
        A ${horizonRadius} ${horizonRadius} 0 ${earthLargeArc} 1 ${sunrisePoint.x} ${sunrisePoint.y}
        Q ${controlPoint.x} ${controlPoint.y} ${sunsetPoint.x} ${sunsetPoint.y}
        Z
    `;

    // --- Dynamic Multi-Stage Gradient Calculation ---
    
    // Calculate dayFactor for Full Day transition (peaks at solar noon)
    const dayDuration = sunsetHour - sunriseHour;
    const currentDayTime = sunDisplayHour - sunriseHour;
    const dayRatio = dayDuration > 0 ? currentDayTime / dayDuration : 0.5;
    const transitionBuffer = dayDuration > 0 ? 1.5 / dayDuration : 0.1;
    
    let dayFactor = 0;
    if (gradientStatus === 'day' && dayRatio > transitionBuffer && dayRatio < 1 - transitionBuffer) {
        const mid = 0.5;
        const range = 0.5 - transitionBuffer;
        const dist = Math.abs(dayRatio - mid);
        dayFactor = Math.max(0, 1 - (dist / range));
        dayFactor = Math.sin(dayFactor * Math.PI / 2);
    }

    let currentPalette = { sky: ATMOSPHERE_PALETTE.NIGHT.sky, ground: ATMOSPHERE_PALETTE.NIGHT.ground };
    let textureOpacity = 0.15; // Default Night

    if (gradientStatus === 'day') {
        currentPalette = interpolatePalette(ATMOSPHERE_PALETTE.DAY, ATMOSPHERE_PALETTE.FULL_DAY, dayFactor);
        textureOpacity = 0.45 + (0.1 * dayFactor);
    } else if (gradientStatus === 'night') {
        currentPalette = { sky: ATMOSPHERE_PALETTE.NIGHT.sky, ground: ATMOSPHERE_PALETTE.NIGHT.ground };
        textureOpacity = 0.15;
    } else if (gradientStatus === 'dawn') {
        const p = gradientProgress;
        textureOpacity = 0.15 + (0.3 * p);
        if (p < 0.5) {
            const localP = p / 0.5;
            currentPalette = interpolatePalette(ATMOSPHERE_PALETTE.NIGHT, ATMOSPHERE_PALETTE.DAWN, localP);
        } else {
            const localP = (p - 0.5) / 0.5;
            currentPalette = interpolatePalette(ATMOSPHERE_PALETTE.DAWN, ATMOSPHERE_PALETTE.DAY, localP);
        }
    } else if (gradientStatus === 'dusk') {
        const p = gradientProgress;
        // Dusk opacity should fade out slower to keep earth visible during twilight
        textureOpacity = 0.45 - (0.3 * p); 
        if (p < 0.5) {
            const localP = p / 0.5;
            currentPalette = interpolatePalette(ATMOSPHERE_PALETTE.DAY, ATMOSPHERE_PALETTE.DUSK, localP);
        } else {
            const localP = (p - 0.5) / 0.5;
            currentPalette = interpolatePalette(ATMOSPHERE_PALETTE.DUSK, ATMOSPHERE_PALETTE.NIGHT, localP);
        }
    }

    const groundStop0 = currentPalette.ground[0];
    const groundStop100 = currentPalette.ground[1];
    
    // --- Sky Gradient Colors (4 stops) ---
    const skyStop0 = currentPalette.sky[0];
    const skyStop25 = currentPalette.sky[1];
    const skyStop60 = currentPalette.sky[2];
    const skyStop100 = currentPalette.sky[3];

    // --- Moon Glow ---
    const moonPos = planetPositions['moon'];
    const moonIllumination = 1 - Math.abs((celestialData.moonPhase - 0.5) * 2);
    
    // Positional glow (spotlight) fades smoothly based on altitude
    let moonGlowOpacity = 0;
    if (showAtmosphere && moonPos) {
        const altitude = celestialData.moonAltitude;
        if (altitude > 0) {
            moonGlowOpacity = moonIllumination * (0.4 + Math.min(0.6, altitude * 0.5));
        } else if (altitude > -0.1) {
            // Fade out quickly just below horizon
            moonGlowOpacity = moonIllumination * 0.4 * (1 - (Math.abs(altitude) / 0.1));
        }
    }

    // Ambient Earth Glow (Global illumination from moon)
    const moonAmbientOpacity = moonGlowOpacity > 0 && !isDayTime ? (moonGlowOpacity * 0.4) : 0;
    
    // --- Sun Position Logic for Gradient ---
    const sunPosFallback = planetPositions['sun'] || { x: cx, y: cy };
    // Fix gradient center to Sun
    const sunCx = `${(sunPosFallback.x / 1000) * 100}%`;
    const sunCy = `${(sunPosFallback.y / 1000) * 100}%`;
    
    const realSunPos = planetPositions['sun'];
    
    // Sun Glow Calculation: Active during Day AND Dawn/Dusk
    let sunGlowOpacity = 0;
    let sunGlowColor = "#FFFFFF";

    if (realSunPos) {
        // sunAltitude is in radians. 0 is horizon.
        const altitude = celestialData.sunAltitude;
        
        // Opacity: 
        // Max (0.8) when high in sky.
        // Fades out completely when sun is below -18 degrees (-0.314 radians)
        if (altitude > 0) {
            sunGlowOpacity = 0.6 + Math.min(0.2, altitude * 0.2);
        } else if (altitude > -0.314) {
            // Fading out during twilight
            sunGlowOpacity = 0.6 * (1 - (Math.abs(altitude) / 0.314));
        }

        if (sunGlowOpacity > 0) {
            // Color ratio: 1 is Amber/Gold (#D97706), 0 is Soft Yellow (#FDE047)
            // At horizon (altitude <= 0), it's fully amber (ratio = 1)
            // High in sky (altitude >= 0.8 rad), it's soft yellow (ratio = 0)
            let ratio = 1 - Math.max(0, altitude / 0.8);
            ratio = Math.min(1, Math.max(0, ratio)); 
            
            // Base color for high sun
            const highSunColor = "#fff4c8"; // Cor do sol ao meio-dia
            sunGlowColor = interpolateColor(highSunColor, "#f0c064", ratio); // Cor do sol ao pôr/nascer
        }
    }
    
    // --- SKY OPACITY & VISIBILITY ---
    // Sky is opaque during Day, Dawn, and Dusk to show colors. 
    // Transparent at pure Night to show background stars.
    let skyOpacity = 0;
    
    if (isDayTime) {
        skyOpacity = 1;
    } else if (gradientStatus === 'dawn') {
        // Fade in sky during dawn (stars fade out)
        skyOpacity = Math.max(0, Math.min(1, gradientProgress * 1.5));
    } else if (gradientStatus === 'dusk') {
        // Fade out sky during dusk (stars fade in)
        skyOpacity = Math.max(0, Math.min(1, (1 - gradientProgress) * 1.5));
    } else {
        skyOpacity = 0;
    }
    
    // Brilho noturno: reflexo azul do sol abaixo do horizonte
    // Intensidade máxima logo após o pôr do sol, zero à meia-noite
    let nightGlowOpacity = 0;
    if (gradientStatus === 'night' || skyOpacity < 1) {
        const altitude = celestialData.sunAltitude; // negativo quando abaixo do horizonte
        // -0.314 rad = -18° (fim do crepúsculo astronômico)
        // abaixo de -18° começa a escurecer; a -90° (meia-noite) é zero
        if (altitude < 0) {
            const maxDepth = Math.PI / 2; // 90 graus
            const depth = Math.min(Math.abs(altitude), maxDepth);
            nightGlowOpacity = Math.max(0, 1 - (depth / (Math.PI / 4))) * 0.45;
        }
    }
    
    // --- Horizon Labels ---
    const sunriseLabelPos = polarToCartesian(cx, cy, horizonRadius - 25, sunriseAngle);
    const sunsetLabelPos = polarToCartesian(cx, cy, horizonRadius - 25, sunsetAngle);

    const sunriseAnchor = Math.cos(toRad(sunriseAngle)) < 0 ? 'start' : 'end';
    const sunsetAnchor = Math.cos(toRad(sunsetAngle)) < 0 ? 'start' : 'end';

    const labelYOffset = -12;

    const sortedPlanetIds = useMemo(() => {
        const ids = Object.keys(planetPositions);
        ids.sort((a, b) => getPlanetRadialIndex(a) - getPlanetRadialIndex(b));
        return ids;
    }, [planetPositions]);
    
    const natalPlanetPositions = useMemo(() => {
        if (!natalData) return {};
        const positions: Record<string, {x: number, y: number, angle: number}> = {};
        Object.keys(visiblePlanets).forEach(planetId => {
            if (!visiblePlanets[planetId]) return;
             const key = `${planetId}EclipticLongitude` as keyof CelestialData;
             const longitude = natalData[key] as number;
             if (longitude !== undefined) {
                 const angle = getAngle(longitude);
                 const r = getPlanetRadius(planetId);
                 const pos = polarToCartesian(cx, cy, r, angle);
                 positions[planetId] = { x: pos.x, y: pos.y, angle };
             }
        });
        return positions;
    }, [natalData, visiblePlanets, ascendantLongitude, isZodiacFixed]);

    const anyPlanetSelected = selectedPlanets.length > 0;
    const anyAspectSelected = selectedAspects.length > 0;
    const isAnyAspectHovered = hoveredAspect !== null;

    const handleMouseEnter = (e: React.MouseEvent, type: TooltipData['type'], id: string | number) => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        mousePos.current = { x: e.clientX, y: e.clientY };
        if (type === 'house') {
            setHoveredHouse(id as number);
        }
        
        // Small delay for tooltips
        hoverTimeout.current = window.setTimeout(() => {
            let title = '';
            let description: React.ReactNode = '';

            if (type === 'planet') {
                const data = PLANET_DESCRIPTIONS[id as string];
                if (data) {
                    title = data.title;
                    description = data.description;
                }
            } else if (type === 'sign') {
                const signId = id as string;
                const signData = ZODIAC_DATA.find(s => s.id === signId);
                const descData = SIGN_DESCRIPTIONS[signId];
                
                if (signData && descData) {
                    title = descData.title;
                    
                    // Find planets in this sign
                    const planetsInSign = Object.entries(celestialData)
                        .filter(([key, val]) => key.endsWith('EclipticLongitude') && typeof val === 'number')
                        .map(([key, val]) => {
                            const planetId = key.replace('EclipticLongitude', '');
                            if (!visiblePlanets[planetId]) return null;
                            const signIndex = Math.floor((val as number) / 30);
                            return signIndex === ZODIAC_DATA.findIndex(s => s.id === signId) ? planetId : null;
                        })
                        .filter(Boolean) as string[];

                    const rulerId = (signData as any).ruler;
                    const rulerName = PLANET_DESCRIPTIONS[rulerId]?.title || rulerId;

                    description = (
                        <div className="flex flex-col gap-2">
                            <p>{descData.description}</p>
                            
                            {/* Ruler Info */}
                            {rulerId && (
                                <div className="flex items-center gap-2 mt-1 bg-brand-surface-highlight/20 p-1.5 rounded-md border border-brand-border/10">
                                    <span className="text-[10px] uppercase tracking-wider opacity-70">Regente:</span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-astro text-sm">{CELESTIAL_GLYPHS[rulerId]}</span>
                                        <span className="font-bold text-xs">{rulerName}</span>
                                    </div>
                                </div>
                            )}

                            {/* Planets in Sign */}
                            {planetsInSign.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {planetsInSign.map(pid => (
                                        <div key={pid} className="flex items-center gap-1 bg-brand-surface-highlight/30 px-1.5 py-0.5 rounded text-xs border border-brand-border/10">
                                            <span className="font-astro">{CELESTIAL_GLYPHS[pid]}</span>
                                            <span>{PLANET_DESCRIPTIONS[pid]?.title || pid}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                }
            } else if (type === 'house') {
                const houseNum = id as number;
                const data = HOUSE_DESCRIPTIONS[houseNum];
                if (data) {
                    title = data.title;
                    
                    // Get the natural ruler of the house
                    const rulerId = HOUSE_RULERS[houseNum];
                    const rulerName = PLANET_DESCRIPTIONS[rulerId]?.title || rulerId;

                    description = (
                        <div className="flex flex-col gap-2">
                            <p>{data.description}</p>
                            
                            {/* Ruler Info */}
                            {rulerId && (
                                <div className="flex items-center gap-2 mt-1 bg-brand-surface-highlight/20 p-1.5 rounded-md border border-brand-border/10">
                                    <span className="text-[10px] uppercase tracking-wider opacity-70">Regente:</span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-astro text-sm">{CELESTIAL_GLYPHS[rulerId]}</span>
                                        <span className="font-bold text-xs">{rulerName}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }
            }

            if (title) {
                setTooltip({
                    type,
                    title,
                    description,
                    x: mousePos.current.x,
                    y: mousePos.current.y
                });
            }
        }, 300);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        mousePos.current = { x: e.clientX, y: e.clientY };
        if (tooltip) {
            // Update position immediately
            setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
        }
    };

    const handleMouseLeave = (e: React.MouseEvent, type?: TooltipData['type']) => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setTooltip(null);
        if (type === 'house') {
            setHoveredHouse(null);
        }
    };
    
    const graduationTicks = useMemo(() => {
        const ticks = [];
        for (let i = 0; i < 360; i++) {
            const longitude = i;
            const isSignStart = longitude % 30 === 0;
            const isDecan = longitude % 10 === 0;
            const isMid = longitude % 5 === 0;
            // Use base angle (rotation = 0) for static calculation: 180 - longitude
            const angle = 180 - longitude;
            let length = 6;
            let width = 0.5;
            let opacity = 0.3;
            let colorClass = "text-brand-text-muted";

            if (isSignStart) {
                length = 15;
                width = 2;
                opacity = 1;
                colorClass = "text-brand-text";
            } else if (isDecan) {
                length = 12;
                width = 1.5;
                opacity = 0.8;
                colorClass = "text-brand-text-muted";
            } else if (isMid) {
                length = 8;
                width = 1;
                opacity = 0.6;
            }

            const startR = graduationRingRadius;
            const endR = graduationRingRadius - length;
            const p1 = polarToCartesian(cx, cy, startR, angle);
            const p2 = polarToCartesian(cx, cy, endR, angle);
            
            ticks.push(
                <line 
                    key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
                    stroke="currentColor" 
                    className={colorClass}
                    strokeWidth={width} 
                    strokeOpacity={opacity} 
                    strokeLinecap="round" 
                />
            );
        }
        return ticks;
    }, [graduationRingRadius, cx, cy]);

    const isLightBackground = showAtmosphere && (
        gradientStatus === 'day' ||
        (gradientStatus === 'dawn' && gradientProgress > 0.5) ||
        (gradientStatus === 'dusk' && gradientProgress < 0.5)
    );
    // Texto principal: azul-petróleo escuro no dia, quase-branco na noite
    const dynamicContrastFill = isLightBackground ? '#1a2e44' : '#e2e8f0';
    // Texto secundário: azul médio no dia, cinza-ardósia na noite  
    const formatPlanetDegree = (longitude: number): string => {
        const deg = Math.floor(longitude % 30);
        const minFloat = (longitude % 1) * 60;
        const min = Math.floor(minFloat);
        return `${String(deg).padStart(2,'0')}° ${String(min).padStart(2,'0')}'`;
    };

    const dynamicContrastSubFill = isLightBackground ? '#2d4a6a' : '#94a3b8';
    // Sombra de texto: inversa para garantir separação em qualquer fundo
    const dynamicTextShadow = isLightBackground
        ? 'drop-shadow(0 1px 2px rgba(255,255,255,0.4))'
        : 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))';

    // Retorna se um ângulo SVG está na metade "céu" ou "terra" do mapa
    // O horizonte é a linha ASC-DSC (ângulo 180° no SVG = esquerda = ASC)
    // Ângulos 0°-180° = metade superior = céu diurno
    // Ângulos 180°-360° = metade inferior = terra
    const getElementColor = (angleDeg: number): string => {
        const norm = ((angleDeg % 360) + 360) % 360;
        const isSkyHalf = norm > 180 && norm < 360;
        if (showAtmosphere && isLightBackground) {
            return isSkyHalf ? '#1a2e44' : '#e2e8f0';
        } else {
            return '#e2e8f0';
        }
    };

    const ASPECT_LINE_COLORS: Record<string, string> = {
        conjunction: 'var(--color-aspect-conjunction)',
        opposition: 'var(--color-aspect-opposition)',
        trine: 'var(--color-aspect-trine)',
        square: 'var(--color-aspect-square)',
        sextile: 'var(--color-aspect-sextile)',
    };
    
    const timeRingElements = useMemo(() => {
        if (!showTimeRing) return [];
        const elements = [];
        for (let h = 0; h < 24; h++) {
            const angle = getTimeAngle(h);
            const pos = polarToCartesian(cx, cy, timeRingRadius, angle);
            const colorAngle = (h === 6 || h === 18) ? angle + 2 : angle;
            const elementColor = getElementColor(colorAngle);
            const isCardinal = h === 0 || h === 6 || h === 12 || h === 18;
            const fontSize = isCardinal ? `${26 * timeRingScale}px` : `${20 * timeRingScale}px`;
            
            elements.push(
                <g key={`time-${h}`}>
                    <text
                        x={pos.x}
                        y={pos.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ 
                            transformBox: 'fill-box', 
                            transformOrigin: 'center',
                            fontFamily: "'Cormorant Garamond', serif",
                            fontWeight: 600,
                            fontSize: fontSize,
                            filter: showAtmosphere && isLightBackground
                                ? 'drop-shadow(0 1px 1px rgba(255,255,255,0.3))'
                                : 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                            fill: elementColor,
                        }}
                    >
                        {String(h).padStart(2, '0')}
                    </text>
                </g>
            );
        }
        return elements;
    }, [midheavenLongitude, ascendantLongitude, descendantLongitude, imumCoeliLongitude, isZodiacFixed, showTimeRing, dynamicContrastFill, isLightBackground, celestialData.sunEclipticLongitude, currentTime, timeRingScale, theme]);


    const innerHouseGraduationTicks = useMemo(() => {
        const ticks = [];
        for (let i = 0; i < 12; i++) {
            const startCusp = houseCusps[i];
            const endCusp = houseCusps[(i + 1) % 12];
            let diff = endCusp - startCusp;
            if (diff < 0) diff += 360;
            const majorAngle = getAngle(startCusp);
            const majorP1 = polarToCartesian(cx, cy, innerGraduationRadius - 5, majorAngle);
            const majorP2 = polarToCartesian(cx, cy, innerGraduationRadius + 5, majorAngle);
            
            ticks.push(
                <line 
                    key={`house-tick-major-${i}`} 
                    x1={majorP1.x} y1={majorP1.y} x2={majorP2.x} y2={majorP2.y} 
                    stroke="currentColor" 
                    strokeWidth={1.5} 
                    strokeOpacity={0.9} 
                    strokeLinecap="round"
                    className="text-brand-text"
                />
            );

            const decanStep = diff / 3;
            for (let j = 1; j < 3; j++) {
                const decanLon = normalizeAngle(startCusp + (decanStep * j));
                const decanAngle = getAngle(decanLon);
                const minorP1 = polarToCartesian(cx, cy, innerGraduationRadius - 2.5, decanAngle);
                const minorP2 = polarToCartesian(cx, cy, innerGraduationRadius + 2.5, decanAngle);
                
                ticks.push(
                    <line 
                        key={`house-tick-minor-${i}-${j}`} 
                        x1={minorP1.x} y1={minorP1.y} x2={minorP2.x} y2={minorP2.y} 
                        stroke="currentColor" 
                        strokeWidth={1} 
                        strokeOpacity={0.6} 
                        strokeLinecap="round"
                         className="text-brand-text-muted"
                    />
                );
            }
        }
        return ticks;
    }, [houseCusps, getAngle, innerGraduationRadius, cx, cy]);


    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const seconds = String(currentTime.getSeconds()).padStart(2, '0');
    const dayVal = currentTime.getDate();
    const monthVal = currentTime.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
    const yearVal = currentTime.getFullYear();
    const weekdayVal = currentTime.toLocaleDateString('pt-BR', { weekday: 'long' }).charAt(0).toUpperCase() + currentTime.toLocaleDateString('pt-BR', { weekday: 'long' }).slice(1);
    const dateString = `${String(dayVal).padStart(2,'0')} ${monthVal} ${yearVal}`;

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <style>
                {`
                    @keyframes twinkle {
                        0%, 100% { opacity: 0.3; transform: scale(0.9); }
                        50% { opacity: 1; transform: scale(1.1); }
                    }
                    .star-twinkle {
                        animation-name: twinkle;
                        animation-timing-function: ease-in-out;
                        animation-iteration-count: infinite;
                        transform-box: fill-box;
                        transform-origin: center;
                    }
                `}
            </style>
            <svg viewBox="0 0 1000 1000" className="w-full h-full drop-shadow-2xl font-serif select-none overflow-visible">
                <defs>
                    <clipPath id="clock-face-clip">
                        <circle cx="500" cy="500" r="500" />
                    </clipPath>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="moon-glow" x="-150%" y="-150%" width="400%" height="400%">
                         <feGaussianBlur stdDeviation="10" in="SourceGraphic" />
                    </filter>
                    <filter id="glyph-shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="black" floodOpacity="0.8"/>
                    </filter>
                    
                    {/* TERRAIN TEXTURE - Updated procedural noise with strict masking */}
                    <filter id="grass-texture" x="-20%" y="-20%" width="140%" height="140%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.015 0.18" numOctaves="3" stitchTiles="stitch" result="noise"/>
                        <feSpecularLighting in="noise" surfaceScale="2" specularConstant="0.8" specularExponent="15" lightingColor="#b0e090" result="specLight">
                            <feDistantLight azimuth="235" elevation="70"/>
                        </feSpecularLighting>
                        <feComposite in="specLight" in2="noise" operator="in" result="specularTexture"/>
                        {/* Clip texture to source shape */}
                        <feComposite in="specularTexture" in2="SourceGraphic" operator="in" result="finalTexture"/>
                    </filter>

                    <mask id="center-mask">
                        <rect x="-100%" y="-100%" width="300%" height="300%" fill="white" />
                        <circle cx={cx} cy={cy} r={innerVoidRadius} fill="#000000" />
                    </mask>
                    
                    <clipPath id="inner-ring-mask">
                        <circle cx={cx} cy={cy} r={housesRingInner} />
                    </clipPath>

                    {/* DYNAMIC RADIAL SUN GRADIENT FOR DAY SKY (4 STOPS) */}
                    <radialGradient id="sky-gradient" cx={sunCx} cy={sunCy} r="150%" fx={sunCx} fy={sunCy} gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={skyStop0} />
                        <stop offset="35%" stopColor={skyStop25} />
                        <stop offset="70%" stopColor={skyStop60} />
                        <stop offset="100%" stopColor={skyStop100} />
                    </radialGradient>
                    
                    {/* NIGHT GLOW — brilho azul do sol abaixo do horizonte */}
                    <radialGradient
                        id="night-glow-gradient"
                        cx={sunCx} cy={sunCy}
                        r="140%"
                        fx={sunCx} fy={sunCy}
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0%"   stopColor="#1a3a6e" stopOpacity="1" />
                        <stop offset="30%"  stopColor="#0f2248" stopOpacity="0.6" />
                        <stop offset="70%"  stopColor="#060e28" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                    </radialGradient>
                    
                    {/* DYNAMIC GROUND GRADIENT */}
                    <radialGradient id="ground-gradient" cx={cx} cy={cy} r={housesRingInner} gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={groundStop0} />
                        <stop offset="100%" stopColor={groundStop100} />
                    </radialGradient>

                    {/* SIGN LINES GRADIENTS */}
                    {Object.entries(ELEMENT_HEX_COLORS).map(([element, color]) => (
                        <radialGradient 
                            key={`sign-grad-${element}`} 
                            id={`sign-grad-${element}`} 
                            cx={cx} 
                            cy={cy} 
                            r={zodiacRingInner} 
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset="35%" stopColor="#000000" stopOpacity="0" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.15" />
                        </radialGradient>
                    ))}
                    
                    {/* MOON LIGHT SPOTLIGHT */}
                    {moonPos && (
                        <radialGradient id="moon-light" cx={moonPos.x} cy={moonPos.y} r={housesRingInner * 0.8} gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="white" stopOpacity="0.6"/>
                            <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
                        </radialGradient>
                    )}

                    {/* LUXURY ZODIAC GRADIENTS - Space Luxury Edition */}
                    <linearGradient id="zodiac-fire" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-zodiac-fire-1)" /> 
                        <stop offset="40%" stopColor="var(--color-zodiac-fire-2)" /> 
                        <stop offset="100%" stopColor="var(--color-zodiac-fire-3)" /> 
                    </linearGradient>
                    <linearGradient id="zodiac-earth" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-zodiac-earth-1)" /> 
                        <stop offset="50%" stopColor="var(--color-zodiac-earth-2)" /> 
                        <stop offset="100%" stopColor="var(--color-zodiac-earth-3)" /> 
                    </linearGradient>
                    <linearGradient id="zodiac-air" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-zodiac-air-1)" /> 
                        <stop offset="60%" stopColor="var(--color-zodiac-air-2)" /> 
                        <stop offset="100%" stopColor="var(--color-zodiac-air-3)" /> 
                    </linearGradient>
                    <linearGradient id="zodiac-water" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-zodiac-water-1)" /> 
                        <stop offset="50%" stopColor="var(--color-zodiac-water-2)" /> 
                        <stop offset="100%" stopColor="var(--color-zodiac-water-3)" /> 
                    </linearGradient>

                    {/* ICON ZODIAC GRADIENTS - Lighter for contrast */}
                    <linearGradient id="zodiac-icon-fire" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-zodiac-icon-fire-1)" /> 
                        <stop offset="40%" stopColor="var(--color-zodiac-icon-fire-2)" /> 
                        <stop offset="100%" stopColor="var(--color-zodiac-icon-fire-3)" /> 
                    </linearGradient>
                    <linearGradient id="zodiac-icon-earth" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-zodiac-icon-earth-1)" /> 
                        <stop offset="50%" stopColor="var(--color-zodiac-icon-earth-2)" /> 
                        <stop offset="100%" stopColor="var(--color-zodiac-icon-earth-3)" /> 
                    </linearGradient>
                    <linearGradient id="zodiac-icon-air" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-zodiac-icon-air-1)" /> 
                        <stop offset="60%" stopColor="var(--color-zodiac-icon-air-2)" /> 
                        <stop offset="100%" stopColor="var(--color-zodiac-icon-air-3)" /> 
                    </linearGradient>
                    <linearGradient id="zodiac-icon-water" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-zodiac-icon-water-1)" /> 
                        <stop offset="50%" stopColor="var(--color-zodiac-icon-water-2)" /> 
                        <stop offset="100%" stopColor="var(--color-zodiac-icon-water-3)" /> 
                    </linearGradient>
                    
                    {/* SUN LIGHT SPOTLIGHT FOR GROUND GLOW */}
                    {realSunPos && (
                        <>
                            <radialGradient id="sun-ground-glow" cx={realSunPos.x} cy={realSunPos.y} r={housesRingInner * 1.5} gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor={sunGlowColor} stopOpacity="1"/>
                                <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
                            </radialGradient>
                            <radialGradient id="sun-sky-glow" cx={realSunPos.x} cy={realSunPos.y} r={housesRingInner * 1.8} gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor={sunGlowColor} stopOpacity="0.8"/>
                                <stop offset="40%" stopColor={sunGlowColor} stopOpacity="0.3"/>
                                <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
                            </radialGradient>
                        </>
                    )}

                    {/* Planet Gradients */}
                    <radialGradient id="grad-sun" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#FFFACD" />
                        <stop offset="40%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#FF8C00" />
                    </radialGradient>
                    <radialGradient id="grad-moon" cx="35%" cy="35%" r="60%">
                        <stop offset="0%" stopColor="#F5F5F5" />
                        <stop offset="50%" stopColor="#D3D3D3" />
                        <stop offset="100%" stopColor="#808080" />
                    </radialGradient>
                    <radialGradient id="grad-mercury" cx="40%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="#E0E0E0" />
                        <stop offset="60%" stopColor="#A9A9A9" />
                        <stop offset="100%" stopColor="#757575" />
                    </radialGradient>
                    <radialGradient id="grad-venus" cx="35%" cy="35%" r="60%">
                        <stop offset="0%" stopColor="#E9D5FF" />
                        <stop offset="50%" stopColor="#C084FC" />
                        <stop offset="100%" stopColor="#9333EA" />
                    </radialGradient>
                    <radialGradient id="grad-mars" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#FF7F50" />
                        <stop offset="60%" stopColor="#CD5C5C" />
                        <stop offset="100%" stopColor="#8B0000" />
                    </radialGradient>
                    <linearGradient id="grad-jupiter-stripes" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF8DC" />
                        <stop offset="20%" stopColor="#CD853F" />
                        <stop offset="40%" stopColor="#FFF8DC" />
                        <stop offset="60%" stopColor="#D2691E" />
                        <stop offset="80%" stopColor="#FFF8DC" />
                        <stop offset="100%" stopColor="#CD853F" />
                    </linearGradient>
                    <radialGradient id="grad-jupiter-overlay" cx="35%" cy="35%" r="70%"><stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4"/><stop offset="100%" stopColor="#000000" stopOpacity="0.2"/></radialGradient>
                    <radialGradient id="grad-saturn" cx="40%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#F0E68C" />
                        <stop offset="100%" stopColor="#DAA520" />
                    </radialGradient>
                    <radialGradient id="grad-uranus" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#AFEEEE" />
                        <stop offset="100%" stopColor="#00CED1" />
                    </radialGradient>
                    <radialGradient id="grad-neptune" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#4169E1" />
                        <stop offset="100%" stopColor="#00008B" />
                    </radialGradient>
                    <radialGradient id="grad-pluto" cx="35%" cy="35%" r="60%">
                        <stop offset="0%" stopColor="#8B0000" />
                        <stop offset="50%" stopColor="#708090" />
                        <stop offset="100%" stopColor="#2F4F4F" />
                    </radialGradient>
                    
                    <radialGradient id="grad-northNode" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#E0FFFF" /><stop offset="100%" stopColor="#00CED1" /></radialGradient>
                    <radialGradient id="grad-southNode" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#D2691E" /><stop offset="100%" stopColor="#8B4513" /></radialGradient>
                    <radialGradient id="grad-lilith" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#4B0082" /><stop offset="60%" stopColor="#000000" /><stop offset="100%" stopColor="#2e022e" /></radialGradient>
                    <radialGradient id="grad-chiron" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#90EE90" /><stop offset="100%" stopColor="#2E8B57" /></radialGradient>
                    <radialGradient id="grad-ceres" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#556B2F" /></radialGradient>
                    <radialGradient id="grad-pallas" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#F0F8FF" /><stop offset="100%" stopColor="#4682B4" /></radialGradient>
                    <radialGradient id="grad-juno" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFB6C1" /><stop offset="100%" stopColor="#C71585" /></radialGradient>
                    <radialGradient id="grad-vesta" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFA500" /><stop offset="100%" stopColor="#FF4500" /></radialGradient>
                </defs>

                {/* --- LAYER 0: BACKGROUNDS --- */}
                <g mask="url(#center-mask)">
                    {/* Custom Background Image */}
                    {customBackgroundImage && (
                        <image
                            href={customBackgroundImage}
                            x={cx - 500}
                            y={cy - 500}
                            width="1000"
                            height="1000"
                            preserveAspectRatio="xMidYMid slice"
                            opacity="0.6"
                        />
                    )}

                    {/* Constellations Background */}
                    {showConstellations && (
                        <g className="pointer-events-none" transform={`rotate(${isZodiacFixed ? 0 : zodiacRotation}, ${cx}, ${cy})`}>
                            <image
                                href="/Contellation.svg"
                                x={cx - 937.5}
                                y={cy - 937.5}
                                width="1875"
                                height="1875"
                                opacity="0.6"
                                style={{ mixBlendMode: 'screen' }}
                            />
                        </g>
                    )}
                </g>

                {/* --- LAYER 1: ATMOSPHERE & EARTH (Inside Clock) --- */}
                <g mask="url(#center-mask)">
                    {/* Base Background (if Atmosphere OFF) */}
                    {!showAtmosphere && (
                         <circle 
                            cx={cx} cy={cy} 
                            r={housesRingInner} 
                            fill="currentColor" 
                            fillOpacity="0.4"
                            className="transition-colors duration-500 text-brand-surface-highlight"
                        />
                    )}

                    {/* Atmosphere Layers */}
                    {showAtmosphere && (
                        <>
                            {/* Brilho noturno azul seguindo o sol */}
                            {nightGlowOpacity > 0 && (
                                <circle
                                    cx={cx} cy={cy}
                                    r={housesRingInner}
                                    fill="url(#night-glow-gradient)"
                                    fillOpacity={nightGlowOpacity}
                                    style={{ pointerEvents: 'none' }}
                                />
                            )}

                            {/* SKY LAYER 1: GRADIENT (Day/Dusk) */}
                            <circle 
                                cx={cx} cy={cy} r={housesRingInner}
                                fill="url(#sky-gradient)" 
                                fillOpacity={skyOpacity}
                                stroke="none" 
                            />

                            {/* SKY LAYER 2: SUN GLOW */}
                            {realSunPos && sunGlowOpacity > 0 && (
                                <circle
                                    cx={cx} cy={cy} r={housesRingInner}
                                    fill="url(#sun-sky-glow)"
                                    fillOpacity={sunGlowOpacity * 0.8}
                                    stroke="none"
                                    style={{ mixBlendMode: 'screen' }}
                                />
                            )}

                            {/* EARTH LAYER GROUP */}
                            <g className="transition-colors duration-[2000ms]">
                                 {/* 1. Base Gradient Fill */}
                                <path 
                                    d={earthPath} 
                                    fill="url(#ground-gradient)" 
                                    stroke="none" 
                                />
                                
                                {/* 2. Texture Overlay (Soft Light) */}
                                <path 
                                    d={earthPath} 
                                    fill="#000000" // Base fill is used by filter as mask
                                    stroke="none" 
                                    filter="url(#grass-texture)"
                                    opacity={textureOpacity}
                                    style={{ mixBlendMode: 'soft-light' }}
                                />

                                {/* 3. Sun Glow Interaction */}
                                {realSunPos && sunGlowOpacity > 0 && (
                                    <path 
                                        d={earthPath} 
                                        fill="url(#sun-ground-glow)" 
                                        fillOpacity={sunGlowOpacity}
                                        stroke="none"
                                        style={{ mixBlendMode: 'screen' }}
                                    />
                                )}
                                
                                {/* 4. Moon Glow Interaction - Clipped to Earth Path (Horizon) */}
                                {moonPos && (
                                    <path 
                                        d={earthPath} 
                                        fill="url(#moon-light)" 
                                        fillOpacity={moonGlowOpacity}
                                        stroke="none"
                                        style={{ mixBlendMode: 'plus-lighter' }}
                                    />
                                )}

                                {/* 5. Moon Ambient Glow (Global Earth Illumination) */}
                                {moonAmbientOpacity > 0 && (
                                    <path 
                                        d={earthPath} 
                                        fill="#b0c4de" 
                                        fillOpacity={moonAmbientOpacity}
                                        stroke="none"
                                        style={{ mixBlendMode: 'overlay' }}
                                    />
                                )}
                            </g>
                            
                            {/* Horizon Labels - New Prominent Layout */}
                            <g className="pointer-events-none">
                                 {/* Sunrise Widget */}
                                 <g transform={`translate(${sunriseLabelPos.x}, ${sunriseLabelPos.y})`}>
                                     <rect 
                                        x={sunriseAnchor === 'start' ? -10 : -100} 
                                        y={-15} 
                                        width="110" 
                                        height="30" 
                                        rx="15" 
                                        fill="#1e1b4b"
                                        fillOpacity="0.8"
                                        stroke="#ffffff"
                                        strokeOpacity="0.2"
                                     />
                                     <circle cx={sunriseAnchor === 'start' ? 8 : -8} cy={0} r="8" fill="#FDD107" />
                                     <text 
                                        x={sunriseAnchor === 'start' ? 22 : -22} 
                                        y={0} 
                                        textAnchor={sunriseAnchor}
                                        dominantBaseline="middle"
                                        className="text-[14px] font-bold fill-white font-display tracking-wider"
                                     >
                                        {celestialData.sunriseTime}
                                     </text>
                                     <text 
                                        x={sunriseAnchor === 'start' ? 22 : -22} 
                                        y={-18} 
                                        textAnchor={sunriseAnchor}
                                        className="text-[9px] font-bold uppercase fill-yellow-400 font-display tracking-[0.2em]"
                                     >
                                        Nascer
                                     </text>
                                 </g>

                                 {/* Sunset Widget */}
                                 <g transform={`translate(${sunsetLabelPos.x}, ${sunsetLabelPos.y})`}>
                                     <rect 
                                        x={sunsetAnchor === 'start' ? -10 : -100} 
                                        y={-15} 
                                        width="110" 
                                        height="30" 
                                        rx="15" 
                                        fill="#1e1b4b"
                                        fillOpacity="0.8"
                                        stroke="#ffffff"
                                        strokeOpacity="0.2"
                                     />
                                     <circle cx={sunsetAnchor === 'start' ? 8 : -8} cy={0} r="8" fill="#F97316" />
                                     <text 
                                        x={sunsetAnchor === 'start' ? 22 : -22} 
                                        y={0} 
                                        textAnchor={sunsetAnchor}
                                        dominantBaseline="middle"
                                        className="text-[14px] font-bold fill-white font-display tracking-wider"
                                     >
                                        {celestialData.sunsetTime}
                                     </text>
                                     <text 
                                        x={sunsetAnchor === 'start' ? 22 : -22} 
                                        y={-18} 
                                        textAnchor={sunsetAnchor}
                                        className="text-[9px] font-bold uppercase fill-orange-400 font-display tracking-[0.2em]"
                                     >
                                        Pôr
                                     </text>
                                 </g>
                            </g>
                        </>
                    )}
                </g>
                
                {/* --- LAYER 2: RINGS & GRADUATIONS --- */}
                <g className="text-gray-300 pointer-events-none" transform={`rotate(${isZodiacFixed ? 0 : zodiacRotation}, ${cx}, ${cy})`}>
                    <circle 
                        cx={cx} cy={cy} r={graduationRingRadius - (graduationTickLength/2)} 
                        fill="none" stroke="currentColor" className="text-gray-800 opacity-40" strokeWidth={graduationTickLength}
                    />
                    <circle cx={cx} cy={cy} r={graduationRingRadius} fill="none" stroke="currentColor" className="text-gray-500" strokeWidth="1.5"/>
                    <circle cx={cx} cy={cy} r={graduationRingInner} fill="none" stroke="currentColor" className="text-gray-500" strokeWidth="1.5"/>
                    {graduationTicks}
                </g>

                 <ZodiacRing 
                    cx={cx} 
                    cy={cy} 
                    innerRadius={zodiacRingInner} 
                    outerRadius={zodiacRingOuter} 
                    rotation={isZodiacFixed ? 0 : zodiacRotation} 
                    onHover={(id) => handleMouseEnter({ clientX: mousePos.current.x, clientY: mousePos.current.y } as any, 'sign', id)}
                    onLeave={() => handleMouseLeave({} as any, 'sign')}
                    iconSize={zodiacSignSize}
                    colorMode={zodiacColorMode}
                    highlightFilter={highlightFilter}
                />

                {showSeasonsRing && (
                    <g className="pointer-events-none select-none" transform={`rotate(${isZodiacFixed ? 0 : zodiacRotation}, ${cx}, ${cy})`}>
                        {[
                            { name: 'OUTONO', start: 0, end: 90, color: '#fb923c' },
                            { name: 'INVERNO', start: 90, end: 180, color: '#60a5fa' },
                            { name: 'PRIMAVERA', start: 180, end: 270, color: '#4ade80' },
                            { name: 'VERÃO', start: 270, end: 360, color: '#facc15' },
                        ].map((season, i) => {
                            const isLight = theme === 'light';
                            const lightColors = isLight ? SEASON_COLORS_LIGHT[season.name as keyof typeof SEASON_COLORS_LIGHT] : null;
                            
                            const fillColor = lightColors ? lightColors.bg : season.color;
                            const strokeColor = lightColors ? lightColors.border : season.color;
                            const textColor = lightColors ? lightColors.text : season.color;
                            
                            const fillOpacity = isLight ? "0.4" : "0.05";
                            const strokeOpacity = isLight ? "0.6" : "0.2";

                            const startAngle = 180 - season.start;
                            const endAngle = 180 - season.end;
                            const midAngle = normalizeAngle(180 - ((season.start + season.end) / 2));
                            
                            const wedgePath = describeAnnularSector(cx, cy, graduationRingRadius, zodiacRingInner, endAngle, startAngle);
                            
                            const textRadius = (graduationRingRadius + zodiacRingInner) / 2;
                            const textPathId = `season-path-${i}`;
                            const textPathD = describeTextArc(cx, cy, textRadius, startAngle, endAngle);
                            
                            return (
                                <g key={`season-${i}`}>
                                    <path d={wedgePath} fill={fillColor} fillOpacity={fillOpacity} stroke={strokeColor} strokeOpacity={strokeOpacity} strokeWidth="1" />
                                    <path id={textPathId} d={textPathD} fill="none" stroke="none" />
                                    <text
                                        fill={textColor}
                                        fontSize="10.5"
                                        fontFamily="sans-serif"
                                        fontWeight="600"
                                        letterSpacing="2"
                                        className="opacity-80"
                                    >
                                        <textPath href={`#${textPathId}`} startOffset="50%" textAnchor="middle" alignmentBaseline="middle">
                                            {season.name}
                                        </textPath>
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                )}

                {showSignLines && (
                    <g className="pointer-events-none" transform={`rotate(${isZodiacFixed ? 0 : zodiacRotation}, ${cx}, ${cy})`}>
                        {ZODIAC_DATA.map((sign, i) => {
                            const startLon = i * 30;
                            const endLon = (i + 1) * 30;
                            // Base angles (rotation = 0)
                            const startAngle = 180 - startLon;
                            const endAngle = 180 - endLon;
                            
                            const p1 = polarToCartesian(cx, cy, innerVoidRadius, startAngle);
                            const p2 = polarToCartesian(cx, cy, zodiacRingInner, startAngle);
                            
                            const color = ELEMENT_HEX_COLORS[sign.element as keyof typeof ELEMENT_HEX_COLORS] || '#888888';
                            const wedgePath = describeAnnularSector(cx, cy, innerVoidRadius, zodiacRingInner, endAngle, startAngle);

                            return (
                                <g key={`sign-segment-${sign.id}`}>
                                    <path 
                                        d={wedgePath}
                                        fill={`url(#sign-grad-${sign.element})`}
                                    />
                                    <line 
                                        x1={p1.x} y1={p1.y} 
                                        x2={p2.x} y2={p2.y} 
                                        stroke="currentColor" 
                                        className="text-brand-text-muted" 
                                        strokeOpacity={signLineOpacity}
                                        strokeWidth={signLineThickness} 
                                    />
                                </g>
                            );
                        })}
                    </g>
                )}

                <g>
                    {houseCusps.map((cusp, i) => {
                        const startAngle = getAngle(cusp);
                        const nextCusp = houseCusps[(i + 1) % 12];
                        const endAngle = getAngle(nextCusp);
                        const houseNumber = i + 1;
                        const isSelected = selectedHouses.includes(houseNumber);
                        const isHovered = hoveredHouse === houseNumber;
                        
                        let fillOpacity = 0;
                        if (isSelected) fillOpacity = 0.25;
                        if (isHovered) fillOpacity = 0.15;

                        const houseFill = '#8b5cf6';
                        
                        const wedgePath = describeAnnularSector(cx, cy, innerVoidRadius, housesRingInner, endAngle, startAngle);
                        
                        const posInner = polarToCartesian(cx, cy, innerVoidRadius, startAngle);
                        const posOuter = polarToCartesian(cx, cy, zodiacRingInner, startAngle);
                        const isAngle = i === 0 || i === 3 || i === 6 || i === 9;
                        const isMainAngle = i === 0 || i === 3 || i === 6 || i === 9; // AC, IC, DC, MC
                        
                        const shouldShowLine = showHouseLines;

                        const lineColor = "text-brand-text";
                        
                        const lineWidth = isMainAngle ? "2" : "0.5";
                        const lineOpacity = isAngle ? 0.9 : 0.6;
                        
                        let diff = nextCusp - cusp;
                        if (diff < 0) diff += 360;
                        const midLon = cusp + diff / 2;
                        const midAngle = getAngle(midLon);
                        const houseColor = getElementColor(midAngle);
                        const houseNumberRadius = innerVoidRadius + 32;
                        const numPos = polarToCartesian(cx, cy, houseNumberRadius, midAngle); 

                        let label = '';
                        if (houseNumber === 1) label = 'ASC';
                        else if (houseNumber === 10) label = 'MC';
                        else label = houseFormat === 'roman' ? toRoman(houseNumber) : String(houseNumber);

                        return (
                            <g key={`house-group-${i}`}>
                                <path 
                                    d={wedgePath} 
                                    fill={houseFill}
                                    fillOpacity={fillOpacity}
                                    className="cursor-help"
                                    style={{ pointerEvents: 'auto' }} 
                                    onClick={() => onHouseClick(houseNumber)}
                                    onMouseEnter={(e) => handleMouseEnter(e, 'house', houseNumber)}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={(e) => handleMouseLeave(e, 'house')}
                                />
                                {shouldShowLine && (
                                    <line 
                                        x1={posInner.x} y1={posInner.y} x2={posOuter.x} y2={posOuter.y} 
                                        stroke="currentColor" className={lineColor} strokeWidth={isMainAngle ? Number(houseLineThickness) * 1.5 : houseLineThickness} strokeOpacity={isAngle ? Math.min(1, Number(houseLineOpacity) * 1.5) : houseLineOpacity}
                                        strokeDasharray={houseLineFormat === 'dashed' ? "21 21" : "none"}
                                        style={{ pointerEvents: 'none' }}
                                    />
                                )}
                                {showHouseMarkers && (
                                    <text 
                                        x={numPos.x} y={numPos.y} textAnchor="middle" dominantBaseline="central" 
                                        className={`font-bold select-none cursor-pointer ${houseFormat === 'roman' && label !== 'ASC' && label !== 'MC' ? 'font-serif' : 'font-display'}`}
                                        style={{ 
                                            fill: houseColor,
                                            fontSize: '16px', 
                                            pointerEvents: 'auto', 
                                            textShadow: 'none',
                                        }}
                                        onClick={() => onHouseClick(houseNumber)}
                                        onMouseEnter={(e) => handleMouseEnter(e, 'house', houseNumber)}
                                        onMouseMove={handleMouseMove}
                                        onMouseLeave={(e) => handleMouseLeave(e, 'house')}
                                    >
                                        {label}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </g>

                {/* MC/IC Markers */}
                {showMcIcArrows && (
                    <g className="pointer-events-none" transform={`rotate(${isZodiacFixed ? 0 : zodiacRotation}, ${cx}, ${cy})`}>
                        {/* MC Arrow (House 10 Cusp) */}
                        {(() => {
                            const mcAngle = getAngle(houseCusps[9]);
                            const pos = polarToCartesian(cx, cy, zodiacRingOuter + 2, mcAngle);
                            return (
                                <g transform={`translate(${pos.x}, ${pos.y}) rotate(${mcAngle})`}>
                                    <path d="M -6,-6 L 2,0 L -6,6" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </g>
                            );
                        })()}
                        {/* IC Bar (House 4 Cusp) */}
                        {(() => {
                            const icAngle = getAngle(houseCusps[3]);
                            const pos = polarToCartesian(cx, cy, zodiacRingOuter + 2, icAngle);
                            return (
                                <g transform={`translate(${pos.x}, ${pos.y}) rotate(${icAngle})`}>
                                    <line x1="0" y1="-8" x2="0" y2="8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                                </g>
                            );
                        })()}
                    </g>
                )}

                <g className="pointer-events-none select-none" style={{ zIndex: 50 }}>
                     {showTimeRing && (
                        <>
                            <circle cx={cx} cy={cy} r={timeRingRadius} fill="none" stroke="currentColor" className="text-brand-text-muted opacity-30" strokeWidth="0.5" strokeDasharray="2 2" />
                            {timeRingElements}
                        </>
                     )}
                </g>

                <circle 
                    cx={cx} cy={cy} r={innerVoidRadius} 
                    fill="none" stroke="none" className="text-gray-300" strokeWidth="0" 
                />

                <g
                    className={`select-none ${onClockClick ? 'cursor-pointer pointer-events-auto' : 'pointer-events-none'}`}
                    style={{ filter: dynamicTextShadow }}
                    onClick={onClockClick}
                >
                    <text x={cx} y={cy - 42} textAnchor="middle"
                        style={{ fill: theme === 'light' ? '#0f172a' : '#94a3b8' }}
                        className="text-[11px] font-bold uppercase font-display tracking-[0.2em]">
                        {locationName}
                    </text>
                    <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle"
                        style={{ fill: theme === 'light' ? '#0f172a' : '#e2e8f0' }}
                        className="text-[32px] font-manrope font-extralight tracking-[0.2em]">
                        {hours}:{minutes}
                    </text>
                    <text x={cx} y={cy + 28} textAnchor="middle"
                        style={{ fill: theme === 'light' ? '#0f172a' : '#94a3b8' }}
                        className="text-[14px] font-bold uppercase tracking-[0.15em] font-display">
                        {dateString}
                    </text>
                    <text x={cx} y={cy + 46} textAnchor="middle"
                        style={{ fill: theme === 'light' ? '#0f172a' : '#64748b' }}
                        className="text-[9px] font-bold uppercase tracking-[0.3em] font-display">
                        {weekdayVal}
                    </text>
                </g>

                <circle cx={cx} cy={cy} r={numbersProtectionRadius} fill="none" stroke="currentColor" className="text-brand-text-muted opacity-40" strokeWidth="1" strokeDasharray="4 4"/>

                <g className="text-brand-text-muted pointer-events-none opacity-80">
                     <circle cx={cx} cy={cy} r={innerGraduationRadius} fill="none" stroke="currentColor" strokeWidth="1"/>
                    {innerHouseGraduationTicks}
                </g>

                {showOrbits && (
                    <g className="pointer-events-none">
                        {MAJOR_PLANET_IDS.map((planetId) => (
                            <circle
                                key={`orbit-${planetId}`} cx={cx} cy={cy} r={getPlanetRadius(planetId)}
                                fill="none" stroke="currentColor" className="text-brand-text-muted" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 3" 
                            />
                        ))}
                    </g>
                )}

                {(showAspectLines || isNatalMode) && (
                    <g className="opacity-90" mask="url(#center-mask)">
                        {filteredAspects.map((aspect) => {
                            const isSelected = selectedAspects.includes(aspect.id);
                            const isHovered = hoveredAspect === aspect.id;
                            const p1Selected = selectedPlanets.includes(aspect.body1.id);
                            const p2Selected = selectedPlanets.includes(aspect.body2.id);
                            const maxOrb = ASPECT_ORBS[aspect.type as keyof typeof ASPECT_ORBS] || 10;
                            const orbRatio = Math.max(0, 1 - (aspect.orb / maxOrb));
                            let strokeWidth = 1.15 + (orbRatio * 3.0);
                            let strokeOpacity = 0.3 + (orbRatio * 0.7);
                            let dashArray = orbRatio < 0.6 ? "3 3" : "none";
                            const color = ASPECT_LINE_COLORS[aspect.type] || '#9ca3af';

                            let isVisible = true;
                            if (isAnyAspectHovered) {
                                if (isHovered) isVisible = true; else isVisible = false;
                            } else if (anyAspectSelected) {
                                if (isSelected) isVisible = true; else isVisible = false;
                            } else if (anyPlanetSelected) {
                                if (p1Selected && p2Selected) { strokeOpacity = Math.max(0.8, strokeOpacity); strokeWidth = Math.max(2.3, strokeWidth); }
                                else if (p1Selected || p2Selected) { strokeOpacity = strokeOpacity * 0.4; }
                                else { isVisible = false; }
                            }

                            if (!isVisible) return null;
                            let pos1, pos2;
                            if (isNatalMode) {
                                pos1 = planetPositions[aspect.body1.id];
                                pos2 = natalPlanetPositions[aspect.body2.id];
                            } else {
                                pos1 = planetPositions[aspect.body1.id];
                                pos2 = planetPositions[aspect.body2.id];
                            }
                            if (!pos1 || !pos2) return null;

                            return (
                                <line 
                                    key={aspect.id} x1={pos1.x} y1={pos1.y} x2={pos2.x} y2={pos2.y}
                                    stroke={color} strokeWidth={strokeWidth} strokeOpacity={strokeOpacity} strokeDasharray={dashArray} strokeLinecap="round"
                                    onClick={() => onAspectClick(aspect.id)} className="cursor-pointer"
                                />
                            );
                        })}
                    </g>
                )}

                {showNeedle && (
                    <g className="pointer-events-none">
                        {sortedPlanetIds.map(planetId => {
                            if (!visiblePlanets[planetId]) return null;
                            const { angle } = planetPositions[planetId];
                            
                            // Adjust line start/end based on head/tail
                            const headSize = 8;
                            const tailSize = 6;
                            
                            const lineStartRadius = innerGraduationRadius + (pointerTail !== 'none' ? tailSize : 0);
                            const lineEndRadius = graduationRingRadius - (pointerHead !== 'none' ? headSize : 0);
                            
                            const innerPos = polarToCartesian(cx, cy, lineStartRadius, angle);
                            const lineEndPos = polarToCartesian(cx, cy, lineEndRadius, angle);
                            
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
                                        const p1 = polarToCartesian(cx, cy, radius + (isHead ? 0 : dSize), angle);
                                        const p2 = polarToCartesian(cx, cy, radius - (isHead ? dSize : 0), angle);
                                        const p3 = polarToCartesian(cx, cy, radius - (isHead ? dSize/2 : -dSize/2), angle - 0.8);
                                        const p4 = polarToCartesian(cx, cy, radius - (isHead ? dSize/2 : -dSize/2), angle + 0.8);
                                        return <polygon points={`${p1.x},${p1.y} ${p3.x},${p3.y} ${p2.x},${p2.y} ${p4.x},${p4.y}`} fill={color} />;
                                    case 'square':
                                        const sSize = size * 0.6;
                                        const s1 = polarToCartesian(cx, cy, radius, angle - 0.6);
                                        const s2 = polarToCartesian(cx, cy, radius, angle + 0.6);
                                        const s3 = polarToCartesian(cx, cy, radius - (isHead ? sSize : -sSize), angle + 0.6);
                                        const s4 = polarToCartesian(cx, cy, radius - (isHead ? sSize : -sSize), angle - 0.6);
                                        return <polygon points={`${s1.x},${s1.y} ${s2.x},${s2.y} ${s3.x},${s3.y} ${s4.x},${s4.y}`} fill={color} />;
                                    default:
                                        return null;
                                }
                            };

                            return (
                                <g key={`needle-${planetId}`} opacity={0.9}>
                                    <line 
                                        x1={innerPos.x} y1={innerPos.y} x2={lineEndPos.x} y2={lineEndPos.y}
                                        stroke={color} strokeWidth={pointerThickness}
                                        strokeDasharray={pointerStyle === 'dashed' ? '4 2' : 'none'}
                                    />
                                    {pointerHead !== 'none' && renderMarker(pointerHead, graduationRingRadius, headSize, true)}
                                    {pointerTail !== 'none' && renderMarker(pointerTail, innerGraduationRadius, tailSize, false)}
                                </g>
                            );
                        })}
                    </g>
                )}
                
                 {natalData && (
                    <g className="pointer-events-none">
                        {sortedPlanetIds.map(planetId => {
                            if (!visiblePlanets[planetId] || !natalPlanetPositions[planetId]) return null;
                            const { x, y } = natalPlanetPositions[planetId];
                            const iconSize = planetSize * 0.85; 
                            const fontSize = iconSize * 0.7;
                            return (
                                <g key={`natal-${planetId}`} transform={`translate(${x}, ${y})`} opacity={0.85}>
                                    <text x="0" y="0" dy={fontSize * 0.35} textAnchor="middle" fill="#FFD700" stroke="#B8860B" strokeWidth="0.5" fontSize={fontSize} style={{ fontFamily: '"Noto Sans Symbols", "Segoe UI Symbol", sans-serif', filter: "drop-shadow(0 0 2px rgba(0,0,0,0.8))" }}>
                                        {CELESTIAL_GLYPHS[planetId]}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                )}

                {/* Magnetic Fields */}
                {showMagneticField && (
                    <g className="pointer-events-none">
                        <style>
                            {`
                                @keyframes magFlow {
                                    from { stroke-dashoffset: 0; }
                                    to { stroke-dashoffset: -24; }
                                }
                                .mag-line {
                                    animation: magFlow 1s linear infinite;
                                }
                            `}
                        </style>
                        {sortedPlanetIds.map(planetId => {
                            if (!visiblePlanets[planetId]) return null;
                            const { x, y } = planetPositions[planetId];
                            const color = PLANET_COLORS[planetId] || '#00ffff';
                            const R = planetSize / 2;
                            const size = planetSize * 1.5 * magneticFieldSize;
                            
                            // Calculate pull from other planets
                            let pullX = 0;
                            let pullY = 0;
                            
                            sortedPlanetIds.forEach(otherId => {
                                if (otherId === planetId || !visiblePlanets[otherId]) return;
                                const otherPos = planetPositions[otherId];
                                const dx = otherPos.x - x;
                                const dy = otherPos.y - y;
                                const dist = Math.sqrt(dx*dx + dy*dy);
                                const maxDist = size * 5;
                                if (dist < maxDist && dist > 0) {
                                    const force = Math.pow((maxDist - dist) / maxDist, 2); // Stronger when closer
                                    pullX += (dx / dist) * force * size * 1.5;
                                    pullY += (dy / dist) * force * size * 1.5;
                                }
                            });
                            
                            // Rotate the magnetic field to align with the planet's angle
                            const angleRad = Math.atan2(y - cy, x - cx) + Math.PI / 2;
                            const angleDeg = angleRad * (180 / Math.PI);

                            // Rotate pull vector to local coordinates
                            const localPullX = pullX * Math.cos(-angleRad) - pullY * Math.sin(-angleRad);
                            const localPullY = pullX * Math.sin(-angleRad) + pullY * Math.cos(-angleRad);
                            
                            const loops = [];
                            const numLoops = Math.max(4, Math.floor(4 * magneticFieldSize));
                            for (let i = 1; i <= numLoops; i++) {
                                const spread = i * size * 0.6 / magneticFieldSize;
                                const height = R + i * size * 0.2;
                                
                                // Calculate opacity based on distance (i) and size
                                const baseOpacity = (0.3 + (0.1 * (i / numLoops))) * magneticFieldOpacity;
                                const distanceFade = Math.max(0, 1 - (i / (numLoops + 1)));
                                const finalOpacity = baseOpacity * distanceFade;

                                // Left loop
                                loops.push(
                                    <path 
                                        key={`l-${i}`}
                                        d={`M 0 ${-R} C ${-spread + localPullX} ${-height + localPullY}, ${-spread + localPullX} ${height + localPullY}, 0 ${R}`}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth="1.5"
                                        strokeDasharray="4 8"
                                        opacity={finalOpacity}
                                        className="mag-line"
                                        style={{ mixBlendMode: 'screen', filter: `drop-shadow(0 0 4px ${color})` }}
                                    />
                                );
                                // Right loop
                                loops.push(
                                    <path 
                                        key={`r-${i}`}
                                        d={`M 0 ${-R} C ${spread + localPullX} ${-height + localPullY}, ${spread + localPullX} ${height + localPullY}, 0 ${R}`}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth="1.5"
                                        strokeDasharray="4 8"
                                        opacity={finalOpacity}
                                        className="mag-line"
                                        style={{ mixBlendMode: 'screen', filter: `drop-shadow(0 0 4px ${color})` }}
                                    />
                                );
                            }

                            return (
                                <g key={`mag-${planetId}`} transform={`translate(${x}, ${y}) rotate(${angleDeg})`}>
                                    {loops}
                                </g>
                            );
                        })}
                    </g>
                )}

                <g>
                    {sortedPlanetIds.map(planetId => {
                        const { x, y, angle } = planetPositions[planetId];
                        const isSelected = selectedPlanets.includes(planetId);
                        const isGhost = ghostPlanets.includes(planetId);
                        const planetHouse = housePlacements[planetId];
                        const isHouseHovered = hoveredHouse !== null && planetHouse === hoveredHouse;
                        const isHovered = hoveredPlanet === planetId || isHouseHovered;
                        const isRetro = retrogradeStatus[planetId];

                        let isDimmedByFilter = false;
                        if (highlightFilter) {
                             const key = `${planetId}EclipticLongitude` as keyof CelestialData;
                             const longitude = celestialData[key] as number;
                             if (typeof longitude === 'number') {
                                const signIndex = Math.floor(longitude / 30);
                                const sign = ZODIAC_DATA[signIndex];
                                if (sign) {
                                    if (highlightFilter.type === 'element' && sign.element !== highlightFilter.value) isDimmedByFilter = true;
                                    if (highlightFilter.type === 'modality' && sign.modality !== highlightFilter.value) isDimmedByFilter = true;
                                    if (highlightFilter.type === 'polarity' && sign.polarity !== highlightFilter.value) isDimmedByFilter = true;
                                }
                             }
                        }

                        let opacity = 1;
                        let pointerEvents = 'auto';
                        if (anyPlanetSelected) {
                            if (isSelected) opacity = 1; else if (isGhost) opacity = 0.25; else { opacity = 0; pointerEvents = 'none'; }
                        }
                        
                        if (isDimmedByFilter && opacity > 0.1) {
                            opacity = 0.1;
                        } else if (!isDimmedByFilter && highlightFilter) {
                            opacity = 1;
                        }

                        // Opacity reduction for planets "below horizon" (on the earth texture)
                        if (showAtmosphere && isAngleBetween(angle, sunsetAngle, sunriseAngle)) {
                            opacity *= 0.6; // Dim to 60%
                        }

                        const color = PLANET_COLORS[planetId] || '#ffffff';
                        const currentPlanetSize = planetSize;
                        
                        const iconSize = currentPlanetSize; 
                        const iconOffset = iconSize / 2;
                        const fontSize = currentPlanetSize * 0.6;
                        const shouldUseSphere = showPlanetSpheres; 
                        const isMoon = planetId === 'moon';
                        const moonEmoji = isMoon && showPlanetSpheres ? getMoonPhaseEmoji(celestialData.moonPhase) : '';
                        
                        const glyphColor = SPHERE_GLYPH_COLORS[planetId] || 'white';
                        const hasDarkGlyph = glyphColor !== '#ffffff' && glyphColor !== 'white' && planetId !== 'lilith';

                        return (
                            <g 
                                key={planetId} onClick={(e) => { e.stopPropagation(); onPlanetClick(planetId); }}
                                onMouseEnter={(e) => handleMouseEnter(e, 'planet', planetId)} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
                                className="cursor-pointer group !transition-none" style={{ opacity, pointerEvents: pointerEvents as any, transform: `translate(${x}px, ${y}px)`, willChange: 'transform' }}
                            >
                                <g>
                                    <g className={`${isHovered ? 'scale-125' : 'scale-100'}`}>
                                        {/* Protection Circle for Non-Sphere Mode */}
                                        {!shouldUseSphere && (
                                            <circle 
                                                r={iconSize / 1.8} 
                                                fill={showAtmosphere ? "#0f172a" : "#131129"} 
                                                fillOpacity="1"
                                                stroke={color}
                                                strokeWidth="1"
                                            />
                                        )}

                                        {isMoon && shouldUseSphere && (
                                            <circle 
                                                cx="0" cy="0"
                                                r={iconSize * 0.85} 
                                                fill="white" 
                                                fillOpacity={0.6 * moonIllumination} 
                                                filter="url(#moon-glow)"
                                            />
                                        )}

                                        {isMoon && showPlanetSpheres ? (
                                             <g>
                                                {(isSelected || isHovered) && <circle r={iconSize/1.8} fill="white" fillOpacity="0.1" stroke="#8b5cf6" strokeWidth="2" />}
                                                 <text 
                                                    x="0" y="0" dy={fontSize * 0.35} textAnchor="middle" fontSize={iconSize} 
                                                    style={{ 
                                                        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif', 
                                                        pointerEvents: 'none', 
                                                        fill: 'white',
                                                        filter: 'grayscale(100%)'
                                                    }}
                                                >
                                                    {moonEmoji}
                                                </text>
                                             </g>
                                        ) : shouldUseSphere ? (
                                            <g>
                                                {planetId === 'saturn' && <ellipse cx="0" cy="0" rx={iconSize * 0.8} ry={iconSize * 0.25} fill="none" stroke="#D2B48C" strokeWidth={iconSize * 0.15} transform="rotate(-25)" opacity="0.8"/>}
                                                {planetId === 'uranus' && <ellipse cx="0" cy="0" rx={iconSize * 0.3} ry={iconSize * 0.85} fill="none" stroke="#A0F0FF" strokeWidth={iconSize * 0.075} opacity="0.8"/>}
                                                <circle r={iconSize / 2} fill={`url(#grad-${planetId})`} className={`${isSelected || isHovered ? 'stroke-white stroke-2' : ''}`} filter={planetId === 'sun' ? "url(#glow)" : ""}/>
                                                {planetId === 'jupiter' && (
                                                    <>
                                                        <circle r={iconSize / 2} fill="url(#grad-jupiter-stripes)" fillOpacity="0.6" transform="rotate(45)" />
                                                        <circle r={iconSize / 2} fill="url(#grad-jupiter-overlay)" />
                                                    </>
                                                )}
                                                <text 
                                                    x="0" y="0" 
                                                    dy={fontSize * 0.35} 
                                                    textAnchor="middle" 
                                                    fill={glyphColor} 
                                                    fontSize={fontSize} 
                                                    style={{ 
                                                        fontFamily: '"Noto Sans Symbols", "Segoe UI Symbol", sans-serif', 
                                                        pointerEvents: 'none',
                                                        filter: hasDarkGlyph ? 'drop-shadow(0 1px 0px rgba(255,255,255,0.3))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                                                        fontWeight: hasDarkGlyph ? 'bold' : 'normal'
                                                    }}
                                                >
                                                    {CELESTIAL_GLYPHS[planetId]}
                                                </text>
                                                {isRetro && (
                                                    <g transform={`translate(${iconOffset/2}, ${iconOffset/2})`}>
                                                        <circle r={Math.max(4, fontSize * 0.3)} fill="red" stroke="white" strokeWidth="1" />
                                                        <text dy="3" textAnchor="middle" fill="white" fontSize={Math.max(6, fontSize * 0.4)} fontWeight="bold">R</text>
                                                    </g>
                                                )}
                                            </g>
                                        ) : (
                                            <g>
                                                <text x="0" y="0" dy={fontSize * 0.35} textAnchor="middle" fontSize={fontSize} fill={color} style={{ fontFamily: '"Noto Sans Symbols", "Segoe UI Symbol", sans-serif', filter: 'drop-shadow(0 0 1px black)' }}>
                                                    {CELESTIAL_GLYPHS[planetId]}
                                                </text>
                                                 {isRetro && (
                                                    <g transform={`translate(${iconOffset/2}, ${iconOffset/2})`}>
                                                        <circle r={Math.max(4, fontSize * 0.3)} fill="red" stroke="white" strokeWidth="1" />
                                                        <text dy="3" textAnchor="middle" fill="white" fontSize={Math.max(6, fontSize * 0.4)} fontWeight="bold">R</text>
                                                    </g>
                                                )}
                                            </g>
                                        )}
                                    </g>
                                    {showDegreeLabels && (
                                        <text
                                            x={14}
                                            y={-8}
                                            textAnchor="start"
                                            style={{
                                                fontSize: `${degreeLabelSize}px`,
                                                fill: getElementColor(getAngle(celestialData[`${planetId}EclipticLongitude` as keyof CelestialData] as number)),
                                                fontFamily: "'Cormorant Garamond', serif",
                                                fontWeight: 500,
                                                opacity: 0.9,
                                                pointerEvents: 'none',
                                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                                            }}
                                        >
                                            {formatPlanetDegree(celestialData[`${planetId}EclipticLongitude` as keyof CelestialData] as number)}
                                        </text>
                                    )}
                                </g>
                            </g>
                        );
                    })}
                </g>
            </svg>
            {tooltip && (
                <Tooltip 
                    text={
                        <div>
                            <h4 className="font-bold text-sm mb-1 text-brand-purple uppercase tracking-wide">{tooltip.title}</h4>
                            <div className="text-xs text-brand-text-muted leading-relaxed">{tooltip.description}</div>
                        </div>
                    }
                    visible={!!tooltip}
                    x={tooltip.x}
                    y={tooltip.y}
                />
            )}
        </div>
    );
};
