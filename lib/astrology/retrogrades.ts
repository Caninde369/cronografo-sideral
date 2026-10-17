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
