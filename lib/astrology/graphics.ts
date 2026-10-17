import { normalizeAngle, polarToCartesian } from './utils';


export const ATMOSPHERE_PALETTE = {
    NIGHT: {
        sky:    ['#080d1e', '#05091a', '#030612', '#010208'],
        ground: ['#04060f', '#020308'],
    },
    DAWN: {
        // Nascer: magenta profundo → laranja dourado → violeta → azul noturno
        sky:    ['#f5a623', '#d4502a', '#7b2d6e', '#0d1030'],
        ground: ['#0e0806', '#060404'],
    },
    DAY: {
        // Transição: amarelo claro → laranja suave → azul diurno inicial
        sky:    ['#fef3d0', '#f5c87a', '#3a7ec8', '#0f2248'],
        ground: ['#18220f', '#0e160a'],
    },
    FULL_DAY: {
        // Azul pleno de céu limpo
        sky:    ['#daf0ff', '#4db8f0', '#0a6eb8', '#063260'],
        ground: ['#1e2a14', '#131c0c'],
    },
    DUSK: {
        // Pôr: laranja-vermelho → róseo → violeta → quase preto
        sky:    ['#ff6b35', '#c8304a', '#561870', '#08061a'],
        ground: ['#140a08', '#080404'],
    },
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
