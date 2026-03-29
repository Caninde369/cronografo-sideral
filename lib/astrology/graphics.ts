import { normalizeAngle, polarToCartesian } from './utils';

// --- PALETTE DEFINITIONS BASED ON REFERENCE IMAGES ---
// Stops: 0% (Sun Center), 35% (Halo), 70% (Mid Sky), 100% (Far/Dark)
export const ATMOSPHERE_PALETTE = {
    NIGHT: {
        sky: ['#0a0502', '#0f0c1b', '#080510', '#020105'], // Atmospheric dark luxury
        ground: ['#050302', '#0a0805']
    },
    DAWN: { 
        sky: ['#fceabb', '#f8b500', '#5e2563', '#0f0c1b'], // Gold to deep purple
        ground: ['#1a100c', '#2a1b15'] 
    },
    DAY: {
        sky: ['#ffecd2', '#fcb69f', '#1e3c72', '#0f0c1b'], // Soft light to deep space blue
        ground: ['#1c2315', '#2a3b1c']
    },
    FULL_DAY: {
        sky: ['#f0f9ff', '#7dd3fc', '#075985', '#0f172a'], // Celeste/Sky blue luxury
        ground: ['#2d3a28', '#1a2414']
    },
    DUSK: {
        sky: ['#ff7e5f', '#feb47b', '#5e2563', '#0f0c1b'], // Peach/orange to deep purple
        ground: ['#150d12', '#0a0508']
    }
};

// --- COLOR HELPERS ---
export const parseHex = (color: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

export const interpolateColor = (color1: string, color2: string, factor: number) => {
    const c1 = parseHex(color1);
    const c2 = parseHex(color2);
    
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);

    return `rgb(${r}, ${g}, ${b})`;
};

export const interpolatePalette = (
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
