
// --- Data for Zodiac Signs (Equal 30-degree houses) ---
export const ZODIAC_DATA = [
    { id: 'aries', name: 'Áries', abbr: 'ARI', symbol: '♈', size: 30, element: 'fire', modality: 'cardinal', polarity: 'masculine', ruler: 'mars', constellation: { lines: ['M -15,5 L 0,0 L 10,-10'], stars: [{cx: -15, cy: 5, r: 1.5}, {cx: 0, cy: 0, r: 2}, {cx: 10, cy: -10, r: 1.5}, {cx: 12, cy: -15, r: 1}] }},
    { id: 'taurus', name: 'Touro', abbr: 'TOU', symbol: '♉', size: 30, element: 'earth', modality: 'fixed', polarity: 'feminine', ruler: 'venus', constellation: { lines: ['M -10,-8 L 0,0 L 15,5', 'M 0,0 L -5,15'], stars: [{cx: -10, cy: -8, r: 1.5}, {cx: 0, cy: 0, r: 2.5}, {cx: 15, cy: 5, r: 2}, {cx: -5, cy: 15, r: 1.5}, {cx: -15, cy: -6, r:1}, {cx:18,cy:8,r:1}] }},
    { id: 'gemini', name: 'Gêmeos', abbr: 'GEM', symbol: '♊', size: 30, element: 'air', modality: 'mutable', polarity: 'masculine', ruler: 'mercury', constellation: { lines: ['M -10,-15 L -5,0', 'M -5,0 L -15,15', 'M 10,-15 L 5,0', 'M 5,0 L 15,15'], stars: [{cx: -10, cy: -15, r: 2}, {cx: -5, cy: 0, r: 1.5}, {cx: -15, cy: 15, r: 1.5}, {cx: 10, cy: -15, r: 2}, {cx: 5, cy: 0, r: 1.5}, {cx: 15, cy: 15, r: 1.5}] }},
    { id: 'cancer', name: 'Câncer', abbr: 'CAN', symbol: '♋', size: 30, element: 'water', modality: 'cardinal', polarity: 'feminine', ruler: 'moon', constellation: { lines: ['M -15,0 a 15,15 0 0,0 30,0', 'M 15,0 a 15,15 0 0,0 -30,0'], stars: [{cx: -15, cy: 0, r: 1.5}, {cx: 15, cy: 0, r: 1.5}, {cx: 0, cy: 10, r: 2}, {cx: 0, cy: -10, r: 1}] }},
    { id: 'leo', name: 'Leão', abbr: 'LEO', symbol: '♌', size: 30, element: 'fire', modality: 'fixed', polarity: 'masculine', ruler: 'sun', constellation: { lines: ['M -15,-10 a 15,15 0 1,1 0,20 L 15,-15'], stars: [{cx: -15, cy: -10, r: 2}, {cx: 0, cy: 10, r: 2.5}, {cx: 15, cy: -15, r: 1.5}] }},
    { id: 'virgo', name: 'Virgem', abbr: 'VIR', symbol: '♍', size: 30, element: 'earth', modality: 'mutable', polarity: 'feminine', ruler: 'mercury', constellation: { lines: ['M -15,-10 L -5,10 L 5,-10 L 15,10 L 20,0'], stars: [{cx: -15, cy: -10, r: 1.5}, {cx: -5, cy: 10, r: 2}, {cx: 5, cy: -10, r: 1.5}, {cx: 15, cy: 10, r: 2}, {cx: 20, cy: 0, r: 1}] }},
    { id: 'libra', name: 'Libra', abbr: 'LIB', symbol: '♎', size: 30, element: 'air', modality: 'cardinal', polarity: 'masculine', ruler: 'venus', constellation: { lines: ['M -20,0 L 20,0', 'M -10,-10 L 10,-10 a 10,10 0 0,1 0,20 L -10,10 a 10,10 0 0,1 0,-20'], stars: [{cx: -20, cy: 0, r: 1.5}, {cx: 20, cy: 0, r: 1.5}, {cx: 0, cy: 10, r: 2}] }},
    { id: 'scorpio', name: 'Escorpião', abbr: 'SCO', symbol: '♏', size: 30, element: 'water', modality: 'fixed', polarity: 'feminine', ruler: 'pluto', constellation: { lines: ['M -15,-10 L -5,10 L 5,-10 L 15,10 L 20,0 L 25,-10'], stars: [{cx: -15, cy: -10, r: 1.5}, {cx: -5, cy: 10, r: 2}, {cx: 5, cy: -10, r: 1.5}, {cx: 15, cy: 10, r: 2}, {cx: 20, cy: 0, r: 1}, {cx: 25, cy: -10, r: 1.5}] }},
    { id: 'sagittarius', name: 'Sagitário', abbr: 'SAG', symbol: '♐', size: 30, element: 'fire', modality: 'mutable', polarity: 'masculine', ruler: 'jupiter', constellation: { lines: ['M -15,15 L 15,-15', 'M 0,0 L 15,0 L 15,-15'], stars: [{cx: -15, cy: 15, r: 2}, {cx: 15, cy: -15, r: 2}, {cx: 0, cy: 0, r: 1.5}] }},
    { id: 'capricorn', name: 'Capricórnio', abbr: 'CAP', symbol: '♑', size: 30, element: 'earth', modality: 'cardinal', polarity: 'feminine', ruler: 'saturn', constellation: { lines: ['M -15,-10 L 0,15 L 15,-10 a 15,15 0 1,1 -15,15'], stars: [{cx: -15, cy: -10, r: 2}, {cx: 0, cy: 15, r: 2.5}, {cx: 15, cy: -10, r: 1.5}] }},
    { id: 'aquarius', name: 'Aquário', abbr: 'AQU', symbol: '♒', size: 30, element: 'air', modality: 'fixed', polarity: 'masculine', ruler: 'uranus', constellation: { lines: ['M -20,-5 L -10,5 L 0,-5 L 10,5 L 20,-5', 'M -20,10 L -10,20 L 0,10 L 10,20 L 20,10'], stars: [{cx: -20, cy: -5, r: 1.5}, {cx: 20, cy: -5, r: 1.5}, {cx: -20, cy: 10, r: 1.5}, {cx: 20, cy: 10, r: 1.5}] }},
    { id: 'pisces', name: 'Peixes', abbr: 'PEX', symbol: '♓', size: 30, element: 'water', modality: 'mutable', polarity: 'feminine', ruler: 'neptune', constellation: { lines: ['M -15,15 a 15,15 0 0,1 30,0', 'M -15,-15 a 15,15 0 0,0 30,0', 'M 0,-15 L 0,15'], stars: [{cx: -15, cy: 15, r: 2}, {cx: 15, cy: 15, r: 2}, {cx: -15, cy: -15, r: 2}, {cx: 15, cy: -15, r: 2}] }}
];

export const ELEMENT_COLORS: Record<string, string> = {
    fire: 'text-element-fire drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]', // Gold/Fire
    earth: 'text-element-earth drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]', // Emerald
    air: 'text-element-air drop-shadow-[0_0_8px_rgba(203,213,225,0.4)]', // Silver/Air
    water: 'text-element-water drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]', // Azure/Water
};

export const MODALITY_COLORS: Record<string, string> = {
    cardinal: 'text-modality-cardinal', 
    fixed: 'text-modality-fixed', 
    mutable: 'text-modality-mutable', 
};

export const POLARITY_COLORS: Record<string, string> = {
    masculine: 'text-polarity-masculine', 
    feminine: 'text-polarity-feminine', 
};

export const ELEMENT_COLORS_BG: Record<string, string> = {
    fire: 'bg-grad-fire border-white/10 text-white shadow-lg shadow-red-900/20',
    earth: 'bg-grad-earth border-white/10 text-white shadow-lg shadow-emerald-900/20',
    air: 'bg-grad-air border-white/10 text-white shadow-lg shadow-blue-900/20',
    water: 'bg-grad-water border-white/10 text-white shadow-lg shadow-slate-900/20',
};

export const getZodiacColorClass = (sign: any, mode: 'none' | 'element' | 'modality' | 'polarity') => {
    if (!sign || mode === 'none') return 'text-brand-text-muted';
    if (mode === 'element') return ELEMENT_COLORS[sign.element] || 'text-brand-text-muted';
    if (mode === 'modality') return MODALITY_COLORS[sign.modality] || 'text-brand-text-muted';
    if (mode === 'polarity') return POLARITY_COLORS[sign.polarity] || 'text-brand-text-muted';
    return 'text-brand-text-muted';
};
