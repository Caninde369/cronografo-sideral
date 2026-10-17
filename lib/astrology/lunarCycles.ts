import { SearchMoonPhase, Seasons } from 'astronomy-engine';

export const NORTHERN_MOONS = [
    'Lua do Lobo',     // Jan
    'Lua da Neve',     // Fev
    'Lua da Minhoca',  // Mar
    'Lua Rosa',        // Abr
    'Lua das Flores',  // Mai
    'Lua de Morango',  // Jun
    'Lua do Cervo',    // Jul
    'Lua do Esturjão', // Ago
    'Lua da Colheita', // Set
    'Lua do Caçador',  // Out
    'Lua do Castor',   // Nov
    'Lua Fria',        // Dez
];

export const SOUTHERN_MOONS = [
    'Lua do Feno',       // Jan
    'Lua dos Grãos',     // Fev
    'Lua da Colheita',   // Mar
    'Lua do Caçador',    // Abr
    'Lua da Geada',      // Mai
    'Lua Fria',          // Jun
    'Lua de Gelo',       // Jul
    'Lua da Tempestade', // Ago
    'Lua da Minhoca',    // Set
    'Lua Rosa',          // Out
    'Lua das Flores',    // Nov
    'Lua de Morango',    // Dez
];

export const getMoonEmoji = (moonName: string): string => {
    switch (moonName) {
        case 'Lua do Lobo': return '🐺';
        case 'Lua da Neve': return '🌨️';
        case 'Lua da Minhoca': return '🪱';
        case 'Lua Rosa': return '🌸';
        case 'Lua das Flores': return '💐';
        case 'Lua de Morango': return '🍓';
        case 'Lua do Cervo': return '🦌';
        case 'Lua do Esturjão': return '🐟';
        case 'Lua da Colheita': return '🌾';
        case 'Lua do Caçador': return '🏹';
        case 'Lua do Castor': return '🦫';
        case 'Lua Fria': return '💨';
        case 'Lua do Feno': return '🌿';
        case 'Lua dos Grãos': return '🌽';
        case 'Lua da Geada': return '🧊';
        case 'Lua de Gelo': return '❄️';
        case 'Lua da Tempestade': return '⚡';
        case 'Lua Azul': return '🔵';
        default: return '🌕';
    }
};

// Calcula Lua Nova após o equinócio de março (início do ciclo anual)
export const getYearCycleStart = (year: number): Date => {
    const seasons = Seasons(year);
    const equinox = seasons.mar_equinox.date;
    const searchFrom = new Date(equinox);
    searchFrom.setDate(searchFrom.getDate() - 2);
    const newMoon = SearchMoonPhase(0, searchFrom, 40);
    return newMoon ? newMoon.date : equinox;
};

export interface LunarCyclePhase {
    name: string;
    icon: string;
    range: string;
    days: number[];
}

export interface LunarCycle {
    start: Date;
    nextStart: Date;
    totalDays: number;
    name: string;
    emoji: string;
    index: number;
    phases: LunarCyclePhase[];
}

// Gera todos os ciclos lunares do ano a partir da primeira Lua Nova pós-equinócio
export const getYearCycles = (year: number, latitude: number = 0): LunarCycle[] => {
    const firstNewMoon = getYearCycleStart(year);
    const seenMonths = new Set<number>();
    const rawNewMoons: Date[] = [];
    let searchDate = new Date(firstNewMoon);

    for (let i = 0; i < 14; i++) {
        const nm = i === 0 ? firstNewMoon : (() => {
            const s = new Date(searchDate);
            s.setDate(s.getDate() + 1);
            const found = SearchMoonPhase(0, s, 35);
            return found ? found.date : s;
        })();
        rawNewMoons.push(new Date(nm));
        if (i > 0) searchDate = new Date(nm);
    }

    const cycles: LunarCycle[] = [];
    for (let i = 0; i < 13; i++) {
        const nm = rawNewMoons[i];
        const nextNm = rawNewMoons[i + 1];

        // Busca exata do tempo astronômico de cada fase dentro deste ciclo
        const p0 = SearchMoonPhase(0, new Date(nm.getTime() - 12 * 3600000), 10);
        const p1 = SearchMoonPhase(90, p0 ? p0.date : nm, 15);
        const p2 = SearchMoonPhase(180, p1 ? p1.date : nm, 15);
        const p3 = SearchMoonPhase(270, p2 ? p2.date : nm, 15);
        const p4 = SearchMoonPhase(0, p3 ? new Date(p3.date.getTime() + 3600000) : nextNm, 15);

        const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const d0 = midnight(p0 ? p0.date : nm);
        const d1 = midnight(p1 ? p1.date : nm);
        const d2 = midnight(p2 ? p2.date : nm);
        const d3 = midnight(p3 ? p3.date : nm);
        const d4 = midnight(p4 ? p4.date : nextNm);

        const l0 = Math.max(1, Math.round((d1.getTime() - d0.getTime()) / 86400000));
        const l1 = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000));
        const l2 = Math.max(1, Math.round((d3.getTime() - d2.getTime()) / 86400000));
        const l3 = Math.max(1, Math.round((d4.getTime() - d3.getTime()) / 86400000));

        const r0 = [1, l0];
        const r1 = [l0 + 1, l0 + l1];
        const r2 = [l0 + l1 + 1, l0 + l1 + l2];
        const r3 = [l0 + l1 + l2 + 1, l0 + l1 + l2 + l3];

        const totalDays = l0 + l1 + l2 + l3;

        const phases: LunarCyclePhase[] = [
            { icon: '🌑', name: 'Nova', range: `${r0[0]}–${r0[1]}`, days: Array.from({ length: l0 }, (_, k) => r0[0] + k) },
            { icon: '🌓', name: 'Crescente', range: `${r1[0]}–${r1[1]}`, days: Array.from({ length: l1 }, (_, k) => r1[0] + k) },
            { icon: '🌕', name: 'Cheia', range: `${r2[0]}–${r2[1]}`, days: Array.from({ length: l2 }, (_, k) => r2[0] + k) },
            { icon: '🌗', name: 'Minguante', range: `${r3[0]}–${r3[1]}`, days: Array.from({ length: l3 }, (_, k) => r3[0] + k) },
        ];

        const fullMoonDate = p2 ? p2.date : new Date(nm.getTime() + 14 * 86400000);
        const month = fullMoonDate.getMonth();
        
        let name = '';
        if (seenMonths.has(month)) {
            name = 'Lua Azul';
        } else {
            seenMonths.add(month);
            const isSouth = latitude < 0;
            name = isSouth ? SOUTHERN_MOONS[month] : NORTHERN_MOONS[month];
        }

        cycles.push({ 
            start: d0, 
            nextStart: d4,
            totalDays: totalDays > 0 ? totalDays : 29,
            name, 
            emoji: getMoonEmoji(name), 
            index: i + 1,
            phases
        });
    }
    return cycles;
};
