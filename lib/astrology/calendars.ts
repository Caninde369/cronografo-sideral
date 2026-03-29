
import { SearchMoonPhase, Seasons } from 'astronomy-engine';

export interface CalendarEvent {
    date: Date;
    type: 'moon' | 'season' | 'other';
    name: string;
    icon?: string;
}

export const getNextMoonPhases = (date: Date, count: number = 4): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const phases = [
        { phase: 0, name: 'Lua Nova', icon: '🌑' },
        { phase: 90, name: 'Quarto Crescente', icon: '🌓' },
        { phase: 180, name: 'Lua Cheia', icon: '🌕' },
        { phase: 270, name: 'Quarto Minguante', icon: '🌗' }
    ];

    let searchDate = new Date(date);
    
    for (let i = 0; i < count; i++) {
        let nextPhaseEvent: CalendarEvent | null = null;
        let minDiff = Infinity;
        
        for (const p of phases) {
            const phaseDate = SearchMoonPhase(p.phase, searchDate, 35);
            if (phaseDate) {
                const diff = phaseDate.date.getTime() - searchDate.getTime();
                if (diff > 0 && diff < minDiff) {
                    minDiff = diff;
                    nextPhaseEvent = {
                        date: phaseDate.date,
                        type: 'moon',
                        name: p.name,
                        icon: p.icon
                    };
                }
            }
        }
        
        if (nextPhaseEvent) {
            events.push(nextPhaseEvent);
            searchDate = new Date(nextPhaseEvent.date.getTime() + 1000); // add 1 second to avoid finding the same phase
        } else {
            break;
        }
    }
    
    return events;
};

export const getMonthEvents = (year: number, month: number): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    // Moon Phases
    // We need to find phases within the month.
    // SearchMoonPhase(phase, date, limit_days)
    
    const phases = [
        { phase: 0, name: 'Lua Nova', icon: '🌑' },
        { phase: 90, name: 'Quarto Crescente', icon: '🌓' },
        { phase: 180, name: 'Lua Cheia', icon: '🌕' },
        { phase: 270, name: 'Quarto Minguante', icon: '🌗' }
    ];

    phases.forEach(p => {
        let searchDate = new Date(startDate);
        // Search for the next occurrence of this phase starting from a few days before the month to catch early ones
        // Actually, SearchMoonPhase finds the *next* occurrence >= date.
        // So we start searching from startDate.
        
        while (searchDate <= endDate) {
            const phaseDate = SearchMoonPhase(p.phase, searchDate, 35);
            if (!phaseDate) break;
            
            const dateObj = phaseDate.date;
            if (dateObj.getMonth() === month && dateObj.getFullYear() === year) {
                events.push({
                    date: dateObj,
                    type: 'moon',
                    name: p.name,
                    icon: p.icon
                });
            }
            
            // Move searchDate forward to find next occurrence (next month usually, but loop handles it)
            searchDate = new Date(dateObj.getTime() + 24 * 60 * 60 * 1000 * 5); // +5 days
            if (dateObj.getMonth() > month || dateObj.getFullYear() > year) break;
        }
    });

    // Seasons (Equinoxes/Solstices)
    // Seasons(year) returns { mar_equinox, jun_solstice, sep_equinox, dec_solstice }
    const seasons = Seasons(year);
    const seasonEvents = [
        { date: seasons.mar_equinox.date, name: 'Equinócio de Outono (S) / Primavera (N)', icon: '🍂' },
        { date: seasons.jun_solstice.date, name: 'Solstício de Inverno (S) / Verão (N)', icon: '❄️' },
        { date: seasons.sep_equinox.date, name: 'Equinócio de Primavera (S) / Outono (N)', icon: '🌸' },
        { date: seasons.dec_solstice.date, name: 'Solstício de Verão (S) / Inverno (N)', icon: '☀️' }
    ];

    seasonEvents.forEach(s => {
        if (s.date.getMonth() === month && s.date.getFullYear() === year) {
            events.push({
                date: s.date,
                type: 'season',
                name: s.name,
                icon: s.icon
            });
        }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
};

export const getDayOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
};

export const getSeasonInfo = (date: Date, latitudeSouth: boolean = true): { name: string, day: number } => {
    const year = date.getFullYear();
    const ingresses = getSeasonIngresses(year, latitudeSouth);

    // Ordenar por data
    const sorted = [...ingresses].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Adicionar o primeiro ingresso do ano seguinte para fechar o último intervalo
    const nextYearIngresses = getSeasonIngresses(year + 1, latitudeSouth);
    const nextYearFirst = [...nextYearIngresses].sort((a, b) => a.date.getTime() - b.date.getTime())[0];
    const allBoundaries = [...sorted, nextYearFirst];

    let currentSeason = sorted[sorted.length - 1]; // fallback: última estação do ano
    let startDate = currentSeason.date;

    for (let i = 0; i < allBoundaries.length - 1; i++) {
        const from = allBoundaries[i].date;
        const to = allBoundaries[i + 1].date;
        if (date >= from && date < to) {
            currentSeason = allBoundaries[i];
            startDate = from;
            break;
        }
    }

    // Calcular dia dentro da estação
    const msPerDay = 1000 * 60 * 60 * 24;
    const day = Math.floor((date.getTime() - startDate.getTime()) / msPerDay) + 1;

    // Capitalizar primeira letra
    const name = currentSeason.name.charAt(0) + currentSeason.name.slice(1).toLowerCase();

    return { name, day };
};

// Mayan Tzolkin Calculation
const TZOLKIN_DAY_NAMES = [
    'Imix', 'Ik', 'Akbal', 'Kan', 'Chicchan', 
    'Cimi', 'Manik', 'Lamat', 'Muluc', 'Oc', 
    'Chuen', 'Eb', 'Ben', 'Ix', 'Men', 
    'Cib', 'Caban', 'Etznab', 'Cauac', 'Ahau'
];

const TZOLKIN_DAY_NAMES_PT = [
    'Dragão', 'Vento', 'Noite', 'Semente', 'Serpente',
    'Enlaçador de Mundos', 'Mão', 'Estrela', 'Lua', 'Cachorro',
    'Macaco', 'Humano', 'Caminhante do Céu', 'Mago', 'Águia',
    'Guerreiro', 'Terra', 'Espelho', 'Tormenta', 'Sol'
];

const TZOLKIN_COLORS = [
    'Vermelho', 'Branco', 'Azul', 'Amarelo'
];

const TZOLKIN_TONES = [
    'Magnético', 'Lunar', 'Elétrico', 'Auto-existente', 'Harmônico',
    'Rítmico', 'Ressonante', 'Galáctico', 'Solar', 'Planetário',
    'Espectral', 'Cristal', 'Cósmico'
];

export const getTzolkinDate = (date: Date): { kin: number, tone: string, sign: string, color: string, full: string } => {
    // Reference date: March 29, 2011 was Kin 99 (9 Storm/Cauac/Tormenta)
    // Actually, let's use a standard correlation.
    // 4 Ahau 8 Cumku = Aug 11, 3114 BCE (Julian) = Aug 13, 3114 BCE (Gregorian proleptic?)
    // Easier reference: Dec 21, 2012 was 4 Ahau (Kin 160? No, 4 Ahau is Kin 60... wait)
    // Let's use a simpler modern reference.
    // April 12, 2024 was Kin 174 (White Overtone Wizard / Mago Harmônico Branco)
    
    const refDate = new Date(2024, 3, 12); // April 12, 2024 (Month is 0-indexed)
    const refKin = 174; 

    // Calculate difference in days
    const oneDay = 1000 * 60 * 60 * 24;
    const diffTime = date.getTime() - refDate.getTime();
    const diffDays = Math.round(diffTime / oneDay);

    let kin = (refKin + diffDays) % 260;
    if (kin <= 0) kin += 260;

    // Kin 1 = 1 Imix (Tone 1, Sign 0)
    // Tone = (Kin - 1) % 13 + 1
    // Sign Index = (Kin - 1) % 20

    const toneIndex = (kin - 1) % 13;
    const signIndex = (kin - 1) % 20;
    
    // Color pattern: Red, White, Blue, Yellow repeating
    // Imix (0) -> Red
    // Ik (1) -> White
    // Akbal (2) -> Blue
    // Kan (3) -> Yellow
    const colorIndex = signIndex % 4;

    const toneName = TZOLKIN_TONES[toneIndex];
    const signName = TZOLKIN_DAY_NAMES_PT[signIndex];
    const colorName = TZOLKIN_COLORS[colorIndex];

    return {
        kin,
        tone: toneName,
        sign: signName,
        color: colorName,
        full: `${signName} ${toneName} ${colorName}`
    };
};

export const getMoonAge = (moonPhase: number): number => {
    // moonPhase is 0..1
    // Cycle is approx 29.53 days
    // Age = phase * 29.53
    // Round to 1 decimal place
    return Math.round(moonPhase * 29.53 * 10) / 10;
};

export type SeasonIngress = {
    name: string;       // 'VERÃO' | 'OUTONO' | 'INVERNO' | 'PRIMAVERA'
    longitude: number;  // longitude eclíptica do Sol no momento do ingresso (0, 90, 180, 270)
    date: Date;
    color: string;
};

export function getSeasonIngresses(year: number, latitudeSouth: boolean): SeasonIngress[] {
    // astronomy-engine retorna os 4 eventos do ano
    const seasons = Seasons(year);

    // No hemisfério sul as estações são invertidas em relação ao hemisfério norte
    // Mar Equinox (0°) = Outono no sul, Primavera no norte
    // Jun Solstice (90°) = Inverno no sul, Verão no norte
    // Sep Equinox (180°) = Primavera no sul, Outono no norte
    // Dec Solstice (270°) = Verão no sul, Inverno no norte

    const north = [
        { name: 'PRIMAVERA', longitude: 0,   date: seasons.mar_equinox.date,  color: '#4ade80' },
        { name: 'VERÃO',     longitude: 90,  date: seasons.jun_solstice.date, color: '#facc15' },
        { name: 'OUTONO',    longitude: 180, date: seasons.sep_equinox.date,  color: '#fb923c' },
        { name: 'INVERNO',   longitude: 270, date: seasons.dec_solstice.date, color: '#60a5fa' },
    ];

    const south = [
        { name: 'OUTONO',    longitude: 0,   date: seasons.mar_equinox.date,  color: '#fb923c' },
        { name: 'INVERNO',   longitude: 90,  date: seasons.jun_solstice.date, color: '#60a5fa' },
        { name: 'PRIMAVERA', longitude: 180, date: seasons.sep_equinox.date,  color: '#4ade80' },
        { name: 'VERÃO',     longitude: 270, date: seasons.dec_solstice.date, color: '#facc15' },
    ];

    return latitudeSouth ? south : north;
}
