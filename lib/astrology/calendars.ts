
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

export const getSeasonInfo = (date: Date): { name: string, day: number } => {
    const year = date.getFullYear();
    const dayOfYear = getDayOfYear(date);
    
    // Approximate season start dates for Southern Hemisphere
    // Summer: Dec 21 (approx day 355) - Mar 20 (approx day 79)
    // Autumn: Mar 21 (approx day 80) - Jun 20 (approx day 171)
    // Winter: Jun 21 (approx day 172) - Sep 22 (approx day 265)
    // Spring: Sep 23 (approx day 266) - Dec 20 (approx day 354)

    // Adjust for leap years if necessary, but approximation is usually acceptable for UI
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const daysInYear = isLeap ? 366 : 365;

    const equinoxes = {
        mar: 80 + (isLeap ? 1 : 0), // Mar 21
        jun: 172 + (isLeap ? 1 : 0), // Jun 21
        sep: 266 + (isLeap ? 1 : 0), // Sep 23
        dec: 355 + (isLeap ? 1 : 0)  // Dec 21
    };

    if (dayOfYear >= equinoxes.dec || dayOfYear < equinoxes.mar) {
        // Summer
        const startDay = dayOfYear >= equinoxes.dec ? equinoxes.dec : (equinoxes.dec - daysInYear);
        return { name: 'Verão', day: dayOfYear - startDay + 1 };
    } else if (dayOfYear >= equinoxes.mar && dayOfYear < equinoxes.jun) {
        // Autumn
        return { name: 'Outono', day: dayOfYear - equinoxes.mar + 1 };
    } else if (dayOfYear >= equinoxes.jun && dayOfYear < equinoxes.sep) {
        // Winter
        return { name: 'Inverno', day: dayOfYear - equinoxes.jun + 1 };
    } else {
        // Spring
        return { name: 'Primavera', day: dayOfYear - equinoxes.sep + 1 };
    }
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
