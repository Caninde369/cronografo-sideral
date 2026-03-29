export const MAJOR_PLANET_IDS = [
    'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'sun'
];

export const PLANET_COLORS: Record<string, string> = {
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
export const SPHERE_GLYPH_COLORS: Record<string, string> = {
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

export const getPlanetRadialIndex = (id: string): number => {
    switch (id) {
        case 'moon': return 0;
        case 'lilith': return 0.5;
        case 'northNode': return 0.5;
        case 'southNode': return 0.5;
        case 'mercury': return 1;
        case 'venus': return 2;
        case 'mars': return 3;
        case 'vesta': return 3.5;
        case 'juno': return 3.5;
        case 'ceres': return 3.5;
        case 'pallas': return 3.5;
        case 'jupiter': return 4;
        case 'saturn': return 5;
        case 'chiron': return 5.5;
        case 'uranus': return 6;
        case 'neptune': return 7;
        case 'pluto': return 8; 
        case 'sun': return 9; 
        default: return 10;
    }
};

export const DEFAULT_VISIBLE_PLANETS: Record<string, boolean> = {
    sun: true, moon: true, mercury: true, venus: true, mars: true,
    jupiter: true, saturn: true, uranus: true, neptune: true, pluto: true,
    lilith: false, northNode: false, southNode: false,
    chiron: false, ceres: false, pallas: false, juno: false, vesta: false
};
