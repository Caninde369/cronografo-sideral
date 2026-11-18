import {
    calculateMercuryTropicalLongitude,
    calculateVenusTropicalLongitude,
    calculateMarsTropicalLongitude,
    calculateJupiterTropicalLongitude,
    calculateSaturnTropicalLongitude,
    calculateUranusTropicalLongitude,
    calculateNeptuneTropicalLongitude,
    calculatePlutoTropicalLongitude
} from './celestialBodies';
import { calculateChironTropicalLongitude } from './astroPoints';

const isStationary = (longitudeFunc: (date: Date) => number, date: Date, intervalHours: number = 24, threshold: number): boolean => {
    const t2 = new Date(date);
    const t1 = new Date(date.getTime() - intervalHours * 60 * 60 * 1000);

    const lonT2 = longitudeFunc(t2);
    const lonT1 = longitudeFunc(t1);

    let diff = lonT2 - lonT1;
    if (diff > 180) diff -= 360;
    else if (diff < -180) diff += 360;

    return Math.abs(diff) <= threshold;
};

export const calculateAllStationary = (date: Date): Record<string, boolean> => {
    // Thresholds approx. for 24h interval (degrees per day)
    return {
        mercury: isStationary(calculateMercuryTropicalLongitude, date, 24, 0.03),
        venus:   isStationary(calculateVenusTropicalLongitude, date, 24, 0.03),
        mars:    isStationary(calculateMarsTropicalLongitude, date, 24, 0.02),
        jupiter: isStationary(calculateJupiterTropicalLongitude, date, 24, 0.01),
        saturn:  isStationary(calculateSaturnTropicalLongitude, date, 24, 0.008),
        uranus:  isStationary(calculateUranusTropicalLongitude, date, 24, 0.005),
        neptune: isStationary(calculateNeptuneTropicalLongitude, date, 24, 0.004),
        pluto:   isStationary(calculatePlutoTropicalLongitude, date, 24, 0.002),
        chiron:  isStationary(calculateChironTropicalLongitude, date, 24, 0.005),
    };
};

const isRetrograde = (longitudeFunc: (date: Date) => number, date: Date, intervalHours: number = 24): boolean => {

    const t2 = new Date(date);
    const t1 = new Date(date.getTime() - intervalHours * 60 * 60 * 1000);

    const lonT2 = longitudeFunc(t2);
    const lonT1 = longitudeFunc(t1);

    let diff = lonT2 - lonT1;
    if (diff > 180) diff -= 360;
    else if (diff < -180) diff += 360;

    return diff < -0.0001;
};

export const calculateAllRetrogrades = (date: Date): Record<string, boolean> => {
    return {
        mercury: isRetrograde(calculateMercuryTropicalLongitude, date, 6),
        venus: isRetrograde(calculateVenusTropicalLongitude, date, 12),
        mars: isRetrograde(calculateMarsTropicalLongitude, date, 24),
        jupiter: isRetrograde(calculateJupiterTropicalLongitude, date, 24),
        saturn: isRetrograde(calculateSaturnTropicalLongitude, date, 24),
        uranus: isRetrograde(calculateUranusTropicalLongitude, date, 48),
        neptune: isRetrograde(calculateNeptuneTropicalLongitude, date, 48),
        pluto: isRetrograde(calculatePlutoTropicalLongitude, date, 48),
        chiron: isRetrograde(calculateChironTropicalLongitude, date, 24),
    };
};

/* ── Períodos de retrogradação e estações (para o R e o S do painel Astros) ── */
const LONGITUDE_FNS: Record<string, (date: Date) => number> = {
    mercury: calculateMercuryTropicalLongitude,
    venus: calculateVenusTropicalLongitude,
    mars: calculateMarsTropicalLongitude,
    jupiter: calculateJupiterTropicalLongitude,
    saturn: calculateSaturnTropicalLongitude,
    uranus: calculateUranusTropicalLongitude,
    neptune: calculateNeptuneTropicalLongitude,
    pluto: calculatePlutoTropicalLongitude,
    chiron: calculateChironTropicalLongitude,
};
const DAY_MS = 24 * 60 * 60 * 1000;
const dailyMotion = (fn: (d: Date) => number, d: Date) => {
    let diff = fn(new Date(d.getTime() + DAY_MS / 2)) - fn(new Date(d.getTime() - DAY_MS / 2));
    if (diff > 180) diff -= 360; else if (diff < -180) diff += 360;
    return diff;
};
/** Refina, com precisão de ~1 hora, o instante em que o movimento troca de sinal entre a e b. */
const refineStation = (fn: (d: Date) => number, a: Date, b: Date) => {
    let lo = a.getTime(), hi = b.getTime();
    const sLo = Math.sign(dailyMotion(fn, a));
    for (let k = 0; k < 10; k++) {
        const mid = (lo + hi) / 2;
        if (Math.sign(dailyMotion(fn, new Date(mid))) === sLo) lo = mid; else hi = mid;
    }
    return new Date((lo + hi) / 2);
};

export type RetroPeriod = { start: Date; end: Date };

/** Período retrógrado que contém a data (da estação retrógrada à estação direta). */
export const findRetrogradePeriod = (bodyId: string, date: Date): RetroPeriod | null => {
    const fn = LONGITUDE_FNS[bodyId];
    if (!fn || dailyMotion(fn, date) >= 0) return null;
    let back = new Date(date), k = 0;
    while (dailyMotion(fn, back) < 0 && k++ < 400) back = new Date(back.getTime() - DAY_MS);
    let fwd = new Date(date); k = 0;
    while (dailyMotion(fn, fwd) < 0 && k++ < 400) fwd = new Date(fwd.getTime() + DAY_MS);
    return {
        start: refineStation(fn, back, new Date(back.getTime() + DAY_MS)),
        end: refineStation(fn, new Date(fwd.getTime() - DAY_MS), fwd),
    };
};

/** Estação mais próxima da data (até 30 dias): quando o planeta para e para que lado vai. */
export const findNearestStation = (bodyId: string, date: Date): { at: Date; turnsTo: 'retro' | 'direct' } | null => {
    const fn = LONGITUDE_FNS[bodyId];
    if (!fn) return null;
    let best: { at: Date; turnsTo: 'retro' | 'direct' } | null = null;
    let bestGap = Infinity;
    for (let i = -30; i < 30; i++) {
        const a = new Date(date.getTime() + i * DAY_MS), b = new Date(a.getTime() + DAY_MS);
        const ma = dailyMotion(fn, a), mb = dailyMotion(fn, b);
        if (Math.sign(ma) !== Math.sign(mb)) {
            const at = refineStation(fn, a, b);
            const gap = Math.abs(at.getTime() - date.getTime());
            if (gap < bestGap) { bestGap = gap; best = { at, turnsTo: mb < 0 ? 'retro' : 'direct' }; }
        }
    }
    return best;
};
