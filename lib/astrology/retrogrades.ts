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
